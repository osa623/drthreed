import * as THREE from 'three';
import { InputManager } from './InputManager';
import { FirstPersonCamera } from './FirstPersonCamera';
import { FirstPersonMotion } from './FirstPersonMotion';
import type { PhysicsManager } from '../physics/PhysicsManager';
import type { PlayerLiveState, PlayerMotionSettings, SpawnPointConfig } from '../state/types';

export class PlayerController {
  private physicsManager: PhysicsManager;
  private inputManager: InputManager;
  private fpCamera: FirstPersonCamera;
  private motion: FirstPersonMotion;

  // Player physics state
  private velocity = new THREE.Vector3(0, 0, 0);
  private verticalVelocity = 0;
  private isGrounded = true;
  private currentSpeed = 0;
  private groundSlopeAngle = 0;
  private groundSurfaceName: string | null = null;

  private isFlyMode = false;
  private currentSettings: PlayerMotionSettings;

  constructor(
    camera: THREE.PerspectiveCamera,
    physicsManager: PhysicsManager,
    settings: PlayerMotionSettings
  ) {
    this.physicsManager = physicsManager;
    this.currentSettings = settings;

    this.inputManager = new InputManager();
    this.fpCamera = new FirstPersonCamera(camera);
    this.motion = new FirstPersonMotion();
  }

  public init(
    container: HTMLElement,
    onLockChange?: (locked: boolean) => void,
    onToggleGravity?: (playerPos: [number, number, number]) => void
  ): void {
    this.inputManager.init(
      container,
      onLockChange,
      () => {
        // Tab key toggles between Fly Mode and Grounded Physics Mode!
        this.toggleFlyMode();
        if (onToggleGravity) {
          const pos = this.getPosition();
          onToggleGravity(pos);
        }
      }
    );
  }

  public requestPointerLock(container: HTMLElement): void {
    this.inputManager.requestPointerLock(container);
  }

  public exitPointerLock(): void {
    this.inputManager.exitPointerLock();
  }

  public isPointerLocked(): boolean {
    return this.inputManager.getPointerLocked();
  }

  public setFlyMode(enabled: boolean): void {
    this.isFlyMode = enabled;
    if (enabled) {
      this.verticalVelocity = 0;
      this.isGrounded = false;
    }
  }

  public getIsFlyMode(): boolean {
    return this.isFlyMode;
  }

  public toggleFlyMode(): boolean {
    this.setFlyMode(!this.isFlyMode);
    return this.isFlyMode;
  }

  public getPosition(): [number, number, number] {
    const p = this.physicsManager.getPlayerPosition();
    if (p) return [p.x, p.y, p.z];
    return [0, 1.5, 0];
  }

  public spawn(spawnConfig: SpawnPointConfig): void {
    const pos = spawnConfig.position;
    this.physicsManager.initPlayer(pos, this.currentSettings);
    this.fpCamera.setRotation(spawnConfig.rotationY, 0);
    this.velocity.set(0, 0, 0);
    this.verticalVelocity = 0;
    this.motion.reset();
  }

  public update(deltaTime: number, settings: PlayerMotionSettings): PlayerLiveState {
    this.currentSettings = settings;
    const input = this.inputManager.pollInput();

    // 1. Process Look Rotation
    if (this.inputManager.getPointerLocked()) {
      this.fpCamera.applyMouseDelta(
        input.mouseDeltaX,
        input.mouseDeltaY,
        settings.mouseSensitivity
      );
    }

    // ----------------------------------------------------
    // BLENDER FREE-FLY MODE (No Gravity, 6DOF Flight)
    // ----------------------------------------------------
    if (this.isFlyMode) {
      const lookDir = this.fpCamera.getLookDirection();
      const right = this.fpCamera.getRightVector();
      const flyMove = new THREE.Vector3();

      if (input.forward) flyMove.add(lookDir);
      if (input.backward) flyMove.sub(lookDir);
      if (input.right) flyMove.add(right);
      if (input.left) flyMove.sub(right);
      if (input.up) flyMove.y += 1.0;
      if (input.down) flyMove.y -= 1.0;

      if (flyMove.lengthSq() > 0.001) {
        flyMove.normalize();
      }

      const flySpeed = (input.sprint ? settings.runSpeed * 1.8 : settings.walkSpeed * 1.5);
      const targetFlyVel = flyMove.multiplyScalar(flySpeed);

      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetFlyVel.x, 8.0, deltaTime);
      this.velocity.y = THREE.MathUtils.damp(this.velocity.y, targetFlyVel.y, 8.0, deltaTime);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, targetFlyVel.z, 8.0, deltaTime);

