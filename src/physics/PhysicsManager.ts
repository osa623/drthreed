import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { ColliderFactory } from './ColliderFactory';
import { GroundDetector, type GroundRayResult } from './GroundDetector';
import type { AnalyzedNode, PlayerMotionSettings } from '../state/types';

export class PhysicsManager {
  private rapierInstance: typeof RAPIER | null = null;
  private world: RAPIER.World | null = null;
  private staticBody: RAPIER.RigidBody | null = null;

  // Registered colliders map: nodeId -> RAPIER.Collider
  private colliders = new Map<string, RAPIER.Collider>();
  // Visual debug helpers: Three.js group attached to the scene
  private debugGroup = new THREE.Group();

  // Player physics
  private playerBody: RAPIER.RigidBody | null = null;
  private playerCollider: RAPIER.Collider | null = null;
  private characterController: RAPIER.KinematicCharacterController | null = null;

  // Parameters
  public readonly capsuleRadius = 0.35;
  public readonly capsuleHalfHeight = 0.55; // total height = 0.55*2 + 0.35*2 = 1.80m
  public readonly eyeOffsetFromCenter = 0.75; // eye height from ground = 0.90 + 0.75 = 1.65m

  private isInitialized = false;
  private isDebugVisible = true;

  constructor() {
    this.debugGroup.name = '__PHYSICS_DEBUG_HELPERS__';
  }

  public getDebugGroup(): THREE.Group {
    return this.debugGroup;
  }

  public setDebugVisible(visible: boolean): void {
    this.isDebugVisible = visible;
    this.debugGroup.visible = visible;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    await RAPIER.init();
    this.rapierInstance = RAPIER;
    this.initWorld();
    this.isInitialized = true;
  }

  private initWorld(): void {
    if (!this.rapierInstance) return;
    const gravity = { x: 0, y: -9.81, z: 0 };
    this.world = new this.rapierInstance.World(gravity);

    // Static rigid body parent for all environment colliders
    const bodyDesc = this.rapierInstance.RigidBodyDesc.fixed();
    this.staticBody = this.world.createRigidBody(bodyDesc);
  }

  /**
   * Rebuilds environment colliders from the current scene nodes
   */
  public rebuildColliders(
    sceneRoot: THREE.Object3D,
    nodes: Map<string, AnalyzedNode>,
    preservePlayer: boolean = true
  ): void {
    if (!this.world || !this.rapierInstance || !this.staticBody) return;

    // Clear existing colliders
    for (const [, collider] of this.colliders) {
      try {
        this.world.removeCollider(collider, false);
      } catch (e) {
        console.warn('Error removing collider:', e);
      }
    }
    this.colliders.clear();

    // Clear debug helpers
    while (this.debugGroup.children.length > 0) {
      const child = this.debugGroup.children[0];
      this.debugGroup.remove(child);
      if ((child as THREE.LineSegments).geometry) {
        (child as THREE.LineSegments).geometry.dispose();
      }
    }

    // Traverse and create colliders for each configured node
    nodes.forEach((nodeConfig, nodeId) => {
      if (!nodeConfig.colliderConfig.enabled || nodeConfig.colliderConfig.mode === 'none') {
        return;
      }

      // Find Three.js object
      const obj = this.findObjectByNodeId(sceneRoot, nodeId);
      if (!obj) return;

      const worldBox = new THREE.Box3(
        new THREE.Vector3(...nodeConfig.worldBoundingBox.min),
        new THREE.Vector3(...nodeConfig.worldBoundingBox.max)
      );

      const { colliderDesc, debugHelper } = ColliderFactory.createColliderDesc(
        this.rapierInstance!,
        obj,
        nodeConfig.colliderConfig,
        worldBox
      );

      if (colliderDesc) {
        try {
          const collider = this.world!.createCollider(colliderDesc, this.staticBody!);
          this.colliders.set(nodeId, collider);

          if (debugHelper) {
            this.debugGroup.add(debugHelper);
          }
        } catch (err) {
          console.warn(`Failed to create collider for node "${nodeConfig.name}":`, err);
        }
      }
    });

    this.debugGroup.visible = this.isDebugVisible;

    if (!preservePlayer) {
      this.destroyPlayer();
    }
  }

  /**
   * Initializes player kinematic capsule & character controller
   */
  public initPlayer(
    initialPos: [number, number, number],
    motionSettings: PlayerMotionSettings
  ): void {
    if (!this.world || !this.rapierInstance) return;

    this.destroyPlayer();

    // 1. Create Kinematic Position-Based Rigid Body for Player
    const bodyDesc = this.rapierInstance.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(initialPos[0], initialPos[1], initialPos[2]);
    this.playerBody = this.world.createRigidBody(bodyDesc);

    // 2. Create Capsule Collider
    const colliderDesc = this.rapierInstance.ColliderDesc.capsule(
      this.capsuleHalfHeight,
      this.capsuleRadius
    );
    this.playerCollider = this.world.createCollider(colliderDesc, this.playerBody);

    // 3. Create Rapier Character Controller
    // Skin offset allows smooth contact resolution without sticking
    this.characterController = this.world.createCharacterController(0.015);
    
    // Configure slope limits: convert degrees to radians
    const maxSlopeRad = (motionSettings.maxSlopeAngle * Math.PI) / 180;
    this.characterController.setMaxSlopeClimbAngle(maxSlopeRad);
    this.characterController.setMinSlopeSlideAngle(maxSlopeRad);

    // Configure autostepping
    this.characterController.enableAutostep(
      motionSettings.maxStepHeight,
      this.capsuleRadius * 0.8,
      false
    );

    // Snap to ground to ensure smooth steps
    this.characterController.enableSnapToGround(0.3);
  }

