"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

interface GamepadButton {
  type: "button" | "axis";
  code: number;
  buttonId?: number;
  value?: number;
}

interface GamepadConfig {
  buttons?: GamepadButton[];
}

interface GamepadConfigs {
  [gamepadId: string]: GamepadConfig;
}

interface GamepadFullConfig {
  playerGamepadId: [string | null, string | null];
  configs: GamepadConfigs;
}

interface Keys {
  [keyCode: string]: [number, number, string];
}

interface ControlMapperRowProps {
  keys: Keys;
  button: number;
  prevButton: number;
  gamepadConfig: GamepadFullConfig | null;
  currentPromptButton: number;
  handleClick: (buttonInfo: [number, number]) => void;
  isPlayer1: boolean;
}

const ControlMapperRow: React.FC<ControlMapperRowProps> = ({
  keys,
  button,
  prevButton,
  gamepadConfig,
  currentPromptButton,
  handleClick,
  isPlayer1,
}) => {
  const [player1Button, setPlayer1Button] = useState<string>("");
  const [player2Button, setPlayer2Button] = useState<string>("");
  const [waitingForKey, setWaitingForKey] = useState<number>(0);

  /**
   * 获取游戏手柄按钮名称
   */
  const gamepadButtonName = useCallback(
    (gamepadButton: GamepadButton): string => {
      if (gamepadButton.type === "button") return "Btn-" + gamepadButton.code;
      if (gamepadButton.type === "axis")
        return "Axis-" + gamepadButton.code + " " + gamepadButton.value;
      return "";
    },
    [],
  );

  /**
   * 搜索按钮
   */
  const searchButton = useCallback(
    (
      gamepadConfig: GamepadConfig | undefined,
      buttonId: number,
    ): GamepadButton | undefined => {
      return gamepadConfig?.buttons?.filter((b) => b.buttonId === buttonId)[0];
    },
    [],
  );

  /**
   * 搜索新按钮
   */
  const searchNewButton = useCallback(
    (
      prevGamepadConfig: GamepadConfig | null | undefined,
      gamepadConfig: GamepadConfig | undefined,
    ): GamepadButton | undefined => {
      return gamepadConfig?.buttons?.filter((b) => {
        return (
          !prevGamepadConfig ||
          !prevGamepadConfig.buttons?.some((b2) => b2.buttonId === b.buttonId)
        );
      })[0];
    },
    [],
  );

  /**
   * 更新按钮显示
   */
  const updateButtonDisplay = useCallback(
    (prevGamepadConfig: GamepadFullConfig | null = null) => {
      const playerButtons: [string, string] = ["", ""];

      // 首先处理键盘按键
      for (const key in keys) {
        if (keys[key][0] === 1 && keys[key][1] === button) {
          playerButtons[0] = keys[key][2];
        } else if (keys[key][0] === 2 && keys[key][1] === button) {
          playerButtons[1] = keys[key][2];
        }
      }

      let waitingForKey = 0;
      let waitingForKeyPlayer = 0;

      // 处理游戏手柄配置
      if (gamepadConfig?.playerGamepadId) {
        const playerGamepadId = gamepadConfig.playerGamepadId;

        // 玩家1
        if (playerGamepadId[0]) {
          playerButtons[0] = "";
          const gamepadButton = searchButton(
            gamepadConfig.configs[playerGamepadId[0]],
            button,
          );
          const newButton = searchNewButton(
            prevGamepadConfig?.configs?.[playerGamepadId[0]],
            gamepadConfig.configs[playerGamepadId[0]],
          );

          if (gamepadButton) {
            playerButtons[0] = gamepadButtonName(gamepadButton);
          } else {
            if (newButton && newButton.buttonId === prevButton) {
              if (!waitingForKey) {
                waitingForKey = 1;
                waitingForKeyPlayer = 1;
              }
            }
          }
        }

        // 玩家2
        if (playerGamepadId[1]) {
          playerButtons[1] = "";
          const gamepadButton = searchButton(
            gamepadConfig.configs[playerGamepadId[1]],
            button,
          );
          const newButton = searchNewButton(
            prevGamepadConfig?.configs?.[playerGamepadId[1]],
            gamepadConfig.configs[playerGamepadId[1]],
          );

          if (gamepadButton) {
            playerButtons[1] = gamepadButtonName(gamepadButton);
          } else {
            if (newButton && newButton.buttonId === prevButton) {
              if (!waitingForKey) {
                waitingForKey = 2;
                waitingForKeyPlayer = 2;
              }
            }
          }
        }
      }

      // 更新状态
      setPlayer1Button(playerButtons[0]);
      setPlayer2Button(playerButtons[1]);

      // 处理等待按键状态
      if (waitingForKey) {
        handleClick([waitingForKeyPlayer, button]);
        setWaitingForKey(waitingForKey);
      } else if (waitingForKey === 0 && currentPromptButton !== button) {
        setWaitingForKey(0);
      }
    },
    [
      keys,
      button,
      prevButton,
      gamepadConfig,
      currentPromptButton,
      handleClick,
      searchButton,
      searchNewButton,
      gamepadButtonName,
    ],
  );

  /**
   * 初始化按钮显示
   */
  useEffect(() => {
    updateButtonDisplay();
  }, [updateButtonDisplay]);

  const prevGamepadConfigRef = useRef<GamepadFullConfig | null>(null);

  /**
   * 当 props 变化时更新按钮显示
   */
  useEffect(() => {
    updateButtonDisplay(prevGamepadConfigRef.current);
    prevGamepadConfigRef.current = gamepadConfig;
  }, [keys, gamepadConfig, currentPromptButton, updateButtonDisplay]);

  /**
   * 处理等待按键状态变化
   */
  useEffect(() => {
    if (waitingForKey === 1 && currentPromptButton !== button) {
      setWaitingForKey(0);
    } else if (waitingForKey === 2 && currentPromptButton !== button) {
      setWaitingForKey(0);
    }
  }, [currentPromptButton, button, waitingForKey]);

  /**
   * 点击事件处理
   */
  const handleCellClick = useCallback(() => {
    const player = isPlayer1 ? 1 : 2;
    handleClick([player, button]);
    setWaitingForKey(player);
  }, [handleClick, button, isPlayer1]);

  const waitingText = "Press key...";

  const displayText = useMemo(() => {
    if (waitingForKey === 1 || waitingForKey === 2) {
      return waitingText;
    }
    return isPlayer1 ? player1Button : player2Button;
  }, [waitingForKey, isPlayer1, player1Button, player2Button]);

  return (
    <div className="key-button" onClick={handleCellClick}>
      {displayText}
    </div>
  );
};

export default ControlMapperRow;
