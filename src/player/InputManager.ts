export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  crouch: boolean;
  mouseDeltaX: number;
  mouseDeltaY: number;
}

export class InputManager {
  private keys = new Set<string>();
  private mouseDeltaX = 0;
  private mouseDeltaY = 0;
  private isPointerLocked = false;
  private onLockChangeCallback?: (locked: boolean) => void;

  private boundKeyDown = this.handleKeyDown.bind(this);
  private boundKeyUp = this.handleKeyUp.bind(this);
  private boundMouseMove = this.handleMouseMove.bind(this);
  private boundPointerLockChange = this.handlePointerLockChange.bind(this);

  public init(targetElement: HTMLElement, onLockChange?: (locked: boolean) => void): void {
    this.onLockChangeCallback = onLockChange;
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    targetElement.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('pointerlockchange', this.boundPointerLockChange);
  }

  public requestPointerLock(targetElement: HTMLElement): void {
    targetElement.requestPointerLock();
  }

  public exitPointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  public getPointerLocked(): boolean {
    return this.isPointerLocked;
  }

  public pollInput(): InputState {
    const state: InputState = {
      forward: this.keys.has('KeyW') || this.keys.has('ArrowUp'),
      backward: this.keys.has('KeyS') || this.keys.has('ArrowDown'),
      left: this.keys.has('KeyA') || this.keys.has('ArrowLeft'),
      right: this.keys.has('KeyD') || this.keys.has('ArrowRight'),
      jump: this.keys.has('Space'),
      sprint: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'),
      crouch: this.keys.has('KeyC') || this.keys.has('ControlLeft'),
      mouseDeltaX: this.mouseDeltaX,
      mouseDeltaY: this.mouseDeltaY,
    };

    // Consume mouse deltas
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;

    return state;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Avoid intercepting input if user is typing in an input or textarea
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
      return;
    }
    this.keys.add(e.code);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.isPointerLocked) {
      this.mouseDeltaX += e.movementX;
      this.mouseDeltaY += e.movementY;
    }
  }

  private handlePointerLockChange(): void {
    this.isPointerLocked = !!document.pointerLockElement;
    if (this.onLockChangeCallback) {
      this.onLockChangeCallback(this.isPointerLocked);
    }
    if (!this.isPointerLocked) {
      this.keys.clear();
      this.mouseDeltaX = 0;
      this.mouseDeltaY = 0;
    }
  }

  public dispose(targetElement: HTMLElement): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    targetElement.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
    this.keys.clear();
  }
}
