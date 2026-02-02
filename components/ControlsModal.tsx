"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Controller } from "jsnes";
import ControlMapperRow from "./ControlMapperRow";
import { KEYS } from "./KeyboardController";
import "@/styles/ControlsModal.css";

/* ---------- types ---------- */

interface GamepadButton {
  type: "button" | "axis";
  code: number;
  buttonId?: number;
  value?: number;
  gamepadId?: string;
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
  [key: string]: [number, number, string];
}

interface ControlsModalProps {
  gamepadConfig?: GamepadFullConfig | null;
  keys: Keys;
  promptButton?: (cb: ((info: GamepadButton) => void) | null) => void;
  setKeys: (keys: Keys) => void;
  setGamepadConfig?: (config: GamepadFullConfig) => void;
  isOpen: boolean;
  toggle: () => void;
}

/* ---------- component ---------- */

const ControlsModal: React.FC<ControlsModalProps> = ({
  gamepadConfig: initialGamepadConfig,
  keys: initialKeys,
  promptButton,
  setKeys,
  setGamepadConfig,
  isOpen,
  toggle,
}) => {
  const [gamepadConfig, setGamepadConfigState] = useState<GamepadFullConfig>({
    playerGamepadId: initialGamepadConfig?.playerGamepadId ?? [null, null],
    configs: initialGamepadConfig?.configs ?? {},
  });

  const [keys, setKeysState] = useState<any>(initialKeys ?? {});
  const [currentButton, setCurrentButton] = useState<[number, number] | null>(
    null,
  );
  const [currentPromptButton, setCurrentPromptButton] = useState(-1);
  const [modified, setModified] = useState(false);

  const gamepadConfigRef = useRef(gamepadConfig);
  useEffect(() => {
    gamepadConfigRef.current = gamepadConfig;
  }, [gamepadConfig]);

  /* ---------- keyboard handler ---------- */

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!currentButton) return;

      const [player, button] = currentButton;

      // 移除旧绑定
      const newKeys: Keys = {};
      for (const k in keys) {
        const [p, b] = keys[k];
        if (p !== player || b !== button) {
          newKeys[k] = keys[k];
        }
      }

      // 使用 event.code（稳定 + TS 安全）
      newKeys[event.code] = [
        player,
        button,
        event.key.length === 1 ? event.key.toUpperCase() : event.key,
      ];

      const newPlayerGamepadId: [string | null, string | null] = [
        ...gamepadConfigRef.current.playerGamepadId,
      ];
      newPlayerGamepadId[player - 1] = null;

      setKeysState(newKeys);
      setGamepadConfigState({
        configs: gamepadConfigRef.current.configs,
        playerGamepadId: newPlayerGamepadId,
      });

      setCurrentButton(null);
      setCurrentPromptButton(-1);
      setModified(true);
      if (promptButton) promptButton(null);
    },
    [currentButton, keys, promptButton],
  );

  /* ---------- gamepad handler ---------- */

  const handleGamepadButtonDown = useCallback(
    (info: GamepadButton) => {
      if (!currentButton || !info.gamepadId) return;

      const [player, buttonId] = currentButton;
      const gamepadId = info.gamepadId;

      const newPlayerGamepadId: [string | null, string | null] = [
        ...gamepadConfigRef.current.playerGamepadId,
      ];
      newPlayerGamepadId[player - 1] = gamepadId;

      const oldButtons =
        gamepadConfigRef.current.configs[gamepadId]?.buttons ?? [];

      const filtered = oldButtons.filter((b) => b.buttonId !== buttonId);

      const newConfig: GamepadConfigs = {
        ...gamepadConfigRef.current.configs,
        [gamepadId]: {
          buttons: [
            ...filtered,
            {
              type: info.type,
              code: info.code,
              value: info.value,
              buttonId,
            },
          ],
        },
      };

      setGamepadConfigState({
        configs: newConfig,
        playerGamepadId: newPlayerGamepadId,
      });

      setCurrentButton(null);
      setCurrentPromptButton(-1);
      setModified(true);
      if (promptButton) promptButton(null);
    },
    [currentButton, promptButton],
  );

  /* ---------- listen / cleanup ---------- */
  const resetAllKeyToDefault = useCallback(() => {
    setKeysState(KEYS);
    setModified(true);
  }, [setKeysState, setModified]);

  const listenForKey = useCallback(
    (btn: [number, number]) => {
      setCurrentButton(btn);
      setCurrentPromptButton(btn[1]);
      if (promptButton) promptButton(handleGamepadButtonDown);
    },
    [promptButton, handleGamepadButtonDown],
  );

  useEffect(() => {
    if (!currentButton) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentButton, handleKeyDown]);

  useEffect(() => {
    return () => {
      if (modified) {
        setKeys(keys);
        if (setGamepadConfig) setGamepadConfig(gamepadConfig);
      }
      if (promptButton) promptButton(null);
    };
  }, [modified, keys, gamepadConfig, setKeys, setGamepadConfig, promptButton]);

  if (!isOpen) return null;

  /* ---------- UI（未改） ---------- */

  return (
    <div className="modal-overlay active">
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
                {[
                  {
                    icon: "arrow-up",
                    button: Controller.BUTTON_UP,
                    title: "Up",
                  },
                  {
                    icon: "arrow-down",
                    button: Controller.BUTTON_DOWN,
                    title: "Down",
                  },
                  {
                    icon: "arrow-left",
                    button: Controller.BUTTON_LEFT,
                    title: "Left",
                  },
                  {
                    icon: "arrow-right",
                    button: Controller.BUTTON_RIGHT,
                    title: "Right",
                  },
                  { icon: "a", button: Controller.BUTTON_A, title: "A" },
                  { icon: "b", button: Controller.BUTTON_B, title: "B" },
                  {
                    icon: "bars",
                    button: Controller.BUTTON_SELECT,
                    title: "Select",
                  },
                  {
                    icon: "play",
                    button: Controller.BUTTON_START,
                    title: "Start",
                  },
                ].map(({ icon, button: btn, title }) => (
                  <div className="key-binding" key={title}>
                    <div className="key-action" title={title}>
                      <i className={`fas fa-${icon} key-icon`}></i>
                    </div>
                    <ControlMapperRow
                      currentPromptButton={currentPromptButton}
                      button={btn}
                      prevButton={btn}
                      keys={keys}
                      handleClick={listenForKey}
                      gamepadConfig={gamepadConfig}
                      isPlayer1={true}
                    />
                  </div>
                ))}
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
                {[
                  {
                    icon: "arrow-up",
                    button: Controller.BUTTON_UP,
                    title: "Up",
                  },
                  {
                    icon: "arrow-down",
                    button: Controller.BUTTON_DOWN,
                    title: "Down",
                  },
                  {
                    icon: "arrow-left",
                    button: Controller.BUTTON_LEFT,
                    title: "Left",
                  },
                  {
                    icon: "arrow-right",
                    button: Controller.BUTTON_RIGHT,
                    title: "Right",
                  },
                  { icon: "a", button: Controller.BUTTON_A, title: "A" },
                  { icon: "b", button: Controller.BUTTON_B, title: "B" },
                  {
                    icon: "bars",
                    button: Controller.BUTTON_SELECT,
                    title: "Select",
                  },
                  {
                    icon: "play",
                    button: Controller.BUTTON_START,
                    title: "Start",
                  },
                ].map(({ icon, button: btn, title }) => (
                  <div className="key-binding" key={`p2-${title}`}>
                    <div className="key-action" title={title}>
                      <i className={`fas fa-${icon} key-icon`}></i>
                    </div>
                    <ControlMapperRow
                      currentPromptButton={currentPromptButton}
                      button={btn}
                      prevButton={btn}
                      keys={keys}
                      handleClick={listenForKey}
                      gamepadConfig={gamepadConfig}
                      isPlayer1={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={resetAllKeyToDefault}>
            <i className="fas fa-undo"></i> Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlsModal;
