import * as THREE from 'three';
import type { AnalyzedNode, ColliderConfig, ObjectCategory } from '../state/types';

export class SceneAnalyzer {
  private static idCounter = 0;

  /**
   * Performs recursive scene graph analysis and classification.
   */
  public static analyzeScene(root: THREE.Object3D): {
    nodes: Map<string, AnalyzedNode>;
    rootId: string;
    totalTriangles: number;
    totalVertices: number;
    totalMeshes: number;
    sceneBounds: THREE.Box3;
  } {
    const nodes = new Map<string, AnalyzedNode>();
    let totalTriangles = 0;
    let totalVertices = 0;
    let totalMeshes = 0;

    // Ensure world matrices are up-to-date
    root.updateMatrixWorld(true);

    const sceneBounds = new THREE.Box3();
    let hasCalculatedBounds = false;

    // First pass: Traverse all nodes and build entries
    const processNode = (obj: THREE.Object3D, parentId: string | null): string => {
      this.idCounter++;
      const nodeId = `node_${this.idCounter}_${obj.name ? obj.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'unnamed'}`;
      
      // Store reference on Object3D userData
      obj.userData.__inspectorNodeId = nodeId;

      let meshCount = 0;
      let vertexCount = 0;
      let triangleCount = 0;
      const childrenIds: string[] = [];

      const nodeBox = new THREE.Box3();
      let nodeHasBounds = false;

      // Check if this object is a mesh
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        meshCount = 1;
        totalMeshes++;

        if (mesh.geometry) {
          const posAttr = mesh.geometry.attributes.position;
          if (posAttr) {
            vertexCount = posAttr.count;
            totalVertices += vertexCount;
          }
          if (mesh.geometry.index) {
            triangleCount = mesh.geometry.index.count / 3;
          } else if (posAttr) {
            triangleCount = posAttr.count / 3;
          }
          totalTriangles += triangleCount;

          mesh.geometry.computeBoundingBox();
          if (mesh.geometry.boundingBox) {
            const meshWorldBox = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
            nodeBox.union(meshWorldBox);
            nodeHasBounds = true;
          }
        }
      }

      // Process children
      for (const child of obj.children) {
        // Skip helper objects or internal gizmos
        if (child.userData?.__isInternalGizmo) continue;
        const childId = processNode(child, nodeId);
        childrenIds.push(childId);

        const childNode = nodes.get(childId);
        if (childNode) {
          meshCount += childNode.meshCount;
          vertexCount += childNode.vertexCount;
          triangleCount += childNode.triangleCount;

          if (childNode.dimensions[0] > 0 || childNode.dimensions[1] > 0 || childNode.dimensions[2] > 0) {
            nodeBox.union(
              new THREE.Box3(
                new THREE.Vector3(...childNode.worldBoundingBox.min),
                new THREE.Vector3(...childNode.worldBoundingBox.max)
              )
            );
            nodeHasBounds = true;
          }
        }
      }

      if (nodeHasBounds) {
        if (!hasCalculatedBounds) {
          sceneBounds.copy(nodeBox);
          hasCalculatedBounds = true;
        } else {
          sceneBounds.union(nodeBox);
        }
      }

      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      if (nodeHasBounds) {
        nodeBox.getSize(size);
        nodeBox.getCenter(center);
      }

      const dimensions: [number, number, number] = [
        Math.max(0.01, parseFloat(size.x.toFixed(3))),
        Math.max(0.01, parseFloat(size.y.toFixed(3))),
        Math.max(0.01, parseFloat(size.z.toFixed(3))),
      ];
      const centerTuple: [number, number, number] = [
        parseFloat(center.x.toFixed(3)),
        parseFloat(center.y.toFixed(3)),
        parseFloat(center.z.toFixed(3)),
      ];
      const footprintArea = parseFloat((dimensions[0] * dimensions[2]).toFixed(2));

      // Classify the node
      const { category, confidence, reason, defaultCollider } = this.classifyNode(
        obj,
        dimensions,
        centerTuple,
        meshCount,
        triangleCount
      );

      // If this node is a Group / container with multiple children,
      // do NOT generate a solid bounding box that traps the interior of the scene/building!
      if (childrenIds.length > 0) {
        defaultCollider.enabled = false;
        defaultCollider.mode = 'none';
      }

      const analyzed: AnalyzedNode = {
        id: nodeId,
        uuid: obj.uuid,
        name: obj.name || `${obj.type}_${this.idCounter}`,
        type: obj.type,
        parentId,
        childrenIds,
        hasMeshes: meshCount > 0,
        meshCount,
        vertexCount,
        triangleCount,
        worldBoundingBox: {
          min: [
            parseFloat((nodeHasBounds ? nodeBox.min.x : 0).toFixed(3)),
            parseFloat((nodeHasBounds ? nodeBox.min.y : 0).toFixed(3)),
            parseFloat((nodeHasBounds ? nodeBox.min.z : 0).toFixed(3)),
          ],
          max: [
            parseFloat((nodeHasBounds ? nodeBox.max.x : 0).toFixed(3)),
            parseFloat((nodeHasBounds ? nodeBox.max.y : 0).toFixed(3)),
            parseFloat((nodeHasBounds ? nodeBox.max.z : 0).toFixed(3)),
          ],
        },
        dimensions,
        center: centerTuple,
        footprintArea,
        category,
        categoryConfidence: confidence,
        categoryReason: reason,
        visible: obj.visible,
        colliderConfig: defaultCollider,
      };

      nodes.set(nodeId, analyzed);
      return nodeId;
    };

