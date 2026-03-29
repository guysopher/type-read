import { describe, expect, it } from 'vitest';
import {
  decodeHtmlEntities,
  prepareTextForTyping,
  sanitizeTypingText,
  stripTypingMarkdown,
} from './textProcessing';

describe('textProcessing', () => {
  describe('sanitizeTypingText', () => {
    it('removes invisible and object replacement characters', () => {
      const input = 'Hello\u200B world\uFFFC!\uFEFF';

      expect(sanitizeTypingText(input)).toBe('Hello world!');
    });

    it('removes emoji and normalizes unicode spaces', () => {
      const input = 'One\tTwo\u00A0Three🙂';

      expect(sanitizeTypingText(input)).toBe('One Two Three');
    });

    it('preserves normal punctuation and Hebrew text', () => {
      const input = 'שלום, world! 123';

      expect(sanitizeTypingText(input)).toBe('שלום, world! 123');
    });
  });

  describe('stripTypingMarkdown', () => {
    it('removes common markdown syntax while preserving readable text', () => {
      const input = '# Title\n\n**Bold** [link](https://example.com) `code`';

      expect(stripTypingMarkdown(input)).toBe('Title\n\nBold link code');
    });
  });

  describe('prepareTextForTyping', () => {
    it('combines sanitization and markdown cleanup', () => {
      const input = '# Heading\u200B\n\n- First item\n- Second item\uFFFC';

      expect(prepareTextForTyping(input)).toBe('Heading\n\nFirst item\nSecond item');
    });
  });

  describe('decodeHtmlEntities', () => {
    it('decodes the supported HTML entities', () => {
      const input = '&quot;Hello&nbsp;&amp;&nbsp;goodbye&#39; &lt;tag&gt; &#x2F;';

      expect(decodeHtmlEntities(input)).toBe('"Hello & goodbye\' <tag> /');
    });
  });
});
