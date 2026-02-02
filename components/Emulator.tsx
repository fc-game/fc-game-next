"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { NES, Controller } from "jsnes";
import Screen from "@/components/Screen";
import Speakers from "@/components/Speakers";
import FrameTimer from "@/components/FrameTimer";
import GamepadController from "@/components/GamepadController";
import KeyboardController from "@/components/KeyboardController";
import "@/styles/Emulator.css";

interface EmulatorProps {
  ref?: React.Ref<HTMLElement>;
  romData: ArrayBuffer | string;
  paused?: boolean;
  isMobile?: boolean;
  isLandscape?: boolean;
  onError?: (message: string) => void;
  onLoad?: () => void;
}

interface JoystickDirection {
  x: number;
  y: number;
  angle: number;
  distance: number;
}

const Emulator: React.FC<EmulatorProps> = ({
  romData,
  paused = false,
  isMobile = false,
  isLandscape = false,
  onError,
  onLoad,
}) => {
  // Refs
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickHandleRef = useRef<HTMLDivElement>(null);
  const controlsContainerRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<any>(null);

  // State
  const [isDragging, setIsDragging] = useState(false);
  const [touchId, setTouchId] = useState<number | null>(null);
  const [lastDirection, setLastDirection] = useState<string>("center");

  // Emulator instances
  const nesRef = useRef<NES | null>(null);
  const speakersRef = useRef<any>(null);
  const frameTimerRef = useRef<any>(null);
  const gamepadControllerRef = useRef<any>(null);
  const gamepadPollingRef = useRef<any>(null);
  const keyboardControllerRef = useRef<any>(null);

  // Joystick geometry
  const joystickGeometryRef = useRef<{
    baseRect?: DOMRect;
    baseCenterX?: number;
    baseCenterY?: number;
    baseRadius?: number;
    handleRadius: number;
  }>({
    handleRadius: 25,
  });

  // 初始化模拟器
  const initEmulator = useCallback(async () => {
    // 初始化扬声器
    speakersRef.current = new Speakers();
    // 初始化 NES
    nesRef.current = new NES({
      onFrame: (buffer: any) => screenRef.current?.setBuffer(buffer),
      onAudioSample: (l: number, r: number) => {
        speakersRef.current.current?.pushSample(l, r);
      },
      sampleRate: speakersRef.current?.getSampleRate() || 44100,
    });

    // 初始化帧计时器
    frameTimerRef.current = new FrameTimer({
      onGenerateFrame: () => nesRef.current?.frame(),
      onWriteFrame: () => screenRef.current?.writeBuffer(),
    });

    // 初始化游戏手柄控制器
    gamepadControllerRef.current = new GamepadController({
      onButtonDown: (player: number, button: number) =>
        nesRef.current?.buttonDown(player, button),
      onButtonUp: (player: number, button: number) =>
        nesRef.current?.buttonUp(player, button),
    });

    gamepadControllerRef.current.loadGamepadConfig();
    gamepadPollingRef.current = gamepadControllerRef.current.startPolling();

    // 初始化键盘控制器
    keyboardControllerRef.current = new KeyboardController({
      onButtonDown: gamepadControllerRef.current?.disableIfGamepadEnabled(
        (player: number, button: number) =>
          nesRef.current?.buttonDown(player, button),
      ),
      onButtonUp: gamepadControllerRef.current?.disableIfGamepadEnabled(
        (player: number, button: number) =>
          nesRef.current?.buttonUp(player, button),
      ),
    });

    keyboardControllerRef.current.loadKeys();

    // 添加键盘事件监听
    document.addEventListener(
      "keydown",
      keyboardControllerRef.current.handleKeyDown,
    );
    document.addEventListener(
      "keyup",
      keyboardControllerRef.current.handleKeyUp,
    );
    document.addEventListener(
      "keypress",
      keyboardControllerRef.current.handleKeyPress,
    );

    // 移动端布局调整
    if (isMobile && isLandscape && controlsContainerRef.current) {
      controlsContainerRef.current.style.bottom = "150px";
    }

    // 加载 ROM
    try {
      nesRef.current.loadROM(romData);
      startEmulator();
      onLoad?.();
    } catch (error: any) {
      onError?.(error.message || "Failed to load ROM");
    }
  }, [romData, paused, isMobile, isLandscape, onError, onLoad]);

  // 启动模拟器
  const startEmulator = () => {
    frameTimerRef.current?.start();
    speakersRef.current?.start();
  };

  // 停止模拟器
  const stopEmulator = () => {
    frameTimerRef.current?.stop();
    speakersRef.current?.stop();
  };

  // 按钮按下处理
  const controlBtnDownHandle = useCallback((buttonId: number) => {
    return () => {
      nesRef.current?.buttonDown(1, buttonId);
    };
  }, []);

  // 按钮释放处理
  const controlBtnUpHandle = useCallback((buttonId: number) => {
    return () => {
      nesRef.current?.buttonUp(1, buttonId);
    };
  }, []);

  // 重置所有方向按钮
  const buttonUpAll = useCallback(() => {
    if (!nesRef.current) return;

    nesRef.current.buttonUp(1, Controller.BUTTON_UP);
    nesRef.current.buttonUp(1, Controller.BUTTON_DOWN);
    nesRef.current.buttonUp(1, Controller.BUTTON_LEFT);
    nesRef.current.buttonUp(1, Controller.BUTTON_RIGHT);
  }, []);

  // 获取方向
  const getDirection = useCallback((deltaX: number, deltaY: number): string => {
    const geometry = joystickGeometryRef.current;
    if (!geometry.baseRadius) return "center";

    const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 如果距离小于基座半径的30%，视为中心
    if (distance < geometry.baseRadius * 0.3) {
      return "center";
    }

    // 计算8个方向
    if (angle >= -22.5 && angle < 22.5) {
      return "right";
    } else if (angle >= 22.5 && angle < 67.5) {
      return "right-down";
    } else if (angle >= 67.5 && angle < 112.5) {
      return "down";
    } else if (angle >= 112.5 && angle < 157.5) {
      return "left-down";
    } else if (angle >= 157.5 || angle < -157.5) {
      return "left";
    } else if (angle >= -157.5 && angle < -112.5) {
      return "left-up";
    } else if (angle >= -112.5 && angle < -67.5) {
      return "up";
    } else if (angle >= -67.5 && angle < -22.5) {
      return "right-up";
    }

    return "unknown";
  }, []);

  // 移动摇杆
  const moveJoystick = useCallback(
    (clientX: number, clientY: number) => {
      if (
        !joystickHandleRef.current ||
        !joystickGeometryRef.current.baseCenterX ||
        !joystickGeometryRef.current.baseCenterY
      ) {
        return;
      }

      const { baseCenterX, baseCenterY, baseRadius, handleRadius } =
        joystickGeometryRef.current;
      const deltaX = clientX - baseCenterX;
      const deltaY = clientY - baseCenterY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const limitedDistance = Math.min(
        distance,
        (baseRadius || 100) - handleRadius,
      );
      const angle = Math.atan2(deltaY, deltaX);
      const limitedX = Math.cos(angle) * limitedDistance;
      const limitedY = Math.sin(angle) * limitedDistance;

      joystickHandleRef.current.style.transform = `translate(calc(-50% + ${limitedX}px), calc(-50% + ${limitedY}px))`;

      const direction = getDirection(limitedX, limitedY);
      if (direction !== lastDirection) {
        setLastDirection(direction);

        // 先释放所有方向按钮
        buttonUpAll();

        // 按下新的方向组合
        if (direction !== "center") {
          const nes = nesRef.current;
          if (!nes) return;

          switch (direction) {
            case "up":
              nes.buttonDown(1, Controller.BUTTON_UP);
              break;
            case "down":
              nes.buttonDown(1, Controller.BUTTON_DOWN);
              break;
            case "left":
              nes.buttonDown(1, Controller.BUTTON_LEFT);
              break;
            case "right":
              nes.buttonDown(1, Controller.BUTTON_RIGHT);
              break;
            case "left-up":
              nes.buttonDown(1, Controller.BUTTON_LEFT);
              nes.buttonDown(1, Controller.BUTTON_UP);
              break;
            case "left-down":
              nes.buttonDown(1, Controller.BUTTON_LEFT);
              nes.buttonDown(1, Controller.BUTTON_DOWN);
              break;
            case "right-up":
              nes.buttonDown(1, Controller.BUTTON_RIGHT);
              nes.buttonDown(1, Controller.BUTTON_UP);
              break;
            case "right-down":
              nes.buttonDown(1, Controller.BUTTON_RIGHT);
              nes.buttonDown(1, Controller.BUTTON_DOWN);
              break;
            default:
              break;
          }
        }
      }

      return direction;
    },
    [lastDirection, getDirection, buttonUpAll],
  );

  // 重置摇杆
  const resetJoystick = useCallback(() => {
    if (joystickHandleRef.current) {
      joystickHandleRef.current.style.transform = "translate(-50%, -50%)";
    }
    if (lastDirection !== "center") {
      setLastDirection("center");
      buttonUpAll();
    }
  }, [lastDirection, buttonUpAll]);

  // 鼠标按下处理
  const mousedownHandler = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (isDragging) return;

      setIsDragging(true);
      moveJoystick(e.clientX, e.clientY);
    },
    [isDragging, moveJoystick],
  );

  // 触摸开始处理
  const touchstartHandler = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging) return;

      setIsDragging(true);
      const touch = e.changedTouches[0];
      setTouchId(touch.identifier);
      moveJoystick(touch.clientX, touch.clientY);
    },
    [isDragging, moveJoystick],
  );

  // 触摸移动处理
  const touchmoveHandler = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || touchId === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          e.preventDefault();
          moveJoystick(touch.clientX, touch.clientY);
          break;
        }
      }
    },
    [isDragging, touchId, moveJoystick],
  );

  // 触摸结束处理
  const touchendHandler = useCallback(
    (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          resetJoystick();
          setIsDragging(false);
          setTouchId(null);
          break;
        }
      }
    },
    [touchId, resetJoystick],
  );

  // 触摸取消处理
  const touchcancelHandler = useCallback(
    (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          resetJoystick();
          setIsDragging(false);
          setTouchId(null);
          break;
        }
      }
    },
    [touchId, resetJoystick],
  );

  // 鼠标移动处理
  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      moveJoystick(e.clientX, e.clientY);
    },
    [isDragging, moveJoystick],
  );

  // 鼠标释放处理
  const onMouseUp = useCallback(() => {
    resetJoystick();
    setIsDragging(false);
  }, [resetJoystick]);

  // 组件挂载
  useEffect(() => {
    // 初始化模拟器
    initEmulator();

    // 初始化摇杆几何信息
    if (joystickBaseRef.current) {
      const baseRect = joystickBaseRef.current.getBoundingClientRect();
      joystickGeometryRef.current.baseRect = baseRect;
      joystickGeometryRef.current.baseCenterX =
        baseRect.left + baseRect.width / 2;
      joystickGeometryRef.current.baseCenterY =
        baseRect.top + baseRect.height / 2;
      joystickGeometryRef.current.baseRadius = baseRect.width / 1.4;
    }

    // 添加触摸事件监听
    if (isMobile) {
      document.addEventListener("touchmove", touchmoveHandler, {
        passive: false,
      });
      document.addEventListener("touchend", touchendHandler);
      document.addEventListener("touchcancel", touchcancelHandler);
    }

    // 添加鼠标事件监听
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      // 清理模拟器
      stopEmulator();

      // 移除键盘事件监听
      if (keyboardControllerRef.current) {
        document.removeEventListener(
          "keydown",
          keyboardControllerRef.current.handleKeyDown,
        );
        document.removeEventListener(
          "keyup",
          keyboardControllerRef.current.handleKeyUp,
        );
        document.removeEventListener(
          "keypress",
          keyboardControllerRef.current.handleKeyPress,
        );
      }

      // 停止游戏手柄轮询
      if (gamepadPollingRef.current?.stop) {
        gamepadPollingRef.current.stop();
      }

      // 移除触摸事件监听
      if (isMobile) {
        document.removeEventListener("touchmove", touchmoveHandler);
        document.removeEventListener("touchend", touchendHandler);
        document.removeEventListener("touchcancel", touchcancelHandler);
      }

      // 移除鼠标事件监听
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      // 清理调试引用
      (window as any).nes = undefined;
    };
  }, [
    initEmulator,
    isMobile,
    touchmoveHandler,
    touchendHandler,
    touchcancelHandler,
    onMouseMove,
    onMouseUp,
  ]);

  // 暂停/恢复处理
  useEffect(() => {
    if (paused) {
      stopEmulator();
    } else {
      startEmulator();
    }
  }, [paused]);

  // 横竖屏切换处理
  useEffect(() => {
    if (isMobile && controlsContainerRef.current) {
      if (isLandscape) {
        controlsContainerRef.current.style.bottom = "150px";
      } else {
        controlsContainerRef.current.style.bottom = "auto";
      }
    }
  }, [isMobile, isLandscape]);

  // 适应父容器大小
  useEffect(() => {
    screenRef.current?.fitInParent();
  }, []);

  return (
    <>
      <Screen
        ref={screenRef}
        onGenerateFrame={() => nesRef.current?.frame()}
        onMouseDown={(x: number, y: number) => {
          nesRef.current?.zapperMove(x, y);
          nesRef.current?.zapperFireDown();
        }}
        onMouseUp={() => {
          nesRef.current?.zapperFireUp();
        }}
        isMobile={isMobile}
        isLandscape={isLandscape}
      />
      {isMobile && (
        <div className="controls-container" ref={controlsContainerRef}>
          <div className="joystick-section">
            <div className="joystick-container">
              <div
                className="joystick-base"
                ref={joystickBaseRef}
                onTouchStart={touchstartHandler}
                onMouseDown={mousedownHandler}
              >
                <div className="joystick-handle" ref={joystickHandleRef}></div>
              </div>
            </div>
          </div>

          <div className="function-section">
            <div className="function-buttons">
              <div
                className="function-btn"
                onTouchStart={controlBtnDownHandle(Controller.BUTTON_SELECT)}
                onTouchEnd={controlBtnUpHandle(Controller.BUTTON_SELECT)}
                onMouseDown={controlBtnDownHandle(Controller.BUTTON_SELECT)}
                onMouseUp={controlBtnUpHandle(Controller.BUTTON_SELECT)}
              >
                select
              </div>
              <div
                className="function-btn"
                onTouchStart={controlBtnDownHandle(Controller.BUTTON_START)}
                onTouchEnd={controlBtnUpHandle(Controller.BUTTON_START)}
                onMouseDown={controlBtnDownHandle(Controller.BUTTON_START)}
                onMouseUp={controlBtnUpHandle(Controller.BUTTON_START)}
              >
                start
              </div>
            </div>
          </div>

          <div className="buttons-section">
            <div className="action-buttons">
              <div
                className="action-btn b-btn"
                onTouchStart={controlBtnDownHandle(Controller.BUTTON_B)}
                onTouchEnd={controlBtnUpHandle(Controller.BUTTON_B)}
                onMouseDown={controlBtnDownHandle(Controller.BUTTON_B)}
                onMouseUp={controlBtnUpHandle(Controller.BUTTON_B)}
              >
                B
              </div>
              <div
                className="action-btn"
                onTouchStart={controlBtnDownHandle(Controller.BUTTON_A)}
                onTouchEnd={controlBtnUpHandle(Controller.BUTTON_A)}
                onMouseDown={controlBtnDownHandle(Controller.BUTTON_A)}
                onMouseUp={controlBtnUpHandle(Controller.BUTTON_A)}
              >
                A
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Emulator;
