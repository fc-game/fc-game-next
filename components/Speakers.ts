export default class Speakers {
  private ctx: AudioContext;
  private processor: ScriptProcessorNode;
  private bufferL: number[] = [];
  private bufferR: number[] = [];
  private readonly BUFFER_SIZE = 1024;

  constructor() {
    this.ctx = new AudioContext({ sampleRate: 44100 });

    this.processor = this.ctx.createScriptProcessor(this.BUFFER_SIZE, 0, 2);

    this.processor.onaudioprocess = (e) => {
      const outL = e.outputBuffer.getChannelData(0);
      const outR = e.outputBuffer.getChannelData(1);

      for (let i = 0; i < outL.length; i++) {
        outL[i] = this.bufferL.shift() ?? 0;
        outR[i] = this.bufferR.shift() ?? 0;
      }
    };

    this.processor.connect(this.ctx.destination);
  }

  pushSample(left: number, right: number) {
    this.bufferL.push(left);
    this.bufferR.push(right);
  }

  getSampleRate() {
    if (!window.AudioContext) {
      return 44100;
    }
    let myCtx = new window.AudioContext();
    let sampleRate = myCtx.sampleRate;
    myCtx.close();
    return sampleRate;
  }

  resume() {
    this.ctx.resume();
  }

  destroy() {
    this.processor.disconnect();
    this.ctx.close();
  }

  start() {
    this.ctx.resume();
  }

  stop() {
    this.ctx.suspend();
  }
}
