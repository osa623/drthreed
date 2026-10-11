import React, { useRef, useEffect } from 'react';
import { useEditorStore, editorStore } from '../state/editorStore';
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
}

export const SceneViewport: React.FC<SceneViewportProps> = ({ onEngineReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sceneManagerRef = useRef<SceneManager | null>(null);
  const renderManagerRef = useRef<RenderManager | null>(null);
  const physicsManagerRef = useRef<PhysicsManager | null>(null);
  const lightingManagerRef = useRef<LightingManager | null>(null);
  const playerControllerRef = useRef<PlayerController | null>(null);

  const {
    viewMode,
    lightingSettings,
    spawnPoint,
    selectedNodeId,
    showPhysicsDebug,
    playerLiveState,
    nodes,
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

      // Attach physics debug group to scene
      sceneMgr.scene.add(physicsMgr.getDebugGroup());

      // Init Rapier 3D WASM
      physicsMgr.init().then(() => {
        playerCtrl.init(container, (isLocked) => {
          if (!isLocked && editorStore.getState().viewMode === 'first_person') {
            // pointer lock was released by pressing Esc
          }
        });

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
          if (currentMode === 'first_person') {
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
      if (editorStore.getState().viewMode === 'first_person') {
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
      // Validate spawn and spawn player
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

  return (
    <div className="viewport-container" ref={containerRef}>

      {/* First-Person HUD Overlay */}
      {viewMode === 'first_person' && (
        <div className="play-hud-overlay">
          <div className="hud-banner">
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>FIRST-PERSON EXPLORATION</span>
            <span>WASD: Move</span>
            <span>Shift: Run</span>
            <span>Space: Jump</span>
            <span>Esc: Exit Mode</span>
          </div>

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
