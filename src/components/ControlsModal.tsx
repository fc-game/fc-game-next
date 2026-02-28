import React, { useRef, useState, useEffect, useCallback } from "react";
import { Controller } from "jsnes";
import ControlMapperRow from "@/src/components/ControlMapperRow";
import { KEYS } from "@/src/components/KeyboardController";

const ControlsModal = (props: any) => {
  const {
    gamepadConfig: initialGamepadConfig,
    keys: initialKeys,
    promptButton,
    setKeys,
    setGamepadConfig,
    isOpen,
    toggle,
  } = props;

  // 初始化状�?
  const [gamepadConfig, setGamepadConfigState] = useState(() => {
    const config = initialGamepadConfig || {};
    return {
      playerGamepadId: config.playerGamepadId || [null, null],
      configs: config.configs || {},
    };
  });

  const [keys, setKeysState] = useState(initialKeys || {});
  const [button, setButton] = useState(undefined);
  const [modified, setModified] = useState(false);
  const [currentPromptButton, setCurrentPromptButton] = useState(-1);
  const handleKeyDownRef: any = useRef(null);

  handleKeyDownRef.current = (event: any) => {
    if (!button) return;

    const newKeys: any = {};
    for (const key in keys) {
      if (keys[key][0] !== button[0] || keys[key][1] !== button[1]) {
        newKeys[key] = keys[key];
      }
    }

    const playerGamepadId = [...gamepadConfig.playerGamepadId];
    const playerId = button[0];
    playerGamepadId[playerId - 1] = null;

    const newGamepadConfig = {
      configs: gamepadConfig.configs,
      playerGamepadId: playerGamepadId,
    };

    setKeysState({
      ...newKeys,
      [event.keyCode]: [
        ...(button as any).slice(0, 2),
        event.key.length > 1 ? event.key : String(event.key).toUpperCase(),
      ],
    });

    setGamepadConfigState(newGamepadConfig);
    setButton(undefined);
    setCurrentPromptButton(-1);
    setModified(true);

    // 移除监听
    promptButton(null);
    document.removeEventListener("keydown", handleKeyDownStatic);
  };

  const handleKeyDownStatic = useCallback((event: any) => {
    if (handleKeyDownRef.current) {
      handleKeyDownRef.current(event);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDownStatic);
    return () => {
      document.removeEventListener("keydown", handleKeyDownStatic);
    };
  }, [handleKeyDownStatic]);

  const handleGamepadButtonDown = useCallback(
    (buttonInfo: any) => {
      if (!button) return;

      const playerId = button[0];
      const buttonId = button[1];
      const gamepadId = buttonInfo.gamepadId;

      // link player to gamepad
      const playerGamepadId = [...gamepadConfig.playerGamepadId];
      const newConfig: any = {};

      playerGamepadId[playerId - 1] = gamepadId;

      const rejectButtonId = (b: any) => {
        return b.buttonId !== buttonId;
      };

      const newButton = {
        code: buttonInfo.code,
        type: buttonInfo.type,
        buttonId: buttonId,
        value: buttonInfo.value,
      };

      newConfig[gamepadId] = {
        buttons: (gamepadConfig.configs[gamepadId] || { buttons: [] }).buttons
          .filter(rejectButtonId)
          .concat([newButton]),
      };

      // 配置
      const configs = { ...gamepadConfig.configs, ...newConfig };
      const newGamepadConfig = {
        configs: configs,
        playerGamepadId: playerGamepadId,
      };

      setGamepadConfigState(newGamepadConfig);
      setCurrentPromptButton(-1);
      setModified(true);

      // 移除监听
      promptButton(null);
      document.removeEventListener("keydown", handleKeyDownStatic);
    },
    [
      button,
      gamepadConfig.playerGamepadId,
      gamepadConfig.configs,
      promptButton,
      handleKeyDownStatic,
    ],
  );

  /**
   * 移除按键监听
   */
  const removeKeyListener = useCallback(() => {
    promptButton(null);
    document.removeEventListener("keydown", handleKeyDownStatic);
  }, [promptButton, handleKeyDownStatic]);

  /**
   * 按键监听
   */
  const listenForKey = useCallback(
    (button: any) => {
      const currentPromptButton = button[1];

      removeKeyListener();
      setButton(button);
      setCurrentPromptButton(currentPromptButton);
      promptButton(handleGamepadButtonDown);
      document.addEventListener("keydown", handleKeyDownStatic);
    },
    [
      promptButton,
      handleGamepadButtonDown,
      handleKeyDownStatic,
      removeKeyListener,
    ],
  );

  const resetAllKeyToDefault = useCallback(() => {
    setKeysState(KEYS);
    setModified(true);
  }, [setKeysState, setModified]);

  /**
   * 组件卸载时保存修�?
   */
  useEffect(() => {
    return () => {
      if (modified) {
        setKeys(keys);
        setGamepadConfig(gamepadConfig);
      }
      removeKeyListener();
    };
  }, [
    modified,
    keys,
    gamepadConfig,
    setKeys,
    setGamepadConfig,
    removeKeyListener,
  ]);

  /**
   * �?props 变化时更新状�?
   */
  useEffect(() => {
    if (initialGamepadConfig) {
      setGamepadConfigState({
        playerGamepadId: initialGamepadConfig.playerGamepadId || [null, null],
        configs: initialGamepadConfig.configs || {},
      });
    }
    if (initialKeys) {
      setKeysState(initialKeys);
    }
  }, [initialGamepadConfig, initialKeys]);

  return (
    <div className={isOpen ? "modal-overlay active" : "modal-overlay"}>
      <div className="settings-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            <i className="fas fa-gamepad"></i> Game Controls
          </h2>
          <button className="close-button" id="close-modal" onClick={toggle}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="player-settings">
            {/* Player 1 设置 */}
            <div className="player-section">
              <div className="player-header">
                <div className="player-icon p1-icon">
                  <i className="fas fa-user"></i>
                </div>
                <h3 className="player-title p1-title">Player 1</h3>
              </div>

              <div className="key-bindings">
                <div className="key-binding">
                  <div className="key-action" title="Up">
                    <i className="fas fa-arrow-up key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_UP}
                    prevButton={Controller.BUTTON_UP}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={true}
                  />
                </div>

                <div className="key-binding">
                  <div className="key-action" title="Down">
                    <i className="fas fa-arrow-down key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_DOWN}
                    prevButton={Controller.BUTTON_DOWN}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={true}
                  />
                </div>

                <div className="key-binding">
                  <div className="key-action" title="Left">
                    <i className="fas fa-arrow-left key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_LEFT}
                    prevButton={Controller.BUTTON_LEFT}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={true}
                  />
                </div>

                <div className="key-binding">
                  <div className="key-action" title="Right">
                    <i className="fas fa-arrow-right key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_RIGHT}
                    prevButton={Controller.BUTTON_RIGHT}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={true}
                  />
                </div>

                <div className="key-binding">
                  <div className="key-action" title="A">
                    <i className="fas fa-a key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_A}
                    prevButton={Controller.BUTTON_A}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={true}
                  />
                </div>

                <div className="key-binding">
                  <div className="key-action" title="B">
                    <i className="fas fa-b key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_B}
                    prevButton={Controller.BUTTON_B}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={true}
                  />
                </div>

                <div className="key-binding">
                  <div className="key-action" title="Select">
                    <i className="fa-solid fa-bars key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_SELECT}
                    prevButton={Controller.BUTTON_SELECT}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={true}
                  />
                </div>
                <div className="key-binding">
                  <div
                    className="key-action"
                    title="Start
                  "
                  >
                    <i className="fas fa-play key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_START}
                    prevButton={Controller.BUTTON_START}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={true}
                  />
                </div>
              </div>
            </div>

            {/* Player 2 设置 */}
            <div className="player-section">
              <div className="player-header">
                <div className="player-icon p2-icon">
                  <i className="fas fa-user"></i>
                </div>
                <h3 className="player-title p2-title">Player 2</h3>
              </div>

              <div className="key-bindings">
                <div className="key-binding">
                  <div className="key-action" title="Up">
                    <i className="fas fa-arrow-up key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_UP}
                    prevButton={Controller.BUTTON_UP}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={false}
                  />
                </div>

                <div className="key-binding">
                  <div className="key-action" title="Down">
                    <i className="fas fa-arrow-down key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_DOWN}
                    prevButton={Controller.BUTTON_DOWN}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={false}
                  />
                </div>

                <div className="key-binding">
                  <div className="key-action" title="Left">
                    <i className="fas fa-arrow-left key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_LEFT}
                    prevButton={Controller.BUTTON_LEFT}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={false}
                  />
                </div>

                <div className="key-binding">
                  <div className="key-action" title="Right">
                    <i className="fas fa-arrow-right key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_RIGHT}
                    prevButton={Controller.BUTTON_RIGHT}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={false}
                  />
                </div>

                <div className="key-binding">
                  <div className="key-action" title="A">
                    <i className="fas fa-a key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_A}
                    prevButton={Controller.BUTTON_A}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={false}
                  />
                </div>

                <div className="key-binding">
                  <div className="key-action" title="B">
                    <i className="fas fa-b key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_B}
                    prevButton={Controller.BUTTON_B}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={false}
                  />
                </div>

                <div className="key-binding">
                  <div className="key-action" title="Select">
                    <i className="fa-solid fa-bars key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_SELECT}
                    prevButton={Controller.BUTTON_SELECT}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={false}
                  />
                </div>
                <div className="key-binding">
                  <div className="key-action" title="Start">
                    <i className="fas fa-play key-icon"></i>
                  </div>
                  <ControlMapperRow
                    currentPromptButton={currentPromptButton}
                    button={Controller.BUTTON_START}
                    prevButton={Controller.BUTTON_START}
                    keys={keys}
                    handleClick={listenForKey}
                    gamepadConfig={gamepadConfig}
                    isPlayer1={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={resetAllKeyToDefault}>
            <i className="fas fa-undo"></i> Reset to Defaults
          </button>
          {/* <button className="btn btn-success" id="save-settings">
            <i className="fas fa-save"></i> Save Settings
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default ControlsModal;
