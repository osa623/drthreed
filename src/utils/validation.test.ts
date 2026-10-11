import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { validateGLBFile, validateHDRFile, validateSpawnHeight } from './validation';

describe('Validation Utilities', () => {
  it('validates GLB file extensions correctly', () => {
    const validFile = new File(['mock content'], 'mars_outpost.glb', { type: 'model/gltf-binary' });
    expect(validateGLBFile(validFile).valid).toBe(true);

    const validGltf = new File(['mock content'], 'structure.gltf', { type: 'model/gltf+json' });
    expect(validateGLBFile(validGltf).valid).toBe(true);

    const invalidFile = new File(['mock content'], 'document.pdf', { type: 'application/pdf' });
    const result = validateGLBFile(invalidFile);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Invalid file format');
  });

  it('validates HDR file extensions correctly', () => {
    const validHdr = new File(['mock content'], 'mars_sky_2k.hdr', { type: 'image/vnd.radiance' });
    expect(validateHDRFile(validHdr).valid).toBe(true);

    const invalidImg = new File(['mock content'], 'texture.png', { type: 'image/png' });
    const result = validateHDRFile(invalidImg);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Invalid HDRI format');
  });

  it('validates spawn point boundaries relative to scene bounds', () => {
    const bounds = new THREE.Box3(
      new THREE.Vector3(-20, 0, -20),
      new THREE.Vector3(20, 10, 20)
    );

    // Within bounds
    const safeResult = validateSpawnHeight([0, 2, 0], bounds);
    expect(safeResult.valid).toBe(true);

    // Far outside bounds
    const outResult = validateSpawnHeight([100, 2, 100], bounds);
    expect(outResult.valid).toBe(false);
    expect(outResult.message).toContain('outside scene bounds');

    // Deep below bounds
    const underResult = validateSpawnHeight([0, -25, 0], bounds);
    expect(underResult.valid).toBe(false);
    expect(underResult.message).toContain('below the lowest scene geometry');
  });
});
