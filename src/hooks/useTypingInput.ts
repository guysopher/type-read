import { useState, useCallback, useRef } from 'react';
import {
  compareStrings,
  isCorrectChar,
  countMistakes,
  isFullyTyped,
  getNextCharToType as getNextChar,
  type ComparisonOptions,
} from '@/utils/typingComparison';
import {
  playCorrectSound,
  playErrorSound,
  playWordCompleteSound,
  playPunctuationSound,
} from '@/lib/sounds';

export interface TypingStats {
  wordsTyped: number;
  totalWords: number;
  correctKeystrokes: number;
  totalKeystrokes: number;
  startTime: number | null;
  endTime: number | null;
}

export interface WordCompletionEvent {
  wordIndex: number;
  typedWord: string;
  expectedWord: string;
  isCorrect: boolean;
  mistakeCount: number;
  hadAnyMistakes: boolean; // True if any mistake was made during typing (even if backspaced)
  hasPunctuation: boolean;
  isLastWord: boolean;
}

export interface UseTypingInputProps {
  words: string[];
  initialWordIndex?: number;
  initialStats?: Partial<TypingStats>;
  comparisonOptions: ComparisonOptions;
  allowMistakes: boolean;
  soundEffects: boolean;
  onWordComplete?: (event: WordCompletionEvent) => void;
  onKeystroke?: (isCorrect: boolean, timestamp: number) => void;
  onComplete?: () => void;
  onStartTyping?: (timestamp: number) => void;
}

