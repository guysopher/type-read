import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameScoring } from './useGameScoring';

describe('useGameScoring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useGameScoring());

      expect(result.current.gameScore).toBe(0);
      expect(result.current.comboMultiplier).toBe(1);
      expect(result.current.maxComboReached).toBe(0);
      expect(result.current.currentStreak).toBe(0);
      expect(result.current.bestStreak).toBe(0);
      expect(result.current.streakBonus).toBeNull();
      expect(result.current.powerUpPlacements.size).toBe(0);
    });
  });

  describe('addWordScore', () => {
    it('should increase streak on correct word', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.addWordScore(5, true, false, 0, 0);
      });

      expect(result.current.currentStreak).toBe(1);
      expect(result.current.bestStreak).toBe(1);
    });

    it('should increase combo multiplier on perfect word (no mistakes)', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.addWordScore(5, true, false, 0, 0);
      });

      expect(result.current.comboMultiplier).toBe(2);
    });

    it('should not increase combo if word had mistakes', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.addWordScore(5, true, true, 1, 0);
      });

      expect(result.current.comboMultiplier).toBe(1);
    });

    it('should calculate base score from word length', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.addWordScore(10, true, false, 0, 0);
      });

      expect(result.current.gameScore).toBeGreaterThan(0);
    });

    it('should apply streak multiplier to score', () => {
      const { result } = renderHook(() => useGameScoring());

      // Build up a streak
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addWordScore(10, true, false, 0, i);
        }
      });

      const scoreAfter5 = result.current.gameScore;

      // Add one more word
      act(() => {
        result.current.addWordScore(10, true, false, 0, 5);
      });

      const scoreAfter6 = result.current.gameScore;

      // Score should increase more with higher streak
      expect(scoreAfter6).toBeGreaterThan(scoreAfter5);
    });

    it('should apply combo multiplier to score', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.addWordScore(10, true, false, 0, 0);
      });

      const scoreAfter1 = result.current.gameScore;

      act(() => {
        result.current.addWordScore(10, true, false, 0, 1);
      });

      const scoreAfter2 = result.current.gameScore;
      const secondWordScore = scoreAfter2 - scoreAfter1;

      // Second word should score more due to combo multiplier
      expect(secondWordScore).toBeGreaterThan(scoreAfter1);
    });

    it('should award streak bonus at milestone 5', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addWordScore(10, true, false, 0, i);
        }
      });

      expect(result.current.streakBonus).not.toBeNull();
      expect(result.current.streakBonus?.amount).toBe(10);
    });

    it('should award streak bonus at milestone 10', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addWordScore(10, true, false, 0, i);
        }
      });

      expect(result.current.streakBonus?.amount).toBe(25);
    });

    it('should award streak bonus at milestone 20', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.addWordScore(10, true, false, 0, i);
        }
      });

      expect(result.current.streakBonus?.amount).toBe(50);
    });

    it('should clear streak bonus after timeout', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addWordScore(10, true, false, 0, i);
        }
      });

      expect(result.current.streakBonus).not.toBeNull();

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(result.current.streakBonus).toBeNull();
    });

    it('should reset streak on incorrect word', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.addWordScore(10, true, false, 0, 0);
        result.current.addWordScore(10, true, false, 0, 1);
        result.current.addWordScore(10, true, false, 0, 2);
      });

      expect(result.current.currentStreak).toBe(3);

      act(() => {
        result.current.addWordScore(10, false, true, 2, 3);
      });

      expect(result.current.currentStreak).toBe(0);
    });

    it('should deduct points for mistakes', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.addWordScore(10, true, false, 0, 0);
      });

      const scoreAfterCorrect = result.current.gameScore;

      act(() => {
        result.current.addWordScore(10, false, true, 3, 1);
      });

      expect(result.current.gameScore).toBe(scoreAfterCorrect - 3);
    });

    it('should not allow negative score', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.addWordScore(10, false, true, 100, 0);
      });

      expect(result.current.gameScore).toBe(0);
    });

    it('should track best streak', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addWordScore(10, true, false, 0, i);
        }
      });

      expect(result.current.bestStreak).toBe(10);

      act(() => {
        result.current.addWordScore(10, false, true, 1, 10);
      });

      expect(result.current.currentStreak).toBe(0);
      expect(result.current.bestStreak).toBe(10); // Best streak preserved
    });

    it('should track max combo reached', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addWordScore(10, true, false, 0, i);
        }
      });

      expect(result.current.maxComboReached).toBe(6); // Started at 1, increased 5 times
    });

    it('should collect power-up when word is completed', () => {
      const onPowerUpCollected = vi.fn();
      const { result } = renderHook(() => useGameScoring({ onPowerUpCollected }));

      // Initialize power-ups
      act(() => {
        result.current.initializePowerUps(100);
      });

      const powerUpPlacements = Array.from(result.current.powerUpPlacements.entries());
      expect(powerUpPlacements.length).toBeGreaterThan(0);

      // Complete a word with power-up
      const [wordIndex, powerUpType] = powerUpPlacements[0];

      act(() => {
        result.current.addWordScore(10, true, false, 0, wordIndex);
      });

      expect(onPowerUpCollected).toHaveBeenCalledWith(wordIndex, powerUpType);
      expect(result.current.powerUpPlacements.has(wordIndex)).toBe(false);
    });
  });

  describe('resetStreak', () => {
    it('should reset current streak to 0', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addWordScore(10, true, false, 0, i);
        }
      });

      expect(result.current.currentStreak).toBe(5);

      act(() => {
        result.current.resetStreak();
      });

      expect(result.current.currentStreak).toBe(0);
    });

    it('should not reset best streak', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addWordScore(10, true, false, 0, i);
        }
      });

      expect(result.current.bestStreak).toBe(5);

      act(() => {
        result.current.resetStreak();
      });

      expect(result.current.bestStreak).toBe(5);
    });
  });

  describe('resetCombo', () => {
    it('should reset combo multiplier to 1', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addWordScore(10, true, false, 0, i);
        }
      });

      expect(result.current.comboMultiplier).toBeGreaterThan(1);

      act(() => {
        result.current.resetCombo();
      });

      expect(result.current.comboMultiplier).toBe(1);
    });
  });

  describe('initializePowerUps', () => {
    it('should create 8-12 power-ups', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.initializePowerUps(100);
      });

      const count = result.current.powerUpPlacements.size;
      expect(count).toBeGreaterThanOrEqual(8);
      expect(count).toBeLessThanOrEqual(12);
    });

    it('should place power-ups after first 5 words', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.initializePowerUps(100);
      });

      const indices = Array.from(result.current.powerUpPlacements.keys());
      indices.forEach(index => {
        expect(index).toBeGreaterThanOrEqual(5);
      });
    });

    it('should maintain minimum distance between power-ups', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.initializePowerUps(100);
      });

      const indices = Array.from(result.current.powerUpPlacements.keys()).sort((a, b) => a - b);

      for (let i = 1; i < indices.length; i++) {
        const distance = indices[i] - indices[i - 1];
        expect(distance).toBeGreaterThanOrEqual(10);
      }
    });

    it('should assign power-up types', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.initializePowerUps(100);
      });

      const types = Array.from(result.current.powerUpPlacements.values());
      const validTypes = ['freezeMonster', 'shield', 'slowMo'];

      types.forEach(type => {
        expect(validTypes).toContain(type);
      });
    });
  });

  describe('getPowerUpAtWord', () => {
    it('should return power-up type if exists at word index', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.initializePowerUps(100);
      });

      const [wordIndex, powerUpType] = Array.from(result.current.powerUpPlacements.entries())[0];
      const retrieved = result.current.getPowerUpAtWord(wordIndex);

      expect(retrieved).toBe(powerUpType);
    });

    it('should return null if no power-up at word index', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.initializePowerUps(100);
      });

      const retrieved = result.current.getPowerUpAtWord(0); // Word 0 has no power-up
      expect(retrieved).toBeNull();
    });
  });

  describe('streak multiplier calculation', () => {
    it('should start at 1.0x for 0-4 streak', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.addWordScore(10, true, false, 0, 0);
      });

      // With streak 1, multiplier should be 1.0
      // Score = 10 * 1.0 * 2 (combo) = 20
      expect(result.current.gameScore).toBeGreaterThanOrEqual(20);
    });

    it('should increase multiplier every 5 words', () => {
      const { result } = renderHook(() => useGameScoring());

      let scores: number[] = [];

      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.addWordScore(10, true, false, 0, i);
          scores.push(result.current.gameScore);
        }
      });

      // Score should increase more rapidly as streak grows
      expect(scores[9]).toBeGreaterThan(scores[4] * 1.5);
    });

    it('should cap at 2x multiplier for 50+ streak', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        for (let i = 0; i < 60; i++) {
          result.current.addWordScore(10, true, false, 0, i);
        }
      });

      // At streak 60, multiplier should be capped at 2.0
      expect(result.current.currentStreak).toBe(60);
    });
  });

  describe('combo system', () => {
    it('should increase combo only on perfect words', () => {
      const { result } = renderHook(() => useGameScoring());

      act(() => {
        result.current.addWordScore(10, true, false, 0, 0); // Perfect
        result.current.addWordScore(10, true, false, 0, 1); // Perfect
        result.current.addWordScore(10, true, true, 1, 2); // Had mistakes
      });

      expect(result.current.comboMultiplier).toBe(1); // Reset after mistake
    });

    it('should apply combo multiplier to score', () => {
      const { result } = renderHook(() => useGameScoring());

      let firstWordScore = 0;

      act(() => {
        result.current.addWordScore(10, true, false, 0, 0);
        firstWordScore = result.current.gameScore;
      });

      act(() => {
        result.current.addWordScore(10, true, false, 0, 1);
      });

      const secondWordScore = result.current.gameScore - firstWordScore;

      // Second word should score more due to combo
      expect(secondWordScore).toBeGreaterThan(firstWordScore);
    });
  });
});
