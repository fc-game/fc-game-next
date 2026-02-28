import React, { Component } from "react";
import { NES, Controller } from "jsnes";
import Raven from "raven-js";
import FrameTimer from "@/src/components/FrameTimer";
import GamepadController from "@/src/components/GamepadController";
import KeyboardController from "@/src/components/KeyboardController";
import Screen from "@/src/components/Screen";
import Speakers from "@/src/components/Speakers";

interface EmulatorProps {
  romData: any;
  paused: boolean;
  isMobile: boolean | null;
  isLandscape: boolean;
  onError: (msg: string) => void;
}

/*
 * Runs the emulator.
 * The only UI is a canvas element. It assumes it is a singleton in various ways
 * (binds to window, keyboard, speakers, etc).
 */
export default class Emulator extends Component<EmulatorProps> {
  private joystickBase: React.RefObject<HTMLDivElement | null>;
  private joystickHandle: React.RefObject<HTMLDivElement | null>;
  private controlsContainer: React.RefObject<HTMLDivElement | null>;
  private nes: NES | null = null;
  private frameTimer: FrameTimer | null = null;
  private gamepadController: GamepadController | null = null;
  private keyboardController: KeyboardController | null = null;
  private speakers: Speakers | null = null;
  private screen: Screen | null = null;
  private baseRect: DOMRect | undefined;
  private baseCenterX: number;
  private baseCenterY: number;
  private baseRadius: number;
  private handleRadius: number;
  private isDragging: boolean;
  private touchId: number | null;
  private lastDirection: string;
  private gamepadPolling: any;

  constructor(props: EmulatorProps) {
    super(props);
    this.joystickBase = React.createRef();
    this.joystickHandle = React.createRef();
    this.controlsContainer = React.createRef();
    this.isDragging = false;
    this.touchId = null;
    this.lastDirection = "center";
    this.baseCenterX = 0;
    this.baseCenterY = 0;
    this.baseRadius = 0;
    this.handleRadius = 25;
  }

  componentDidMount() {
    // Initial layout
    this.fitInParent();

    this.speakers = new Speakers({
      onBufferUnderrun: (actualSize: number, desiredSize: number) => {
        if (this.props.paused) {
          return;
        }
        // Skip a video frame so audio remains consistent. This happens for
        // a variety of reasons:
        // - Frame rate is not quite 60fps, so sometimes buffer empties
        // - Page is not visible, so requestAnimationFrame doesn't get fired.
        //   In this case emulator still runs at full speed, but timing is
        //   done by audio instead of requestAnimationFrame.
        // - System can't run emulator at full speed. In this case it'll stop
        //    firing requestAnimationFrame.
        // console.log(
        //   "Buffer underrun, running another frame to try and catch up"
        // );

        this.frameTimer?.generateFrame();
        // desiredSize will be 2048, and the NES produces 1468 samples on each
        // frame so we might need a second frame to be run. Give up after that
        // though -- the system is not catching up
        if (this.speakers?.buffer.size() < desiredSize) {
          // console.log("Still buffer underrun, running a second frame");
          this.frameTimer?.generateFrame();
        }
      },
    });

    this.nes = new NES({
      onFrame: this.screen?.setBuffer,
      onAudioSample: this.speakers.writeSample,
      sampleRate: this.speakers.getSampleRate(),
    });

    // For debugging. (["nes"] instead of .nes to avoid VS Code type errors.)
    window.nes = this.nes;

    this.frameTimer = new FrameTimer({
      onGenerateFrame: Raven.wrap(this.nes.frame),
      onWriteFrame: this.screen
        ? Raven.wrap(this.screen.writeBuffer)
        : () => {},
    });

    // Set up gamepad and keyboard
    this.gamepadController = new GamepadController({
      onButtonDown: this.nes.buttonDown,
      onButtonUp: this.nes.buttonUp,
    });

    this.gamepadController.loadGamepadConfig();
    this.gamepadPolling = this.gamepadController.startPolling();

    this.keyboardController = new KeyboardController({
      onButtonDown: this.gamepadController.disableIfGamepadEnabled(
        this.nes.buttonDown,
      ),
      onButtonUp: this.gamepadController.disableIfGamepadEnabled(
        this.nes.buttonUp,
      ),
    });

    // Load keys from localStorage (if they exist)
    this.keyboardController.loadKeys();
    document.addEventListener("keydown", this.keyboardController.handleKeyDown);
    document.addEventListener("keyup", this.keyboardController.handleKeyUp);
    document.addEventListener(
      "keypress",
      this.keyboardController.handleKeyPress,
    );

    if (this.props.isMobile && this.props.isLandscape) {
      this.controlsContainer!.current!.style.bottom = "150px";
    }
    // Set up joystick
    if (this.props.isMobile) {
      this.baseRect = this.joystickBase?.current?.getBoundingClientRect();
      if (this.baseRect) {
        this.baseCenterX = this.baseRect.left + this.baseRect.width / 2;
        this.baseCenterY = this.baseRect.top + this.baseRect.height / 2;
        this.baseRadius = this.baseRect.width / 1.4;
        this.handleRadius = 25;
      }
      document.addEventListener(
        "touchmove",
        (e) => {
          if (!this.isDragging) return;

          for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === this.touchId) {
              e.preventDefault();
              this.moveJoystick(touch.clientX, touch.clientY);
              break;
            }
          }
        },
        { passive: false },
      );

