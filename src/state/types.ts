export type ObjectCategory =
  | 'building'
  | 'floor_ground'
  | 'wall'
  | 'terrain'
  | 'rock'
  | 'furniture'
  | 'equipment'
  | 'prop'
  | 'structural'
  | 'unknown';

export type ColliderMode =
  | 'none'
  | 'auto'
  | 'box_exact'
  | 'box_expanded'
  | 'convex'
  | 'trimesh'
  | 'ground_mesh';

export interface ColliderConfig {
  enabled: boolean;
  mode: ColliderMode;
  margin: number; // in meters (applied on sides, expands width and depth by 2*m)
  customDimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  targetArea?: number; // target footprint area in m²
  isGround: boolean;
  isWalkableSlope: boolean;
  friction?: number;
  restitution?: number;
}

export interface AnalyzedNode {
  id: string; // unique identifier
  uuid: string; // Three.js UUID
  name: string;
  type: string;
  parentId: string | null;
  childrenIds: string[];
  hasMeshes: boolean;
  meshCount: number;
  vertexCount: number;
  triangleCount: number;
  worldBoundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
  dimensions: [number, number, number]; // width (x), height (y), depth (z)
  center: [number, number, number];
  footprintArea: number; // width * depth
  category: ObjectCategory;
  categoryConfidence: number; // 0.0 - 1.0
  categoryReason: string;
  visible: boolean;
  colliderConfig: ColliderConfig;
}

export interface SpawnPointConfig {
  position: [number, number, number];
  rotationY: number; // yaw in radians
  eyeHeight: number;
  isValidated: boolean;
  groundHeightFound?: number;
}

export interface PlayerMotionSettings {
  walkSpeed: number; // m/s
  runSpeed: number; // m/s
  jumpForce: number; // m/s
  gravity: number; // m/s²
  mouseSensitivity: number;
  maxSlopeAngle: number; // in degrees (e.g. 45)
  maxStepHeight: number; // in meters (e.g. 0.35)
  enableBreathing: boolean;
  enableHeadBob: boolean;
  reducedMotion: boolean;
}

export interface LightingSettings {
  hdrName?: string;
  hdrUrl?: string;
  intensity: number;
  rotation: number; // in degrees 0-360
  showBackground: boolean;
  exposure: number;
  sunIntensity: number;
  sunElevation: number; // 0-90
  sunAzimuth: number; // 0-360
  ambientIntensity: number;
  shadowQuality: 'off' | 'low' | 'medium' | 'high';
}

export interface PerformanceStats {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  physicsBodies: number;
  physicsColliders: number;
}

export interface PlayerLiveState {
  isGrounded: boolean;
  currentSpeed: number;
  position: [number, number, number];
  velocity: [number, number, number];
  groundSlopeAngle: number;
  groundSurfaceName: string | null;
  isAirborne: boolean;
}

export type ViewportViewMode = 'orbit' | 'first_person';
