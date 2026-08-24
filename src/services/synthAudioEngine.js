/**
 * synthAudioEngine.js
 * Universal Real-Time Web Audio & Mobile Synthesis Engine for Gandharva Live Studios.
 * Provides zero-latency, rich acoustic and electronic instrument sound synthesis.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Convert Note Name (e.g. 'C4', 'A#3', 'E2') to Frequency in Hertz (Hz)
export function noteToFreq(note) {
  if (!note) return 440;
  if (typeof note === 'number') return note;

  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const regex = /^([A-Ga-g]#?|[A-Ga-g]b?)(-?\d+)$/;
  const match = note.trim().match(regex);
  if (!match) return 440;

  let noteName = match[1].toUpperCase();
  if (noteName === 'DB') noteName = 'C#';
  if (noteName === 'EB') noteName = 'D#';
  if (noteName === 'GB') noteName = 'F#';
  if (noteName === 'AB') noteName = 'G#';
  if (noteName === 'BB') noteName = 'A#';

  const octave = parseInt(match[2], 10);
  const noteIndex = notes.indexOf(noteName);
  if (noteIndex === -1) return 440;

  const semitonesFromA4 = (noteIndex - 9) + (octave - 4) * 12;
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

/**
 * 0. REALTIME ACOUSTIC GRAND PIANO SYNTHESIZER
 */
export function playPianoNote(freqOrNote, volume = 0.8, isSustain = false, duration = 2.8) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const freq = noteToFreq(freqOrNote);
  const now = ctx.currentTime;
  const noteDuration = isSustain ? duration * 1.8 : duration;

  // Dual string oscillators with natural acoustic piano detuning (chorus effect)
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator();
  const gain = ctx.createGain();
  const soundboardFilter = ctx.createBiquadFilter();

  osc1.type = 'triangle';
  osc2.type = 'sine';
  osc3.type = 'sine';

  osc1.frequency.setValueAtTime(freq, now);
  osc2.frequency.setValueAtTime(freq * 2.001, now); // 2nd harmonic
  osc3.frequency.setValueAtTime(freq * 0.998, now); // Sub-string acoustic detuning

  // Soundboard Resonance Lowpass
  soundboardFilter.type = 'lowpass';
  soundboardFilter.frequency.setValueAtTime(Math.min(12000, freq * 6), now);
  soundboardFilter.frequency.exponentialRampToValueAtTime(Math.max(200, freq * 1.2), now + noteDuration);

  // Hammer strike attack (instant 2ms punch) + natural acoustic decay
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.55 * volume, now + 0.003); // 3ms hammer attack
  gain.gain.exponentialRampToValueAtTime(0.22 * volume, now + 0.25); // Initial pluck decay
  gain.gain.exponentialRampToValueAtTime(0.0001, now + noteDuration);

  osc1.connect(soundboardFilter);
  osc2.connect(soundboardFilter);
  osc3.connect(soundboardFilter);
  soundboardFilter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc3.start(now);
  osc1.stop(now + noteDuration);
  osc2.stop(now + noteDuration);
  osc3.stop(now + noteDuration);
}

/**
 * 1. REALTIME GUITAR SYNTHESIZER (Acoustic Pluck & Electric Overdrive)
 */
export function playGuitarNote(freqOrNote, mode = 'acoustic', duration = 2.0) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const freq = noteToFreq(freqOrNote);
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  if (mode === 'electric') {
    // Electric Guitar: Sawtooth + Overdrive clipping + Cab filter
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 1.002, now); // Slight detune

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + duration);

    // Distortion WaveShaper
    const waveshaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    const k = 40;
    for (let i = 0; i < 256; ++i) {
      const x = (i * 2) / 256 - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    waveshaper.curve = curve;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(waveshaper);
    osc2.connect(waveshaper);
    waveshaper.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
  } else {
    // Acoustic Guitar: Bright Pluck with String Harmonics
    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 2.5, now);
    filter.Q.setValueAtTime(2.0, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
  }

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
}

/**
 * 2. REALTIME SITAR & JAVARI SYNTHESIZER
 */
