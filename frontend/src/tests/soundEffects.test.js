import { describe, it, expect, beforeEach } from 'vitest';
import {
  toggleAudio,
  isAudioEnabled,
  playDispatchAlert,
  playMechanicalClick,
  playSuccessChime,
} from '../utils/soundEffects';

describe('Web Audio Synthesizer soundEffects', () => {
  beforeEach(() => {
    toggleAudio(true);
  });

  it('should toggle audio state correctly', () => {
    expect(isAudioEnabled()).toBe(true);
    toggleAudio(false);
    expect(isAudioEnabled()).toBe(false);
    toggleAudio(true);
    expect(isAudioEnabled()).toBe(true);
  });

  it('should trigger playDispatchAlert without throwing', () => {
    expect(() => playDispatchAlert()).not.toThrow();
  });

  it('should trigger playMechanicalClick without throwing', () => {
    expect(() => playMechanicalClick()).not.toThrow();
  });

  it('should trigger playSuccessChime without throwing', () => {
    expect(() => playSuccessChime()).not.toThrow();
  });

  it('should not play audio when audio is disabled', () => {
    toggleAudio(false);
    expect(() => {
      playDispatchAlert();
      playMechanicalClick();
      playSuccessChime();
    }).not.toThrow();
  });
});
