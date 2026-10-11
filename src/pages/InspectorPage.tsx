import React, { useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  Layers,
  Tag,
  Shield,
  Mountain,
  Sun,
  Sliders,
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
import { FileDropZone } from '../components/FileDropZone';
import { LoadingOverlay } from '../components/LoadingOverlay';

import { SceneManager } from '../engine/SceneManager';
import { PhysicsManager } from '../physics/PhysicsManager';
import { LightingManager } from '../engine/LightingManager';
import { PlayerController } from '../player/PlayerController';
import { GLBImporter } from '../engine/GLBImporter';
import { SceneAnalyzer } from '../engine/SceneAnalyzer';
import { SampleSceneBuilder } from '../engine/SampleSceneBuilder';
import { editorStore, useEditorStore } from '../state/editorStore';
import { validateGLBFile, validateHDRFile } from '../utils/validation';

type SidebarTab = 'hierarchy' | 'discovery' | 'colliders' | 'terrain' | 'lighting' | 'motion';

export const InspectorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('hierarchy');
  const { viewMode } = useEditorStore();

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

      editorStore.setLoading(false);
    },
    []
  );

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

      // Automatically load the rich Mars Outpost sample scene on first load!
      handleLoadSample();
    },
    [handleLoadSample]
  );

  return (
    <div className="inspector-layout">
      {/* Top Navigation Bar */}
      <NavigationNavbar
        onLoadSample={handleLoadSample}
        onOpenGlbPicker={() => glbInputRef.current?.click()}
        onOpenHdrPicker={() => hdrInputRef.current?.click()}
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

      {/* Main Workspace Body with Drag-and-Drop Zone */}
      <div className="workspace-body">
        <FileDropZone onFileDrop={handleLoadFile}>
          <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
            {/* 3D Viewport */}
            <SceneViewport onEngineReady={handleEngineReady} />

            {/* Performance Stats Overlay */}
            <PerformanceStats />

            {/* Inspector Sidebar (hidden in first-person mode for immersion) */}
            {viewMode === 'orbit' && (
              <aside className="inspector-sidebar">
                {/* Tabs */}
                <div className="sidebar-tabs">
                  <button
                    className={`sidebar-tab ${activeTab === 'hierarchy' ? 'active' : ''}`}
                    onClick={() => setActiveTab('hierarchy')}
                    title="Scene Hierarchy"
                  >
                    <Layers size={13} />
                    <span>Tree</span>
                  </button>

                  <button
                    className={`sidebar-tab ${activeTab === 'discovery' ? 'active' : ''}`}
                    onClick={() => setActiveTab('discovery')}
                    title="Object Discovery & Classification"
                  >
                    <Tag size={13} />
                    <span>Classify</span>
                  </button>

                  <button
                    className={`sidebar-tab ${activeTab === 'colliders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('colliders')}
                    title="Rapier Colliders"
                  >
                    <Shield size={13} />
                    <span>Colliders</span>
                  </button>

                  <button
                    className={`sidebar-tab ${activeTab === 'terrain' ? 'active' : ''}`}
                    onClick={() => setActiveTab('terrain')}
                    title="Terrain & Spawn"
                  >
                    <Mountain size={13} />
                    <span>Terrain</span>
                  </button>

                  <button
                    className={`sidebar-tab ${activeTab === 'lighting' ? 'active' : ''}`}
                    onClick={() => setActiveTab('lighting')}
                    title="Lighting & HDRI"
                  >
                    <Sun size={13} />
                    <span>Lighting</span>
                  </button>

                  <button
                    className={`sidebar-tab ${activeTab === 'motion' ? 'active' : ''}`}
                    onClick={() => setActiveTab('motion')}
                    title="Movement Settings"
                  >
                    <Sliders size={13} />
                    <span>Motion</span>
                  </button>
                </div>

                {/* Panel Content */}
                <div className="panel-content">
                  {activeTab === 'hierarchy' && <ObjectHierarchy />}
                  {activeTab === 'discovery' && <ObjectDiscoveryPanel />}
                  {activeTab === 'colliders' && (
                    <ColliderSettingsPanel onRebuildColliders={handleRebuildColliders} />
                  )}
                  {activeTab === 'terrain' && (
                    <TerrainSettingsPanel physicsManager={physicsManagerRef.current} />
                  )}
                  {activeTab === 'lighting' && (
                    <LightingPanel
                      lightingManager={lightingManagerRef.current}
                      onOpenHdrPicker={() => hdrInputRef.current?.click()}
                    />
                  )}
                  {activeTab === 'motion' && <PlayControls />}
                </div>
              </aside>
            )}
          </div>
        </FileDropZone>
      </div>

      {/* Global Loading & Error Modal */}
      <LoadingOverlay />
    </div>
  );
};
