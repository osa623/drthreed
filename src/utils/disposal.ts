import * as THREE from 'three';

export function disposeThreeObject(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => disposeMaterial(mat));
        } else {
          disposeMaterial(mesh.material);
        }
      }
    }
  });

  if (obj.parent) {
    obj.parent.remove(obj);
  }
}

function disposeMaterial(material: THREE.Material): void {
  // Dispose any textures attached to standard material maps
  const matRecord = material as unknown as Record<string, unknown>;
  const textureKeys = [
    'map',
    'normalMap',
    'roughnessMap',
    'metalnessMap',
    'aoMap',
    'bumpMap',
    'displacementMap',
    'emissiveMap',
    'envMap',
    'lightMap',
    'alphaMap',
  ];

  for (const key of textureKeys) {
    const val = matRecord[key];
    if (val && typeof val === 'object' && 'dispose' in val && typeof (val as { dispose: unknown }).dispose === 'function') {
      (val as THREE.Texture).dispose();
    }
  }

  material.dispose();
}

export function disposeRenderer(renderer: THREE.WebGLRenderer): void {
  try {
    renderer.dispose();
  } catch (err) {
    console.warn('Error during WebGLRenderer disposal:', err);
  }
}