export function playSitarNote(freqOrNote, meendSemitones = 0, isChikari = false, duration = 3.2) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const baseFreq = noteToFreq(freqOrNote);
  const freq = baseFreq * Math.pow(2, meendSemitones / 12);
  const now = ctx.currentTime;

  // Sitar has distinctive jawari buzzing overtones (harmonics 1, 2, 3, 5)
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator();
  const gain = ctx.createGain();
  const jawariFilter = ctx.createBiquadFilter();

  osc1.type = 'sawtooth';
  osc2.type = isChikari ? 'sine' : 'triangle';
  osc3.type = 'sine';

  osc1.frequency.setValueAtTime(freq, now);
  osc2.frequency.setValueAtTime(freq * 2, now);
  osc3.frequency.setValueAtTime(freq * 3.01, now); // Metallic high string buzz

  // Meend Pitch Bend Glide
  if (meendSemitones !== 0) {
    osc1.frequency.exponentialRampToValueAtTime(freq, now + 0.35);
  }

  // Jawari Bridge Resonator
  jawariFilter.type = 'peaking';
  jawariFilter.frequency.setValueAtTime(2800, now);
  jawariFilter.gain.setValueAtTime(12, now);
  jawariFilter.Q.setValueAtTime(4.0, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(isChikari ? 0.5 : 0.4, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc1.connect(jawariFilter);
  osc2.connect(jawariFilter);
  osc3.connect(jawariFilter);
  jawariFilter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc3.start(now);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
  osc3.stop(now + duration);
}

/**
 * 3. REALTIME FLUTE & BANSURI SYNTHESIZER
 */
export function playFluteNote(freqOrNote, breathAmt = 0.3, vibratoSpeed = 5.5, duration = 2.0) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const freq = noteToFreq(freqOrNote);
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const oscHarmonic = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  // Vibrato LFO
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(vibratoSpeed, now);
  lfoGain.gain.setValueAtTime(freq * 0.015, now);
  lfo.connect(osc.frequency);
  lfo.start(now);

  osc.type = 'sine';
  oscHarmonic.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);
  oscHarmonic.frequency.setValueAtTime(freq * 2, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 3.5, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.45 * (breathAmt + 0.4), now + 0.012); // Instant snappy breath attack
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(filter);
  oscHarmonic.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  oscHarmonic.start(now);
  osc.stop(now + duration);
  oscHarmonic.stop(now + duration);
  lfo.stop(now + duration);
}

/**
 * Real-Time Flute Meend Portamento Glide (Slur between notes)
 */
export function playFluteMeendGlide(startNote, endNote, duration = 1.2, breathAmt = 0.4) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const startFreq = noteToFreq(startNote);
  const endFreq = noteToFreq(endNote);
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const oscHarmonic = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sine';
  oscHarmonic.type = 'triangle';

  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration * 0.85);

  oscHarmonic.frequency.setValueAtTime(startFreq * 2, now);
  oscHarmonic.frequency.exponentialRampToValueAtTime(endFreq * 2, now + duration * 0.85);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(startFreq * 3.5, now);
  filter.frequency.exponentialRampToValueAtTime(endFreq * 3.5, now + duration * 0.85);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.4 * (breathAmt + 0.5), now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(filter);
  oscHarmonic.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  oscHarmonic.start(now);
  osc.stop(now + duration);
  oscHarmonic.stop(now + duration);
}

// Global Tanpura Drone State
let tanpuraNodes = null;

export function startTanpuraDrone(rootNote = 'C3', droneType = 'Pa') {
  const ctx = getAudioContext();
  if (!ctx) return;
  stopTanpuraDrone();

  const baseFreq = noteToFreq(rootNote);
  const now = ctx.currentTime;

  // 4 strings of Tanpura: String 1 (Pa/Ma), String 2 (Sa high), String 3 (Sa high), String 4 (Sa low)
  const string1Freq = droneType === 'Pa' ? baseFreq * 1.5 : baseFreq * 1.333; // Pa (3/2) or Ma (4/3)
  const string2Freq = baseFreq * 2.0; // High Sa
  const string3Freq = baseFreq * 2.0; // High Sa
  const string4Freq = baseFreq; // Low Sa

  const frequencies = [string1Freq, string2Freq, string3Freq, string4Freq];
  const oscillators = [];
  const gains = [];

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.22, now);
  masterGain.connect(ctx.destination);

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const oscHarmonic = ctx.createOscillator();
    const stringGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    oscHarmonic.type = 'sine';

    osc.frequency.setValueAtTime(freq, now);
    oscHarmonic.frequency.setValueAtTime(freq * 2, now);

    // Jawari resonance buzz
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 2.5, now);
    filter.Q.setValueAtTime(3.0, now);

    // Gentle staggered pulsing to simulate Tanpura plucking cycle
    stringGain.gain.setValueAtTime(0.08, now);

    osc.connect(filter);
    oscHarmonic.connect(filter);
    filter.connect(stringGain);
    stringGain.connect(masterGain);

    osc.start(now);
    oscHarmonic.start(now);

    oscillators.push(osc, oscHarmonic);
    gains.push(stringGain);
  });

  tanpuraNodes = { oscillators, masterGain };
}

export function stopTanpuraDrone() {
  if (tanpuraNodes) {
    try {
      tanpuraNodes.oscillators.forEach(osc => osc.stop());
    } catch (e) {}
    tanpuraNodes = null;
  }
}


/**
 * 4. REALTIME VIOLIN & STRINGS SYNTHESIZER (Bowed & Pizzicato)
 */
