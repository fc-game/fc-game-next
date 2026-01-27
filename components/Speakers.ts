export default class Speakers {
  private audioCtx: AudioContext;
  private scriptNode: ScriptProcessorNode;
  private buffer: number[] = [];

  constructor() {
    this.audioCtx = new AudioContext({ sampleRate: 44100 });

    this.scriptNode = this.audioCtx.createScriptProcessor(2048, 0, 1);
    this.scriptNode.onaudioprocess = (e) => {
      const out = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < out.length; i++) {
        out[i] = this.buffer.length ? this.buffer.shift()! : 0;
      }
    };

    this.scriptNode.connect(this.audioCtx.destination);
  }

  writeSample(sample: number) {
    this.buffer.push(sample);
  }

  getBufferedSamples() {
    return this.buffer.length;
  }

  getSampleRate() {
    return this.audioCtx.sampleRate;
  }

  start() {
    this.audioCtx.resume();
  }

  stop() {
    this.audioCtx.suspend();
  }
}
