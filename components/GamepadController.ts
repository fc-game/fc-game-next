interface ButtonInfo {
  gamepadId: string;
  type: "button" | "axis";
  code: number;
  value?: number;
}

interface GamepadButton {
  pressed: boolean;
}

interface GamepadState {
  buttons: GamepadButton[];
  axes: number[];
}

interface GamepadConfig {
  playerGamepadId: [string | null, string | null];
  configs: {
    [gamepadId: string]: {
      buttons: Array<{
        type: "button" | "axis";
        code: number;
        buttonId: number;
        value?: number;
      }>;
    };
  };
}

export interface GamepadControllerProps {
  onButtonDown: (playerId: number, buttonId: number) => void;
  onButtonUp: (playerId: number, buttonId: number) => void;
}

export default class GamepadController {
  private onButtonDown: (playerId: number, buttonId: number) => void;
  private onButtonUp: (playerId: number, buttonId: number) => void;
  private gamepadState: GamepadState[];
  private buttonCallback: ((info: ButtonInfo) => void) | null;
  private gamepadConfig: GamepadConfig | null;

  constructor(props: GamepadControllerProps) {
    this.onButtonDown = props.onButtonDown;
    this.onButtonUp = props.onButtonUp;
    this.gamepadState = [];
    this.buttonCallback = null;
    this.gamepadConfig = null;
  }

  disableIfGamepadEnabled = (callback: (playerId: number, buttonId: number) => void) => {
    return (playerId: number, buttonId: number) => {
      if (!this.gamepadConfig) {
        return callback(playerId, buttonId);
      }

      const playerGamepadId = this.gamepadConfig.playerGamepadId;
      if (!playerGamepadId || !playerGamepadId[playerId - 1]) {
        // allow callback only if player is not associated to any gamepad
        return callback(playerId, buttonId);
      }
    };
  };

  private _getPlayerNumberFromGamepad = (gamepad: Gamepad): number => {
    if (!this.gamepadConfig) return 1;

    if (this.gamepadConfig.playerGamepadId[0] === gamepad.id) {
      return 1;
    }

    if (this.gamepadConfig.playerGamepadId[1] === gamepad.id) {
      return 2;
    }

    return 1;
  };

  poll = (): void => {
    // Check if we're in browser environment
    if (typeof navigator === 'undefined') {
      return;
    }

    const gamepads = (navigator.getGamepads
      ? navigator.getGamepads()
      : navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []) as Gamepad[];

    const usedPlayers: number[] = [];

    for (let gamepadIndex = 0; gamepadIndex < gamepads.length; gamepadIndex++) {
      const gamepad = gamepads[gamepadIndex];
      const previousGamepad = this.gamepadState[gamepadIndex];

      if (!gamepad) {
        continue;
      }

      if (!previousGamepad) {
        this.gamepadState[gamepadIndex] = {
          buttons: gamepad.buttons.map(b => ({ pressed: b.pressed })),
          axes: gamepad.axes.slice()
        };
        continue;
      }

      const buttons = gamepad.buttons;
      const previousButtons = previousGamepad.buttons;

      if (this.buttonCallback) {
        for (let code = 0; code < gamepad.axes.length; code++) {
          const axis = gamepad.axes[code];
          const previousAxis = previousGamepad.axes[code];

          if (axis === -1 && previousAxis !== -1) {
            this.buttonCallback!({
              gamepadId: gamepad.id,
              type: "axis",
              code: code,
              value: axis,
            });
          }

          if (axis === 1 && previousAxis !== 1) {
            this.buttonCallback!({
              gamepadId: gamepad.id,
              type: "axis",
              code: code,
              value: axis,
            });
          }
        }

        for (let code = 0; code < buttons.length; code++) {
          const button = buttons[code];
          const previousButton = previousButtons[code];
          if (button.pressed && !previousButton.pressed) {
            this.buttonCallback!({
              gamepadId: gamepad.id,
              type: "button",
              code: code,
            });
          }
        }
      } else if (this.gamepadConfig) {
        let playerNumber = this._getPlayerNumberFromGamepad(gamepad);
        if (usedPlayers.length < 2) {
          if (usedPlayers.indexOf(playerNumber) !== -1) {
            playerNumber++;
            if (playerNumber > 2) playerNumber = 1;
          }
          usedPlayers.push(playerNumber);

          if (this.gamepadConfig.configs[gamepad.id]) {
            const configButtons = this.gamepadConfig.configs[gamepad.id].buttons;
            for (let i = 0; i < configButtons.length; i++) {
              const configButton = configButtons[i];
              if (configButton.type === "button") {
                const code = configButton.code;
                const button = buttons[code];
                const previousButton = previousButtons[code];

                if (button.pressed && !previousButton.pressed) {
                  this.onButtonDown(playerNumber, configButton.buttonId);
                } else if (!button.pressed && previousButton.pressed) {
                  this.onButtonUp(playerNumber, configButton.buttonId);
                }
              } else if (configButton.type === "axis") {
                const code = configButton.code;
                const axis = gamepad.axes[code];
                const previousAxis = previousGamepad.axes[code];

                if (
                  axis === configButton.value &&
                  previousAxis !== configButton.value
                ) {
                  this.onButtonDown(playerNumber, configButton.buttonId);
                }

                if (
                  axis !== configButton.value &&
                  previousAxis === configButton.value
                ) {
                  this.onButtonUp(playerNumber, configButton.buttonId);
                }
              }
            }
          }
        }
      }

      this.gamepadState[gamepadIndex] = {
        buttons: buttons.map((b) => {
          return { pressed: b.pressed };
        }),
        axes: gamepad.axes.slice(0),
      };
    }
  };

  promptButton = (f: ((info: ButtonInfo) => void) | null): void => {
    if (!f) {
      this.buttonCallback = f;
    } else {
      this.buttonCallback = (buttonInfo: ButtonInfo) => {
        this.buttonCallback = null;
        f(buttonInfo);
      };
    }
  };

  loadGamepadConfig = (): void => {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    let gamepadConfig: GamepadConfig | null = null;
    try {
      const configString = localStorage.getItem("gamepadConfig");
      if (configString) {
        gamepadConfig = JSON.parse(configString) as GamepadConfig;
      }
    } catch (e) {
      console.log("Failed to get gamepadConfig from localStorage.", e);
    }

    this.gamepadConfig = gamepadConfig;
  };

  setGamepadConfig = (gamepadConfig: GamepadConfig): void => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem("gamepadConfig", JSON.stringify(gamepadConfig));
      this.gamepadConfig = gamepadConfig;
    } catch (e) {
      console.log("Failed to set gamepadConfig in localStorage");
    }
  };

  startPolling = (): { stop: () => void } => {
    if (typeof window === 'undefined') {
      return { stop: () => {} };
    }

    if (!(navigator.getGamepads || navigator.webkitGetGamepads)) {
      return { stop: () => {} };
    }

    let stopped = false;
    const loop = (): void => {
      if (stopped) return;

      this.poll();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return {
      stop: () => {
        stopped = true;
      },
    };
  };

  getGamepadConfig(): GamepadConfig | null {
    return this.gamepadConfig;
  }
}