import React, { useState, useEffect, useCallback } from "react";

const ControlMapperRow = (props: any) => {
  const {
    keys,
    button,
    prevButton,
    gamepadConfig,
    currentPromptButton,
    handleClick,
    isPlayer1,
  } = props;

  const [player1Button, setPlayer1Button] = useState("");
  const [player2Button, setPlayer2Button] = useState("");
  const [waitingForKey, setWaitingForKey] = useState(0);

  const gamepadButtonName = useCallback((gamepadButton: any) => {
    if (gamepadButton.type === "button") return "Btn-" + gamepadButton.code;
    if (gamepadButton.type === "axis")
      return "Axis-" + gamepadButton.code + " " + gamepadButton.value;
    return "";
  }, []);

  const searchButton = useCallback((gamepadConfig: any, buttonId: any) => {
    return gamepadConfig?.buttons?.filter(
      (b: any) => b.buttonId === buttonId,
    )[0];
  }, []);

  const searchNewButton = useCallback(
    (prevGamepadConfig: any, gamepadConfig: any) => {
      return gamepadConfig?.buttons?.filter((b: any) => {
        return (
          !prevGamepadConfig ||
          !prevGamepadConfig.buttons?.some(
            (b2: any) => b2.buttonId === b.buttonId,
          )
        );
      })[0];
    },
    [],
  );

  const updateButtonDisplay = useCallback(
    (prevGamepadConfig: GamepadConfiguration | null = null) => {
      const playerButtons = ["", ""];

      for (const key in keys) {
        if (keys[key][0] === 1 && keys[key][1] === button) {
          playerButtons[0] = keys[key][2];
        } else if (keys[key][0] === 2 && keys[key][1] === button) {
          playerButtons[1] = keys[key][2];
        }
      }

      let waitingForKey = 0;
      let waitingForKeyPlayer = 0;

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

      setPlayer1Button(playerButtons[0]);
      setPlayer2Button(playerButtons[1]);

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

  useEffect(() => {
    updateButtonDisplay();
  }, [updateButtonDisplay]);

  useEffect(() => {
    let prevGamepadConfig = null;
    updateButtonDisplay(prevGamepadConfig);
  }, [keys, gamepadConfig, currentPromptButton, updateButtonDisplay]);

  useEffect(() => {
    if (waitingForKey === 1 && currentPromptButton !== button) {
      setWaitingForKey(0);
    } else if (waitingForKey === 2 && currentPromptButton !== button) {
      setWaitingForKey(0);
    }
  }, [currentPromptButton, button, waitingForKey]);

  const handleCellClick = useCallback(
    (player: any) => {
      handleClick([player, button]);
      setWaitingForKey(player);
    },
    [handleClick, button],
  );

  const waitingText = "Press key...";

  return (
    <div
      className="key-button"
      onClick={() => handleCellClick(isPlayer1 ? 1 : 2)}
    >
      {waitingForKey === 1 || waitingForKey === 2
        ? waitingText
        : isPlayer1
          ? player1Button
          : player2Button}
    </div>
  );
};

export default ControlMapperRow;
