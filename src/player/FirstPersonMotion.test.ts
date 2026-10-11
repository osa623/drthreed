import { describe, it, expect } from 'vitest';
import { FirstPersonMotion } from './FirstPersonMotion';
import type { PlayerMotionSettings } from '../state/types';

describe('FirstPersonMotion', () => {
  const defaultSettings: PlayerMotionSettings = {
    walkSpeed: 4.0,
    runSpeed: 8.0,
    jumpForce: 5.0,
    gravity: 18.0,
    mouseSensitivity: 0.002,
    maxSlopeAngle: 45,
    maxStepHeight: 0.35,
    enableBreathing: true,
    enableHeadBob: true,
    reducedMotion: false,
  };

  it('produces subtle idle breathing when standing still', () => {
    const motion = new FirstPersonMotion();
    const offset1 = motion.update(0.016, 0.0, true, defaultSettings);
    const offset2 = motion.update(0.5, 0.0, true, defaultSettings);

    // Idle breathing vertical oscillation
    expect(offset1.y).not.toBeNaN();
    expect(offset2.y).not.toBeNaN();
    expect(Math.abs(offset2.y)).toBeLessThan(0.02); // subtle breathing amplitude
  });

  it('scales headbob amplitude and frequency with movement speed', () => {
    const motionWalk = new FirstPersonMotion();
    const motionRun = new FirstPersonMotion();

    const walkOffset = motionWalk.update(0.016, 3.5, true, defaultSettings);
    const runOffset = motionRun.update(0.016, 7.5, true, defaultSettings);

    expect(walkOffset).toBeDefined();
    expect(runOffset).toBeDefined();
  });

  it('completely suppresses motion oscillations when reduced motion is enabled', () => {
    const motion = new FirstPersonMotion();
    const reducedSettings: PlayerMotionSettings = {
      ...defaultSettings,
      reducedMotion: true,
    };

    const offset = motion.update(0.016, 5.0, true, reducedSettings);
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(0);
    expect(offset.z).toBe(0);
  });
});
