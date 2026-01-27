import { Controller } from "jsnes";

// Mapping keyboard code to [controller, button]
export interface KeyMapping {
  [keyCode: number]: [number, number, string];
}

export const KEYS: KeyMapping = {
  75: [1, Controller.BUTTON_A, "K"], // K
  74: [1, Controller.BUTTON_B, "J"], // J
  16: [1, Controller.BUTTON_SELECT, "Left Shift"], // SELECT
  13: [1, Controller.BUTTON_START, "Enter"], // START
  87: [1, Controller.BUTTON_UP, "W"], // Up
  83: [1, Controller.BUTTON_DOWN, "S"], // Down
  65: [1, Controller.BUTTON_LEFT, "A"], // Left
  68: [1, Controller.BUTTON_RIGHT, "D"], // Right
  98: [2, Controller.BUTTON_A, "Num-2"], // A
  97: [2, Controller.BUTTON_B, "Num-1"], // B
  103: [2, Controller.BUTTON_SELECT, "Num-7"], // SELECT
  105: [2, Controller.BUTTON_START, "Num-9"], // START
  38: [2, Controller.BUTTON_UP, "Up"], // Up
  40: [2, Controller.BUTTON_DOWN, "Down"], // Down
  37: [2, Controller.BUTTON_LEFT, "Left"], // Left
  39: [2, Controller.BUTTON_RIGHT, "Right"], // Right
};

export interface KeyboardControllerOptions {
  onButtonDown: (player: number, button: number) => void;
  onButtonUp: (player: number, button: number) => void;
}

export default class KeyboardController {
  private onButtonDown: (player: number, button: number) => void;
  private onButtonUp: (player: number, button: number) => void;
  private keys: KeyMapping;

  constructor(options: KeyboardControllerOptions) {
    this.onButtonDown = options.onButtonDown;
    this.onButtonUp = options.onButtonUp;
    this.keys = KEYS;
  }

  loadKeys = (): void => {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      this.keys = KEYS;
      return;
    }

    let keys: KeyMapping | undefined;
    try {
      const keysString = localStorage.getItem("keys");
      if (keysString) {
        keys = JSON.parse(keysString) as KeyMapping;
      }
    } catch (e) {
      console.log("Failed to get keys from localStorage.", e);
    }

    this.keys = keys || KEYS;
  };

  setKeys = (newKeys: KeyMapping): void => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem("keys", JSON.stringify(newKeys));
      this.keys = newKeys;
    } catch (e) {
      console.log("Failed to set keys in localStorage");
    }
  };

  handleKeyDown = (e: KeyboardEvent): void => {
    const key = this.keys[e.keyCode];
    if (key) {
      this.onButtonDown(key[0], key[1]);
      e.preventDefault();
    }
  };

  handleKeyUp = (e: KeyboardEvent): void => {
    const key = this.keys[e.keyCode];
    if (key) {
      this.onButtonUp(key[0], key[1]);
      e.preventDefault();
    }
  };

  handleKeyPress = (e: KeyboardEvent): void => {
    e.preventDefault();
  };

  getCurrentKeys(): KeyMapping {
    return this.keys;
  }
}