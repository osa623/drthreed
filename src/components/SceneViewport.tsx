import React, { useRef, useEffect, useState } from 'react';
import { Target, Layers, Sparkles, UploadCloud, Footprints } from 'lucide-react';
import { useEditorStore, editorStore } from '../state/editorStore';
import { useTheme, themeStore } from '../state/themeStore';
import { SceneManager } from '../engine/SceneManager';
import { RenderManager } from '../engine/RenderManager';
import { PhysicsManager } from '../physics/PhysicsManager';
import { LightingManager } from '../engine/LightingManager';
import { PlayerController } from '../player/PlayerController';
import type { PerformanceStats } from '../state/types';

interface SceneViewportProps {
  onEngineReady?: (instances: {
    sceneManager: SceneManager;
    physicsManager: PhysicsManager;
    lightingManager: LightingManager;
    playerController: PlayerController;
  }) => void;
  onLoadSample?: () => void;
}

export const SceneViewport: React.FC<SceneViewportProps> = ({ onEngineReady, onLoadSample }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  const sceneManagerRef = useRef<SceneManager | null>(null);
  const renderManagerRef = useRef<RenderManager | null>(null);
  const physicsManagerRef = useRef<PhysicsManager | null>(null);
  const lightingManagerRef = useRef<LightingManager | null>(null);
  const playerControllerRef = useRef<PlayerController | null>(null);

  const { theme } = useTheme();

  const {
    viewMode,
    lightingSettings,
    spawnPoint,
    selectedNodeId,
    showPhysicsDebug,
    playerLiveState,
    nodes,
    isLoading,
  } = useEditorStore();

  // Initialize Core 3D and Physics Engine
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Dynamically create a fresh canvas element to guarantee clean WebGL context lifecycle
    const canvas = document.createElement('canvas');
    canvas.className = 'viewport-canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);
    canvasRef.current = canvas;

    let sceneMgr: SceneManager;
    let renderMgr: RenderManager;
    let physicsMgr: PhysicsManager;
    let lightingMgr: LightingManager;
    let playerCtrl: PlayerController;

    try {
      sceneMgr = new SceneManager(container);
      renderMgr = new RenderManager(canvas);
      physicsMgr = new PhysicsManager();
      lightingMgr = new LightingManager(sceneMgr.scene, renderMgr.renderer);
      playerCtrl = new PlayerController(sceneMgr.fpCamera, physicsMgr, editorStore.getState().playerSettings);

      sceneManagerRef.current = sceneMgr;
      renderManagerRef.current = renderMgr;
      physicsManagerRef.current = physicsMgr;
      lightingManagerRef.current = lightingMgr;
      playerControllerRef.current = playerCtrl;

      // Sync initial background theme
      sceneMgr.setBackgroundTheme(themeStore.getTheme());

      // Attach physics debug group to scene
      sceneMgr.scene.add(physicsMgr.getDebugGroup());

      // Init Rapier 3D WASM
      physicsMgr.init().then(() => {
        playerCtrl.init(
          container,
          (isLocked) => {
            setIsPointerLocked(isLocked);
          },
          (playerPos) => {
            // Tab was pressed: Toggle gravity! If we were in fly mode, switch to grounded explore mode
            const currentMode = editorStore.getState().viewMode;
            if (currentMode === 'fly') {
              // Locate safe ground underneath current floating position
              const safeResult = physicsMgr.findSafeSpawn(playerPos[0], playerPos[2]);
              const targetY = safeResult.found ? safeResult.safeY : playerPos[1];
              editorStore.setState({
                viewMode: 'first_person',
                spawnPoint: {
                  position: [playerPos[0], targetY, playerPos[2]],
                  rotationY: playerCtrl['fpCamera']?.getYaw() || 0,
                  eyeHeight: 1.65,
                  isValidated: safeResult.found,
                  groundHeightFound: targetY,
                },
              });
              playerCtrl.setFlyMode(false);
            } else if (currentMode === 'first_person') {
              // Switch back to fly mode
              editorStore.setState({ viewMode: 'fly' });
              playerCtrl.setFlyMode(true);
            }
          }
        );

        if (onEngineReady) {
          onEngineReady({
            sceneManager: sceneMgr,
            physicsManager: physicsMgr,
            lightingManager: lightingMgr,
            playerController: playerCtrl,
          });
        }
      }).catch((err) => {
        console.error('Failed to init Rapier 3D:', err);
        editorStore.setErrorMessage(`Rapier 3D Physics initialization error: ${err}`);
      });

      // Start render loop
      renderMgr.startLoop(
        (delta) => {
          const currentMode = editorStore.getState().viewMode;
          if (currentMode === 'first_person' || currentMode === 'fly') {
            const liveState = playerCtrl.update(delta, editorStore.getState().playerSettings);
            editorStore.setState({ playerLiveState: liveState });
          } else {
            sceneMgr.update();
          }
        },
        () => {
          const camera = sceneMgr.getActiveCamera();
          renderMgr.renderer.render(sceneMgr.scene, camera);
        },
        (stats: PerformanceStats) => {
          editorStore.setState({ performanceStats: stats });
        }
      );
    } catch (err) {
      console.error('WebGL initialization failure:', err);
      editorStore.setErrorMessage(
        `Failed to initialize WebGL 3D renderer: ${err instanceof Error ? err.message : String(err)}. Please ensure WebGL is enabled in your browser.`
      );
      return;
    }

    // Resize handling
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      sceneMgr.handleResize(width, height);
      renderMgr.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const onCanvasClick = (e: MouseEvent) => {
      const currentMode = editorStore.getState().viewMode;
      if (currentMode === 'first_person' || currentMode === 'fly') {
        if (!playerCtrl.isPointerLocked()) {
          playerCtrl.requestPointerLock(container);
        }
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const pickedNodeId = sceneMgr.pickObjectAt(e.clientX, e.clientY, rect);
      if (pickedNodeId) {
        editorStore.selectNode(pickedNodeId);
      }
    };

    canvas.addEventListener('click', onCanvasClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('click', onCanvasClick);
      renderMgr.dispose();
      playerCtrl.dispose(container);
      physicsMgr.dispose();
      lightingMgr.dispose();
      sceneMgr.dispose();

      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
      canvasRef.current = null;
    };
  }, [onEngineReady]);

  // Sync View Mode transitions
  useEffect(() => {
    if (!sceneManagerRef.current || !playerControllerRef.current || !physicsManagerRef.current) return;

    sceneManagerRef.current.setViewMode(viewMode);

    if (viewMode === 'first_person') {
      playerControllerRef.current.setFlyMode(false);
      playerControllerRef.current.spawn(spawnPoint);
      if (containerRef.current) {
        playerControllerRef.current.requestPointerLock(containerRef.current);
      }
    } else if (viewMode === 'fly') {
      playerControllerRef.current.setFlyMode(true);
      playerControllerRef.current.spawn(spawnPoint);
      if (containerRef.current) {
        playerControllerRef.current.requestPointerLock(containerRef.current);
      }
    } else {
      playerControllerRef.current.exitPointerLock();
    }
  }, [viewMode, spawnPoint]);

  // Sync Lighting settings
  useEffect(() => {
    if (lightingManagerRef.current) {
      lightingManagerRef.current.updateSettings(lightingSettings);
    }
  }, [lightingSettings]);

  // Sync Theme background
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setBackgroundTheme(theme);
    }
  }, [theme]);

  // Sync Selection highlight
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.highlightNode(selectedNodeId);
    }
  }, [selectedNodeId]);

  // Sync Physics Debug Visibility
  useEffect(() => {
    if (physicsManagerRef.current) {
      physicsManagerRef.current.setDebugVisible(showPhysicsDebug);
    }
  }, [showPhysicsDebug]);

  // Sync Object Visibility
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    nodes.forEach((node) => {
      sceneManagerRef.current!.setNodeVisibility(node.id, node.visible);
    });
  }, [nodes]);

  const handleFocusSelected = () => {
    if (selectedNodeId && sceneManagerRef.current) {
      sceneManagerRef.current.focusNode(selectedNodeId);
    }
  };

  const handleToggleWireframe = () => {
    editorStore.setPhysicsDebug(!showPhysicsDebug);
  };

  return (
    <div className="viewport-container" ref={containerRef}>
      {/* Floating Viewport Toolbar (Orbit Mode) */}
      {viewMode === 'orbit' && (
        <div className="floating-viewport-toolbar">
          {selectedNodeId && (
            <button
              type="button"
              className="viewport-toolbar-btn"
              onClick={handleFocusSelected}
              title="Focus camera on selected object"
            >
              <Target size={13} color="var(--accent-cyan)" />
              <span>Focus Selected</span>
            </button>
          )}

          <button
            type="button"
            className={`viewport-toolbar-btn ${showPhysicsDebug ? 'active' : ''}`}
            onClick={handleToggleWireframe}
            title="Toggle Rapier collider wireframes"
          >
            <Layers size={13} />
            <span>Wireframe</span>
          </button>

          <button
            type="button"
            className="viewport-toolbar-btn"
            onClick={() => editorStore.setViewMode('fly')}
            title="Switch to Free-Fly mode"
          >
            <Sparkles size={13} color="#d166ff" />
            <span>Fly Mode</span>
          </button>

          <button
            type="button"
            className="viewport-toolbar-btn"
            onClick={() => editorStore.setViewMode('first_person')}
            title="Switch to First-Person mode"
          >
            <Footprints size={13} color="var(--accent-emerald)" />
            <span>Explore Mode</span>
          </button>
        </div>
      )}

      {/* Initial Empty State Banner if no nodes loaded */}
      {nodes.size === 0 && !isLoading && (
        <div className="viewport-empty-overlay">
          <UploadCloud size={48} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>
            Bring your 3D world into view
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', textAlign: 'center', lineHeight: 1.6 }}>
            Drop a supported .glb or .gltf file anywhere in the workspace to begin inspecting, or load the built-in Sample 3D Model environment.
          </p>
          {onLoadSample && (
            <button type="button" className="btn-primary-pill" onClick={onLoadSample} style={{ marginTop: '12px' }}>
              <Sparkles size={15} />
              <span>Load Sample 3D Model</span>
            </button>
          )}
        </div>
      )}

      {/* First-Person / Fly Mode HUD Overlay */}
      {(viewMode === 'first_person' || viewMode === 'fly') && (
        <div className="play-hud-overlay">
          {!isPointerLocked ? (
            <div
              className="hud-banner"
              style={{
                background: viewMode === 'fly' ? 'rgba(157, 0, 255, 0.35)' : 'rgba(0, 240, 255, 0.25)',
                border: viewMode === 'fly' ? '1px solid #d166ff' : '1px solid var(--accent-cyan)',
                cursor: 'pointer',
                boxShadow: viewMode === 'fly' ? '0 0 15px rgba(209, 102, 255, 0.4)' : '0 0 15px rgba(0, 240, 255, 0.3)',
              }}
              onClick={() => {
                if (containerRef.current && playerControllerRef.current) {
                  playerControllerRef.current.requestPointerLock(containerRef.current);
                }
              }}
            >
              <span style={{ color: '#fff', fontWeight: 700 }}>
                {viewMode === 'fly'
                  ? '🛸 CLICK VIEWPORT TO CAPTURE MOUSE (WASD/E/Q TO FLY | TAB: ACTIVATE GRAVITY)'
                  : '👉 CLICK VIEWPORT TO CAPTURE MOUSE & LOOK AROUND (WASD TO WALK | TAB: FLY)'}
              </span>
            </div>
          ) : (
            <div
              className="hud-banner"
              style={viewMode === 'fly' ? { borderColor: '#d166ff', background: 'rgba(20, 10, 35, 0.85)' } : {}}
            >
              <span style={{ color: viewMode === 'fly' ? '#d166ff' : 'var(--accent-cyan)', fontWeight: 700 }}>
                {viewMode === 'fly' ? '🛸 FREE-FLY MODE (NO GRAVITY)' : 'EXPLORATION ACTIVE (GRAVITY)'}
              </span>
              <span>WASD: Move</span>
              {viewMode === 'fly' && <span>E/Space: Up | Q/C: Down</span>}
              <span>Shift: Boost Speed</span>
              <span style={{ color: '#ffea00', fontWeight: 600 }}>[TAB]: {viewMode === 'fly' ? 'DROP / ACTIVATE GRAVITY' : 'SWITCH TO FLY'}</span>
              <span>Esc: Release Mouse</span>
            </div>
          )}

          <div className="hud-crosshair" />

          <div className="hud-telemetry">
            <div className="telemetry-row">
              <span>STATUS:</span>
              <span className="telemetry-val">
                {playerLiveState.isGrounded ? 'GROUNDED' : 'AIRBORNE'}
              </span>
            </div>
            <div className="telemetry-row">
              <span>SPEED:</span>
              <span className="telemetry-val">{playerLiveState.currentSpeed.toFixed(2)} m/s</span>
            </div>
            <div className="telemetry-row">
              <span>SLOPE:</span>
              <span className="telemetry-val">{playerLiveState.groundSlopeAngle.toFixed(1)}°</span>
            </div>
            <div className="telemetry-row">
              <span>POSITION:</span>
              <span className="telemetry-val">
                ({playerLiveState.position[0].toFixed(1)}, {playerLiveState.position[1].toFixed(1)}, {playerLiveState.position[2].toFixed(1)})
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
