import { useState, useEffect } from 'react';
import type {
  AnalyzedNode,
  ColliderConfig,
  LightingSettings,
  ObjectCategory,
  PerformanceStats,
  PlayerLiveState,
  PlayerMotionSettings,
  SpawnPointConfig,
  ViewportViewMode,
} from './types';

export interface EditorState {
  loadedModelName: string | null;
  nodes: Map<string, AnalyzedNode>;
  rootNodeId: string | null;
  selectedNodeId: string | null;
  searchQuery: string;
  categoryFilter: ObjectCategory | 'all';
  viewMode: ViewportViewMode;

  // Configuration
  spawnPoint: SpawnPointConfig;
  playerSettings: PlayerMotionSettings;
  lightingSettings: LightingSettings;

  // Live telemetry
  playerLiveState: PlayerLiveState;
  performanceStats: PerformanceStats;
  showPhysicsDebug: boolean;

  // Status & Feedback
  isLoading: boolean;
  loadingProgress: number;
  loadingMessage: string;
  errorMessage: string | null;
}

type Listener = (state: EditorState) => void;

class EditorStore {
  private state: EditorState = {
    loadedModelName: null,
    nodes: new Map(),
    rootNodeId: null,
    selectedNodeId: null,
    searchQuery: '',
    categoryFilter: 'all',
    viewMode: 'orbit',

    spawnPoint: {
      position: [0, 2.5, 10],
      rotationY: 0,
      eyeHeight: 1.65,
      isValidated: true,
    },

    playerSettings: {
      walkSpeed: 4.2,
      runSpeed: 8.0,
      jumpForce: 5.2,
      gravity: 18.0,
      mouseSensitivity: 0.0022,
      maxSlopeAngle: 42,
      maxStepHeight: 0.35,
      enableBreathing: true,
      enableHeadBob: true,
      reducedMotion: false,
    },

    lightingSettings: {
      intensity: 1.2,
      rotation: 45,
      showBackground: false,
      exposure: 1.1,
      sunIntensity: 2.2,
      sunElevation: 42,
      sunAzimuth: 135,
      ambientIntensity: 0.6,
      shadowQuality: 'high',
    },

    playerLiveState: {
      isGrounded: true,
      currentSpeed: 0,
      position: [0, 2.5, 10],
      velocity: [0, 0, 0],
      groundSlopeAngle: 0,
      groundSurfaceName: null,
      isAirborne: false,
    },

    performanceStats: {
      fps: 60,
      frameTimeMs: 16.6,
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0,
      physicsBodies: 0,
      physicsColliders: 0,
    },

    showPhysicsDebug: true,
    isLoading: false,
    loadingProgress: 0,
    loadingMessage: '',
    errorMessage: null,
  };

  private listeners = new Set<Listener>();

  public getState(): EditorState {
    return this.state;
  }

  public setState(partial: Partial<EditorState> | ((prev: EditorState) => Partial<EditorState>)): void {
    const next = typeof partial === 'function' ? partial(this.state) : partial;
    this.state = { ...this.state, ...next };
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // Helper Actions
  public selectNode(nodeId: string | null): void {
    this.setState({ selectedNodeId: nodeId });
  }

  public setNodeVisibility(nodeId: string, visible: boolean): void {
    const node = this.state.nodes.get(nodeId);
    if (!node) return;

    const updatedMap = new Map(this.state.nodes);
    updatedMap.set(nodeId, { ...node, visible });
    this.setState({ nodes: updatedMap });
  }

  public updateNodeCategory(nodeId: string, category: ObjectCategory): void {
    const node = this.state.nodes.get(nodeId);
    if (!node) return;

    const updatedMap = new Map(this.state.nodes);
    updatedMap.set(nodeId, {
      ...node,
      category,
      categoryReason: `User manually reclassified as ${category}.`,
      categoryConfidence: 1.0,
    });
    this.setState({ nodes: updatedMap });
  }

  public updateNodeCollider(nodeId: string, partialConfig: Partial<ColliderConfig>): void {
    const node = this.state.nodes.get(nodeId);
    if (!node) return;

    const updatedConfig: ColliderConfig = {
      ...node.colliderConfig,
      ...partialConfig,
    };

    const updatedMap = new Map(this.state.nodes);
    updatedMap.set(nodeId, {
      ...node,
      colliderConfig: updatedConfig,
    });
    this.setState({ nodes: updatedMap });
  }

  public setViewMode(mode: ViewportViewMode): void {
    this.setState({ viewMode: mode });
  }

  public setPhysicsDebug(visible: boolean): void {
    this.setState({ showPhysicsDebug: visible });
  }

  public setSearchQuery(q: string): void {
    this.setState({ searchQuery: q });
  }

  public setCategoryFilter(f: ObjectCategory | 'all'): void {
    this.setState({ categoryFilter: f });
  }

  public setErrorMessage(msg: string | null): void {
    this.setState({ errorMessage: msg });
  }

  public setLoading(loading: boolean, message = '', progress = 0): void {
    this.setState({
      isLoading: loading,
      loadingMessage: message,
      loadingProgress: progress,
    });
  }
}

export const editorStore = new EditorStore();

export function useEditorStore(): EditorState {
  const [state, setState] = useState<EditorState>(editorStore.getState());

  useEffect(() => {
    return editorStore.subscribe((nextState) => {
      setState(nextState);
    });
  }, []);

  return state;
}
