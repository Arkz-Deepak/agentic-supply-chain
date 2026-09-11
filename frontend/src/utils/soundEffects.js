// Pure Web Audio API sound synthesizer for subtle UI feedback
// Zero external audio files, works offline, 100% reliable for live hackathon pitch.

let audioCtx = null;
let soundEnabled = true;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleAudio(enabled) {
  soundEnabled = enabled !== undefined ? enabled : !soundEnabled;
  return soundEnabled;
}

export function isAudioEnabled() {
  return soundEnabled;
}

/**
 * Low-pitched dispatch alert when disruption triggers.
 * Subtle, warm warning tone (dual frequency 220Hz -> 180Hz) that won't overpower speaking voice.
 */
export function playDispatchAlert() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Low-pass filter for smooth warmth, removing harsh high frequencies
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    const now = ctx.currentTime;

    // Primary frequency sweep down (240Hz -> 175Hz)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(175, now + 0.35);

    // Sub-harmonic for tactical depth
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(90, now + 0.35);

    // Soft attack, steady sustain, clean decay
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 0.42);
    subOsc.stop(now + 0.42);
  } catch (err) {
    console.warn('Audio feedback error:', err);
  }
}

/**
 * Soft mechanical click when user interacts or agent completes a phase.
 * Snappy, subtle haptic-style click (850Hz transient, 25ms decay).
 */
export function playMechanicalClick() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(3.0, now);

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch (err) {
    console.warn('Audio feedback error:', err);
  }
}

/**
 * Soft harmonic chime when agent successfully recalculates and confirms the bypass route.
 * Gentle dual fifth (523Hz C5 -> 659Hz E5) with soft acoustic decay.
 */
export function playSuccessChime() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    [
      { freq: 523.25, timeOffset: 0.0 },
      { freq: 659.25, timeOffset: 0.08 },
    ].forEach(({ freq, timeOffset }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + timeOffset);

      gain.gain.setValueAtTime(0.0001, now + timeOffset);
      gain.gain.linearRampToValueAtTime(0.09, now + timeOffset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.5);
    });
  } catch (err) {
    console.warn('Audio feedback error:', err);
  }
}