    const rootId = processNode(root, null);

    // Fallback: If no node in the scene was classified as ground,
    // find the lowest wide mesh in the scene and designate it as walkable ground
    let hasGroundNode = false;
    nodes.forEach((n) => {
      if (n.colliderConfig.isGround) hasGroundNode = true;
    });

    if (!hasGroundNode && nodes.size > 0) {
      let lowestMeshNode: AnalyzedNode | null = null;
      let lowestY = Infinity;

      nodes.forEach((n) => {
        if (n.hasMeshes && n.childrenIds.length === 0) {
          const minY = n.worldBoundingBox.min[1];
          if (minY < lowestY) {
            lowestY = minY;
            lowestMeshNode = n;
          }
        }
      });

      if (lowestMeshNode) {
        (lowestMeshNode as AnalyzedNode).colliderConfig.isGround = true;
        (lowestMeshNode as AnalyzedNode).colliderConfig.enabled = true;
        (lowestMeshNode as AnalyzedNode).colliderConfig.mode = 'trimesh';
        (lowestMeshNode as AnalyzedNode).category = 'floor_ground';
        (lowestMeshNode as AnalyzedNode).categoryReason = 'Automatically designated as baseline walkable floor.';
      }
    }

    return {
      nodes,
      rootId,
      totalTriangles,
      totalVertices,
      totalMeshes,
      sceneBounds: hasCalculatedBounds ? sceneBounds : new THREE.Box3(new THREE.Vector3(-10, 0, -10), new THREE.Vector3(10, 5, 10)),
    };
  }

  /**
   * Rule-based transparent classification
   */
  private static classifyNode(
    obj: THREE.Object3D,
    dimensions: [number, number, number],
    _center: [number, number, number],
    meshCount: number,
    triangleCount: number
  ): {
    category: ObjectCategory;
    confidence: number;
    reason: string;
    defaultCollider: ColliderConfig;
  } {
    const rawName = (obj.name || '').toLowerCase();
    const [width, height, depth] = dimensions;
    const horizontalExtent = Math.max(width, depth);
    const aspectFlatness = height / Math.max(0.1, horizontalExtent);

    // Rule 1: Terrain / Landscape
    if (
      rawName.includes('terrain') ||
      rawName.includes('landscape') ||
      rawName.includes('crater') ||
      rawName.includes('ground') ||
      rawName.includes('surface') ||
      rawName.includes('plateau') ||
      rawName.includes('mountain') ||
      rawName.includes('dune')
    ) {
      return {
        category: 'terrain',
        confidence: 0.95,
        reason: `Node name "${obj.name}" matches terrain taxonomy and has wide surface extent (${width.toFixed(1)}m × ${depth.toFixed(1)}m).`,
        defaultCollider: {
          enabled: true,
          mode: 'trimesh',
          margin: 0,
          isGround: true,
          isWalkableSlope: true,
          friction: 0.9,
        },
      };
    }

    // Rule 2: Floor / Flat Ground
    if (
      rawName.includes('floor') ||
      rawName.includes('deck') ||
      rawName.includes('pavement') ||
      rawName.includes('slab') ||
      rawName.includes('platform') ||
      rawName.includes('concrete') ||
      rawName.includes('plane') ||
      rawName.includes('ground') ||
      rawName.includes('road') ||
      rawName.includes('driveway') ||
      rawName.includes('asphalt') ||
      rawName.includes('tile') ||
      (aspectFlatness < 0.12 && horizontalExtent > 2.0)
    ) {
      return {
        category: 'floor_ground',
        confidence: 0.9,
        reason: rawName.includes('floor') || rawName.includes('ground') || rawName.includes('concrete')
          ? `Named "${obj.name}" matching floor taxonomy.`
          : `Flat geometry aspect ratio (${aspectFlatness.toFixed(2)}) with wide span (${horizontalExtent.toFixed(1)}m).`,
        defaultCollider: {
          enabled: true,
          mode: 'trimesh',
          margin: 0,
          isGround: true,
          isWalkableSlope: true,
          friction: 0.8,
        },
      };
    }

    // Rule 3: Building / Habitat / Structure / Garage / Room
    if (
      rawName.includes('building') ||
      rawName.includes('hab') ||
      rawName.includes('outpost') ||
      rawName.includes('facility') ||
      rawName.includes('station') ||
      rawName.includes('dome') ||
      rawName.includes('module') ||
      rawName.includes('structure') ||
      rawName.includes('hangar') ||
      rawName.includes('garage') ||
      rawName.includes('house') ||
      rawName.includes('room') ||
      rawName.includes('shed') ||
      rawName.includes('warehouse') ||
      rawName.includes('interior') ||
      rawName.includes('lab')
    ) {
      return {
        category: 'building',
        confidence: 0.88,
        reason: `Name "${obj.name}" indicates architectural habitat/structure (${width.toFixed(1)}m × ${height.toFixed(1)}m × ${depth.toFixed(1)}m).`,
        defaultCollider: {
          enabled: true,
          mode: 'trimesh', // trimesh allows walking inside rooms/doors!
          margin: 0,
          isGround: false,
          isWalkableSlope: false,
        },
      };
    }

    // Rule 4: Walls
    if (rawName.includes('wall') || rawName.includes('partition') || rawName.includes('barrier') || rawName.includes('fence')) {
      return {
        category: 'wall',
        confidence: 0.92,
        reason: `Named "${obj.name}" matching vertical barrier taxonomy.`,
        defaultCollider: {
          enabled: true,
          mode: horizontalExtent > 3.0 ? 'trimesh' : 'box_exact',
          margin: 0,
          isGround: false,
          isWalkableSlope: false,
        },
      };
    }

    // Rule 5: Rocks / Boulders
    if (rawName.includes('rock') || rawName.includes('boulder') || rawName.includes('stone') || rawName.includes('rubble')) {
      return {
        category: 'rock',
        confidence: 0.9,
        reason: `Name matches natural obstruction/rock taxonomy.`,
        defaultCollider: {
          enabled: true,
          mode: triangleCount < 1500 ? 'convex' : 'box_exact',
          margin: 0.05,
          isGround: false,
          isWalkableSlope: false,
        },
      };
    }

    // Rule 6: Furniture / Interior Fixtures
    if (
      rawName.includes('desk') ||
      rawName.includes('table') ||
      rawName.includes('chair') ||
      rawName.includes('seat') ||
      rawName.includes('bench') ||
      rawName.includes('bed') ||
      rawName.includes('console') ||
      rawName.includes('rack') ||
      rawName.includes('cabinet')
    ) {
      return {
        category: 'furniture',
        confidence: 0.85,
        reason: `Matched interior fixture or station furniture vocabulary.`,
        defaultCollider: {
          enabled: true,
          mode: 'box_exact',
          margin: 0,
          isGround: false,
          isWalkableSlope: false,
        },
      };
    }

    // Rule 7: Equipment / Machinery
    if (
      rawName.includes('rover') ||
      rawName.includes('generator') ||
      rawName.includes('solar') ||
      rawName.includes('panel') ||
      rawName.includes('antenna') ||
      rawName.includes('sensor') ||
      rawName.includes('terminal') ||
      rawName.includes('engine') ||
      rawName.includes('battery') ||
      rawName.includes('transformer')
    ) {
      return {
        category: 'equipment',
        confidence: 0.85,
        reason: `Matches technical instrumentation/equipment keywords.`,
        defaultCollider: {
          enabled: true,
          mode: 'box_exact',
          margin: 0.1,
          isGround: false,
          isWalkableSlope: false,
        },
      };
    }

    // Rule 8: Small Props
    if (
      rawName.includes('barrel') ||
      rawName.includes('crate') ||
      rawName.includes('box') ||
      rawName.includes('canister') ||
      rawName.includes('pipe') ||
      rawName.includes('cable') ||
      rawName.includes('light') ||
      (horizontalExtent < 1.5 && height < 1.5 && meshCount <= 2)
    ) {
      return {
        category: 'prop',
        confidence: 0.75,
        reason: `Compact physical dimensions (${width.toFixed(1)}m × ${height.toFixed(1)}m × ${depth.toFixed(1)}m).`,
        defaultCollider: {
          enabled: true,
          mode: 'box_exact',
          margin: 0,
          isGround: false,
          isWalkableSlope: false,
        },
      };
    }

    // Rule 9: Structural
    if (
      rawName.includes('pillar') ||
      rawName.includes('beam') ||
      rawName.includes('truss') ||
      rawName.includes('frame') ||
      rawName.includes('strut') ||
      rawName.includes('column') ||
      rawName.includes('arch')
    ) {
      return {
        category: 'structural',
        confidence: 0.8,
        reason: `Identified as architectural load-bearing structural member.`,
        defaultCollider: {
          enabled: true,
          mode: 'box_exact',
          margin: 0,
          isGround: false,
          isWalkableSlope: false,
        },
      };
    }

    // Default: Unknown / Unclassified
    return {
      category: 'unknown',
      confidence: 0.4,
      reason: `No definitive naming or geometry heuristics matched. Classified as general scene node.`,
      defaultCollider: {
        enabled: meshCount > 0,
        mode: meshCount > 0 ? (horizontalExtent > 4.0 ? 'trimesh' : 'box_exact') : 'none',
        margin: 0,
        isGround: false,
        isWalkableSlope: false,
      },
    };
  }
}
