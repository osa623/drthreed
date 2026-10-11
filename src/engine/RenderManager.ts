import * as THREE from 'three';
import { disposeRenderer } from '../utils/disposal';
import type { PerformanceStats } from '../state/types';

export class RenderManager {
  public readonly renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;
  private isRunning = false;

  // Frame timing
  private lastTime = performance.now();
  private frameCount = 0;
  private fpsTimer = 0;
  private currentFps = 60;
  private lastFrameDelta = 16.6;

  constructor(canvas: HTMLCanvasElement) {
    const testContext = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!testContext) {
      throw new Error(
        'WebGL 2.0 context could not be created on the canvas. Ensure hardware acceleration is enabled in your browser.'
      );
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  public setSize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);
  }

  public startLoop(
    onTick: (delta: number) => void,
    onRender: () => void,
    onStatsUpdate?: (stats: PerformanceStats) => void
  ): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();

    const loop = (currentTime: number) => {
      if (!this.isRunning) return;

      const rawDelta = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      // Clamp delta to avoid huge physics jumps if tab was backgrounded
      const delta = Math.min(0.08, Math.max(0.001, rawDelta));
      this.lastFrameDelta = rawDelta * 1000;

      // FPS tracking
      this.frameCount++;
      this.fpsTimer += delta;
      if (this.fpsTimer >= 0.5) {
        this.currentFps = Math.round((this.frameCount / this.fpsTimer));
        this.frameCount = 0;
        this.fpsTimer = 0;

        if (onStatsUpdate) {
          const info = this.renderer.info;
          onStatsUpdate({
            fps: this.currentFps,
            frameTimeMs: parseFloat(this.lastFrameDelta.toFixed(1)),
            drawCalls: info.render.calls,
            triangles: info.render.triangles,
            geometries: info.memory.geometries,
            textures: info.memory.textures,
            physicsBodies: 0, // populated by physics manager
            physicsColliders: 0,
          });
        }
      }

      onTick(delta);
      onRender();

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public stopLoop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public dispose(): void {
    this.stopLoop();
    disposeRenderer(this.renderer);
  }
}
