import '@testing-library/jest-dom';

// Polyfill AudioContext for sound effects testing
if (typeof window !== 'undefined') {
  window.AudioContext = window.AudioContext || class MockAudioContext {
    constructor() {
      this.currentTime = 0;
      this.destination = {};
    }
    createOscillator() {
      return {
        type: 'sine',
        frequency: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
        },
        connect: () => {},
        start: () => {},
        stop: () => {},
      };
    }
    createGain() {
      return {
        gain: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
          linearRampToValueAtTime: () => {},
        },
        connect: () => {},
      };
    }
    createBiquadFilter() {
      return {
        type: 'lowpass',
        frequency: {
          setValueAtTime: () => {},
        },
        Q: {
          setValueAtTime: () => {},
        },
        connect: () => {},
      };
    }
  };
  window.webkitAudioContext = window.AudioContext;
}
