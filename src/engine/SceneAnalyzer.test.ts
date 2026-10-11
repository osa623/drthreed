import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { SceneAnalyzer } from './SceneAnalyzer';

describe('SceneAnalyzer', () => {
  it('correctly analyzes a scene graph and classifies architectural categories', () => {
    const root = new THREE.Group();
    root.name = 'TestEnvironmentRoot';

    // 1. Terrain Mesh
    const terrainGeo = new THREE.PlaneGeometry(30, 30, 4, 4);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMesh = new THREE.Mesh(terrainGeo, new THREE.MeshBasicMaterial());
    terrainMesh.name = 'Terrain_Crater_Floor';
    root.add(terrainMesh);

    // 2. Building Habitat
    const habGroup = new THREE.Group();
    habGroup.name = 'Habitat_Main_Module';
    const habBox = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), new THREE.MeshBasicMaterial());
    habBox.name = 'Hab_Walls';
    habGroup.add(habBox);
    root.add(habGroup);

    // 3. Wall Barrier
    const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 5), new THREE.MeshBasicMaterial());
    wallMesh.name = 'Wall_Partition_North';
    root.add(wallMesh);

    // 4. Lab Console
    const consoleMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 0.8), new THREE.MeshBasicMaterial());
    consoleMesh.name = 'Console_Terminal';
    root.add(consoleMesh);

    // 5. Small Prop
    const propMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial());
    propMesh.name = 'Prop_Crate_Sample';
    root.add(propMesh);

    const result = SceneAnalyzer.analyzeScene(root);

    expect(result.nodes.size).toBeGreaterThan(4);
    expect(result.totalMeshes).toBe(5);

    // Find analyzed nodes
    const terrainNode = Array.from(result.nodes.values()).find((n) => n.name === 'Terrain_Crater_Floor');
    expect(terrainNode).toBeDefined();
    expect(terrainNode?.category).toBe('terrain');
    expect(terrainNode?.colliderConfig.isGround).toBe(true);

    const habNode = Array.from(result.nodes.values()).find((n) => n.name === 'Habitat_Main_Module');
    expect(habNode).toBeDefined();
    expect(habNode?.category).toBe('building');

    const wallNode = Array.from(result.nodes.values()).find((n) => n.name === 'Wall_Partition_North');
    expect(wallNode).toBeDefined();
    expect(wallNode?.category).toBe('wall');

    const consoleNode = Array.from(result.nodes.values()).find((n) => n.name === 'Console_Terminal');
    expect(consoleNode).toBeDefined();
    expect(consoleNode?.category).toBe('furniture');

    const propNode = Array.from(result.nodes.values()).find((n) => n.name === 'Prop_Crate_Sample');
    expect(propNode).toBeDefined();
    expect(propNode?.category).toBe('prop');
  });

  it('calculates bounding box and footprint area correctly', () => {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 5), new THREE.MeshBasicMaterial());
    mesh.name = 'Test_Box';
    root.add(mesh);

    const result = SceneAnalyzer.analyzeScene(root);
    const boxNode = Array.from(result.nodes.values()).find((n) => n.name === 'Test_Box');

    expect(boxNode).toBeDefined();
    expect(boxNode?.dimensions[0]).toBeCloseTo(4, 1);
    expect(boxNode?.dimensions[1]).toBeCloseTo(2, 1);
    expect(boxNode?.dimensions[2]).toBeCloseTo(5, 1);
    expect(boxNode?.footprintArea).toBeCloseTo(20, 1); // 4 * 5 = 20 m²
  });
});
