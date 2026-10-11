import * as THREE from 'three';

export interface ValidationResult {
  valid: boolean;
  message?: string;
  details?: string;
}

export function validateGLBFile(file: File): ValidationResult {
  const validExtensions = ['.glb', '.gltf'];
  const fileName = file.name.toLowerCase();
  const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

  if (!hasValidExt) {
    return {
      valid: false,
      message: 'Invalid file format',
      details: `File "${file.name}" is not a supported 3D format. Please provide a self-contained .glb or .gltf file.`,
    };
  }

  // 150MB client-side limit check for sanity
  const maxBytes = 250 * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      message: 'File size exceeds browser safety limit (250MB)',
      details: 'Large scenes should be optimized in Blender (decimate geometry, compress textures with WebP/KTX2) before web inspection.',
    };
  }

  return { valid: true };
}

export function validateHDRFile(file: File): ValidationResult {
  const validExtensions = ['.hdr'];
  const fileName = file.name.toLowerCase();
  const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

  if (!hasValidExt) {
    return {
      valid: false,
      message: 'Invalid HDRI format',
      details: `File "${file.name}" is not a supported Radiance HDR (.hdr) file.`,
    };
  }

  const maxBytes = 80 * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      message: 'HDRI image is too large (>80MB)',
      details: 'Please downsample HDRI to 2K or 1K resolution for optimal browser memory and frame rates.',
    };
  }

  return { valid: true };
}

export function validateSpawnHeight(
  spawnPos: [number, number, number],
  bounds: THREE.Box3
): ValidationResult {
  if (bounds.isEmpty()) {
    return { valid: false, message: 'Scene bounds are empty or uncalculated.' };
  }

  const [x, y, z] = spawnPos;
  if (x < bounds.min.x - 20 || x > bounds.max.x + 20 || z < bounds.min.z - 20 || z > bounds.max.z + 20) {
    return {
      valid: false,
      message: 'Spawn position is outside scene bounds',
      details: `Position (${x.toFixed(1)}, ${z.toFixed(1)}) is far outside environment perimeter.`,
    };
  }

  if (y < bounds.min.y - 10) {
    return {
      valid: false,
      message: 'Spawn point is below the lowest scene geometry',
      details: 'The player capsule would immediately fall through the void.',
    };
  }

  return { valid: true };
}
