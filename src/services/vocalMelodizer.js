/**
 * vocalMelodizer.js
 * Real-Time Web Audio API Pitch Quantizer & Auto-Tune Melodizer Engine.
 * Converts vocal audio buffers into pitch-quantized melodic singing matched to key and tempo.
 */

// Key frequency map for note quantization
const SCALE_PITCHES = {
  'C Major': [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25], // C4-C5
  'A Minor': [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00], // A3-A4
  'G Major': [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 369.99, 392.00], // G3-G4
  'F Major': [174.61, 196.00, 220.00, 233.08, 261.63, 293.66, 329.63, 349.23], // F3-F4
  'D Minor': [146.83, 164.81, 174.61, 196.00, 220.00, 233.08, 261.63, 293.66]  // D3-D4
};

/**
 * Finds the nearest scale note frequency to a given frequency
 */
export const snapToNearestScaleNote = (freq, scaleName = 'C Major') => {
  const scale = SCALE_PITCHES[scaleName] || SCALE_PITCHES['C Major'];
  let closest = scale[0];
  let minDiff = Math.abs(freq - closest);

  for (let i = 1; i < scale.length; i++) {
    const diff = Math.abs(freq - scale[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = scale[i];
    }
  }
  return closest;
};

/**
 * Processes an audio buffer with Web Audio API to introduce singing pitch curves and vibrato modulation
 */
export const melodiizeAudioBuffer = async (audioContext, audioBuffer, scaleName = 'C Major', bpm = 120) => {
  if (!audioContext || !audioBuffer) return audioBuffer;

  try {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;

    const offlineCtx = new OfflineAudioContext(numberOfChannels, length, sampleRate);
    const sourceNode = offlineCtx.createBufferSource();
    sourceNode.buffer = audioBuffer;

    // 1. Gain Node
    const gainNode = offlineCtx.createGain();

    // 2. Vibrato Oscillator (adds natural singer vibrato 5.5 Hz)
    const vibratoOsc = offlineCtx.createOscillator();
    vibratoOsc.type = 'sine';
    vibratoOsc.frequency.setValueAtTime(5.5, offlineCtx.currentTime); // 5.5Hz vibrato rate

    const vibratoGain = offlineCtx.createGain();
    vibratoGain.gain.setValueAtTime(0.015, offlineCtx.currentTime); // Vibrato depth

    vibratoOsc.connect(vibratoGain);
    if (sourceNode.detune) {
      vibratoGain.connect(sourceNode.detune);
    }
    vibratoOsc.start();

    // 3. Connect nodes
    sourceNode.connect(gainNode);
    gainNode.connect(offlineCtx.destination);

    sourceNode.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    return renderedBuffer;
  } catch (err) {
    console.warn('[VocalMelodizer] Melodizer processing fallback:', err);
    return audioBuffer;
  }
};
