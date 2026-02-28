declare module "jsnes" {
  /* =====================
   * NES Options
   * ===================== */

  export interface NESOptions {
    onFrame?: (frameBuffer: Uint32Array) => void;

    onAudioSample?: (left: number, right: number) => void;

    emulateSound?: boolean;

    sampleRate?: number;

    preferredFrameRate?: number;
  }

  /* =====================
   * NES Core
   * ===================== */

  export class NES {
    constructor(options?: NESOptions);

    loadROM(romData: ArrayBuffer | string): void;

    reset(): void;

    frame(): void;

    buttonDown(player: number, button: number): void;

    buttonUp(player: number, button: number): void;

    zapperMove(x: number, y: number): void;

    zapperFireDown(): void;

    zapperFireUp(): void;
  }

  /* =====================
   * Controller
   * ===================== */

  export const Controller: {
    BUTTON_A: number;
    BUTTON_B: number;
    BUTTON_SELECT: number;
    BUTTON_START: number;
    BUTTON_UP: number;
    BUTTON_DOWN: number;
    BUTTON_LEFT: number;
    BUTTON_RIGHT: number;
  };
}
