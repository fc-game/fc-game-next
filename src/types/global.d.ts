declare global {
  interface Window {
    cpro_id?: string;

    gtag?: (
      command: "config" | "event" | "js" | "set" | "consent",
      targetId: string,
      config?: Record<string, any>,
    ) => void;

    webkitFullscreenElement?: Element;
    msFullscreenElement?: Element;
    webkitExitFullscreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
    nes: any;
  }

  interface Navigator {
    webkitGetGamepads?: () => Gamepad[];
  }

  interface GamepadButton {
    type: "button" | "axis";
    code: number;
    value?: number;
    buttonId: number;
  }

  interface GamepadConfig {
    buttons: GamepadButton[];
  }

  interface GamepadConfigs {
    [key: string]: GamepadConfig;
  }

  interface GamepadConfiguration {
    playerGamepadId: (string | number)[];
    configs: GamepadConfigs;
  }
}

export {};
