import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { editorStore } from '../state/editorStore';
import type { AnalyzedNode } from '../state/types';

describe('Spawn Point & Inspector World Transform Regression Tests', () => {
  beforeEach(() => {
    // Reset editor store spawn point
    editorStore.setSpawnPoint({
      position: [0, 2.5, 10],
      rotationY: 0,
      eyeHeight: 1.65,
      isValidated: true,
    });
    editorStore.selectNode(null);
  });

  describe('World Coordinate & Surface Top Bounds Calculation', () => {
    it('correctly calculates top-surface spawn coordinates for deeply nested objects with parent transforms', () => {
      // Create root scene hierarchy: Root -> Building Group (translated) -> Floor Mesh (scaled)
      const root = new THREE.Group();
      root.name = 'Model_Root';

      const buildingGroup = new THREE.Group();
      buildingGroup.name = 'Habitat_Complex';
      buildingGroup.position.set(15, 5, -20);
      root.add(buildingGroup);

      const floorGeo = new THREE.BoxGeometry(10, 1, 8); // width 10, height 1, depth 8
      const floorMat = new THREE.MeshBasicMaterial();
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.name = 'Observation_Deck_Floor';
      floorMesh.position.set(0, 4, 0); // local y = 4 within buildingGroup
      floorMesh.userData = { __inspectorNodeId: 'node-deck-42' };
      buildingGroup.add(floorMesh);

      // Force world matrix calculation
      root.updateMatrixWorld(true);

      // Calculate world Box3
      const box = new THREE.Box3().setFromObject(floorMesh);

      // World coordinates calculation:
      // Parent is at y=5, mesh local is at y=4, height is 1 (extends from y= -0.5 to +0.5).
      // World Y center = 5 + 4 = 9.
      // World Y max = 9 + 0.5 = 9.5.
      // World X center = 15.
      // World Z center = -20.
      expect(box.max.y).toBeCloseTo(9.5, 2);
      expect((box.min.x + box.max.x) / 2).toBeCloseTo(15, 2);
      expect((box.min.z + box.max.z) / 2).toBeCloseTo(-20, 2);

      // Spawn point placing calculation
      const safeSpawnPos: [number, number, number] = [
        (box.min.x + box.max.x) / 2,
        box.max.y + 0.1, // Small clearance above top surface
        (box.min.z + box.max.z) / 2,
      ];

      expect(safeSpawnPos[0]).toBeCloseTo(15, 2);
      expect(safeSpawnPos[1]).toBeCloseTo(9.6, 2);
      expect(safeSpawnPos[2]).toBeCloseTo(-20, 2);

      // Verify store accepts updated spawn point
      editorStore.setSpawnPoint({
        position: safeSpawnPos,
        rotationY: 0,
        eyeHeight: 1.65,
        isValidated: true,
      });

      const currentSpawn = editorStore.getState().spawnPoint;
      expect(currentSpawn.position).toEqual(safeSpawnPos);
      expect(currentSpawn.isValidated).toBe(true);
    });

    it('falls back to node position when node has zero or empty bounding dimensions', () => {
      const mockNode: AnalyzedNode = {
        id: 'empty-group-node',
        uuid: 'uuid-empty-01',
        name: 'EmptyMarker',
        type: 'Group',
        parentId: null,
        childrenIds: [],
        hasMeshes: false,
        category: 'prop',
        categoryConfidence: 1.0,
        categoryReason: 'Zero meshes',
        meshCount: 0,
        vertexCount: 0,
        triangleCount: 0,
        dimensions: [0, 0, 0],
        footprintArea: 0,
        center: [4, 1.2, -6],
        worldBoundingBox: {
          min: [4, 1.2, -6],
          max: [4, 1.2, -6],
        },
        visible: true,
        colliderConfig: {
          mode: 'none',
          enabled: false,
          margin: 0,
          isGround: false,
          isWalkableSlope: false,
        },
      };

      // When bounding box has zero volume or is missing, use node's recorded center position
      const targetPos: [number, number, number] = [
        mockNode.center[0],
        mockNode.center[1] + 0.5,
        mockNode.center[2],
      ];

      editorStore.setSpawnPoint({
        position: targetPos,
        rotationY: 0,
        eyeHeight: 1.65,
        isValidated: true,
      });

      expect(editorStore.getState().spawnPoint.position).toEqual([4, 1.7, -6]);
    });
  });

  describe('Spawn Point State & Mode Transitions', () => {
    it('synchronizes spawn point updates and node selection state in EditorStore', () => {
      editorStore.selectNode('terrain-mesh-01');
      expect(editorStore.getState().selectedNodeId).toBe('terrain-mesh-01');

      editorStore.setSpawnPoint({
        position: [12.5, 0.4, -8.2],
        rotationY: Math.PI / 4,
        eyeHeight: 1.7,
        isValidated: true,
      });

      const state = editorStore.getState();
      expect(state.spawnPoint.position[0]).toBeCloseTo(12.5);
      expect(state.spawnPoint.position[1]).toBeCloseTo(0.4);
      expect(state.spawnPoint.position[2]).toBeCloseTo(-8.2);
      expect(state.spawnPoint.rotationY).toBeCloseTo(Math.PI / 4);
      expect(state.spawnPoint.eyeHeight).toBe(1.7);
    });

    it('manages viewMode switching correctly between orbit, first_person, and fly', () => {
      expect(editorStore.getState().viewMode).toBe('orbit');

      editorStore.setViewMode('first_person');
      expect(editorStore.getState().viewMode).toBe('first_person');

      editorStore.setViewMode('fly');
      expect(editorStore.getState().viewMode).toBe('fly');

      editorStore.setViewMode('orbit');
      expect(editorStore.getState().viewMode).toBe('orbit');
    });

    it('updates player live telemetry when player spawns and navigates', () => {
      editorStore.updatePlayerLiveState({
        position: [5, 1.65, 10],
        velocity: [0, 0, 0],
        isGrounded: true,
        currentSpeed: 0,
        groundSlopeAngle: 12.5,
        groundSurfaceName: 'Terrain_Bedrock',
        isAirborne: false,
      });

      const live = editorStore.getState().playerLiveState;
      expect(live.position).toEqual([5, 1.65, 10]);
      expect(live.groundSlopeAngle).toBe(12.5);
      expect(live.groundSurfaceName).toBe('Terrain_Bedrock');
      expect(live.isGrounded).toBe(true);
    });
  });

  describe('3D Spawn Waypoint Beacon Structure', () => {
    it('creates waypoint hierarchy with dual ground rings, silhouette capsule, directional pointer, and vertical beacon', () => {
      const beaconGroup = new THREE.Group();
      beaconGroup.name = 'Spawn_Point_Marker';

      // 1. Dual horizontal rings
      const innerRing = new THREE.Mesh(
        new THREE.RingGeometry(0.35, 0.5, 32),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      innerRing.rotateX(-Math.PI / 2);
      beaconGroup.add(innerRing);

      const outerRing = new THREE.Mesh(
        new THREE.RingGeometry(0.65, 0.72, 32),
        new THREE.MeshBasicMaterial({ color: 0x00e699 })
      );
      outerRing.rotateX(-Math.PI / 2);
      beaconGroup.add(outerRing);

      // 2. Holographic player silhouette capsule
      const capsule = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 1.4, 16),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true })
      );
      capsule.position.y = 0.88;
      beaconGroup.add(capsule);

      // 3. Directional indicator cone
      const pointer = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.35, 8),
        new THREE.MeshBasicMaterial({ color: 0x00e699 })
      );
      pointer.position.set(0, 0.05, -0.65);
      beaconGroup.add(pointer);

      // 4. Vertical beacon beam
      const laserBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 3.0, 8),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      laserBeam.position.y = 1.5;
      beaconGroup.add(laserBeam);

      // Test placement and visibility
      beaconGroup.position.set(10, 2.5, -5);
      beaconGroup.visible = true;

      expect(beaconGroup.children.length).toBe(5);
      expect(beaconGroup.position.x).toBe(10);
      expect(beaconGroup.position.y).toBe(2.5);
      expect(beaconGroup.position.z).toBe(-5);
      expect(beaconGroup.visible).toBe(true);

      // Verify bounds encompass full height of beacon
      const beaconBox = new THREE.Box3().setFromObject(beaconGroup);
      expect(beaconBox.max.y).toBeGreaterThan(2.5); // Laser beam extends upwards
    });
  });
});