  /**
   * Updates player position using Rapier kinematic character controller
   */
  public movePlayer(
    desiredMovement: THREE.Vector3
  ): {
    newPosition: THREE.Vector3;
    isGrounded: boolean;
    groundInfo: GroundRayResult;
  } {
    if (!this.world || !this.playerBody || !this.playerCollider || !this.characterController || !this.rapierInstance) {
      return {
        newPosition: new THREE.Vector3(),
        isGrounded: false,
        groundInfo: {
          hit: false,
          point: new THREE.Vector3(),
          normal: new THREE.Vector3(0, 1, 0),
          distance: Infinity,
          slopeDegrees: 0,
          isWalkable: false,
        },
      };
    }

    const currentPos = this.playerBody.translation();

    // Compute movement resolution with Rapier character controller
    this.characterController.computeColliderMovement(
      this.playerCollider,
      { x: desiredMovement.x, y: desiredMovement.y, z: desiredMovement.z }
    );

    const movement = this.characterController.computedMovement();
    const isGroundedFromController = this.characterController.computedGrounded();

    const targetPos = {
      x: currentPos.x + movement.x,
      y: currentPos.y + movement.y,
      z: currentPos.z + movement.z,
    };

    // Update kinematic body
    this.playerBody.setNextKinematicTranslation(targetPos);

    // Step physics world forward
    this.world.step();

    // Check exact ground contact and slope angle via GroundDetector
    const bottomOrigin = new THREE.Vector3(
      targetPos.x,
      targetPos.y - this.capsuleHalfHeight,
      targetPos.z
    );

    const groundRay = GroundDetector.raycastGround(
      this.world,
      this.rapierInstance,
      bottomOrigin,
      this.capsuleRadius + 0.25,
      45,
      this.playerCollider.handle
    );

    const isGrounded = isGroundedFromController || groundRay.hit;

    return {
      newPosition: new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z),
      isGrounded,
      groundInfo: groundRay,
    };
  }

  public getPlayerPosition(): THREE.Vector3 | null {
    if (!this.playerBody) return null;
    const pos = this.playerBody.translation();
    return new THREE.Vector3(pos.x, pos.y, pos.z);
  }

  public setPlayerPosition(pos: [number, number, number]): void {
    if (this.playerBody) {
      this.playerBody.setTranslation({ x: pos[0], y: pos[1], z: pos[2] }, true);
    }
  }

  public findSafeSpawn(x: number, z: number): { safeY: number; found: boolean; slopeDegrees: number } {
    if (!this.world || !this.rapierInstance) {
      return { safeY: 1.5, found: false, slopeDegrees: 0 };
    }
    return GroundDetector.findSafeSpawnHeight(
      this.world,
      this.rapierInstance,
      x,
      z,
      60.0,
      this.capsuleHalfHeight,
      this.capsuleRadius
    );
  }

  public destroyPlayer(): void {
    if (this.world) {
      if (this.playerCollider) {
        try {
          this.world.removeCollider(this.playerCollider, false);
        } catch {}
        this.playerCollider = null;
      }
      if (this.playerBody) {
        try {
          this.world.removeRigidBody(this.playerBody);
        } catch {}
        this.playerBody = null;
      }
      this.characterController = null;
    }
  }

  public dispose(): void {
    this.destroyPlayer();
    if (this.world) {
      for (const [, col] of this.colliders) {
        try {
          this.world.removeCollider(col, false);
        } catch {}
      }
      this.colliders.clear();
      if (this.staticBody) {
        try {
          this.world.removeRigidBody(this.staticBody);
        } catch {}
        this.staticBody = null;
      }
      this.world.free();
      this.world = null;
    }

    while (this.debugGroup.children.length > 0) {
      const child = this.debugGroup.children[0];
      this.debugGroup.remove(child);
      if ((child as THREE.LineSegments).geometry) {
        (child as THREE.LineSegments).geometry.dispose();
      }
    }
  }

  private findObjectByNodeId(root: THREE.Object3D, nodeId: string): THREE.Object3D | null {
    let result: THREE.Object3D | null = null;
    root.traverse((obj) => {
      if (obj.userData?.__inspectorNodeId === nodeId) {
        result = obj;
      }
    });
    return result;
  }
}