      document.addEventListener("touchend", (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.touchId) {
            this.resetJoystick();
            this.isDragging = false;
            this.touchId = null;
            break;
          }
        }
      });

      document.addEventListener("touchcancel", (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.touchId) {
            this.resetJoystick();
            this.isDragging = false;
            this.touchId = null;
            break;
          }
        }
      });
    }

    //load ROM
    try {
      this.nes.loadROM(this.props.romData);
      this.start();
    } catch (e: any) {
      this.props.onError?.(e.message);
    }
  }

  mousedownHandler = (e: any) => {
    e.preventDefault();
    if (this.isDragging) return;
    this.isDragging = true;
    this.moveJoystick(e.clientX, e.clientY);

    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
  };

  onMouseUp = () => {
    this.resetJoystick();
    this.isDragging = false;
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);
  };

  onMouseMove = (e: any) => {
    if (!this.isDragging) return;
    this.moveJoystick(e.clientX, e.clientY);
  };

  componentWillUnmount() {
    this.stop();
    // Unbind keyboard
    document.addEventListener(
      "keydown",
      this.keyboardController!.handleKeyDown,
    );
    document.addEventListener("keyup", this.keyboardController!.handleKeyUp);
    document.addEventListener(
      "keypress",
      this.keyboardController!.handleKeyPress,
    );

    // Stop gamepad
    this.gamepadPolling.stop();
    window.nes = undefined;
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.paused !== prevProps.paused) {
      if (this.props.paused) {
        this.stop();
      } else {
        this.start();
      }
    }

    if (
      this.props.isMobile &&
      this.props.isLandscape !== prevProps.isLandscape
    ) {
      if (this.controlsContainer.current) {
        if (this.props.isLandscape) {
          this.controlsContainer.current.style.bottom = "150px";
        } else {
          this.controlsContainer.current.style.bottom = "auto";
        }
      }
    }
  }

  resetJoystick = () => {
    if (this.joystickHandle.current) {
      this.joystickHandle.current.style.transform = "translate(-50%, -50%)";
      if (this.lastDirection !== "center") {
        this.lastDirection = "center";
        this.buttonUpAll();
      }
    }
  };

  moveJoystick = (clientX: any, clientY: any) => {
    const deltaX = clientX - this.baseCenterX;
    const deltaY = clientY - this.baseCenterY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const limitedDistance = Math.min(
      distance,
      this.baseRadius - this.handleRadius,
    );
    const angle = Math.atan2(deltaY, deltaX);
    const limitedX = Math.cos(angle) * limitedDistance;
    const limitedY = Math.sin(angle) * limitedDistance;
    if (this.joystickHandle.current) {
      this.joystickHandle.current.style.transform = `translate(calc(-50% + ${limitedX}px), calc(-50% + ${limitedY}px))`;
    }
    const direction = this.getDirection(limitedX, limitedY);
    if (direction !== this.lastDirection) {
      this.lastDirection = direction;
      if (direction !== "center") {
        switch (direction) {
          case "up":
            this.buttonUpAll();
            this.nes?.buttonDown(1, Controller.BUTTON_UP);
            break;
          case "down":
            this.buttonUpAll();
            this.nes?.buttonDown(1, Controller.BUTTON_DOWN);
            break;
          case "left":
            this.buttonUpAll();
            this.nes?.buttonDown(1, Controller.BUTTON_LEFT);
            break;
          case "right":
            this.buttonUpAll();
            this.nes?.buttonDown(1, Controller.BUTTON_RIGHT);
            break;
          case "left-up":
            this.buttonUpAll();
            this.nes?.buttonDown(1, Controller.BUTTON_LEFT);
            this.nes?.buttonDown(1, Controller.BUTTON_UP);
            break;
          case "left-down":
            this.buttonUpAll();
            this.nes?.buttonDown(1, Controller.BUTTON_LEFT);
            this.nes?.buttonDown(1, Controller.BUTTON_DOWN);
            break;
          case "right-up":
            this.buttonUpAll();
            this.nes?.buttonDown(1, Controller.BUTTON_RIGHT);
            this.nes?.buttonDown(1, Controller.BUTTON_UP);
            break;
          case "right-down":
            this.buttonUpAll();
            this.nes?.buttonDown(1, Controller.BUTTON_RIGHT);
            this.nes?.buttonDown(1, Controller.BUTTON_DOWN);
            break;
          default:
            this.buttonUpAll();
            break;
        }
      }
    }

    return direction;
  };

  buttonUpAll = () => {
    this.nes?.buttonUp(1, Controller.BUTTON_UP);
    this.nes?.buttonUp(1, Controller.BUTTON_DOWN);
    this.nes?.buttonUp(1, Controller.BUTTON_LEFT);
    this.nes?.buttonUp(1, Controller.BUTTON_RIGHT);
  };

  getDirection = (deltaX: any, deltaY: any) => {
    const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance < this.baseRadius * 0.3) {
      return "center";
    }

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
  };

  touchstartHandler = (e: any) => {
    if (this.isDragging) return;
    this.isDragging = true;
    this.touchId = e.changedTouches[0].identifier;
    const touch = e.changedTouches[0];
    this.moveJoystick(touch.clientX, touch.clientY);
  };

  touchcancelHandler = (e: any) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.touchId) {
        this.resetJoystick();
        this.isDragging = false;
        this.touchId = null;
        break;
      }
    }
  };

  start = () => {
    this.frameTimer?.start();
    this.speakers?.start();
    // this.fpsInterval = setInterval(() => {
    //   // console.log(`FPS: ${this.nes.getFPS()}`);
    // }, 1000);
  };

  stop = () => {
    this.frameTimer?.stop();
    this.speakers?.stop();
    // clearInterval(this.fpsInterval);
  };

  /*
   * Fill parent element with screen. Typically called if parent element changes size.
   */
  fitInParent() {
    this.screen?.fitInParent();
  }

  controlBtnDownHandle = (buttonId: any) => {
    return () => {
      this.nes?.buttonDown(1, buttonId);
    };
  };

  controlBtnUpHandle = (buttonId: any) => {
    return () => {
      this.nes?.buttonUp(1, buttonId);
    };
  };

  render() {
    return (
      <>
        <Screen
          ref={(screen) => {
            this.screen = screen;
          }}
          onGenerateFrame={() => {
            this.nes?.frame();
          }}
          onMouseDown={(x, y) => {
            this.nes?.zapperMove(x, y);
            this.nes?.zapperFireDown();
          }}
          onMouseUp={() => {
            this.nes?.zapperFireUp();
          }}
          isMobile={this.props.isMobile ? true : false}
          isLandscape={this.props.isLandscape}
        />
        {this.props.isMobile ? (
          <div className="controls-container" ref={this.controlsContainer}>
            <div className="joystick-section">
              <div className="joystick-container">
                <div
                  className="joystick-base"
                  ref={this.joystickBase}
                  onTouchStart={this.touchstartHandler}
                  onTouchCancel={this.touchcancelHandler}
                  // onMouseDown={this.mousedownHandler}
                >
                  <div
                    className="joystick-handle"
                    ref={this.joystickHandle}
                  ></div>
                </div>
              </div>
            </div>
            <div className="function-section">
              <div className="function-buttons">
                <div
                  className="function-btn"
                  onTouchStart={this.controlBtnDownHandle(
                    Controller.BUTTON_SELECT,
                  )}
                  onTouchEnd={this.controlBtnUpHandle(Controller.BUTTON_SELECT)}
                  // onMouseDown={this.controlBtnDownHandle(
                  //   Controller.BUTTON_SELECT
                  // )}
                  // onMouseUp={this.controlBtnUpHandle(Controller.BUTTON_SELECT)}
                >
                  select
                </div>
                <div
                  className="function-btn"
                  onTouchStart={this.controlBtnDownHandle(
                    Controller.BUTTON_START,
                  )}
                  onTouchEnd={this.controlBtnUpHandle(Controller.BUTTON_START)}
                  // onMouseDown={this.controlBtnDownHandle(
                  //   Controller.BUTTON_START
                  // )}
                  // onMouseUp={this.controlBtnUpHandle(Controller.BUTTON_START)}
                >
                  start
                </div>
              </div>
            </div>
            <div className="buttons-section">
              <div className="action-buttons">
                <div
                  className="action-btn b-btn"
                  onTouchStart={this.controlBtnDownHandle(Controller.BUTTON_B)}
                  onTouchEnd={this.controlBtnUpHandle(Controller.BUTTON_B)}
                  // onMouseDown={this.controlBtnDownHandle(Controller.BUTTON_B)}
                  // onMouseUp={this.controlBtnUpHandle(Controller.BUTTON_B)}
                >
                  B
                </div>

                <div
                  className="action-btn"
                  onTouchStart={this.controlBtnDownHandle(Controller.BUTTON_A)}
                  onTouchEnd={this.controlBtnUpHandle(Controller.BUTTON_A)}
                  // onMouseDown={this.controlBtnDownHandle(Controller.BUTTON_A)}
                  // onMouseUp={this.controlBtnUpHandle(Controller.BUTTON_A)}
                >
                  A
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }
}
