import { useState, useEffect, useRef, useCallback } from 'react';
import {
  playBackgroundMusic,
  stopBackgroundMusic,
  pauseBackgroundMusic,
  resumeBackgroundMusic,
} from '@/lib/sounds';

export interface PowerUpState {
  freeze: boolean;
  shield: boolean;
  slowMo: boolean;
}

export interface UseMonsterChaseProps {
  enabled: boolean;
  playerPosition: number; // Absolute character position of player's cursor
  oneWordBehindPosition: number; // Position one word behind player
  isPaused: boolean;
  isComplete: boolean;
  musicEnabled: boolean;
  onGameOver: () => void;
  onMonsterStart?: (timestamp: number) => void;
  onShieldBlock?: () => void;
}

export function useMonsterChase({
  enabled,
  playerPosition,
  oneWordBehindPosition,
  isPaused,
  isComplete,
  musicEnabled,
  onGameOver,
  onMonsterStart,
  onShieldBlock,
}: UseMonsterChaseProps) {
  const [monsterPosition, setMonsterPosition] = useState(0);
  const [monsterSpeed, setMonsterSpeed] = useState(2); // characters per second
  const [monsterStarted, setMonsterStarted] = useState(false);
  const [monsterCountdown, setMonsterCountdown] = useState<number | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [activePowerUps, setActivePowerUps] = useState<PowerUpState>({
    freeze: false,
    shield: false,
    slowMo: false,
  });

  const monsterIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const monsterStartTimeRef = useRef<number | null>(null);
  const correctKeystrokesRef = useRef<number[]>([]); // timestamps of correct keystrokes
  const allKeystrokesRef = useRef<number[]>([]); // all keystrokes for initial speed calc

  /**
   * Calculate typing speed (chars/sec) from correctly typed chars over last 60 seconds
   */
  const calculateLastMinuteSpeed = useCallback(() => {
    const now = Date.now();
    const windowMs = 60000; // 60 second window (1 minute)

    // Filter to correct keystrokes in the last minute
    const recentCorrect = correctKeystrokesRef.current.filter(ts => now - ts < windowMs);
    correctKeystrokesRef.current = recentCorrect; // Clean up old ones

    if (recentCorrect.length < 2) return 0;

    // Calculate chars per second based on correct keystrokes only
    const oldest = recentCorrect[0];
    const timeSpanSec = (now - oldest) / 1000;

    if (timeSpanSec < 1) return 0;

    // Return correctly typed chars per second
    return recentCorrect.length / timeSpanSec;
  }, []);

  /**
   * Start the 10-second countdown before monster begins chasing
   */
  const startCountdown = useCallback(() => {
    if (!enabled || monsterCountdown !== null || monsterStarted) return;
    setMonsterCountdown(10);
  }, [enabled, monsterCountdown, monsterStarted]);

  /**
   * Record a keystroke for speed calculation
   */
  const recordKeystroke = useCallback(
    (isCorrect: boolean, timestamp: number) => {
      if (!monsterStarted) {
        allKeystrokesRef.current.push(timestamp);
      }
      if (isCorrect) {
        correctKeystrokesRef.current.push(timestamp);
      }
    },
    [monsterStarted]
  );

  /**
   * Activate a power-up
   */
  const activatePowerUp = useCallback((type: 'freezeMonster' | 'shield' | 'slowMo') => {
    if (type === 'freezeMonster') {
      setActivePowerUps(prev => ({ ...prev, freeze: true }));
      // Freeze monster for 10 seconds
      setTimeout(() => {
        setActivePowerUps(prev => ({ ...prev, freeze: false }));
      }, 10000);
    } else if (type === 'shield') {
      setActivePowerUps(prev => ({ ...prev, shield: true }));
      // Shield lasts until used (one-time protection)
    } else if (type === 'slowMo') {
      setActivePowerUps(prev => ({ ...prev, slowMo: true }));
      // Slow-mo for 15 seconds
      setTimeout(() => {
        setActivePowerUps(prev => ({ ...prev, slowMo: false }));
      }, 15000);
    }
  }, []);

  /**
   * Keep monster at "one word behind" position until countdown starts
   */
  useEffect(() => {
    if (enabled && !monsterStarted && monsterCountdown === null) {
      setMonsterPosition(oneWordBehindPosition);
    }
  }, [enabled, monsterStarted, monsterCountdown, oneWordBehindPosition]);

  /**
   * Handle monster countdown timer
   */
  useEffect(() => {
    if (monsterCountdown === null || monsterCountdown < 0) return;

    if (monsterCountdown === 0) {
      // Countdown finished - monster wakes up!
      // Calculate initial speed from keystrokes during the 10-second grace period
      const keystrokes = allKeystrokesRef.current;
      let playerCharsPerSec = 2; // default minimum

      if (keystrokes.length >= 2) {
        const firstKeystroke = keystrokes[0];
        const lastKeystroke = keystrokes[keystrokes.length - 1];
        const activeTypingTime = (lastKeystroke - firstKeystroke) / 1000;

        if (activeTypingTime > 0.5) {
          playerCharsPerSec = Math.max(keystrokes.length / activeTypingTime, 2);
        }
      }

      setMonsterSpeed(playerCharsPerSec);
      setMonsterStarted(true);
      setMonsterCountdown(null);
      monsterStartTimeRef.current = Date.now();
      onMonsterStart?.(Date.now());

      // Start the chase music!
      if (musicEnabled) playBackgroundMusic();
      return;
    }

    // Tick down every second
    const timer = setTimeout(() => {
      setMonsterCountdown(monsterCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [monsterCountdown, musicEnabled, onMonsterStart]);

  /**
   * Handle music based on game state
   */
  useEffect(() => {
    if (isGameOver || isComplete) {
      stopBackgroundMusic();
    } else if (isPaused) {
      pauseBackgroundMusic();
    } else if (monsterStarted && musicEnabled) {
      resumeBackgroundMusic();
    }
  }, [isGameOver, isComplete, isPaused, monsterStarted, musicEnabled]);

  /**
   * Stop music on unmount
   */
  useEffect(() => {
    return () => {
      stopBackgroundMusic();
    };
  }, []);

  /**
   * Monster chase game loop - movement and adaptive difficulty
   */
  useEffect(() => {
    if (!monsterStarted || isComplete || isGameOver || isPaused) {
      if (monsterIntervalRef.current) {
        clearInterval(monsterIntervalRef.current);
        monsterIntervalRef.current = null;
      }
      return;
    }

    // Monster moves every 50ms for smooth animation
    monsterIntervalRef.current = setInterval(() => {
      setMonsterPosition(prev => {
        if (prev < 0) return prev; // Not started yet

        // Don't move if frozen
        if (activePowerUps.freeze) return prev;

        // Apply slow-mo if active
        const speedMultiplier = activePowerUps.slowMo ? 0.5 : 1;
        const newPos = prev + (monsterSpeed / 20) * speedMultiplier; // 20 updates per second

        // Check if monster caught the player
        if (newPos >= playerPosition) {
          // Use shield if available
          if (activePowerUps.shield) {
            setActivePowerUps(p => ({ ...p, shield: false }));
            onShieldBlock?.(); // Notify that shield blocked the monster
            // Push monster back
            return prev - 50; // Move back significantly
          } else {
            setIsGameOver(true);
            onGameOver();
            return prev;
          }
        }
        return newPos;
      });
    }, 50);

    // Update monster speed every second based on adaptive difficulty algorithm
    const speedUpdateInterval = setInterval(() => {
      const lastMinuteSpeed = calculateLastMinuteSpeed(); // chars/sec from last 60 seconds

      if (lastMinuteSpeed > 0 && monsterStartTimeRef.current) {
        const elapsedSeconds = (Date.now() - monsterStartTimeRef.current) / 1000;

        // 1. Skill-Based Scaling: Determine player skill tier
        // Fast typers (>5 c/s ≈ 60 WPM): 1.0-1.5x multiplier
        // Medium typers (3-5 c/s ≈ 36-60 WPM): 0.8-1.0x multiplier
        // Slow typers (<3 c/s ≈ <36 WPM): 0.6-0.8x multiplier
        const playerCPS = lastMinuteSpeed;
        const skillMultiplier = Math.min(Math.max(0.6 + playerCPS / 10, 0.6), 1.5);

        // 2. Sigmoid Curve Progression: Smooth S-curve (starts gentle, accelerates mid-game, plateaus)
        // Formula: bonus = maxBonus / (1 + e^(-steepness * (time - midpoint)))
        const maxBonus = 8 * skillMultiplier; // Max bonus scaled by skill (4.8-12 c/s)
        const midpoint = 60; // S-curve inflection point at 60 seconds
        const steepness = 0.05 * skillMultiplier; // Curve steepness scales with skill
        const sigmoidBonus =
          maxBonus / (1 + Math.exp(-steepness * (elapsedSeconds - midpoint)));

        // 3. Rubber-Banding: Adjust based on player lead/lag
        // Distance in characters between player and monster
        const distance = playerPosition - monsterPosition;
        const targetDistance = lastMinuteSpeed * 10; // Target: ~10 seconds of typing ahead

        // Rubber-banding factor: 0.9-1.1x based on distance from target
        // Player far ahead → monster speeds up (+10%)
        // Player close/behind → monster slows down (-10%)
        const distanceRatio = distance / Math.max(targetDistance, 20);
        const rubberBandFactor = Math.min(Math.max(0.9 + (1 - distanceRatio) * 0.2, 0.9), 1.1);

        // 4. Combine all factors: base speed * rubber-banding + sigmoid progression
        const baseSpeed = lastMinuteSpeed * rubberBandFactor;
        const newSpeed = baseSpeed + sigmoidBonus;

        // Clamp between minimum (2 c/s) and maximum (30 c/s for fast typers)
        const maxSpeed = 20 + 10 * (skillMultiplier - 0.6); // 20-29 c/s based on skill
        setMonsterSpeed(Math.min(Math.max(newSpeed, 2), maxSpeed));
      }
    }, 1000);

    return () => {
      if (monsterIntervalRef.current) {
        clearInterval(monsterIntervalRef.current);
        monsterIntervalRef.current = null;
      }
      clearInterval(speedUpdateInterval);
    };
  }, [
    monsterStarted,
    isComplete,
    isGameOver,
    isPaused,
    playerPosition,
    monsterSpeed,
    activePowerUps,
    calculateLastMinuteSpeed,
    onGameOver,
    onShieldBlock,
  ]);

  return {
    monsterPosition,
    monsterSpeed,
    monsterStarted,
    monsterCountdown,
    isGameOver,
    activePowerUps,
    startCountdown,
    recordKeystroke,
    activatePowerUp,
  };
}