export function playViolinNote(freqOrNote, isPizzicato = false, vibrato = true, duration = 2.5) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const freq = noteToFreq(freqOrNote);
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const bodyFilter = ctx.createBiquadFilter();

  osc.type = isPizzicato ? 'triangle' : 'sawtooth';
  osc.frequency.setValueAtTime(freq, now);

  if (vibrato && !isPizzicato) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(6.0, now);
    lfoGain.gain.setValueAtTime(freq * 0.02, now);
    lfo.connect(osc.frequency);
    lfo.start(now + 0.15); // Vibrato begins slightly after attack
    lfo.stop(now + duration);
  }

  // Violin Body Formant (1.2kHz - 3.5kHz)
  bodyFilter.type = 'bandpass';
  bodyFilter.frequency.setValueAtTime(2200, now);
  bodyFilter.Q.setValueAtTime(1.8, now);

  if (isPizzicato) {
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
  } else {
    // Bowed Sustain
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  }

  osc.connect(bodyFilter);
  bodyFilter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + (isPizzicato ? 0.8 : duration));
}

/**
 * 5. REALTIME SAXOPHONE & BRASS SYNTHESIZER
 */
export function playSaxNote(freqOrNote, growl = false, duration = 1.8) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const freq = noteToFreq(freqOrNote);
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const hornFilter = ctx.createBiquadFilter();

  osc1.type = 'sawtooth';
  osc2.type = 'square';
  osc1.frequency.setValueAtTime(freq, now);
  osc2.frequency.setValueAtTime(freq * 0.998, now);

  if (growl) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(28, now); // Rough flutter growl
    lfoGain.gain.setValueAtTime(freq * 0.08, now);
    lfo.connect(osc1.frequency);
    lfo.start(now);
    lfo.stop(now + duration);
  }

  hornFilter.type = 'lowpass';
  hornFilter.frequency.setValueAtTime(2600, now);
  hornFilter.Q.setValueAtTime(3.0, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.4, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc1.connect(hornFilter);
  osc2.connect(hornFilter);
  hornFilter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
}

/**
 * 6. REALTIME DRUM & TABLA SYNTHESIZER
 */
export function playDrumSound(type = 'kick', velocity = 1.0) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const vol = Math.max(0.1, Math.min(1.0, velocity));

  if (type === 'kick') {
    // Deep Sub Kick Drop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);

    gain.gain.setValueAtTime(0.8 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  } else if (type === 'snare') {
    // Snare Tone + Noise Burst
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
    gain.gain.setValueAtTime(0.5 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    // Noise Buffer
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1200, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45 * vol, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.2);
    noise.stop(now + 0.22);
  } else if (type === 'hihat' || type === 'hihat_open') {
    const isClosed = type === 'hihat';
    const dur = isClosed ? 0.06 : 0.4;
    const bufferSize = ctx.sampleRate * dur;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + dur);
  } else if (type === 'tabla_bayan') {
    // Resonant Indian Tabla Bayan (Bass Bending Dhin/Ge)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(115, now + 0.08); // Upward pitch mod
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.35);

    gain.gain.setValueAtTime(0.7 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  } else if (type === 'tabla_dayan') {
    // Crisp Bell-like Indian Tabla Dayan (Na / Tin / Ta)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(293.66, now); // D4 Dayan base pitch
    gain.gain.setValueAtTime(0.6 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}

/**
 * 7. REALTIME PIPE ORGAN SYNTHESIZER (Multi-Drawbar Harmonics)
 */
export function playOrganNote(freqOrNote, drawbars = [8, 8, 6, 0, 4, 0, 0, 2], duration = 2.0) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const baseFreq = noteToFreq(freqOrNote);
  const now = ctx.currentTime;

  const harmonicMultipliers = [0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0];
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.001, now);
  masterGain.gain.linearRampToValueAtTime(0.3, now + 0.04);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  masterGain.connect(ctx.destination);

  harmonicMultipliers.forEach((mult, idx) => {
    const barVal = drawbars[idx] || 0;
    if (barVal > 0) {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * mult, now);
      oscGain.gain.setValueAtTime((barVal / 8) * 0.12, now);

      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + duration);
    }
  });
}

/**
 * 8. REALTIME BASS GUITAR SYNTHESIZER (Slap & Fingerstyle)
 */
export function playBassNote(freqOrNote, isSlap = false, duration = 1.8) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const freq = noteToFreq(freqOrNote);
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc1.type = isSlap ? 'sawtooth' : 'triangle';
  osc2.type = 'sine';
  osc1.frequency.setValueAtTime(freq, now);
  osc2.frequency.setValueAtTime(freq * 0.5, now); // Sub-octave thump

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(isSlap ? 2200 : 700, now);
  filter.frequency.exponentialRampToValueAtTime(180, now + duration * 0.6);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.5, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
}

/**
 * 9. REALTIME SYNTHESIZER (Dual-Osc Polyphonic)
 */
export function playSynthWave(freqOrNote, oscType = 'sawtooth', cutoff = 2000, duration = 1.8) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const freq = noteToFreq(freqOrNote);
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = oscType;
  osc.frequency.setValueAtTime(freq, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoff, now);
  filter.Q.setValueAtTime(4.0, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}
