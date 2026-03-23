import { describe, it, expect } from 'vitest';
import {
  stripNonAlpha,
  compareStrings,
  isCorrectChar,
  getNextCharToType,
  countMistakes,
  isFullyTyped,
  type ComparisonOptions,
} from './typingComparison';

describe('typingComparison', () => {
  describe('stripNonAlpha', () => {
    it('should strip punctuation when shouldStrip is true', () => {
      expect(stripNonAlpha('hello, world!', true)).toBe('helloworld');
      expect(stripNonAlpha('test123', true)).toBe('test');
      expect(stripNonAlpha('foo-bar', true)).toBe('foobar');
    });

    it('should preserve original string when shouldStrip is false', () => {
      expect(stripNonAlpha('hello, world!', false)).toBe('hello, world!');
      expect(stripNonAlpha('test123', false)).toBe('test123');
    });

    it('should preserve Hebrew characters', () => {
      expect(stripNonAlpha('שלום עולם!', true)).toBe('שלוםעולם');
      expect(stripNonAlpha('שלום', true)).toBe('שלום');
    });

    it('should handle empty strings', () => {
      expect(stripNonAlpha('', true)).toBe('');
      expect(stripNonAlpha('', false)).toBe('');
    });

    it('should handle strings with only punctuation', () => {
      expect(stripNonAlpha('!!!', true)).toBe('');
      expect(stripNonAlpha('123...', true)).toBe('');
    });
  });

  describe('compareStrings', () => {
    const strictOptions: ComparisonOptions = {
      forgiveCapitals: false,
      forgiveNonAlpha: false,
    };

    const forgiveCapsOptions: ComparisonOptions = {
      forgiveCapitals: true,
      forgiveNonAlpha: false,
    };

    const forgivePuncOptions: ComparisonOptions = {
      forgiveCapitals: false,
      forgiveNonAlpha: true,
    };

    const forgiveAllOptions: ComparisonOptions = {
      forgiveCapitals: true,
      forgiveNonAlpha: true,
    };

    describe('strict mode', () => {
      it('should match identical strings', () => {
        expect(compareStrings('hello', 'hello', strictOptions)).toBe(true);
        expect(compareStrings('test', 'test', strictOptions)).toBe(true);
      });

      it('should not match different strings', () => {
        expect(compareStrings('hello', 'world', strictOptions)).toBe(false);
        expect(compareStrings('test', 'testing', strictOptions)).toBe(false);
      });

      it('should not match with different cases', () => {
        expect(compareStrings('Hello', 'hello', strictOptions)).toBe(false);
        expect(compareStrings('TEST', 'test', strictOptions)).toBe(false);
      });

      it('should not match with punctuation differences', () => {
        expect(compareStrings('hello', 'hello!', strictOptions)).toBe(false);
        expect(compareStrings('test', 'test.', strictOptions)).toBe(false);
      });
    });

    describe('forgive capitals', () => {
      it('should match strings with different cases', () => {
        expect(compareStrings('Hello', 'hello', forgiveCapsOptions)).toBe(true);
        expect(compareStrings('TEST', 'test', forgiveCapsOptions)).toBe(true);
        expect(compareStrings('TeSt', 'tEsT', forgiveCapsOptions)).toBe(true);
      });

      it('should still enforce punctuation', () => {
        expect(compareStrings('hello', 'hello!', forgiveCapsOptions)).toBe(false);
      });
    });

    describe('forgive punctuation', () => {
      it('should match strings ignoring punctuation', () => {
        expect(compareStrings('hello', 'hello!', forgivePuncOptions)).toBe(true);
        expect(compareStrings('test', 'test.', forgivePuncOptions)).toBe(true);
        expect(compareStrings('hello', 'he-llo', forgivePuncOptions)).toBe(true);
      });

      it('should still enforce case sensitivity', () => {
        expect(compareStrings('Hello', 'hello', forgivePuncOptions)).toBe(false);
      });
    });

    describe('forgive all', () => {
      it('should match with different cases and punctuation', () => {
        expect(compareStrings('Hello!', 'hello', forgiveAllOptions)).toBe(true);
        expect(compareStrings('TEST.', 'test', forgiveAllOptions)).toBe(true);
        expect(compareStrings('He-LLo!', 'hello', forgiveAllOptions)).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should return false for empty strings', () => {
        expect(compareStrings('', '', strictOptions)).toBe(false);
        expect(compareStrings('hello', '', strictOptions)).toBe(false);
        expect(compareStrings('', 'hello', strictOptions)).toBe(false);
      });

      it('should handle Hebrew text', () => {
        expect(compareStrings('שלום', 'שלום', strictOptions)).toBe(true);
        expect(compareStrings('שלום!', 'שלום', forgivePuncOptions)).toBe(true);
      });
    });
  });

  describe('isCorrectChar', () => {
    const strictOptions: ComparisonOptions = {
      forgiveCapitals: false,
      forgiveNonAlpha: false,
    };

    const forgiveCapsOptions: ComparisonOptions = {
      forgiveCapitals: true,
      forgiveNonAlpha: false,
    };

    const forgivePuncOptions: ComparisonOptions = {
      forgiveCapitals: false,
      forgiveNonAlpha: true,
    };

    describe('strict mode', () => {
      it('should match identical characters', () => {
        expect(isCorrectChar('a', 'a', strictOptions)).toBe(true);
        expect(isCorrectChar('z', 'z', strictOptions)).toBe(true);
      });

      it('should not match different characters', () => {
        expect(isCorrectChar('a', 'b', strictOptions)).toBe(false);
        expect(isCorrectChar('x', 'y', strictOptions)).toBe(false);
      });

      it('should not match different cases', () => {
        expect(isCorrectChar('A', 'a', strictOptions)).toBe(false);
        expect(isCorrectChar('z', 'Z', strictOptions)).toBe(false);
      });

      it('should match punctuation exactly', () => {
        expect(isCorrectChar('!', '!', strictOptions)).toBe(true);
        expect(isCorrectChar('.', '.', strictOptions)).toBe(true);
        expect(isCorrectChar('!', '.', strictOptions)).toBe(false);
      });
    });

    describe('forgive capitals', () => {
      it('should match characters with different cases', () => {
        expect(isCorrectChar('A', 'a', forgiveCapsOptions)).toBe(true);
        expect(isCorrectChar('z', 'Z', forgiveCapsOptions)).toBe(true);
      });

      it('should still require correct punctuation', () => {
        expect(isCorrectChar('!', '.', forgiveCapsOptions)).toBe(false);
      });
    });

    describe('forgive punctuation', () => {
      it('should always pass for non-alpha characters', () => {
        expect(isCorrectChar('x', '!', forgivePuncOptions)).toBe(true);
        expect(isCorrectChar('', '.', forgivePuncOptions)).toBe(true);
        expect(isCorrectChar('a', ',', forgivePuncOptions)).toBe(true);
      });

      it('should still enforce exact letter matching', () => {
        expect(isCorrectChar('a', 'b', forgivePuncOptions)).toBe(false);
      });
    });

    it('should handle Hebrew characters', () => {
      expect(isCorrectChar('ש', 'ש', strictOptions)).toBe(true);
      expect(isCorrectChar('ש', 'ל', strictOptions)).toBe(false);
    });
  });

  describe('getNextCharToType', () => {
    const strictOptions: ComparisonOptions = {
      forgiveCapitals: false,
      forgiveNonAlpha: false,
    };

    const forgiveCapsOptions: ComparisonOptions = {
      forgiveCapitals: true,
      forgiveNonAlpha: false,
    };

    it('should return space when word is complete', () => {
      expect(getNextCharToType('hello', 'hello', strictOptions)).toBe(' ');
      expect(getNextCharToType('test', 'test', strictOptions)).toBe(' ');
    });

    it('should return next character when typing correctly', () => {
      expect(getNextCharToType('h', 'hello', strictOptions)).toBe('e');
      expect(getNextCharToType('he', 'hello', strictOptions)).toBe('l');
      expect(getNextCharToType('hel', 'hello', strictOptions)).toBe('l');
    });

    it('should return first incorrect character when there is a mistake', () => {
      expect(getNextCharToType('hx', 'hello', strictOptions)).toBe('e');
      expect(getNextCharToType('tex', 'test', strictOptions)).toBe('s');
    });

    it('should return space when input is empty', () => {
      expect(getNextCharToType('', 'hello', strictOptions)).toBe('h');
    });

    it('should work with forgive capitals', () => {
      expect(getNextCharToType('HELL', 'hello', forgiveCapsOptions)).toBe('o');
      expect(getNextCharToType('HeLLo', 'hello', forgiveCapsOptions)).toBe(' ');
    });

    it('should handle overtyping', () => {
      expect(getNextCharToType('helloooo', 'hello', strictOptions)).toBe(' ');
    });
  });

  describe('countMistakes', () => {
    const strictOptions: ComparisonOptions = {
      forgiveCapitals: false,
      forgiveNonAlpha: false,
    };

    const forgiveCapsOptions: ComparisonOptions = {
      forgiveCapitals: true,
      forgiveNonAlpha: false,
    };

    const forgivePuncOptions: ComparisonOptions = {
      forgiveCapitals: false,
      forgiveNonAlpha: true,
    };

    describe('strict mode', () => {
      it('should return 0 for perfect match', () => {
        expect(countMistakes('hello', 'hello', strictOptions)).toBe(0);
        expect(countMistakes('test', 'test', strictOptions)).toBe(0);
      });

      it('should count character differences', () => {
        expect(countMistakes('hxllo', 'hello', strictOptions)).toBe(1);
        expect(countMistakes('hexxo', 'hello', strictOptions)).toBe(2);
      });

      it('should count length differences as mistakes', () => {
        expect(countMistakes('hel', 'hello', strictOptions)).toBe(2); // missing 2 chars
        expect(countMistakes('helloooo', 'hello', strictOptions)).toBe(3); // 3 extra chars
      });

      it('should count case differences as mistakes', () => {
        expect(countMistakes('Hello', 'hello', strictOptions)).toBe(1);
        expect(countMistakes('HELLO', 'hello', strictOptions)).toBe(5);
      });
    });

    describe('forgive capitals', () => {
      it('should not count case differences', () => {
        expect(countMistakes('Hello', 'hello', forgiveCapsOptions)).toBe(0);
        expect(countMistakes('HELLO', 'hello', forgiveCapsOptions)).toBe(0);
      });

      it('should still count other mistakes', () => {
        expect(countMistakes('Hxllo', 'hello', forgiveCapsOptions)).toBe(1);
      });
    });

    describe('forgive punctuation', () => {
      it('should ignore punctuation in comparison', () => {
        expect(countMistakes('hello!', 'hello', forgivePuncOptions)).toBe(0);
        expect(countMistakes('hello', 'hello!', forgivePuncOptions)).toBe(0);
        expect(countMistakes('he-llo', 'hello', forgivePuncOptions)).toBe(0);
      });

      it('should count letter mistakes', () => {
        expect(countMistakes('hxllo!', 'hello', forgivePuncOptions)).toBe(1);
      });
    });

    it('should handle empty strings', () => {
      expect(countMistakes('', 'hello', strictOptions)).toBe(5);
      expect(countMistakes('hello', '', strictOptions)).toBe(5);
    });

    it('should handle Hebrew text', () => {
      expect(countMistakes('שלום', 'שלום', strictOptions)).toBe(0);
      expect(countMistakes('שלךם', 'שלום', strictOptions)).toBe(2);
    });
  });

  describe('isFullyTyped', () => {
    const strictOptions: ComparisonOptions = {
      forgiveCapitals: false,
      forgiveNonAlpha: false,
    };

    const forgivePuncOptions: ComparisonOptions = {
      forgiveCapitals: false,
      forgiveNonAlpha: true,
    };

    it('should return true when lengths match', () => {
      expect(isFullyTyped('hello', 'hello', strictOptions)).toBe(true);
      expect(isFullyTyped('hxllo', 'hello', strictOptions)).toBe(true);
    });

    it('should return false when lengths differ', () => {
      expect(isFullyTyped('hel', 'hello', strictOptions)).toBe(false);
      expect(isFullyTyped('helloooo', 'hello', strictOptions)).toBe(false);
    });

    it('should ignore punctuation with forgivePunc option', () => {
      expect(isFullyTyped('hello', 'hello!', forgivePuncOptions)).toBe(true);
      expect(isFullyTyped('hello!', 'hello', forgivePuncOptions)).toBe(true);
    });

    it('should handle empty strings', () => {
      expect(isFullyTyped('', '', strictOptions)).toBe(true);
      expect(isFullyTyped('hello', '', strictOptions)).toBe(false);
    });

    it('should handle Hebrew text', () => {
      expect(isFullyTyped('שלום', 'שלום', strictOptions)).toBe(true);
      expect(isFullyTyped('של', 'שלום', strictOptions)).toBe(false);
    });
  });
});
