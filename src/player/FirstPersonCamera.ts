import * as THREE from 'three';

export class FirstPersonCamera {
  private camera: THREE.PerspectiveCamera;
  private yaw = 0; // Horizontal rotation (radians)
  private pitch = 0; // Vertical rotation (radians)

  // Pitch constraints
  private readonly minPitch = -Math.PI / 2.05; // ~-87 degrees
  private readonly maxPitch = Math.PI / 2.05; // ~+87 degrees

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  public setRotation(yaw: number, pitch: number): void {
    this.yaw = yaw;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, pitch));
    this.updateCameraTransform(new THREE.Vector3(), new THREE.Vector3());
  }

  public getYaw(): number {
    return this.yaw;
  }

  public getPitch(): number {
    return this.pitch;
  }

  public applyMouseDelta(deltaX: number, deltaY: number, sensitivity: number): void {
    this.yaw -= deltaX * sensitivity;
    this.pitch -= deltaY * sensitivity;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
  }

  public getForwardVector(): THREE.Vector3 {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
  }

  public getRightVector(): THREE.Vector3 {
    return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
  }

  /**
   * 3D Forward direction vector for true flying (includes pitch)
   */
  public getLookDirection(): THREE.Vector3 {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    return dir;
  }

  public updateCameraTransform(playerHeadPosition: THREE.Vector3, motionOffset: THREE.Vector3): void {
    // 1. Position camera at player head/eye position + motion offset
    this.camera.position.copy(playerHeadPosition);

    // Apply motion offset rotated to the camera's yaw
    if (motionOffset.lengthSq() > 0) {
      const rotatedOffset = motionOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.camera.position.add(rotatedOffset);
    }

    // 2. Set rotation: Yaw around world Y, Pitch around local X (Stable horizon: roll is zero)
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.y = this.yaw;
    euler.x = this.pitch;
    euler.z = 0; // Strict horizon stability

    this.camera.quaternion.setFromEuler(euler);
  }
}
