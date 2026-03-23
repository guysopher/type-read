import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMonsterChase } from './useMonsterChase';

// Mock the sounds module
vi.mock('@/lib/sounds', () => ({
  playBackgroundMusic: vi.fn(),
  stopBackgroundMusic: vi.fn(),
  pauseBackgroundMusic: vi.fn(),
  resumeBackgroundMusic: vi.fn(),
}));

import {
  playBackgroundMusic,
  stopBackgroundMusic,
  pauseBackgroundMusic,
  resumeBackgroundMusic,
} from '@/lib/sounds';

describe('useMonsterChase', () => {
  const defaultProps = {
    enabled: true,
    playerPosition: 100,
    oneWordBehindPosition: 80,
    isPaused: false,
    isComplete: false,
    musicEnabled: true,
    onGameOver: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      expect(result.current.monsterPosition).toBe(0);
      expect(result.current.monsterSpeed).toBe(2);
      expect(result.current.monsterStarted).toBe(false);
      expect(result.current.monsterCountdown).toBeNull();
      expect(result.current.isGameOver).toBe(false);
      expect(result.current.activePowerUps).toEqual({
        freeze: false,
        shield: false,
        slowMo: false,
      });
    });

    it('should position monster at "one word behind" when not started', () => {
      const { result, rerender } = renderHook(
        (props) => useMonsterChase(props),
        { initialProps: defaultProps }
      );

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.monsterPosition).toBe(80);
    });
  });

  describe('startCountdown', () => {
    it('should start 10-second countdown', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.startCountdown();
      });

      expect(result.current.monsterCountdown).toBe(10);
    });

    it('should not start countdown if disabled', () => {
      const { result } = renderHook(() =>
        useMonsterChase({ ...defaultProps, enabled: false })
      );

      act(() => {
        result.current.startCountdown();
      });

      expect(result.current.monsterCountdown).toBeNull();
    });

    it('should not start countdown if already counting', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.startCountdown();
      });

      const countdownValue = result.current.monsterCountdown;

      act(() => {
        result.current.startCountdown(); // Try to start again
      });

      expect(result.current.monsterCountdown).toBe(countdownValue);
    });

    it('should count down every second', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.startCountdown();
      });

      expect(result.current.monsterCountdown).toBe(10);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.monsterCountdown).toBe(9);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.monsterCountdown).toBe(8);
    });

    it('should start monster after countdown reaches 0', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.startCountdown();
      });

      act(() => {
        vi.advanceTimersByTime(10000); // 10 seconds
      });

      expect(result.current.monsterStarted).toBe(true);
      expect(result.current.monsterCountdown).toBeNull();
    });

    it('should play background music when monster starts', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.startCountdown();
        vi.advanceTimersByTime(10000);
      });

      expect(playBackgroundMusic).toHaveBeenCalled();
    });

    it('should not play music if musicEnabled is false', () => {
      const { result } = renderHook(() =>
        useMonsterChase({ ...defaultProps, musicEnabled: false })
      );

      act(() => {
        result.current.startCountdown();
        vi.advanceTimersByTime(10000);
      });

      expect(playBackgroundMusic).not.toHaveBeenCalled();
    });

    it('should call onMonsterStart when monster starts', () => {
      const onMonsterStart = vi.fn();
      const { result } = renderHook(() =>
        useMonsterChase({ ...defaultProps, onMonsterStart })
      );

      act(() => {
        result.current.startCountdown();
        vi.advanceTimersByTime(10000);
      });

      expect(onMonsterStart).toHaveBeenCalled();
    });
  });

  describe('recordKeystroke', () => {
    it('should record correct keystrokes', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.recordKeystroke(true, Date.now());
        result.current.recordKeystroke(true, Date.now());
      });

      // Keystrokes are recorded internally for speed calculation
      // We can verify by starting the monster and checking speed
    });

    it('should calculate initial speed from keystrokes', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      const startTime = Date.now();

      act(() => {
        result.current.startCountdown();

        // Record some keystrokes during countdown
        for (let i = 0; i < 10; i++) {
          result.current.recordKeystroke(true, startTime + i * 100);
        }

        vi.advanceTimersByTime(10000);
      });

      // Speed should be calculated from keystrokes
      // 10 keystrokes in ~1 second = ~10 chars/sec
      expect(result.current.monsterSpeed).toBeGreaterThan(2);
    });
  });

  describe('activatePowerUp', () => {
    it('should activate freeze power-up', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.activatePowerUp('freezeMonster');
      });

      expect(result.current.activePowerUps.freeze).toBe(true);
    });

    it('should deactivate freeze after 10 seconds', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.activatePowerUp('freezeMonster');
      });

      expect(result.current.activePowerUps.freeze).toBe(true);

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.activePowerUps.freeze).toBe(false);
    });

    it('should activate shield power-up', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.activatePowerUp('shield');
      });

      expect(result.current.activePowerUps.shield).toBe(true);
    });

    it('should activate slow-mo power-up', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.activatePowerUp('slowMo');
      });

      expect(result.current.activePowerUps.slowMo).toBe(true);
    });

    it('should deactivate slow-mo after 15 seconds', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.activatePowerUp('slowMo');
      });

      expect(result.current.activePowerUps.slowMo).toBe(true);

      act(() => {
        vi.advanceTimersByTime(15000);
      });

      expect(result.current.activePowerUps.slowMo).toBe(false);
    });
  });

  describe('monster movement', () => {
    it('should not move monster before started', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      const initialPosition = result.current.monsterPosition;

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.monsterPosition).toBe(initialPosition);
    });

    it('should move monster after starting', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.startCountdown();
        vi.advanceTimersByTime(10000); // Start monster
      });

      const initialPosition = result.current.monsterPosition;

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.monsterPosition).toBeGreaterThan(initialPosition);
    });

    it('should not move monster when frozen', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.startCountdown();
        vi.advanceTimersByTime(10000);
      });

      act(() => {
        result.current.activatePowerUp('freezeMonster');
      });

      const frozenPosition = result.current.monsterPosition;

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.monsterPosition).toBe(frozenPosition);
    });

    it('should move slower with slow-mo active', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.startCountdown();
        vi.advanceTimersByTime(10000);
      });

      // Move without slow-mo
      const positionBefore = result.current.monsterPosition;

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      const normalMovement = result.current.monsterPosition - positionBefore;

      act(() => {
        result.current.activatePowerUp('slowMo');
      });

      const slowMoPositionBefore = result.current.monsterPosition;

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      const slowMoMovement = result.current.monsterPosition - slowMoPositionBefore;

      // Slow-mo should move at 50% speed
      expect(slowMoMovement).toBeLessThan(normalMovement);
    });

    it('should pause monster when game is paused', () => {
      const { result, rerender } = renderHook(
        (props) => useMonsterChase(props),
        { initialProps: defaultProps }
      );

      act(() => {
        result.current.startCountdown();
        vi.advanceTimersByTime(10000);
      });

      const positionBeforePause = result.current.monsterPosition;

      rerender({ ...defaultProps, isPaused: true });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.monsterPosition).toBe(positionBeforePause);
    });

    it('should stop monster when game is complete', () => {
      const { result, rerender } = renderHook(
        (props) => useMonsterChase(props),
        { initialProps: defaultProps }
      );

      act(() => {
        result.current.startCountdown();
        vi.advanceTimersByTime(10000);
      });

      const positionBeforeComplete = result.current.monsterPosition;

      rerender({ ...defaultProps, isComplete: true });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.monsterPosition).toBe(positionBeforeComplete);
    });
  });

  describe('game over detection', () => {
    it('should trigger game over when monster catches player', () => {
      const onGameOver = vi.fn();
      const { result, rerender } = renderHook(
        (props) => useMonsterChase(props),
        { initialProps: { ...defaultProps, onGameOver, playerPosition: 100 } }
      );

      act(() => {
        result.current.startCountdown();
        vi.advanceTimersByTime(10000);
      });

      // Move player close to monster
      rerender({ ...defaultProps, onGameOver, playerPosition: 10 });

      act(() => {
        vi.advanceTimersByTime(5000); // Give monster time to catch up
      });

      expect(result.current.isGameOver).toBe(true);
      expect(onGameOver).toHaveBeenCalled();
    });

    it('should use shield when monster catches player', () => {
      const onGameOver = vi.fn();
      const { result, rerender } = renderHook(
        (props) => useMonsterChase(props),
        { initialProps: { ...defaultProps, onGameOver, playerPosition: 100 } }
      );

      act(() => {
        result.current.startCountdown();
        result.current.activatePowerUp('shield');
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.activePowerUps.shield).toBe(true);

      // Move player close to monster
      rerender({ ...defaultProps, onGameOver, playerPosition: 10 });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Shield should be used, no game over
      expect(result.current.activePowerUps.shield).toBe(false);
      expect(result.current.isGameOver).toBe(false);
      expect(onGameOver).not.toHaveBeenCalled();
    });

    it('should push monster back when shield is used', () => {
      const { result, rerender } = renderHook(
        (props) => useMonsterChase(props),
        { initialProps: { ...defaultProps, playerPosition: 100 } }
      );

      act(() => {
        result.current.startCountdown();
        result.current.activatePowerUp('shield');
        vi.advanceTimersByTime(10000);
      });

      const positionBeforeShield = result.current.monsterPosition;

      // Move player close to trigger shield
      rerender({ ...defaultProps, playerPosition: 10 });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Monster should be pushed back
      expect(result.current.monsterPosition).toBeLessThan(positionBeforeShield);
    });
  });

  describe('music control', () => {
    it('should pause music when game is paused', () => {
      const { rerender } = renderHook(
        (props) => useMonsterChase(props),
        { initialProps: defaultProps }
      );

      rerender({ ...defaultProps, isPaused: true });

      act(() => {
        vi.runAllTimers();
      });

      expect(pauseBackgroundMusic).toHaveBeenCalled();
    });

    it('should resume music when game is unpaused', () => {
      const { result, rerender } = renderHook(
        (props) => useMonsterChase(props),
        { initialProps: defaultProps }
      );

      act(() => {
        result.current.startCountdown();
        vi.advanceTimersByTime(10000);
      });

      rerender({ ...defaultProps, isPaused: true });

      act(() => {
        vi.runAllTimers();
      });

      rerender({ ...defaultProps, isPaused: false });

      act(() => {
        vi.runAllTimers();
      });

      expect(resumeBackgroundMusic).toHaveBeenCalled();
    });

    it('should stop music when game is over', () => {
      const { rerender } = renderHook(
        (props) => useMonsterChase(props),
        { initialProps: defaultProps }
      );

      rerender({ ...defaultProps, isComplete: true });

      act(() => {
        vi.runAllTimers();
      });

      expect(stopBackgroundMusic).toHaveBeenCalled();
    });

    it('should stop music on unmount', () => {
      const { unmount } = renderHook(() => useMonsterChase(defaultProps));

      unmount();

      expect(stopBackgroundMusic).toHaveBeenCalled();
    });
  });

  describe('speed calculation', () => {
    it('should calculate speed from recent keystrokes', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      const now = Date.now();

      act(() => {
        result.current.startCountdown();

        // Record fast typing
        for (let i = 0; i < 20; i++) {
          result.current.recordKeystroke(true, now + i * 50);
        }

        vi.advanceTimersByTime(10000);
      });

      // Speed should reflect fast typing
      expect(result.current.monsterSpeed).toBeGreaterThan(5);
    });

    it('should have minimum speed of 2 chars/sec', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.startCountdown();
        // No keystrokes recorded
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.monsterSpeed).toBeGreaterThanOrEqual(2);
    });

    it('should update speed dynamically based on typing performance', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      const now = Date.now();

      act(() => {
        result.current.startCountdown();

        // Record initial keystrokes
        for (let i = 0; i < 10; i++) {
          result.current.recordKeystroke(true, now + i * 100);
        }

        vi.advanceTimersByTime(10000);
      });

      const initialSpeed = result.current.monsterSpeed;

      // Record more keystrokes
      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.recordKeystroke(true, now + 10000 + i * 50);
        }

        vi.advanceTimersByTime(2000); // Speed updates every second
      });

      // Speed should increase with faster typing
      expect(result.current.monsterSpeed).toBeGreaterThan(initialSpeed);
    });
  });

  describe('edge cases', () => {
    it('should handle monster disabled', () => {
      const { result } = renderHook(() =>
        useMonsterChase({ ...defaultProps, enabled: false })
      );

      act(() => {
        result.current.startCountdown();
      });

      expect(result.current.monsterCountdown).toBeNull();
      expect(result.current.monsterStarted).toBe(false);
    });

    it('should handle multiple power-ups active simultaneously', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.activatePowerUp('freezeMonster');
        result.current.activatePowerUp('shield');
        result.current.activatePowerUp('slowMo');
      });

      expect(result.current.activePowerUps.freeze).toBe(true);
      expect(result.current.activePowerUps.shield).toBe(true);
      expect(result.current.activePowerUps.slowMo).toBe(true);
    });

    it('should handle countdown reaching 0 with no keystrokes', () => {
      const { result } = renderHook(() => useMonsterChase(defaultProps));

      act(() => {
        result.current.startCountdown();
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.monsterStarted).toBe(true);
      expect(result.current.monsterSpeed).toBe(2); // Minimum speed
    });
  });
});
