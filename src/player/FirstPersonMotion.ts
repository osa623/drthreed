import * as THREE from 'three';
import type { PlayerMotionSettings } from '../state/types';

export class FirstPersonMotion {
  private bobCycle = 0;
  private breathCycle = 0;
  private landingImpulse = 0;
  private wasAirborne = false;

  /**
   * Calculates procedural headbob, breathing, and landing offsets.
   */
  public update(
    deltaTime: number,
    currentSpeed: number,
    isGrounded: boolean,
    settings: PlayerMotionSettings
  ): THREE.Vector3 {
    const offset = new THREE.Vector3(0, 0, 0);

    // If reduced motion is enabled, suppress offsets for accessibility/comfort
    if (settings.reducedMotion) {
      return offset;
    }

    // Landing impulse handling
    if (this.wasAirborne && isGrounded) {
      // Impact compression
      this.landingImpulse = 0.08;
    }
    this.wasAirborne = !isGrounded;

    // Decay landing impulse smoothly
    if (this.landingImpulse > 0.001) {
      this.landingImpulse = THREE.MathUtils.damp(this.landingImpulse, 0, 10, deltaTime);
      offset.y -= this.landingImpulse;
    }

    // 1. Idle Breathing Effect
    if (settings.enableBreathing) {
      this.breathCycle += deltaTime * 2.0; // ~0.32 Hz
      const breathY = Math.sin(this.breathCycle) * 0.006;
      offset.y += breathY;
    }

    // 2. Velocity-driven Head Bob
    if (settings.enableHeadBob && isGrounded && currentSpeed > 0.2) {
      // Frequency scales with speed (walking ~9 rad/s, sprinting ~14 rad/s)
      const bobFreq = THREE.MathUtils.lerp(8.0, 14.0, Math.min(1.0, currentSpeed / settings.runSpeed));
      this.bobCycle += deltaTime * bobFreq;

      // Amplitude scales with speed
      const intensity = Math.min(1.0, currentSpeed / settings.runSpeed);
      const verticalBob = Math.sin(this.bobCycle * 2.0) * (0.015 * intensity);
      const horizontalBob = Math.cos(this.bobCycle) * (0.01 * intensity);

      offset.y += verticalBob;
      offset.x += horizontalBob;
    }

    return offset;
  }

  public reset(): void {
    this.bobCycle = 0;
    this.breathCycle = 0;
    this.landingImpulse = 0;
    this.wasAirborne = false;
  }
}
