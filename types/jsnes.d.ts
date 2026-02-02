declare module "jsnes" {
  /* =====================
   * NES Options
   * ===================== */

  export interface NESOptions {
    /** 每帧回调（PPU 输出） */
    onFrame?: (frameBuffer: Uint32Array) => void;

    /** 音频采样回调（APU 输出） */
    onAudioSample?: (left: number, right: number) => void;

    /** 是否启用声音（默认 true） */
    emulateSound?: boolean;

    /** 音频采样率（默认 44100） */
    sampleRate?: number;

    /** 期望帧率（一般不用动） */
    preferredFrameRate?: number;
  }

  /* =====================
   * NES Core
   * ===================== */

  export class NES {
    constructor(options?: NESOptions);

    /** 加载 ROM（base64 string） */
    loadROM(romData: ArrayBuffer | string): void;

    /** 重置模拟器 */
    reset(): void;

    /** 执行一帧（CPU + PPU + APU） */
    frame(): void;

    /** 按键按下 */
    buttonDown(player: number, button: number): void;

    /** 按键抬起 */
    buttonUp(player: number, button: number): void;
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
