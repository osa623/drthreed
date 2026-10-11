import React, { useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  Layers,
  Tag,
  Shield,
  Sun,
  Sliders,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NavigationNavbar } from '../components/NavigationNavbar';
import { SceneViewport } from '../components/SceneViewport';
import { ObjectHierarchy } from '../components/ObjectHierarchy';
import { ObjectDiscoveryPanel } from '../components/ObjectDiscoveryPanel';
import { ColliderSettingsPanel } from '../components/ColliderSettingsPanel';
import { TerrainSettingsPanel } from '../components/TerrainSettingsPanel';
import { LightingPanel } from '../components/LightingPanel';
import { PlayControls } from '../components/PlayControls';
import { PerformanceStats } from '../components/PerformanceStats';
import { InspectorStatusBar } from '../components/InspectorStatusBar';
import { FileDropZone } from '../components/FileDropZone';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { HelpShortcutsModal } from '../components/HelpShortcutsModal';

import { SceneManager } from '../engine/SceneManager';
import { PhysicsManager } from '../physics/PhysicsManager';
import { LightingManager } from '../engine/LightingManager';
import { PlayerController } from '../player/PlayerController';
import { GLBImporter } from '../engine/GLBImporter';
import { SceneAnalyzer } from '../engine/SceneAnalyzer';
import { SampleSceneBuilder } from '../engine/SampleSceneBuilder';
import { editorStore, useEditorStore } from '../state/editorStore';
import type { SpawnPointConfig } from '../state/types';
import { validateGLBFile, validateHDRFile } from '../utils/validation';

type LeftSidebarTab = 'tree' | 'inventory';
type RightSidebarTab = 'colliders' | 'lighting' | 'locomotion';

