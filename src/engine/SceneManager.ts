import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { disposeThreeObject } from '../utils/disposal';
import type { ViewportViewMode } from '../state/types';

export class SceneManager {
  public readonly scene: THREE.Scene;
  public readonly orbitCamera: THREE.PerspectiveCamera;
  public readonly fpCamera: THREE.PerspectiveCamera;
  public orbitControls: OrbitControls;

  private currentModelRoot: THREE.Object3D | null = null;
  private selectionHelper: THREE.Box3Helper | null = null;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private activeMode: ViewportViewMode = 'orbit';
  private spawnMarkerGroup: THREE.Group | null = null;

  constructor(viewportContainer: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0f14);

    const aspect = viewportContainer.clientWidth / (viewportContainer.clientHeight || 1);

    // 1. Orbit Camera for Inspection
    this.orbitCamera = new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);
    this.orbitCamera.position.set(16, 12, 22);

    // 2. First-Person Camera for Gameplay
    this.fpCamera = new THREE.PerspectiveCamera(75, aspect, 0.05, 1000);

    // 3. Orbit Controls
    this.orbitControls = new OrbitControls(this.orbitCamera, viewportContainer);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.target.set(0, 2, 0);
    this.orbitControls.maxPolarAngle = Math.PI / 2 + 0.1; // allow looking slightly up from ground
  }

  public getActiveCamera(): THREE.PerspectiveCamera {
    return this.activeMode === 'orbit' ? this.orbitCamera : this.fpCamera;
  }

  public setViewMode(mode: ViewportViewMode): void {
    this.activeMode = mode;
    if (mode === 'orbit') {
      this.orbitControls.enabled = true;
      if (this.spawnMarkerGroup) this.spawnMarkerGroup.visible = true;
    } else {
      this.orbitControls.enabled = false;
      if (this.spawnMarkerGroup) this.spawnMarkerGroup.visible = false;
    }
  }

  public getViewMode(): ViewportViewMode {
    return this.activeMode;
  }

  public setModel(root: THREE.Object3D): void {
    // Clear existing model if present
    this.clearModel();

    this.currentModelRoot = root;
    this.scene.add(root);

    // Center orbit camera to model bounds
    const box = new THREE.Box3().setFromObject(root);
    if (!box.isEmpty()) {
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 5);

      this.orbitControls.target.copy(center);
      this.orbitCamera.position.set(
        center.x + maxDim * 0.9,
        center.y + maxDim * 0.6,
        center.z + maxDim * 0.9
      );
      this.orbitControls.update();
    }
  }

  public getModel(): THREE.Object3D | null {
    return this.currentModelRoot;
  }

  public clearModel(): void {
    this.clearSelectionHighlight();

    if (this.currentModelRoot) {
      this.scene.remove(this.currentModelRoot);
      disposeThreeObject(this.currentModelRoot);
      this.currentModelRoot = null;
    }
  }

  /**
   * Highlights the selected node in 3D viewport
   */
  public highlightNode(nodeId: string | null): void {
    this.clearSelectionHighlight();
    if (!nodeId || !this.currentModelRoot) return;

    let targetObj: THREE.Object3D | null = null;
    this.currentModelRoot.traverse((obj) => {
      if (obj.userData?.__inspectorNodeId === nodeId) {
        targetObj = obj;
      }
    });

    if (targetObj) {
      const box = new THREE.Box3().setFromObject(targetObj);
      if (!box.isEmpty()) {
        const cyanColor = new THREE.Color(0x00f0ff);
        this.selectionHelper = new THREE.Box3Helper(box, cyanColor);
        this.selectionHelper.userData.__isInternalGizmo = true;
        this.scene.add(this.selectionHelper);
      }
    }
  }

  public clearSelectionHighlight(): void {
    if (this.selectionHelper) {
      this.scene.remove(this.selectionHelper);
      this.selectionHelper.dispose();
      this.selectionHelper = null;
    }
  }

  /**
   * Centers and frames the camera on the target object
   */
  public focusNode(nodeId: string): void {
    if (!nodeId || !this.currentModelRoot) return;

    let targetObj: THREE.Object3D | null = null;
    this.currentModelRoot.traverse((obj) => {
      if (obj.userData?.__inspectorNodeId === nodeId) {
        targetObj = obj;
      }
    });

    if (targetObj) {
      const box = new THREE.Box3().setFromObject(targetObj);
      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 2);

        this.orbitControls.target.copy(center);
        this.orbitCamera.position.set(
          center.x + maxDim * 1.5,
          center.y + maxDim * 1.2,
          center.z + maxDim * 1.5
        );
        this.orbitControls.update();
      }
    }
  }

  /**
   * Adjusts default background color when not overridden by HDRI
   */
  public setBackgroundTheme(theme: 'dark' | 'light'): void {
    if (!this.scene.background || !(this.scene.background instanceof THREE.Texture)) {
      this.scene.background = new THREE.Color(theme === 'light' ? 0xe2e8f0 : 0x0c0f14);
    }
  }

  /**
   * Mouse raycasting to select objects by clicking in the viewport
   */
  public pickObjectAt(
    clientX: number,
    clientY: number,
    rect: DOMRect
  ): string | null {
    if (!this.currentModelRoot || this.activeMode !== 'orbit') return null;

    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.orbitCamera);
    const intersects = this.raycaster.intersectObjects(this.currentModelRoot.children, true);

    for (const hit of intersects) {
      // Find closest ancestor with an assigned inspector node id
      let curr: THREE.Object3D | null = hit.object;
      while (curr && curr !== this.scene) {
        if (curr.userData?.__inspectorNodeId) {
          return curr.userData.__inspectorNodeId as string;
        }
        curr = curr.parent;
      }
    }

    return null;
  }

  /**
   * Updates Three.js object visibility based on node state
   */
  public setNodeVisibility(nodeId: string, visible: boolean): void {
    if (!this.currentModelRoot) return;
    this.currentModelRoot.traverse((obj) => {
      if (obj.userData?.__inspectorNodeId === nodeId) {
        obj.visible = visible;
      }
    });
  }

  public handleResize(width: number, height: number): void {
    const aspect = width / (height || 1);
    this.orbitCamera.aspect = aspect;
    this.orbitCamera.updateProjectionMatrix();

    this.fpCamera.aspect = aspect;
    this.fpCamera.updateProjectionMatrix();
  }

  /**
   * Returns exact world-space bounding box for a given node ID,
   * properly accounting for all parent transforms and nested objects.
   */
  public getObjectWorldBounds(nodeId: string): THREE.Box3 | null {
    if (!this.currentModelRoot) return null;
    let targetObj: THREE.Object3D | null = null;
    this.currentModelRoot.traverse((obj) => {
      if (obj.userData?.__inspectorNodeId === nodeId) {
        targetObj = obj;
      }
    });
    if (!targetObj) return null;
    return new THREE.Box3().setFromObject(targetObj);
  }

  /**
   * Creates or updates the visible 3D player spawn beacon entity in the scene
   */
  public updateSpawnMarker(pos: [number, number, number], visible: boolean = true): void {
    if (!this.spawnMarkerGroup) {
      this.spawnMarkerGroup = new THREE.Group();
      this.spawnMarkerGroup.name = 'Spawn_Point_Marker';
      this.spawnMarkerGroup.userData.__isInternalGizmo = true;

      // 1. Horizontal Beacon Base Rings
      const ringGeo = new THREE.RingGeometry(0.35, 0.5, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      this.spawnMarkerGroup.add(ring);

      const outerRingGeo = new THREE.RingGeometry(0.65, 0.72, 32);
      outerRingGeo.rotateX(-Math.PI / 2);
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: 0x00e699,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
      this.spawnMarkerGroup.add(outerRing);

      // 2. Holographic Player Capsule Silhouette (1.75m height, 0.35m radius)
      const capsuleGeo = new THREE.CylinderGeometry(0.32, 0.32, 1.4, 16);
      const capsuleMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });
      const capsule = new THREE.Mesh(capsuleGeo, capsuleMat);
      capsule.position.y = 0.88;
      this.spawnMarkerGroup.add(capsule);

      // 3. Directional Look Arrow (Front indicator)
      const arrowGeo = new THREE.ConeGeometry(0.15, 0.35, 8);
      arrowGeo.rotateX(-Math.PI / 2);
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0x00e699 });
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.position.set(0, 0.05, -0.65);
      this.spawnMarkerGroup.add(arrow);

      // 4. Vertical Beacon Beam
      const beamGeo = new THREE.CylinderGeometry(0.03, 0.03, 3.0, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.55,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 1.5;
      this.spawnMarkerGroup.add(beam);

      this.scene.add(this.spawnMarkerGroup);
    }

    this.spawnMarkerGroup.position.set(pos[0], pos[1], pos[2]);
    this.spawnMarkerGroup.visible = visible;
  }

  public update(): void {
    if (this.activeMode === 'orbit') {
      this.orbitControls.update();
    }
  }

  public dispose(): void {
    if (this.spawnMarkerGroup) {
      this.scene.remove(this.spawnMarkerGroup);
      disposeThreeObject(this.spawnMarkerGroup);
      this.spawnMarkerGroup = null;
    }
    this.clearModel();
    this.orbitControls.dispose();
  }
}
