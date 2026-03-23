import { useState, useCallback } from 'react';

export interface StreakBonus {
  amount: number;
  timestamp: number;
}

export interface UseGameScoringProps {
  onPowerUpCollected?: (
    wordIndex: number,
    powerUpType: 'freezeMonster' | 'shield' | 'slowMo'
  ) => void;
}

export function useGameScoring({ onPowerUpCollected }: UseGameScoringProps = {}) {
  const [gameScore, setGameScore] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [maxComboReached, setMaxComboReached] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [streakBonus, setStreakBonus] = useState<StreakBonus | null>(null);

  // Power-up placements (word index -> power-up type)
  const [powerUpPlacements, setPowerUpPlacements] = useState<
    Map<number, 'freezeMonster' | 'shield' | 'slowMo'>
  >(new Map());

  /**
   * Calculate streak bonus based on milestone
   */
  const calculateStreakBonus = useCallback((streak: number): number => {
    if (streak === 5) return 10;
    if (streak === 10) return 25;
    if (streak === 20) return 50;
    if (streak === 50) return 150;
    if (streak === 100) return 500;
    if (streak % 25 === 0 && streak > 100) return 100;
    return 0;
  }, []);

  /**
   * Calculate streak multiplier (up to 2x at 50+ streak)
   */
  const calculateStreakMultiplier = useCallback((streak: number): number => {
    return Math.min(1 + Math.floor(streak / 5) * 0.1, 2);
  }, []);

  /**
   * Handle word completion and update score
   */
  const addWordScore = useCallback(
    (wordLength: number, isCorrect: boolean, hadAnyMistakes: boolean, mistakeCount: number, wordIndex: number) => {
      if (isCorrect) {
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        setBestStreak(prev => Math.max(prev, newStreak));

        // Combo multiplier increases only on perfect words (no mistakes at all, even if fixed)
        // Note: combo is already reset to 1 on any incorrect keystroke via resetCombo()
        if (!hadAnyMistakes) {
          const newCombo = comboMultiplier + 1;
          setComboMultiplier(newCombo);
          setMaxComboReached(prev => Math.max(prev, newCombo));
        }
        // If hadAnyMistakes, combo stays at 1 (was already reset on the incorrect keystroke)

        // Award streak bonus at milestones
        const bonus = calculateStreakBonus(newStreak);
        if (bonus > 0) {
          setStreakBonus({ amount: bonus, timestamp: Date.now() });
          setTimeout(() => setStreakBonus(null), 1500);
        }

        // Update game score: word.length * streak multiplier * combo multiplier + bonus
        const streakMultiplier = calculateStreakMultiplier(newStreak);
        const baseScore = wordLength * streakMultiplier * comboMultiplier;
        setGameScore(prev => prev + Math.round(baseScore) + bonus);

        // Check if this word has a power-up collectible
        const powerUpType = powerUpPlacements.get(wordIndex);
        if (powerUpType) {
          // Notify power-up collection
          onPowerUpCollected?.(wordIndex, powerUpType);
          // Remove it from placements so it's not collected again
          setPowerUpPlacements(prev => {
            const newPlacements = new Map(prev);
            newPlacements.delete(wordIndex);
            return newPlacements;
          });
        }
      } else {
        // Word has mistakes
        setCurrentStreak(0);
        // Combo is already 1 from resetCombo() calls during typing
        // Lose 1 point per mistake
        setGameScore(prev => Math.max(0, prev - mistakeCount));
      }
    },
    [
      currentStreak,
      comboMultiplier,
      powerUpPlacements,
      calculateStreakBonus,
      calculateStreakMultiplier,
      onPowerUpCollected,
    ]
  );

  /**
   * Reset streak (called when game over or other conditions)
   */
  const resetStreak = useCallback(() => {
    setCurrentStreak(0);
  }, []);

  /**
   * Reset combo multiplier
   */
  const resetCombo = useCallback(() => {
    setComboMultiplier(1);
  }, []);

  /**
   * Initialize power-up placements for the text
   * Spreads powerups evenly throughout the text with minimum distance enforcement
   */
  const initializePowerUps = useCallback((totalWords: number) => {
    const placements = new Map<number, 'freezeMonster' | 'shield' | 'slowMo'>();
    const powerUpTypes: ('freezeMonster' | 'shield' | 'slowMo')[] = [
      'freezeMonster',
      'shield',
      'slowMo',
    ];
    const numPowerUps = Math.floor(Math.random() * 5) + 8; // 8-12 power-ups

    // Calculate even spacing between power-ups
    const minIndex = 5; // Start after first few words
    const maxIndex = totalWords - 1;
    const availableRange = maxIndex - minIndex;
    const spacing = Math.floor(availableRange / numPowerUps);
    const minDistance = Math.max(10, Math.floor(spacing * 0.6)); // Minimum 10 words apart, or 60% of spacing

    for (let i = 0; i < numPowerUps; i++) {
      // Place power-ups evenly with slight randomness (only 15% variation)
      const basePosition = minIndex + (i * spacing);
      const randomOffset = Math.floor((Math.random() - 0.5) * spacing * 0.3); // +/- 15% of spacing
      let wordIndex = Math.max(minIndex, Math.min(maxIndex, basePosition + randomOffset));

      // Ensure minimum distance from all existing power-ups
      let attempts = 0;
      while (attempts < 50) {
        let tooClose = false;
        for (const existingIndex of placements.keys()) {
          if (Math.abs(wordIndex - existingIndex) < minDistance) {
            tooClose = true;
            break;
          }
        }

        if (!tooClose && !placements.has(wordIndex)) {
          break; // Found a good position
        }

        // Try next position
        wordIndex = minIndex + Math.floor(Math.random() * availableRange);
        attempts++;
      }

      // Randomly select a power-up type
      const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      placements.set(wordIndex, powerUpType);
    }

    setPowerUpPlacements(placements);
  }, []);

  /**
   * Check if a word has a power-up
   */
  const getPowerUpAtWord = useCallback(
    (wordIndex: number) => {
      return powerUpPlacements.get(wordIndex) || null;
    },
    [powerUpPlacements]
  );

  return {
    gameScore,
    comboMultiplier,
    maxComboReached,
    currentStreak,
    bestStreak,
    streakBonus,
    powerUpPlacements,
    addWordScore,
    resetStreak,
    resetCombo,
    initializePowerUps,
    getPowerUpAtWord,
  };
}
