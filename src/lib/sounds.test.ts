import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  playBackgroundMusic,
  stopBackgroundMusic,
  pauseBackgroundMusic,
  resumeBackgroundMusic,
  setMusicMuted,
  playCorrectSound,
  playErrorSound,
  playWordCompleteSound,
  playPunctuationSound,
} from './sounds';

describe('sounds', () => {
  let mockAudioElement: any;
  let mockOscillator: any;
  let mockGainNode: any;
  let mockAudioContext: any;

  beforeEach(() => {
    // Mock Audio element
    mockAudioElement = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      load: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      volume: 1,
      loop: false,
      currentTime: 0,
      paused: false,
      muted: false,
    };

    global.Audio = vi.fn(() => mockAudioElement) as any;

    // Mock Oscillator
    mockOscillator = {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 0 },
      type: 'sine',
    };

    // Mock Gain Node
    mockGainNode = {
      connect: vi.fn(),
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };

    // Mock AudioContext
    mockAudioContext = {
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGainNode),
      destination: {},
      currentTime: 0,
    };

    global.AudioContext = vi.fn(() => mockAudioContext) as any;
  });

  describe('Background Music', () => {
    describe('playBackgroundMusic', () => {
      it('should create and play background music', () => {
        playBackgroundMusic();

        expect(global.Audio).toHaveBeenCalledWith('/Pixel Pogo Loop.mp3');
        expect(mockAudioElement.play).toHaveBeenCalled();
      });

      it('should set loop to true', () => {
        playBackgroundMusic();

        expect(mockAudioElement.loop).toBe(true);
      });

      it('should set volume to 0.3', () => {
        playBackgroundMusic();

        expect(mockAudioElement.volume).toBe(0.3);
      });

      it('should reuse existing audio element', () => {
        playBackgroundMusic();
        playBackgroundMusic();

        expect(global.Audio).toHaveBeenCalledTimes(1);
        expect(mockAudioElement.play).toHaveBeenCalledTimes(2);
      });

      it('should handle errors gracefully', () => {
        global.Audio = vi.fn(() => {
          throw new Error('Audio not supported');
        }) as any;

        expect(() => playBackgroundMusic()).not.toThrow();
      });
    });

    describe('stopBackgroundMusic', () => {
      it('should pause and reset music', () => {
        playBackgroundMusic();
        stopBackgroundMusic();

        expect(mockAudioElement.pause).toHaveBeenCalled();
        expect(mockAudioElement.currentTime).toBe(0);
      });

      it('should do nothing if music not initialized', () => {
        expect(() => stopBackgroundMusic()).not.toThrow();
      });
    });

    describe('pauseBackgroundMusic', () => {
      it('should pause music', () => {
        playBackgroundMusic();
        pauseBackgroundMusic();

        expect(mockAudioElement.pause).toHaveBeenCalled();
      });

      it('should do nothing if music not initialized', () => {
        expect(() => pauseBackgroundMusic()).not.toThrow();
      });
    });

    describe('resumeBackgroundMusic', () => {
      it('should resume paused music', () => {
        playBackgroundMusic();
        mockAudioElement.paused = true;
        resumeBackgroundMusic();

        expect(mockAudioElement.play).toHaveBeenCalledTimes(2);
      });

      it('should not play if music is not paused', () => {
        playBackgroundMusic();
        mockAudioElement.paused = false;
        resumeBackgroundMusic();

        expect(mockAudioElement.play).toHaveBeenCalledTimes(1); // Only initial play
      });

      it('should do nothing if music not initialized', () => {
        expect(() => resumeBackgroundMusic()).not.toThrow();
      });
    });

    describe('setMusicMuted', () => {
      it('should mute music', () => {
        playBackgroundMusic();
        setMusicMuted(true);

        expect(mockAudioElement.muted).toBe(true);
      });

      it('should unmute music', () => {
        playBackgroundMusic();
        setMusicMuted(true);
        setMusicMuted(false);

        expect(mockAudioElement.muted).toBe(false);
      });

      it('should do nothing if music not initialized', () => {
        expect(() => setMusicMuted(true)).not.toThrow();
      });
    });
  });

  describe('Sound Effects', () => {
    describe('playCorrectSound', () => {
      it('should create and configure oscillator', () => {
        playCorrectSound();

        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
        expect(mockAudioContext.createGain).toHaveBeenCalled();
      });

      it('should set frequency to 800Hz', () => {
        playCorrectSound();

        expect(mockOscillator.frequency.value).toBe(800);
      });

      it('should use sine wave', () => {
        playCorrectSound();

        expect(mockOscillator.type).toBe('sine');
      });

      it('should connect oscillator to gain node', () => {
        playCorrectSound();

        expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
      });

      it('should connect gain node to destination', () => {
        playCorrectSound();

        expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
      });

      it('should configure gain envelope', () => {
        playCorrectSound();

        expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalled();
        expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalled();
      });

      it('should start and stop oscillator', () => {
        playCorrectSound();

        expect(mockOscillator.start).toHaveBeenCalled();
        expect(mockOscillator.stop).toHaveBeenCalled();
      });

      it('should handle errors gracefully', () => {
        mockAudioContext.createOscillator = vi.fn(() => {
          throw new Error('AudioContext not supported');
        });

        expect(() => playCorrectSound()).not.toThrow();
      });
    });

    describe('playErrorSound', () => {
      it('should create oscillator with correct settings', () => {
        playErrorSound();

        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
        expect(mockOscillator.frequency.value).toBe(200);
        expect(mockOscillator.type).toBe('square');
      });

      it('should use square wave for error', () => {
        playErrorSound();

        expect(mockOscillator.type).toBe('square');
      });

      it('should start and stop oscillator', () => {
        playErrorSound();

        expect(mockOscillator.start).toHaveBeenCalled();
        expect(mockOscillator.stop).toHaveBeenCalled();
      });

      it('should handle errors gracefully', () => {
        mockAudioContext.createOscillator = vi.fn(() => {
          throw new Error('AudioContext not supported');
        });

        expect(() => playErrorSound()).not.toThrow();
      });
    });

    describe('playWordCompleteSound', () => {
      it('should create oscillator with higher frequency', () => {
        playWordCompleteSound();

        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
        expect(mockOscillator.frequency.value).toBe(1200);
      });

      it('should use sine wave', () => {
        playWordCompleteSound();

        expect(mockOscillator.type).toBe('sine');
      });

      it('should start and stop oscillator', () => {
        playWordCompleteSound();

        expect(mockOscillator.start).toHaveBeenCalled();
        expect(mockOscillator.stop).toHaveBeenCalled();
      });

      it('should handle errors gracefully', () => {
        mockAudioContext.createOscillator = vi.fn(() => {
          throw new Error('AudioContext not supported');
        });

        expect(() => playWordCompleteSound()).not.toThrow();
      });
    });

    describe('playPunctuationSound', () => {
      it('should create two oscillators for two-tone sound', () => {
        playPunctuationSound();

        expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
      });

      it('should create gain node', () => {
        playPunctuationSound();

        expect(mockAudioContext.createGain).toHaveBeenCalled();
      });

      it('should connect both oscillators to gain node', () => {
        playPunctuationSound();

        expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
        expect(mockOscillator.connect).toHaveBeenCalledTimes(2);
      });

      it('should start and stop both oscillators', () => {
        playPunctuationSound();

        expect(mockOscillator.start).toHaveBeenCalledTimes(2);
        expect(mockOscillator.stop).toHaveBeenCalledTimes(2);
      });

      it('should handle errors gracefully', () => {
        mockAudioContext.createOscillator = vi.fn(() => {
          throw new Error('AudioContext not supported');
        });

        expect(() => playPunctuationSound()).not.toThrow();
      });
    });
  });

  describe('Audio Context Management', () => {
    it('should create audio context once and reuse', () => {
      playCorrectSound();
      playErrorSound();
      playWordCompleteSound();

      expect(global.AudioContext).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple sound effects', () => {
      playCorrectSound();
      playErrorSound();
      playWordCompleteSound();
      playPunctuationSound();

      // All should succeed without errors
      expect(mockOscillator.start).toHaveBeenCalled();
    });
  });
});
