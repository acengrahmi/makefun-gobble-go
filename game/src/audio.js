// Gobble & Go — all sound is synthesized with WebAudio: no audio files,
// nothing to download. A gobble, a jump whoosh, corn pops, a thud, a sad
// trombone for getting caught, a fanfare for escaping, and a plucky little
// banjo-style tune that keeps time while you run.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  function ensure() {
    if (!ctx) {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return null;
      ctx = new AudioContext();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    const ac = ensure();
    if (!ac || muted) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, when = 0, lowpass = 1200) {
    const ac = ensure();
    if (!ac || muted) return;
    const t0 = ac.currentTime + when;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(t0);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },

    // The turkey's own voice: three quick descending gobbles.
    gobble() {
      tone(420, 0.09, 'square', 0.12, 0, 300);
      tone(380, 0.09, 'square', 0.12, 0.1, 260);
      tone(330, 0.14, 'square', 0.12, 0.2, 210);
    },
    jump() {
      tone(300, 0.16, 'sine', 0.14, 0, 620);
      noise(0.08, 0.05, 0, 2400);
    },
    doubleJump() {
      tone(520, 0.14, 'sine', 0.12, 0, 880);
    },
    slide() {
      noise(0.18, 0.08, 0, 900);
    },
    corn() {
      tone(880, 0.08, 'triangle', 0.16, 0, 1320);
      tone(1320, 0.12, 'triangle', 0.12, 0.06);
    },
    goldenCorn() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.14, i * 0.07));
    },
    hit() {
      noise(0.22, 0.22, 0, 500);
      tone(140, 0.25, 'sawtooth', 0.16, 0, 60);
    },
    nearMiss() {
      tone(1200, 0.07, 'sine', 0.08, 0, 1800);
    },
    spotted() {
      tone(196, 0.12, 'sawtooth', 0.14, 0);
      tone(233, 0.12, 'sawtooth', 0.14, 0.12);
    },
    caught() {
      // A tiny sad trombone: wah, wah, wahhh.
      [233, 220, 208, 175].forEach((f, i) => tone(f, 0.34, 'sawtooth', 0.15, i * 0.32, f * 0.94));
    },
    escaped() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.09));
      noise(0.5, 0.05, 0.4, 4000);
    },

    // A cheerful plucked loop in G major, one note a beat, bass on the bar.
    startMusic() {
      if (musicTimer) return;
      ensure();
      const melody = [392, 494, 587, 494, 659, 587, 494, 392, 440, 494, 587, 659, 587, 494, 440, 392];
      const bass = [98, 98, 123, 98, 147, 123, 98, 98];
      musicTimer = window.setInterval(() => {
        if (muted) {
          musicStep += 1;
          return;
        }
        const note = melody[musicStep % melody.length];
        tone(note, 0.22, 'triangle', 0.07);
        if (musicStep % 2 === 0) tone(bass[(musicStep / 2) % bass.length], 0.3, 'sine', 0.06);
        musicStep += 1;
      }, 210);
    },
    stopMusic() {
      if (musicTimer) {
        window.clearInterval(musicTimer);
        musicTimer = null;
      }
    },
  };
}
