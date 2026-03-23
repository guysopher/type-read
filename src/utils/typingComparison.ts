/**
 * Typing comparison utilities for validating user input against expected text
 */

export interface ComparisonOptions {
  forgiveCapitals: boolean;
  forgiveNonAlpha: boolean;
}

/**
 * Strip non-alphabetic characters from a string
 * Keeps letters (including Hebrew characters) only
 */
export function stripNonAlpha(s: string, shouldStrip: boolean): string {
  // If forgiveNonAlpha is on, strip punctuation and keep only letters
  return shouldStrip ? s.replace(/[^a-zA-Z\u0590-\u05FF]/g, "") : s;
}

/**
 * Compare two strings with optional forgiveness for capitals and non-alpha characters
 * Returns true if strings match according to the provided options
 */
export function compareStrings(
  a: string,
  b: string,
  options: ComparisonOptions
): boolean {
  // Strip punctuation if forgiveNonAlpha is on
  let strA = stripNonAlpha(a, options.forgiveNonAlpha);
  let strB = stripNonAlpha(b, options.forgiveNonAlpha);

  // Make case-insensitive if forgiveCapitals is on
  if (options.forgiveCapitals) {
    strA = strA.toLowerCase();
    strB = strB.toLowerCase();
  }

  // Empty strings don't match (need at least some letters)
  if (strA.length === 0 || strB.length === 0) return false;

  return strA === strB;
}

/**
 * Check if a single character is correctly typed
 * Handles capital forgiveness and non-alpha forgiveness
 */
export function isCorrectChar(
  inputChar: string,
  expectedChar: string,
  options: ComparisonOptions
): boolean {
  const isNonAlpha = /[^a-zA-Z\u0590-\u05FF]/.test(expectedChar);

  if (options.forgiveNonAlpha && isNonAlpha) {
    return true;
  }

  if (options.forgiveCapitals) {
    return inputChar.toLowerCase() === expectedChar.toLowerCase();
  }

  return inputChar === expectedChar;
}

/**
 * Get the next character the user should type
 * Returns the first incorrect character, or the next expected character
 */
export function getNextCharToType(
  currentInput: string,
  currentWord: string,
  options: ComparisonOptions
): string {
  // If word is complete, next is space
  const isWordComplete = compareStrings(currentInput, currentWord, options);
  if (isWordComplete) return ' ';

  // Find first incorrect character position
  for (let i = 0; i < currentInput.length; i++) {
    const inputChar = currentInput[i];
    const expectedChar = currentWord[i];
    if (!expectedChar) break; // Typed more than word length

    if (!isCorrectChar(inputChar, expectedChar, options)) {
      // Show the character they need to fix
      return expectedChar;
    }
  }

  // All typed chars are correct, show next expected char
  return currentWord[currentInput.length] || ' ';
}

/**
 * Count mistakes in a typed word compared to the expected word
 * Returns the number of incorrect characters
 */
export function countMistakes(
  typedWord: string,
  expectedWord: string,
  options: ComparisonOptions
): number {
  // Strip punctuation for length/mistake comparison if forgiveNonAlpha is on
  const strippedTyped = stripNonAlpha(typedWord, options.forgiveNonAlpha);
  const strippedTarget = stripNonAlpha(expectedWord, options.forgiveNonAlpha);

  let mistakeCount = 0;
  const minLen = Math.min(strippedTyped.length, strippedTarget.length);

  // Count character-by-character mistakes
  for (let i = 0; i < minLen; i++) {
    const inputChar = strippedTyped[i];
    const expectedChar = strippedTarget[i];
    let charCorrect: boolean;

    if (options.forgiveCapitals) {
      charCorrect = inputChar.toLowerCase() === expectedChar.toLowerCase();
    } else {
      charCorrect = inputChar === expectedChar;
    }

    if (!charCorrect) {
      mistakeCount++;
    }
  }

  // Extra or missing characters count as mistakes
  mistakeCount += Math.abs(strippedTyped.length - strippedTarget.length);

  return mistakeCount;
}

/**
 * Check if a word is fully typed (has the correct length)
 */
export function isFullyTyped(
  typedWord: string,
  expectedWord: string,
  options: ComparisonOptions
): boolean {
  const strippedTyped = stripNonAlpha(typedWord, options.forgiveNonAlpha);
  const strippedTarget = stripNonAlpha(expectedWord, options.forgiveNonAlpha);
  return strippedTyped.length === strippedTarget.length;
}
