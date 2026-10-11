import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { validateGLBFile } from '../utils/validation';

export interface ImportProgress {
  loaded: number;
  total: number;
  percent: number;
}

export class GLBImporter {
  private loader: GLTFLoader;

  constructor() {
    this.loader = new GLTFLoader();
  }

  /**
   * Imports a .glb or self-contained .gltf from a File object
   */
  public async loadFromFile(
    file: File,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<GLTF> {
    const validation = validateGLBFile(file);
    if (!validation.valid) {
      throw new Error(validation.details || validation.message || 'Invalid 3D file.');
    }

    const objectUrl = URL.createObjectURL(file);

    try {
      const gltf = await new Promise<GLTF>((resolve, reject) => {
        this.loader.load(
          objectUrl,
          (gltfResult) => resolve(gltfResult),
          (xhr) => {
            if (onProgress && xhr.total > 0) {
              onProgress({
                loaded: xhr.loaded,
                total: xhr.total,
                percent: Math.min(100, Math.round((xhr.loaded / xhr.total) * 100)),
              });
            }
          },
          (error) => {
            reject(
              new Error(
                `Failed to parse 3D file "${file.name}". Ensure it is a valid self-contained GLB file. Details: ${error}`
              )
            );
          }
        );
      });

      this.preprocessLoadedScene(gltf.scene);
      return gltf;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  /**
   * Loads from a remote URL or asset path
   */
  public async loadFromUrl(
    url: string,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<GLTF> {
    const gltf = await new Promise<GLTF>((resolve, reject) => {
      this.loader.load(
        url,
        (gltfResult) => resolve(gltfResult),
        (xhr) => {
          if (onProgress && xhr.total > 0) {
            onProgress({
              loaded: xhr.loaded,
              total: xhr.total,
              percent: Math.min(100, Math.round((xhr.loaded / xhr.total) * 100)),
            });
          }
        },
        (error) => reject(new Error(`Failed to load 3D scene from URL: ${error}`))
      );
    });

    this.preprocessLoadedScene(gltf.scene);
    return gltf;
  }

  /**
   * Preprocesses loaded meshes: sets shadow properties, normal generation, materials
   */
  private preprocessLoadedScene(scene: THREE.Group): void {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.geometry) {
          // Ensure normals are present for lighting
          if (!mesh.geometry.attributes.normal) {
            mesh.geometry.computeVertexNormals();
          }
          mesh.geometry.computeBoundingBox();
        }
      }
    });
  }
}
