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

  public init(container: HTMLElement, onLockChange?: (locked: boolean) => void): void {
    this.inputManager.init(container, onLockChange);
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

    // 2. Compute Desired Horizontal Movement Direction
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

    // 3. Target Speed & Acceleration
    const targetSpeed = input.sprint ? settings.runSpeed : settings.walkSpeed;
    const desiredHorizontalVel = moveDir.multiplyScalar(moveDir.length() > 0 ? targetSpeed : 0);

    // Smooth horizontal acceleration/deceleration
    const accelRate = this.isGrounded ? 15.0 : 4.0;
    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, desiredHorizontalVel.x, accelRate, deltaTime);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, desiredHorizontalVel.z, accelRate, deltaTime);

    this.currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);

    // 4. Vertical Dynamics (Gravity & Jump)
    if (this.isGrounded) {
      if (input.jump && this.groundSlopeAngle <= settings.maxSlopeAngle) {
        this.verticalVelocity = settings.jumpForce;
        this.isGrounded = false;
      } else {
        // Slight negative downward force when grounded to track descending slopes cleanly
        this.verticalVelocity = -2.0;
      }
    } else {
      // Apply gravity in freefall
      this.verticalVelocity -= settings.gravity * deltaTime;
      // Clamp terminal velocity
      this.verticalVelocity = Math.max(-30.0, this.verticalVelocity);
    }

    // 5. Total Desired Translation for Rapier Character Controller
    const totalMovement = new THREE.Vector3(
      this.velocity.x * deltaTime,
      this.verticalVelocity * deltaTime,
      this.velocity.z * deltaTime
    );

    // 6. Step physics with Rapier Character Controller
    const physicsResult = this.physicsManager.movePlayer(totalMovement);
    this.isGrounded = physicsResult.isGrounded;
    this.groundSlopeAngle = physicsResult.groundInfo.slopeDegrees;

    if (this.isGrounded && this.verticalVelocity < 0) {
      this.verticalVelocity = 0;
    }

    // 7. Calculate Camera Transform with Breathing & Headbob
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