export function useTypingInput({
  words,
  initialWordIndex = 0,
  initialStats,
  comparisonOptions,
  allowMistakes,
  soundEffects,
  onWordComplete,
  onKeystroke,
  onComplete,
  onStartTyping,
}: UseTypingInputProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(initialWordIndex);
  const [currentInput, setCurrentInput] = useState('');
  const [typedWords, setTypedWords] = useState<Map<number, { typed: string; correct: boolean }>>(
    new Map()
  );
  const [stats, setStats] = useState<TypingStats>({
    wordsTyped: initialStats?.wordsTyped || 0,
    totalWords: words.length,
    correctKeystrokes: initialStats?.correctKeystrokes || 0,
    totalKeystrokes: initialStats?.totalKeystrokes || 0,
    startTime: initialStats?.startTime || null,
    endTime: initialStats?.endTime || null,
  });
  const [shake, setShake] = useState(false);

  // Track if any mistake was made in current word (even if backspaced and fixed)
  const currentWordMistakesRef = useRef<boolean>(false);

  const currentWord = words[currentWordIndex] || '';
  const isWordComplete = compareStrings(currentInput, currentWord, comparisonOptions);

  /**
   * Get the next character to type based on current input and word
   */
  const nextCharToType = getNextChar(currentInput, currentWord, comparisonOptions);

  /**
   * Handle input changes (character-by-character typing)
   */
  const handleInputChange = useCallback(
    (value: string) => {
      // Start timer on first keystroke
      if (!stats.startTime) {
        const now = Date.now();
        setStats(s => ({ ...s, startTime: now }));
        onStartTyping?.(now);
      }

      // Handle word completion (space pressed)
      if (value.endsWith(' ')) {
        const typedWord = value.trim();

        // Ignore empty space
        if (typedWord.length === 0) {
          return;
        }

        const isCorrect = compareStrings(typedWord, currentWord, comparisonOptions);
        const mistakeCount = countMistakes(typedWord, currentWord, comparisonOptions);
        const fullyTyped = isFullyTyped(typedWord, currentWord, comparisonOptions);

        // Block completion based on allowMistakes setting
        const shouldBlock = allowMistakes
          ? !fullyTyped
          : !fullyTyped || mistakeCount > 3 || !isCorrect;

        if (shouldBlock) {
          if (soundEffects) playErrorSound();
          setShake(true);
          setTimeout(() => setShake(false), 300);
          // Remove the trailing space
          setCurrentInput(typedWord);
          return;
        }

        // Word completion successful
        const lastChar = currentWord[currentWord.length - 1];
        const hasPunctuation = /[.,!?;:]/.test(lastChar);
        const isLastWord = currentWordIndex === words.length - 1;

        // Play sound
        if (soundEffects) {
          if (isCorrect) {
            if (hasPunctuation) {
              playPunctuationSound();
            } else {
              playWordCompleteSound();
            }
          } else {
            playErrorSound();
          }
        }

        // Track typed word
        setTypedWords(prev => {
          const newMap = new Map(prev);
          newMap.set(currentWordIndex, { typed: typedWord, correct: isCorrect });
          return newMap;
        });

        // Update stats
        setStats(s => ({
          ...s,
          wordsTyped: s.wordsTyped + 1,
          correctKeystrokes: s.correctKeystrokes + (isCorrect ? typedWord.length : 0),
          totalKeystrokes: s.totalKeystrokes + typedWord.length,
        }));

        // Notify space keystroke
        onKeystroke?.(true, Date.now());

        // Notify word completion
        onWordComplete?.({
          wordIndex: currentWordIndex,
          typedWord,
          expectedWord: currentWord,
          isCorrect,
          mistakeCount,
          hadAnyMistakes: currentWordMistakesRef.current,
          hasPunctuation,
          isLastWord,
        });

        // Handle completion or advance
        if (isLastWord) {
          setStats(s => ({ ...s, endTime: Date.now() }));
          onComplete?.();
        } else {
          setCurrentWordIndex(i => i + 1);
          currentWordMistakesRef.current = false; // Reset for next word
        }

        setCurrentInput('');
      } else {
        // Character-by-character validation
        const newCharIndex = value.length - 1;

        if (newCharIndex >= 0 && newCharIndex < currentWord.length) {
          const newChar = value[newCharIndex];
          const expectedChar = currentWord[newCharIndex];
          const isCorrect = isCorrectChar(newChar, expectedChar, comparisonOptions);

          // Track if any mistake was made
          if (!isCorrect) {
            currentWordMistakesRef.current = true;
          }

          // Play sound
          if (soundEffects) {
            if (isCorrect) {
              playCorrectSound();
            } else {
              playErrorSound();
            }
          }

          // Notify keystroke
          onKeystroke?.(isCorrect, Date.now());
        } else if (newCharIndex >= currentWord.length) {
          // Typing beyond word length - always an error
          if (soundEffects) playErrorSound();
          setShake(true);
          setTimeout(() => setShake(false), 300);
        }

        setCurrentInput(value);
      }
    },
    [
      currentWord,
      currentWordIndex,
      words.length,
      stats.startTime,
      comparisonOptions,
      allowMistakes,
      soundEffects,
      onWordComplete,
      onKeystroke,
      onComplete,
      onStartTyping,
    ]
  );

  /**
   * Handle backspace to go to previous word
   */
  const goToPreviousWord = useCallback(() => {
    if (currentInput === '' && currentWordIndex > 0) {
      const prevIndex = currentWordIndex - 1;
      const prevTypedData = typedWords.get(prevIndex);

      // Remove the previous word from typed words
      setTypedWords(prev => {
        const newMap = new Map(prev);
        newMap.delete(prevIndex);
        return newMap;
      });

      // Restore the previous input
      setCurrentInput(prevTypedData?.typed || '');
      setCurrentWordIndex(prevIndex);
      currentWordMistakesRef.current = false;

      // Adjust stats
      setStats(s => ({
        ...s,
        wordsTyped: Math.max(0, s.wordsTyped - 1),
        totalKeystrokes: Math.max(0, s.totalKeystrokes - (prevTypedData?.typed.length || 0)),
        correctKeystrokes: prevTypedData?.correct
          ? Math.max(0, s.correctKeystrokes - (prevTypedData?.typed.length || 0))
          : s.correctKeystrokes,
      }));

      return true;
    }
    return false;
  }, [currentInput, currentWordIndex, typedWords]);

  /**
   * Handle keydown events (for special keys like backspace)
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && currentInput === '' && currentWordIndex > 0) {
        e.preventDefault();
        goToPreviousWord();
      }
    },
    [currentInput, currentWordIndex, goToPreviousWord]
  );

  return {
    currentWordIndex,
    currentInput,
    currentWord,
    typedWords,
    stats,
    shake,
    isWordComplete,
    nextCharToType,
    handleInputChange,
    handleKeyDown,
    goToPreviousWord,
  };
}
