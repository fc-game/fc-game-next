class SpeakerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];

    // 接收主线程传来的音频数据
    this.port.onmessage = (e) => {
      this.buffer.push(...e.data);
    };
  }

  process(_, outputs) {
    const output = outputs[0][0];

    for (let i = 0; i < output.length; i++) {
      output[i] = this.buffer.length ? this.buffer.shift() : 0;
    }

    return true;
  }
}

registerProcessor("speaker-processor", SpeakerProcessor);
