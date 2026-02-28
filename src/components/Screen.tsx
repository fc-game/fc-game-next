import React, { Component, MouseEventHandler } from "react";

const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 240;

interface ScreenProps {
  onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseDown?: (x: number, y: number) => void;
  onGenerateFrame?: () => void;
  isMobile: boolean;
  isLandscape: boolean;
}

export default class Screen extends Component<ScreenProps> {
  private canvas: HTMLCanvasElement | null = null;
  private canvasContext: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private buf: ArrayBuffer | null = null;
  private buf8: Uint8ClampedArray | null = null;
  private buf32: Uint32Array | null = null;

  componentDidMount() {
    this.initCanvas();
  }

  componentDidUpdate() {
    this.initCanvas();
  }

  initCanvas() {
    if (!this.canvas) return;
    this.canvasContext = this.canvas.getContext("2d");
    if (!this.canvasContext) return;
    this.imageData = this.canvasContext.getImageData(
      0,
      0,
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
    );

    this.canvasContext.fillStyle = "black";
    // set alpha to opaque
    this.canvasContext.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // buffer to write on next animation frame
    this.buf = new ArrayBuffer(this.imageData.data.length);
    // Get the canvas buffer in 8bit and 32bit
    this.buf8 = new Uint8ClampedArray(this.buf);
    this.buf32 = new Uint32Array(this.buf);

    // Set alpha
    for (var i = 0; i < this.buf32.length; ++i) {
      this.buf32[i] = 0xff000000;
    }
  }

  setBuffer = (buffer: any) => {
    if (!this.buf32) return;

    var i = 0;
    for (var y = 0; y < SCREEN_HEIGHT; ++y) {
      for (var x = 0; x < SCREEN_WIDTH; ++x) {
        i = y * 256 + x;
        // Convert pixel from NES BGR to canvas ABGR
        this.buf32[i] = 0xff000000 | buffer[i]; // Full alpha
      }
    }
  };

  writeBuffer = () => {
    if (!this.imageData || !this.buf8) return;
    this.imageData.data.set(this.buf8);
    if (!this.canvasContext) return;
    this.canvasContext.putImageData(this.imageData, 0, 0);
  };

  fitInParent = () => {
    if (!this.canvas || !this.canvas.parentNode) return;

    let parent = this.canvas.parentNode as HTMLElement;
    let parentWidth = parent.clientWidth;
    let parentHeight = parent.clientHeight;
    let parentRatio = parentWidth / parentHeight;
    let desiredRatio = 5 / 3;

    if (this.props.isMobile && this.props.isLandscape) {
      this.canvas.style.width = `${window.innerWidth}px`;
      this.canvas.style.height = `${window.innerHeight}px`;
    } else {
      if (desiredRatio < parentRatio) {
        this.canvas.style.width = `${Math.round(
          parentHeight * desiredRatio,
        )}px`;
        this.canvas.style.height = `${parentHeight}px`;
      } else {
        this.canvas.style.width = `${parentWidth}px`;
        this.canvas.style.height = `${Math.round(
          parentWidth / desiredRatio,
        )}px`;
      }
    }
  };

  screenshot() {
    if (!this.canvas) return null;

    var img = new Image();
    img.src = this.canvas.toDataURL("image/png");
    return img;
  }

  handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!this.props.onMouseDown) return;
    // Make coordinates unscaled
    let scale = SCREEN_WIDTH / parseFloat(this.canvas!.style.width);
    let rect = this.canvas!.getBoundingClientRect();
    let x = Math.round((e.clientX - rect.left) * scale);
    let y = Math.round((e.clientY - rect.top) * scale);
    this.props.onMouseDown(x, y);
  };

  render() {
    return (
      <canvas
        className="screen"
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.props.onMouseUp}
        style={{ width: "100vw", height: "100vh" }}
        ref={(canvas: HTMLCanvasElement) => {
          this.canvas = canvas;
        }}
      />
    );
  }
}
