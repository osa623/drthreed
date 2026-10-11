import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import type { LightingSettings } from '../state/types';

export class LightingManager {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private pmremGenerator: THREE.PMREMGenerator;

  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;
  private currentEnvTexture: THREE.Texture | null = null;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();

    // 1. Directional Sun Light with Shadows
    this.directionalLight = new THREE.DirectionalLight(0xfff5e6, 1.8);
    this.directionalLight.position.set(30, 45, 25);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 150;
    this.directionalLight.shadow.camera.left = -35;
    this.directionalLight.shadow.camera.right = 35;
    this.directionalLight.shadow.camera.top = 35;
    this.directionalLight.shadow.camera.bottom = -35;
    this.directionalLight.shadow.bias = -0.0005;
    this.scene.add(this.directionalLight);

    // 2. Ambient Light
    this.ambientLight = new THREE.AmbientLight(0x222a35, 0.6);
    this.scene.add(this.ambientLight);

    // 3. Hemisphere Light for sky/ground bounce
    this.hemiLight = new THREE.HemisphereLight(0x7090b0, 0x3d271d, 0.7);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // Set default scene background color (technical dark slate/space void)
    this.scene.background = new THREE.Color(0x0e1117);
  }

  public updateSettings(settings: LightingSettings): void {
    this.directionalLight.intensity = settings.sunIntensity;
    this.ambientLight.intensity = settings.ambientIntensity;
    this.renderer.toneMappingExposure = settings.exposure;

    // Sun position from elevation & azimuth
    const elevationRad = (settings.sunElevation * Math.PI) / 180;
    const azimuthRad = (settings.sunAzimuth * Math.PI) / 180;
    const dist = 60;
    this.directionalLight.position.set(
      dist * Math.cos(elevationRad) * Math.sin(azimuthRad),
      dist * Math.sin(elevationRad),
      dist * Math.cos(elevationRad) * Math.cos(azimuthRad)
    );

    // HDRI background visibility and rotation
    if (this.currentEnvTexture) {
      this.scene.environmentIntensity = settings.intensity;
      const rotRad = (settings.rotation * Math.PI) / 180;
      this.currentEnvTexture.offset.set(rotRad / (2 * Math.PI), 0);

      if (settings.showBackground) {
        this.scene.background = this.currentEnvTexture;
      } else {
        this.scene.background = new THREE.Color(0x0e1117);
      }
    }
  }

  /**
   * Loads an HDRI environment from a File or URL
   */
  public async loadHDR(fileOrUrl: File | string): Promise<void> {
    const loader = new RGBELoader();

    let url: string;
    let shouldRevoke = false;
    if (typeof fileOrUrl === 'string') {
      url = fileOrUrl;
    } else {
      url = URL.createObjectURL(fileOrUrl);
      shouldRevoke = true;
    }

    try {
      const texture = await loader.loadAsync(url);
      const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;

      // Clean up previous texture
      this.clearEnvironment();

      this.currentEnvTexture = envMap;
      this.scene.environment = envMap;
      this.scene.background = envMap;

      texture.dispose();
    } finally {
      if (shouldRevoke) {
        URL.revokeObjectURL(url);
      }
    }
  }

  public clearEnvironment(): void {
    if (this.currentEnvTexture) {
      this.currentEnvTexture.dispose();
      this.currentEnvTexture = null;
    }
    this.scene.environment = null;
    this.scene.background = new THREE.Color(0x0e1117);
  }

  public dispose(): void {
    this.clearEnvironment();
    this.pmremGenerator.dispose();
    this.scene.remove(this.directionalLight);
    this.scene.remove(this.ambientLight);
    this.scene.remove(this.hemiLight);
  }
}
