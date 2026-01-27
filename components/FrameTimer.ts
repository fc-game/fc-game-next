const FPS = 60.098;

export interface FrameTimerProps {
  onGenerateFrame: () => void;
  onWriteFrame: () => void;
}

export default class FrameTimer {
  private onGenerateFrame: () => void;
  private onWriteFrame: () => void;
  private running: boolean;
  private interval: number;
  private lastFrameTime: number | false;
  private _requestID: number | null;

  constructor(props: FrameTimerProps) {
    this.onGenerateFrame = props.onGenerateFrame;
    this.onWriteFrame = props.onWriteFrame;
    this.onAnimationFrame = this.onAnimationFrame.bind(this);
    this.running = true;
    this.interval = 1e3 / FPS;
    this.lastFrameTime = false;
    this._requestID = null;
  }

  start(): void {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    this.running = true;
    this.requestAnimationFrame();
  }

  stop(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.running = false;
    if (this._requestID !== null) {
      window.cancelAnimationFrame(this._requestID);
      this._requestID = null;
    }
    this.lastFrameTime = false;
  }

  private requestAnimationFrame(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this._requestID = window.requestAnimationFrame(this.onAnimationFrame);
  }

  private generateFrame(): void {
    this.onGenerateFrame();
    if (this.lastFrameTime !== false) {
      this.lastFrameTime += this.interval;
    }
  }

  private onAnimationFrame = (time: number): void => {
    if (typeof window === 'undefined') {
      return;
    }

    this.requestAnimationFrame();
    
    // how many ms after 60fps frame time
    const excess = time % this.interval;

    // newFrameTime is the current time aligned to 60fps intervals.
    // i.e. 16.6, 33.3, etc ...
    const newFrameTime = time - excess;

    // first frame, do nothing
    if (this.lastFrameTime === false) {
      this.lastFrameTime = newFrameTime;
      return;
    }

    const numFrames = Math.round(
      (newFrameTime - this.lastFrameTime) / this.interval
    );

    // This can happen a lot on a 144Hz display
    if (numFrames === 0) {
      //console.log("WOAH, no frames");
      return;
    }

    // update display on first frame only
    this.generateFrame();
    this.onWriteFrame();

    // we generate additional frames evenly before the next
    // onAnimationFrame call.
    // additional frames are generated but not displayed
    // until next frame draw
    const timeToNextFrame = this.interval - excess;
    for (let i = 1; i < numFrames; i++) {
      setTimeout(() => {
        this.generateFrame();
      }, (i * timeToNextFrame) / numFrames);
    }
    // if (numFrames > 1) console.log("SKIP", numFrames - 1, this.lastFrameTime);
  };

  isRunning(): boolean {
    return this.running;
  }
}