export const InspectorPage: React.FC = () => {
  const [leftTab, setLeftTab] = useState<LeftSidebarTab>('tree');
  const [rightTab, setRightTab] = useState<RightSidebarTab>('colliders');
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  const { viewMode, nodes } = useEditorStore();

  const sceneManagerRef = useRef<SceneManager | null>(null);
  const physicsManagerRef = useRef<PhysicsManager | null>(null);
  const lightingManagerRef = useRef<LightingManager | null>(null);
  const playerControllerRef = useRef<PlayerController | null>(null);

  const glbInputRef = useRef<HTMLInputElement>(null);
  const hdrInputRef = useRef<HTMLInputElement>(null);

  // Rebuilds colliders when user alters settings
  const handleRebuildColliders = useCallback(() => {
    if (!sceneManagerRef.current || !physicsManagerRef.current) return;
    const model = sceneManagerRef.current.getModel();
    if (!model) return;

    physicsManagerRef.current.rebuildColliders(
      model,
      editorStore.getState().nodes,
      true
    );
  }, []);

  // Process and ingest Three.js object hierarchy
  const ingestScene = useCallback(
    (rootObj: THREE.Object3D, modelName: string) => {
      if (!sceneManagerRef.current || !physicsManagerRef.current) return;

      editorStore.setLoading(true, 'Analyzing Scene Graph & Classifying Objects...', 40);

      // 1. Analyze and classify
      const analysis = SceneAnalyzer.analyzeScene(rootObj);

      // 2. Add to 3D scene
      sceneManagerRef.current.setModel(rootObj);

      // 3. Update store
      editorStore.setState({
        loadedModelName: modelName,
        nodes: analysis.nodes,
        rootNodeId: analysis.rootId,
        selectedNodeId: null,
      });

      // 4. Build Rapier colliders
      editorStore.setLoading(true, 'Constructing Rapier 3D Colliders...', 80);
      physicsManagerRef.current.rebuildColliders(rootObj, analysis.nodes, false);

      // 5. Calculate safe spawn point dynamically tailored to this specific environment
      const smartSpawn = physicsManagerRef.current.calculateSmartSpawn(
        analysis.sceneBounds,
        analysis.nodes
      );

      editorStore.setState({
        spawnPoint: {
          position: smartSpawn.safePosition,
          rotationY: 0,
          eyeHeight: 1.65,
          isValidated: smartSpawn.isValidated,
        },
      });

      // Update 3D spawn marker beacon in scene
      sceneManagerRef.current.updateSpawnMarker(smartSpawn.safePosition, true);

      if (playerControllerRef.current) {
        playerControllerRef.current.spawn({
          position: smartSpawn.safePosition,
          rotationY: 0,
          eyeHeight: 1.65,
          isValidated: smartSpawn.isValidated,
        });
      }

      editorStore.setLoading(false);
    },
    []
  );

  // Spawn player at a given node with true world coordinates
  const handleSpawnAtNode = useCallback((nodeId: string) => {
    if (!sceneManagerRef.current) return;
    const box = sceneManagerRef.current.getObjectWorldBounds(nodeId);
    const node = editorStore.getState().nodes.get(nodeId);
    if (!box || box.isEmpty() || !node) return;

    const center = box.getCenter(new THREE.Vector3());
    const topY = parseFloat(box.max.y.toFixed(2));

    let spawnY = topY;
    let isValidated = false;

    if (physicsManagerRef.current) {
      const safe = physicsManagerRef.current.findSafeSpawn(center.x, center.z);
      if (safe.found && Math.abs(safe.safeY - topY) < 4.0) {
        spawnY = parseFloat(safe.safeY.toFixed(2));
        isValidated = true;
      }
    }

    const newSpawnPos: [number, number, number] = [
      parseFloat(center.x.toFixed(2)),
      spawnY,
      parseFloat(center.z.toFixed(2)),
    ];

    const newSpawnConfig: SpawnPointConfig = {
      position: newSpawnPos,
      rotationY: 0,
      eyeHeight: 1.65,
      isValidated,
      groundHeightFound: spawnY,
    };

    editorStore.setState({
      spawnPoint: newSpawnConfig,
      selectedNodeId: nodeId,
    });

    sceneManagerRef.current.updateSpawnMarker(
      newSpawnPos,
      editorStore.getState().viewMode === 'orbit'
    );

    if (playerControllerRef.current) {
      playerControllerRef.current.spawn(newSpawnConfig);
    }
  }, []);

  // Automatically find safe spawn across scene
  const handleAutoFindSafeSpawn = useCallback(() => {
    if (!physicsManagerRef.current || !sceneManagerRef.current) return;
    const { nodes } = editorStore.getState();
    if (nodes.size === 0) return;

    const bounds = new THREE.Box3();
    nodes.forEach((n) => {
      bounds.union(
        new THREE.Box3(
          new THREE.Vector3(...n.worldBoundingBox.min),
          new THREE.Vector3(...n.worldBoundingBox.max)
        )
      );
    });

    const smart = physicsManagerRef.current.calculateSmartSpawn(bounds, nodes);
    const newSpawnConfig: SpawnPointConfig = {
      position: smart.safePosition,
      rotationY: 0,
      eyeHeight: 1.65,
      isValidated: smart.isValidated,
      groundHeightFound: smart.isValidated ? smart.safePosition[1] : undefined,
    };

    editorStore.setState({ spawnPoint: newSpawnConfig });

    sceneManagerRef.current.updateSpawnMarker(
      smart.safePosition,
      editorStore.getState().viewMode === 'orbit'
    );

    if (playerControllerRef.current) {
      playerControllerRef.current.spawn(newSpawnConfig);
    }
  }, []);

  // Load built-in Mars Research Outpost
  const handleLoadSample = useCallback(() => {
    editorStore.setLoading(true, 'Generating Mars Research Outpost Alpha...', 20);
    setTimeout(() => {
      try {
        const sampleRoot = SampleSceneBuilder.buildMarsOutpostScene();
        ingestScene(sampleRoot, 'Mars_Outpost_Alpha.glb');
      } catch (err) {
        editorStore.setLoading(false);
        editorStore.setErrorMessage(`Failed to generate sample environment: ${err}`);
      }
    }, 50);
  }, [ingestScene]);

  // Load user-provided file
  const handleLoadFile = useCallback(
    async (file: File) => {
      const fileName = file.name.toLowerCase();

      // Check if HDRI
      if (fileName.endsWith('.hdr')) {
        const val = validateHDRFile(file);
        if (!val.valid) {
          editorStore.setErrorMessage(val.details || val.message || 'Invalid HDRI');
          return;
        }

        if (lightingManagerRef.current) {
          editorStore.setLoading(true, `Processing HDRI "${file.name}"...`, 50);
          try {
            await lightingManagerRef.current.loadHDR(file);
            editorStore.setState((prev) => ({
              lightingSettings: {
                ...prev.lightingSettings,
                hdrName: file.name,
                showBackground: true,
              },
            }));
          } catch (err) {
            editorStore.setErrorMessage(`Failed to load HDR file: ${err}`);
          } finally {
            editorStore.setLoading(false);
          }
        }
        return;
      }

      // Check if GLB / glTF
      const val = validateGLBFile(file);
      if (!val.valid) {
        editorStore.setErrorMessage(val.details || val.message || 'Invalid file');
        return;
      }

      editorStore.setLoading(true, `Importing "${file.name}"...`, 10);
      const importer = new GLBImporter();

      try {
        const gltf = await importer.loadFromFile(file, (progress) => {
          editorStore.setLoading(true, `Reading "${file.name}" (${progress.percent}%)...`, progress.percent);
        });

        ingestScene(gltf.scene, file.name);
      } catch (err) {
        editorStore.setErrorMessage(
          err instanceof Error ? err.message : `Unknown error importing 3D file.`
        );
      } finally {
        editorStore.setLoading(false);
      }
    },
    [ingestScene]
  );

  // Focus node in scene
  const handleFocusNode = useCallback((nodeId: string) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.focusNode(nodeId);
    }
  }, []);

  // Hook up engine instances once ready
  const handleEngineReady = useCallback(
    (instances: {
      sceneManager: SceneManager;
      physicsManager: PhysicsManager;
      lightingManager: LightingManager;
      playerController: PlayerController;
    }) => {
      sceneManagerRef.current = instances.sceneManager;
      physicsManagerRef.current = instances.physicsManager;
      lightingManagerRef.current = instances.lightingManager;
      playerControllerRef.current = instances.playerController;

      // Automatically load Mars Outpost sample scene on first load!
      handleLoadSample();
    },
    [handleLoadSample]
  );

  return (
    <div className="inspector-layout">
      {/* Top Application Bar */}
      <NavigationNavbar
        onLoadSample={handleLoadSample}
        onOpenGlbPicker={() => glbInputRef.current?.click()}
        onOpenHdrPicker={() => hdrInputRef.current?.click()}
        onOpenHelp={() => setHelpOpen(true)}
      />

      {/* Hidden File Pickers */}
      <input
        ref={glbInputRef}
        type="file"
        accept=".glb,.gltf"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.[0]) handleLoadFile(e.target.files[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={hdrInputRef}
        type="file"
        accept=".hdr"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.[0]) handleLoadFile(e.target.files[0]);
          e.target.value = '';
        }}
      />

      {/* Main Workspace Body */}
      <div className="workspace-body">
        <FileDropZone onFileDrop={handleLoadFile}>
          <div className="workspace-inner-flex">

            {/* =======================================================
                Left Sidebar — Scene Explorer (Hierarchy & Inventory)
                ======================================================= */}
            {viewMode === 'orbit' && (
              <aside className={`inspector-sidebar sidebar-left ${isLeftOpen ? 'open' : 'collapsed'}`}>
                {isLeftOpen ? (
                  <>
                    <div className="sidebar-header">
                      <div className="sidebar-header-title">
                        <Layers size={14} color="var(--accent-cyan)" />
                        <span>Scene Explorer</span>
                        <span className="sidebar-count-badge">{nodes.size}</span>
                      </div>
                      <button
                        type="button"
                        className="sidebar-collapse-btn"
                        onClick={() => setIsLeftOpen(false)}
                        title="Collapse Scene Explorer"
                        aria-label="Collapse Scene Explorer"
                      >
                        <ChevronLeft size={14} />
                      </button>
                    </div>

                    {/* Left Panel Tabs */}
                    <div className="sidebar-tabs">
                      <button
                        type="button"
                        className={`sidebar-tab ${leftTab === 'tree' ? 'active' : ''}`}
                        onClick={() => setLeftTab('tree')}
                      >
                        <Layers size={12} />
                        <span>Hierarchy</span>
                      </button>
                      <button
                        type="button"
                        className={`sidebar-tab ${leftTab === 'inventory' ? 'active' : ''}`}
                        onClick={() => setLeftTab('inventory')}
                      >
                        <Tag size={12} />
                        <span>Inventory</span>
                      </button>
                    </div>

                    <div className="panel-content">
                      {leftTab === 'tree' && (
                        <ObjectHierarchy
                          onFocusNode={handleFocusNode}
                          onSpawnAtNode={handleSpawnAtNode}
                        />
                      )}
                      {leftTab === 'inventory' && <ObjectDiscoveryPanel />}
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    className="sidebar-collapsed-strip"
                    onClick={() => setIsLeftOpen(true)}
                    title="Expand Scene Explorer"
                    aria-label="Expand Scene Explorer"
                  >
                    <ChevronRight size={14} />
                    <span className="collapsed-strip-label">SCENE EXPLORER ({nodes.size})</span>
                  </button>
                )}
              </aside>
            )}

            {/* =======================================================
                Center 3D Viewport
                ======================================================= */}
            <div className="center-viewport-wrapper">
              <SceneViewport
                onEngineReady={handleEngineReady}
                onLoadSample={handleLoadSample}
              />

              {/* Performance Stats HUD Overlay */}
              <PerformanceStats />

              {/* Viewport Floating Re-expand Buttons when panels are collapsed in orbit mode */}
              {viewMode === 'orbit' && (!isLeftOpen || !isRightOpen) && (
                <div className="viewport-dock-controls">
                  {!isLeftOpen && (
                    <button
                      type="button"
                      className="dock-toggle-btn"
                      onClick={() => setIsLeftOpen(true)}
                      title="Expand Left Panel"
                    >
                      <Layers size={13} />
                      <span>Scene Explorer</span>
                    </button>
                  )}
                  {!isRightOpen && (
                    <button
                      type="button"
                      className="dock-toggle-btn"
                      onClick={() => setIsRightOpen(true)}
                      title="Expand Right Panel"
                    >
                      <Sliders size={13} />
                      <span>Properties & Environment</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* =======================================================
                Right Sidebar — Properties & Environment
                ======================================================= */}
            {viewMode === 'orbit' && (
              <aside className={`inspector-sidebar sidebar-right ${isRightOpen ? 'open' : 'collapsed'}`}>
                {isRightOpen ? (
                  <>
                    <div className="sidebar-header">
                      <div className="sidebar-header-title">
                        <Sliders size={14} color="var(--accent-cyan)" />
                        <span>Properties & Environment</span>
                      </div>
                      <button
                        type="button"
                        className="sidebar-collapse-btn"
                        onClick={() => setIsRightOpen(false)}
                        title="Collapse Properties Panel"
                        aria-label="Collapse Properties Panel"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    {/* Right Panel Tabs */}
                    <div className="sidebar-tabs">
                      <button
                        type="button"
                        className={`sidebar-tab ${rightTab === 'colliders' ? 'active' : ''}`}
                        onClick={() => setRightTab('colliders')}
                        title="Selected Object Properties & Rapier Colliders"
                      >
                        <Shield size={12} />
                        <span>Colliders</span>
                      </button>

                      <button
                        type="button"
                        className={`sidebar-tab ${rightTab === 'lighting' ? 'active' : ''}`}
                        onClick={() => setRightTab('lighting')}
                        title="HDRI & Solar Lighting Configuration"
                      >
                        <Sun size={12} />
                        <span>Lighting</span>
                      </button>

                      <button
                        type="button"
                        className={`sidebar-tab ${rightTab === 'locomotion' ? 'active' : ''}`}
                        onClick={() => setRightTab('locomotion')}
                        title="Terrain Limits, Autostepping & Movement Dynamics"
                      >
                        <Sliders size={12} />
                        <span>Motion</span>
                      </button>
                    </div>

                    <div className="panel-content">
                      {rightTab === 'colliders' && (
                        <ColliderSettingsPanel onRebuildColliders={handleRebuildColliders} />
                      )}

                      {rightTab === 'lighting' && (
                        <LightingPanel
                          lightingManager={lightingManagerRef.current}
                          onOpenHdrPicker={() => hdrInputRef.current?.click()}
                        />
                      )}

                      {rightTab === 'locomotion' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <TerrainSettingsPanel
                            physicsManager={physicsManagerRef.current}
                            onSpawnAtNode={handleSpawnAtNode}
                            onAutoFindSpawn={handleAutoFindSafeSpawn}
                          />
                          <PlayControls />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    className="sidebar-collapsed-strip right-strip"
                    onClick={() => setIsRightOpen(true)}
                    title="Expand Properties & Environment"
                    aria-label="Expand Properties & Environment"
                  >
                    <ChevronLeft size={14} />
                    <span className="collapsed-strip-label">PROPERTIES & LIGHTING</span>
                  </button>
                )}
              </aside>
            )}

          </div>
        </FileDropZone>
      </div>

      {/* Bottom Technical Telemetry Status Bar */}
      <InspectorStatusBar />

      {/* Global Loading & Error Modal */}
      <LoadingOverlay />

      {/* Navigation Controls & Keyboard Shortcuts Modal */}
      <HelpShortcutsModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
};
