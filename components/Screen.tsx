"use client";

import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import "@/styles/Screen.css";

const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 240;

export interface ScreenHandle {
  setBuffer: (buffer: number[]) => void;
  writeBuffer: () => void;
  fitInParent: () => void;
}

interface ScreenProps {
  onGenerateFrame?: () => void;
  onMouseDown?: (x: number, y: number) => void;
  onMouseUp?: () => void;
  isMobile?: boolean;
  isLandscape?: boolean;
}

const Screen = forwardRef<ScreenHandle, ScreenProps>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const buf8Ref = useRef<Uint8ClampedArray | null>(null);
  const buf32Ref = useRef<Uint32Array | null>(null);

  const initCanvas = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;
    contextRef.current = context;
    imageDataRef.current = context.getImageData(
      0,
      0,
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
    );

    context.fillStyle = "black";
    // set alpha to opaque
    context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // buffer to write on next animation frame
    const buf = new ArrayBuffer(imageDataRef.current.data.length);
    // Get the canvas buffer in 8bit and 32bit
    buf8Ref.current = new Uint8ClampedArray(buf);
    buf32Ref.current = new Uint32Array(buf);

    // Set alpha
    for (let i = 0; i < buf32Ref.current.length; ++i) {
      buf32Ref.current[i] = 0xff000000;
    }
  };

  useEffect(() => {
    initCanvas();
  }, []);

  useImperativeHandle(ref, () => ({
    setBuffer: (buffer: number[]) => {
      if (!buf32Ref.current) return;

      for (let y = 0; y < SCREEN_HEIGHT; ++y) {
        for (let x = 0; x < SCREEN_WIDTH; ++x) {
          const i = y * 256 + x;
          // Convert pixel from NES BGR to canvas ABGR
          buf32Ref.current[i] = 0xff000000 | buffer[i]; // Full alpha
        }
      }
    },

    writeBuffer: () => {
      if (!imageDataRef.current || !buf8Ref.current || !contextRef.current)
        return;

      imageDataRef.current.data.set(buf8Ref.current);
      contextRef.current.putImageData(imageDataRef.current, 0, 0);
    },

    fitInParent: () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const parent = canvas.parentNode as HTMLElement;
      if (!parent) return;

      const parentWidth = parent.clientWidth;
      const parentHeight = parent.clientHeight;
      const parentRatio = parentWidth / parentHeight;
      const desiredRatio = 5 / 3;

      if (props.isMobile && props.isLandscape) {
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
      } else {
        if (desiredRatio < parentRatio) {
          canvas.style.width = `${Math.round(parentHeight * desiredRatio)}px`;
          canvas.style.height = `${parentHeight}px`;
        } else {
          canvas.style.width = `${parentWidth}px`;
          canvas.style.height = `${Math.round(parentWidth / desiredRatio)}px`;
        }
      }
    },
  }));

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!props.onMouseDown || !canvasRef.current) return;
    // Make coordinates unscaled
    const scale = SCREEN_WIDTH / parseFloat(canvasRef.current.style.width);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * scale);
    const y = Math.round((e.clientY - rect.top) * scale);
    props.onMouseDown(x, y);
  };

  const screenshot = () => {
    if (!canvasRef.current) return null;
    const img = new Image();
    img.src = canvasRef.current.toDataURL("image/png");
    return img;
  };

  return (
    <canvas
      className="screen"
      width={SCREEN_WIDTH}
      height={SCREEN_HEIGHT}
      onMouseDown={handleMouseDown}
      onMouseUp={props.onMouseUp}
      ref={canvasRef}
    />
  );
});

export default Screen;
