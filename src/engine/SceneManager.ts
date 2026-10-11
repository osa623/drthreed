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
    } else {
      this.orbitControls.enabled = false;
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

  public update(): void {
    if (this.activeMode === 'orbit') {
      this.orbitControls.update();
    }
  }

  public dispose(): void {
    this.clearModel();
    this.orbitControls.dispose();
  }
}
