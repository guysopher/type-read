import { describe, expect, it } from 'vitest';
import {
  getSentencePowerUpPlacements,
  INLINE_POWER_UP_MARKERS,
  isSentenceEndingWord,
} from './powerUps';

describe('powerUps', () => {
  it('detects sentence-ending words with trailing punctuation wrappers', () => {
    expect(isSentenceEndingWord('Hello.')).toBe(true);
    expect(isSentenceEndingWord('Hello."')).toBe(true);
    expect(isSentenceEndingWord('Hello)')).toBe(false);
  });

  it('places power-ups on eligible sentence endings with a minimum word distance', () => {
    const words = [
      'One',
      'two.',
      'three',
      'four.',
      'five',
      'six',
      'seven.',
      'eight',
      'nine',
      'ten',
      'eleven.',
    ];

    const placements = getSentencePowerUpPlacements(words, 5);

    expect(Array.from(placements.keys())).toEqual([1, 6, 10]);
    expect(Array.from(placements.values())).toEqual(['freezeMonster', 'shield', 'slowMo']);
  });

  it('uses compact inline markers for text rendering', () => {
    expect(INLINE_POWER_UP_MARKERS.freezeMonster).toBe('❄️');
    expect(INLINE_POWER_UP_MARKERS.shield).toBe('🛡️');
    expect(INLINE_POWER_UP_MARKERS.slowMo).toBe('⏱️');
  });
});
