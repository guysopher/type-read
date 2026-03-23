/**
 * Finger hint utilities for touch typing guidance
 * Supports QWERTY and Hebrew keyboard layouts
 */

export interface FingerHint {
  finger: string;
  direction: string;
  hand: string;
}

/**
 * Keyboard layout mapping for finger positions
 * Format: [finger name, direction from home row, hand (L/R/either)]
 */
const FINGER_MAP: Record<string, [string, string, string]> = {
  // QWERTY Layout - Left hand
  // Left pinky
  'q': ['pinky', '↑', 'L'],
  'a': ['pinky', '●', 'L'],
  'z': ['pinky', '↓', 'L'],
  '1': ['pinky', '↑↑', 'L'],
  '`': ['pinky', '↑←', 'L'],

  // Left ring
  'w': ['ring', '↑', 'L'],
  's': ['ring', '●', 'L'],
  'x': ['ring', '↓', 'L'],
  '2': ['ring', '↑↑', 'L'],

  // Left middle
  'e': ['middle', '↑', 'L'],
  'd': ['middle', '●', 'L'],
  'c': ['middle', '↓', 'L'],
  '3': ['middle', '↑↑', 'L'],

  // Left index
  'r': ['index', '↑', 'L'],
  'f': ['index', '●', 'L'],
  'v': ['index', '↓', 'L'],
  't': ['index', '↑→', 'L'],
  'g': ['index', '→', 'L'],
  'b': ['index', '↓→', 'L'],
  '4': ['index', '↑↑', 'L'],
  '5': ['index', '↑↑→', 'L'],

  // QWERTY Layout - Right hand
  // Right index
  'y': ['index', '↑←', 'R'],
  'h': ['index', '←', 'R'],
  'n': ['index', '↓←', 'R'],
  'u': ['index', '↑', 'R'],
  'j': ['index', '●', 'R'],
  'm': ['index', '↓', 'R'],
  '6': ['index', '↑↑←', 'R'],
  '7': ['index', '↑↑', 'R'],

  // Right middle
  'i': ['middle', '↑', 'R'],
  'k': ['middle', '●', 'R'],
  ',': ['middle', '↓', 'R'],
  '8': ['middle', '↑↑', 'R'],

  // Right ring
  'o': ['ring', '↑', 'R'],
  'l': ['ring', '●', 'R'],
  '.': ['ring', '↓', 'R'],
  '9': ['ring', '↑↑', 'R'],

  // Right pinky
  'p': ['pinky', '↑', 'R'],
  ';': ['pinky', '●', 'R'],
  '/': ['pinky', '↓', 'R'],
  '0': ['pinky', '↑↑', 'R'],
  '-': ['pinky', '↑↑→', 'R'],
  '=': ['pinky', '↑↑→→', 'R'],
  '[': ['pinky', '↑→', 'R'],
  ']': ['pinky', '↑→→', 'R'],
  '\\': ['pinky', '↑→→→', 'R'],
  "'": ['pinky', '→', 'R'],

  // Space - thumbs
  ' ': ['thumb', '●', 'either'],

  // Hebrew keyboard layout (standard SI-1452)
  // Left hand
  // Left pinky
  'ש': ['pinky', '●', 'L'],
  'ז': ['pinky', '↓', 'L'],

  // Left ring
  'ד': ['ring', '●', 'L'],
  'ס': ['ring', '↓', 'L'],

  // Left middle
  'ק': ['middle', '↑', 'L'],
  'ג': ['middle', '●', 'L'],
  'ב': ['middle', '↓', 'L'],

  // Left index
  'ר': ['index', '↑', 'L'],
  'כ': ['index', '●', 'L'],
  'ה': ['index', '↓', 'L'],
  'א': ['index', '↑→', 'L'],
  'ע': ['index', '→', 'L'],
  'נ': ['index', '↓→', 'L'],

  // Right hand
  // Right index
  'ט': ['index', '↑←', 'R'],
  'י': ['index', '←', 'R'],
  'מ': ['index', '↓←', 'R'],
  'ו': ['index', '↑', 'R'],
  'ח': ['index', '●', 'R'],
  'צ': ['index', '↓', 'R'],

  // Right middle
  'ן': ['middle', '↑', 'R'],
  'ל': ['middle', '●', 'R'],
  'ת': ['middle', '↓', 'R'],

  // Right ring
  'ם': ['ring', '↑', 'R'],
  'ך': ['ring', '●', 'R'],
  'ץ': ['ring', '↓', 'R'],

  // Right pinky
  'פ': ['pinky', '↑', 'R'],
  'ף': ['pinky', '●', 'R'],
};

/**
 * Get finger hint for a given character
 * Returns finger name, direction from home row, and hand
 * Returns null if character is not in the mapping
 */
export function getFingerHint(char: string): FingerHint | null {
  const key = char.toLowerCase();
  const mapping = FINGER_MAP[key];

  if (!mapping) return null;

  return {
    finger: mapping[0],
    direction: mapping[1],
    hand: mapping[2],
  };
}

/**
 * Check if a character is a Hebrew character
 */
export function isHebrewChar(char: string): boolean {
  return /[\u0590-\u05FF]/.test(char);
}

/**
 * Get all keys for a specific finger
 * Useful for visual keyboard displays
 */
export function getKeysForFinger(finger: string, hand: 'L' | 'R' | 'either'): string[] {
  return Object.entries(FINGER_MAP)
    .filter(([_, mapping]) => mapping[0] === finger && (mapping[2] === hand || hand === 'either'))
    .map(([key]) => key);
}
