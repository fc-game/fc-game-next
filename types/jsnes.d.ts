declare module 'jsnes' {
  export class NES {
    constructor(options: any);
    loadROM(data: ArrayBuffer | string): void;
    frame(): void;
    buttonDown(player: number, button: number): void;
    buttonUp(player: number, button: number): void;
    zapperMove(x: number, y: number): void;
    zapperFireDown(): void;
    zapperFireUp(): void;
  }

  export class Controller {
    static readonly BUTTON_UP: number;
    static readonly BUTTON_DOWN: number;
    static readonly BUTTON_LEFT: number;
    static readonly BUTTON_RIGHT: number;
    static readonly BUTTON_A: number;
    static readonly BUTTON_B: number;
    static readonly BUTTON_SELECT: number;
    static readonly BUTTON_START: number;
  }
}
