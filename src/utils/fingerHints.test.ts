import { describe, it, expect } from 'vitest';
import { getFingerHint, isHebrewChar, getKeysForFinger } from './fingerHints';

describe('fingerHints', () => {
  describe('getFingerHint', () => {
    describe('QWERTY layout - left hand', () => {
      it('should return correct hints for left pinky keys', () => {
        expect(getFingerHint('q')).toEqual({ finger: 'pinky', direction: '↑', hand: 'L' });
        expect(getFingerHint('a')).toEqual({ finger: 'pinky', direction: '●', hand: 'L' });
        expect(getFingerHint('z')).toEqual({ finger: 'pinky', direction: '↓', hand: 'L' });
        expect(getFingerHint('1')).toEqual({ finger: 'pinky', direction: '↑↑', hand: 'L' });
      });

      it('should return correct hints for left ring keys', () => {
        expect(getFingerHint('w')).toEqual({ finger: 'ring', direction: '↑', hand: 'L' });
        expect(getFingerHint('s')).toEqual({ finger: 'ring', direction: '●', hand: 'L' });
        expect(getFingerHint('x')).toEqual({ finger: 'ring', direction: '↓', hand: 'L' });
      });

      it('should return correct hints for left middle keys', () => {
        expect(getFingerHint('e')).toEqual({ finger: 'middle', direction: '↑', hand: 'L' });
        expect(getFingerHint('d')).toEqual({ finger: 'middle', direction: '●', hand: 'L' });
        expect(getFingerHint('c')).toEqual({ finger: 'middle', direction: '↓', hand: 'L' });
      });

      it('should return correct hints for left index keys', () => {
        expect(getFingerHint('r')).toEqual({ finger: 'index', direction: '↑', hand: 'L' });
        expect(getFingerHint('f')).toEqual({ finger: 'index', direction: '●', hand: 'L' });
        expect(getFingerHint('v')).toEqual({ finger: 'index', direction: '↓', hand: 'L' });
        expect(getFingerHint('t')).toEqual({ finger: 'index', direction: '↑→', hand: 'L' });
        expect(getFingerHint('g')).toEqual({ finger: 'index', direction: '→', hand: 'L' });
        expect(getFingerHint('b')).toEqual({ finger: 'index', direction: '↓→', hand: 'L' });
      });
    });

    describe('QWERTY layout - right hand', () => {
      it('should return correct hints for right index keys', () => {
        expect(getFingerHint('y')).toEqual({ finger: 'index', direction: '↑←', hand: 'R' });
        expect(getFingerHint('h')).toEqual({ finger: 'index', direction: '←', hand: 'R' });
        expect(getFingerHint('n')).toEqual({ finger: 'index', direction: '↓←', hand: 'R' });
        expect(getFingerHint('u')).toEqual({ finger: 'index', direction: '↑', hand: 'R' });
        expect(getFingerHint('j')).toEqual({ finger: 'index', direction: '●', hand: 'R' });
        expect(getFingerHint('m')).toEqual({ finger: 'index', direction: '↓', hand: 'R' });
      });

      it('should return correct hints for right middle keys', () => {
        expect(getFingerHint('i')).toEqual({ finger: 'middle', direction: '↑', hand: 'R' });
        expect(getFingerHint('k')).toEqual({ finger: 'middle', direction: '●', hand: 'R' });
        expect(getFingerHint(',')).toEqual({ finger: 'middle', direction: '↓', hand: 'R' });
      });

      it('should return correct hints for right ring keys', () => {
        expect(getFingerHint('o')).toEqual({ finger: 'ring', direction: '↑', hand: 'R' });
        expect(getFingerHint('l')).toEqual({ finger: 'ring', direction: '●', hand: 'R' });
        expect(getFingerHint('.')).toEqual({ finger: 'ring', direction: '↓', hand: 'R' });
      });

      it('should return correct hints for right pinky keys', () => {
        expect(getFingerHint('p')).toEqual({ finger: 'pinky', direction: '↑', hand: 'R' });
        expect(getFingerHint(';')).toEqual({ finger: 'pinky', direction: '●', hand: 'R' });
        expect(getFingerHint('/')).toEqual({ finger: 'pinky', direction: '↓', hand: 'R' });
        expect(getFingerHint('-')).toEqual({ finger: 'pinky', direction: '↑↑→', hand: 'R' });
        expect(getFingerHint('=')).toEqual({ finger: 'pinky', direction: '↑↑→→', hand: 'R' });
      });
    });

    describe('special keys', () => {
      it('should return correct hint for space', () => {
        expect(getFingerHint(' ')).toEqual({ finger: 'thumb', direction: '●', hand: 'either' });
      });

      it('should handle numbers', () => {
        expect(getFingerHint('1')).toEqual({ finger: 'pinky', direction: '↑↑', hand: 'L' });
        expect(getFingerHint('5')).toEqual({ finger: 'index', direction: '↑↑→', hand: 'L' });
        expect(getFingerHint('9')).toEqual({ finger: 'ring', direction: '↑↑', hand: 'R' });
        expect(getFingerHint('0')).toEqual({ finger: 'pinky', direction: '↑↑', hand: 'R' });
      });

      it('should handle punctuation', () => {
        expect(getFingerHint(',')).toEqual({ finger: 'middle', direction: '↓', hand: 'R' });
        expect(getFingerHint('.')).toEqual({ finger: 'ring', direction: '↓', hand: 'R' });
        expect(getFingerHint(';')).toEqual({ finger: 'pinky', direction: '●', hand: 'R' });
        expect(getFingerHint("'")).toEqual({ finger: 'pinky', direction: '→', hand: 'R' });
      });
    });

    describe('Hebrew layout', () => {
      it('should return correct hints for Hebrew left hand keys', () => {
        expect(getFingerHint('ש')).toEqual({ finger: 'pinky', direction: '●', hand: 'L' });
        expect(getFingerHint('ד')).toEqual({ finger: 'ring', direction: '●', hand: 'L' });
        expect(getFingerHint('ג')).toEqual({ finger: 'middle', direction: '●', hand: 'L' });
        expect(getFingerHint('כ')).toEqual({ finger: 'index', direction: '●', hand: 'L' });
      });

      it('should return correct hints for Hebrew right hand keys', () => {
        expect(getFingerHint('ח')).toEqual({ finger: 'index', direction: '●', hand: 'R' });
        expect(getFingerHint('ל')).toEqual({ finger: 'middle', direction: '●', hand: 'R' });
        expect(getFingerHint('ך')).toEqual({ finger: 'ring', direction: '●', hand: 'R' });
        expect(getFingerHint('ף')).toEqual({ finger: 'pinky', direction: '●', hand: 'R' });
      });

      it('should handle Hebrew characters with directions', () => {
        expect(getFingerHint('ק')).toEqual({ finger: 'middle', direction: '↑', hand: 'L' });
        expect(getFingerHint('ב')).toEqual({ finger: 'middle', direction: '↓', hand: 'L' });
        expect(getFingerHint('א')).toEqual({ finger: 'index', direction: '↑→', hand: 'L' });
        expect(getFingerHint('ע')).toEqual({ finger: 'index', direction: '→', hand: 'L' });
      });
    });

    describe('case sensitivity', () => {
      it('should be case-insensitive', () => {
        expect(getFingerHint('A')).toEqual({ finger: 'pinky', direction: '●', hand: 'L' });
        expect(getFingerHint('Z')).toEqual({ finger: 'pinky', direction: '↓', hand: 'L' });
        expect(getFingerHint('H')).toEqual({ finger: 'index', direction: '←', hand: 'R' });
      });
    });

    describe('unknown characters', () => {
      it('should return null for unmapped characters', () => {
        expect(getFingerHint('€')).toBeNull();
        expect(getFingerHint('~')).toBeNull();
        expect(getFingerHint('@')).toBeNull();
      });

      it('should return null for empty string', () => {
        expect(getFingerHint('')).toBeNull();
      });
    });
  });

  describe('isHebrewChar', () => {
    it('should return true for Hebrew characters', () => {
      expect(isHebrewChar('א')).toBe(true);
      expect(isHebrewChar('ש')).toBe(true);
      expect(isHebrewChar('ל')).toBe(true);
      expect(isHebrewChar('ם')).toBe(true);
    });

    it('should return false for non-Hebrew characters', () => {
      expect(isHebrewChar('a')).toBe(false);
      expect(isHebrewChar('z')).toBe(false);
      expect(isHebrewChar('1')).toBe(false);
      expect(isHebrewChar(' ')).toBe(false);
      expect(isHebrewChar('!')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(isHebrewChar('')).toBe(false);
    });

    it('should handle multi-character strings', () => {
      expect(isHebrewChar('שלום')).toBe(true);
      expect(isHebrewChar('hello')).toBe(false);
    });
  });

  describe('getKeysForFinger', () => {
    it('should return all left pinky keys', () => {
      const keys = getKeysForFinger('pinky', 'L');
      expect(keys).toContain('q');
      expect(keys).toContain('a');
      expect(keys).toContain('z');
      expect(keys).toContain('1');
      expect(keys).toContain('ש');
      expect(keys).not.toContain('p'); // right pinky
    });

    it('should return all right index keys', () => {
      const keys = getKeysForFinger('index', 'R');
      expect(keys).toContain('y');
      expect(keys).toContain('h');
      expect(keys).toContain('n');
      expect(keys).toContain('u');
      expect(keys).toContain('j');
      expect(keys).toContain('m');
      expect(keys).toContain('ח');
      expect(keys).not.toContain('f'); // left index
    });

    it('should return thumb keys for either hand', () => {
      const keys = getKeysForFinger('thumb', 'either');
      expect(keys).toContain(' ');
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should return all left middle keys', () => {
      const keys = getKeysForFinger('middle', 'L');
      expect(keys).toContain('e');
      expect(keys).toContain('d');
      expect(keys).toContain('c');
      expect(keys).toContain('3');
      expect(keys).toContain('ג');
    });

    it('should return all right ring keys', () => {
      const keys = getKeysForFinger('ring', 'R');
      expect(keys).toContain('o');
      expect(keys).toContain('l');
      expect(keys).toContain('.');
      expect(keys).toContain('9');
      expect(keys).toContain('ך');
    });

    it('should return empty array for non-existent finger', () => {
      const keys = getKeysForFinger('elbow', 'L');
      expect(keys).toEqual([]);
    });

    it('should include Hebrew characters in results', () => {
      const leftIndexKeys = getKeysForFinger('index', 'L');
      expect(leftIndexKeys).toContain('כ');
      expect(leftIndexKeys).toContain('ע');
      expect(leftIndexKeys).toContain('נ');
    });

    it('should separate left and right hand keys correctly', () => {
      const leftMiddle = getKeysForFinger('middle', 'L');
      const rightMiddle = getKeysForFinger('middle', 'R');

      expect(leftMiddle).toContain('e');
      expect(leftMiddle).not.toContain('i');

      expect(rightMiddle).toContain('i');
      expect(rightMiddle).not.toContain('e');
    });
  });
});
