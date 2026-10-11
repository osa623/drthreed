import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';

export interface GroundRayResult {
  hit: boolean;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  distance: number;
  slopeDegrees: number;
  isWalkable: boolean;
  colliderHandle?: number;
}

export class GroundDetector {
  private static upVector = new THREE.Vector3(0, 1, 0);

  /**
   * Casts a ray straight down from an origin to detect ground contact in Rapier.
   */
  public static raycastGround(
    world: RAPIER.World,
    rapier: typeof RAPIER,
    origin: THREE.Vector3,
    maxDistance: number = 3.0,
    maxSlopeDegrees: number = 45,
    excludeColliderHandle?: number
  ): GroundRayResult {
    const ray = new rapier.Ray(
      { x: origin.x, y: origin.y, z: origin.z },
      { x: 0, y: -1, z: 0 }
    );

    const hit = world.castRayAndGetNormal(
      ray,
      maxDistance,
      true, // solid
      undefined,
      undefined,
      undefined,
      undefined,
      (collider) => {
        // Exclude player capsule collider if specified
        if (excludeColliderHandle !== undefined && collider.handle === excludeColliderHandle) {
          return false;
        }
        return true;
      }
    );

    if (!hit) {
      return {
        hit: false,
        point: new THREE.Vector3(),
        normal: new THREE.Vector3(0, 1, 0),
        distance: Infinity,
        slopeDegrees: 0,
        isWalkable: false,
      };
    }

    const hitPoint = new THREE.Vector3(
      origin.x,
      origin.y - hit.timeOfImpact,
      origin.z
    );

    const hitNormal = new THREE.Vector3(hit.normal.x, hit.normal.y, hit.normal.z).normalize();
    const cosAngle = Math.max(-1, Math.min(1, hitNormal.dot(this.upVector)));
    const slopeDegrees = (Math.acos(cosAngle) * 180) / Math.PI;
    const isWalkable = slopeDegrees <= maxSlopeDegrees;

    return {
      hit: true,
      point: hitPoint,
      normal: hitNormal,
      distance: hit.timeOfImpact,
      slopeDegrees,
      isWalkable,
      colliderHandle: hit.collider.handle,
    };
  }

  /**
   * Safe spawn height finder: Casts down to locate walkable floor surface
   */
  public static findSafeSpawnHeight(
    world: RAPIER.World,
    rapier: typeof RAPIER,
    x: number,
    z: number,
    searchStartY: number = 3.0,
    maxDistance: number = 20.0,
    capsuleHalfHeight: number = 0.55,
    capsuleRadius: number = 0.35
  ): { safeY: number; found: boolean; slopeDegrees: number } {
    const origin = new THREE.Vector3(x, searchStartY, z);
    const result = this.raycastGround(world, rapier, origin, maxDistance, 50);

    if (result.hit) {
      // Position capsule so its bottom rests just above the ground surface + small clearance
      const safeY = result.point.y + capsuleHalfHeight + capsuleRadius + 0.08;
      return {
        safeY,
        found: true,
        slopeDegrees: result.slopeDegrees,
      };
    }

    return { safeY: searchStartY, found: false, slopeDegrees: 0 };
  }
}
