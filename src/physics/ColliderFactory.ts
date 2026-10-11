import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { ColliderConfig } from '../state/types';

export class ColliderFactory {
  /**
   * Builds Rapier collider descriptions and Three.js visual wireframes.
   */
  public static createColliderDesc(
    rapier: typeof RAPIER,
    obj: THREE.Object3D,
    config: ColliderConfig,
    worldBox: THREE.Box3
  ): {
    colliderDesc: RAPIER.ColliderDesc | null;
    debugHelper: THREE.Object3D | null;
  } {
    if (!config.enabled || config.mode === 'none') {
      return { colliderDesc: null, debugHelper: null };
    }

    const mode = config.mode;

    switch (mode) {
      case 'box_exact':
        return this.createBoxCollider(rapier, worldBox, 0, config);

      case 'box_expanded':
        return this.createBoxCollider(rapier, worldBox, config.margin || 0.25, config);

      case 'auto':
        return this.createBoxCollider(rapier, worldBox, config.margin || 0, config);

      case 'convex':
        return this.createConvexCollider(rapier, obj, config);

      case 'trimesh':
      case 'ground_mesh':
        return this.createTrimeshCollider(rapier, obj, config);

      default:
        return this.createBoxCollider(rapier, worldBox, 0, config);
    }
  }

  /**
   * Creates a box collider centered at the worldBox center.
   * If customDimensions is provided, uses them instead of bounds.
   * Margin expands width and depth by 2*m and height by 2*m (or 0 for vertical clearance if preferred).
   */
  public static createBoxCollider(
    rapier: typeof RAPIER,
    worldBox: THREE.Box3,
    margin: number,
    config: ColliderConfig
  ): {
    colliderDesc: RAPIER.ColliderDesc | null;
    debugHelper: THREE.Object3D | null;
  } {
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();

    if (config.customDimensions) {
      size.set(
        Math.max(0.1, config.customDimensions.width),
        Math.max(0.1, config.customDimensions.height),
        Math.max(0.1, config.customDimensions.depth)
      );
      worldBox.getCenter(center);
    } else {
      worldBox.getSize(size);
      worldBox.getCenter(center);

      // In scene units: margin m per side expands total width & depth by 2*m
      if (margin > 0) {
        size.x += margin * 2;
        size.z += margin * 2;
        size.y += margin * 0.5; // slight height padding
      }
    }

    const halfExtents = {
      x: Math.max(0.05, size.x / 2),
      y: Math.max(0.05, size.y / 2),
      z: Math.max(0.05, size.z / 2),
    };

    const desc = rapier.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z);
    desc.setTranslation(center.x, center.y, center.z);
    desc.setFriction(config.friction ?? 0.7);
    desc.setRestitution(config.restitution ?? 0.0);