      const currentPos = this.physicsManager.getPlayerPosition() || new THREE.Vector3(0, 5, 0);
      const nextPos: [number, number, number] = [
        currentPos.x + this.velocity.x * deltaTime,
        currentPos.y + this.velocity.y * deltaTime,
        currentPos.z + this.velocity.z * deltaTime,
      ];

      this.physicsManager.setPlayerPosition(nextPos);

      const eyeHeight = nextPos[1] + this.physicsManager.eyeOffsetFromCenter;
      const headPos = new THREE.Vector3(nextPos[0], eyeHeight, nextPos[2]);
      this.fpCamera.updateCameraTransform(headPos, new THREE.Vector3());

      const speedMag = this.velocity.length();
      return {
        isGrounded: false,
        currentSpeed: speedMag,
        position: nextPos,
        velocity: [this.velocity.x, this.velocity.y, this.velocity.z],
        groundSlopeAngle: 0,
        groundSurfaceName: 'FREE FLY (NO GRAVITY)',
        isAirborne: true,
      };
    }

    // ----------------------------------------------------
    // GROUNDED PHYSICS MODE (Rapier Kinematics + Gravity)
    // ----------------------------------------------------
    const forward = this.fpCamera.getForwardVector();
    const right = this.fpCamera.getRightVector();
    const moveDir = new THREE.Vector3();

    if (input.forward) moveDir.add(forward);
    if (input.backward) moveDir.sub(forward);
    if (input.right) moveDir.add(right);
    if (input.left) moveDir.sub(right);

    if (moveDir.lengthSq() > 0.001) {
      moveDir.normalize();
    }

    // Target Speed & Acceleration
    const targetSpeed = input.sprint ? settings.runSpeed : settings.walkSpeed;
    const desiredHorizontalVel = moveDir.multiplyScalar(moveDir.length() > 0 ? targetSpeed : 0);

    const accelRate = this.isGrounded ? 15.0 : 4.0;
    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, desiredHorizontalVel.x, accelRate, deltaTime);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, desiredHorizontalVel.z, accelRate, deltaTime);

    this.currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);

    // Vertical Dynamics (Gravity & Jump)
    if (this.isGrounded) {
      if (input.jump && this.groundSlopeAngle <= settings.maxSlopeAngle) {
        this.verticalVelocity = settings.jumpForce;
        this.isGrounded = false;
      } else {
        this.verticalVelocity = 0;
      }
    } else {
      this.verticalVelocity -= settings.gravity * deltaTime;
      this.verticalVelocity = Math.max(-30.0, this.verticalVelocity);
    }

    // Desired Translation
    const totalMovement = new THREE.Vector3(
      this.velocity.x * deltaTime,
      this.verticalVelocity * deltaTime,
      this.velocity.z * deltaTime
    );

    // Step physics with Rapier
    const physicsResult = this.physicsManager.movePlayer(totalMovement, settings.maxSlopeAngle);
    this.isGrounded = physicsResult.isGrounded;
    this.groundSlopeAngle = physicsResult.groundInfo.slopeDegrees;

    if (this.isGrounded && this.verticalVelocity < 0) {
      this.verticalVelocity = 0;
    }

    // Camera Transform with subtle breathing & headbob
    const playerPos = physicsResult.newPosition;
    const eyeHeight = playerPos.y + this.physicsManager.eyeOffsetFromCenter;
    const headPos = new THREE.Vector3(playerPos.x, eyeHeight, playerPos.z);

    const motionOffset = this.motion.update(
      deltaTime,
      this.currentSpeed,
      this.isGrounded,
      settings
    );

    this.fpCamera.updateCameraTransform(headPos, motionOffset);

    return {
      isGrounded: this.isGrounded,
      currentSpeed: this.currentSpeed,
      position: [playerPos.x, playerPos.y, playerPos.z],
      velocity: [this.velocity.x, this.verticalVelocity, this.velocity.z],
      groundSlopeAngle: this.groundSlopeAngle,
      groundSurfaceName: this.groundSurfaceName,
      isAirborne: !this.isGrounded,
    };
  }

  public dispose(container: HTMLElement): void {
    this.inputManager.dispose(container);
    this.physicsManager.destroyPlayer();
  }
}