    // Build visual wireframe
    const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const wireframeGeo = new THREE.WireframeGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: config.isGround ? 0x00e699 : 0x00f0ff,
      linewidth: 1,
      transparent: true,
      opacity: 0.8,
    });
    const line = new THREE.LineSegments(wireframeGeo, mat);
    line.position.copy(center);
    line.userData.__isInternalGizmo = true;

    return { colliderDesc: desc, debugHelper: line };
  }

  /**
   * Creates a triangle mesh collider from all meshes inside the object hierarchy,
   * properly transforming vertices to world space.
   */
  public static createTrimeshCollider(
    rapier: typeof RAPIER,
    rootObj: THREE.Object3D,
    config: ColliderConfig
  ): {
    colliderDesc: RAPIER.ColliderDesc | null;
    debugHelper: THREE.Object3D | null;
  } {
    const vertices: number[] = [];
    const indices: number[] = [];
    let vertexOffset = 0;

    rootObj.updateMatrixWorld(true);

    rootObj.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        const geom = mesh.geometry;
        if (!geom) return;

        const posAttr = geom.attributes.position;
        if (!posAttr) return;

        const worldMatrix = mesh.matrixWorld;
        const tempVec = new THREE.Vector3();

        // Extract transformed vertices
        for (let i = 0; i < posAttr.count; i++) {
          tempVec.fromBufferAttribute(posAttr, i);
          tempVec.applyMatrix4(worldMatrix);
          vertices.push(tempVec.x, tempVec.y, tempVec.z);
        }

        // Extract indices
        if (geom.index) {
          const indexAttr = geom.index;
          for (let i = 0; i < indexAttr.count; i++) {
            indices.push(indexAttr.getX(i) + vertexOffset);
          }
        } else {
          // Non-indexed geometry
          for (let i = 0; i < posAttr.count; i++) {
            indices.push(i + vertexOffset);
          }
        }

        vertexOffset += posAttr.count;
      }
    });

    if (vertices.length === 0 || indices.length === 0) {
      return { colliderDesc: null, debugHelper: null };
    }

    const vArray = new Float32Array(vertices);
    const iArray = new Uint32Array(indices);

    try {
      const desc = rapier.ColliderDesc.trimesh(vArray, iArray);
      desc.setFriction(config.friction ?? (config.isGround ? 0.9 : 0.6));
      desc.setRestitution(config.restitution ?? 0.0);

      // Create subtle wireframe helper
      const debugGeo = new THREE.BufferGeometry();
      debugGeo.setAttribute('position', new THREE.BufferAttribute(vArray, 3));
      debugGeo.setIndex(new THREE.BufferAttribute(iArray, 1));
      const wireframe = new THREE.WireframeGeometry(debugGeo);
      const mat = new THREE.LineBasicMaterial({
        color: config.isGround ? 0x00e699 : 0x00f0ff,
        transparent: true,
        opacity: 0.35,
      });
      const helper = new THREE.LineSegments(wireframe, mat);
      helper.userData.__isInternalGizmo = true;

      return { colliderDesc: desc, debugHelper: helper };
    } catch (err) {
      console.warn('Failed to construct Rapier trimesh collider:', err);
      return { colliderDesc: null, debugHelper: null };
    }
  }

  /**
   * Creates a convex hull collider from vertices.
   */
  public static createConvexCollider(
    rapier: typeof RAPIER,
    rootObj: THREE.Object3D,
    config: ColliderConfig
  ): {
    colliderDesc: RAPIER.ColliderDesc | null;
    debugHelper: THREE.Object3D | null;
  } {
    const vertices: number[] = [];
    rootObj.updateMatrixWorld(true);

    rootObj.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        const geom = mesh.geometry;
        if (!geom) return;

        const posAttr = geom.attributes.position;
        if (!posAttr) return;

        const worldMatrix = mesh.matrixWorld;
        const tempVec = new THREE.Vector3();

        // Sample points to prevent huge convex hull computation
        const step = Math.max(1, Math.floor(posAttr.count / 300));
        for (let i = 0; i < posAttr.count; i += step) {
          tempVec.fromBufferAttribute(posAttr, i);
          tempVec.applyMatrix4(worldMatrix);
          vertices.push(tempVec.x, tempVec.y, tempVec.z);
        }
      }
    });

    if (vertices.length < 12) {
      // Fallback to bounding box if too few points
      const box = new THREE.Box3().setFromObject(rootObj);
      return this.createBoxCollider(rapier, box, config.margin || 0, config);
    }

    try {
      const vArray = new Float32Array(vertices);
      const desc = rapier.ColliderDesc.convexHull(vArray);
      if (!desc) {
        const box = new THREE.Box3().setFromObject(rootObj);
        return this.createBoxCollider(rapier, box, config.margin || 0, config);
      }

      desc.setFriction(config.friction ?? 0.7);
      desc.setRestitution(config.restitution ?? 0.0);

      // Simple bounding box helper as visualization fallback for convex
      const box = new THREE.Box3().setFromObject(rootObj);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
      const wireframe = new THREE.WireframeGeometry(geo);
      const mat = new THREE.LineBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.6,
      });
      const helper = new THREE.LineSegments(wireframe, mat);
      helper.position.copy(center);
      helper.userData.__isInternalGizmo = true;

      return { colliderDesc: desc, debugHelper: helper };
    } catch {
      const box = new THREE.Box3().setFromObject(rootObj);
      return this.createBoxCollider(rapier, box, config.margin || 0, config);
    }
  }
}
