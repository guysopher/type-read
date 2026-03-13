"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface TypingViewProps {
  text: string;
  title: string;
  onReset: () => void;
}

interface Stats {
  wordsTyped: number;
  totalWords: number;
  correctKeystrokes: number;
  totalKeystrokes: number;
  startTime: number | null;
  endTime: number | null;
}

export default function TypingView({ text, title, onReset }: TypingViewProps) {
  // Parse text into words, preserving punctuation
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [stats, setStats] = useState<Stats>({
    wordsTyped: 0,
    totalWords: words.length,
    correctKeystrokes: 0,
    totalKeystrokes: 0,
    startTime: null,
    endTime: null,
  });
  const [isComplete, setIsComplete] = useState(false);
  const [shake, setShake] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLSpanElement>(null);

  const currentWord = words[currentWordIndex] || "";
  const progress = (currentWordIndex / words.length) * 100;

  // Focus input on mount and when clicking anywhere
  useEffect(() => {
    inputRef.current?.focus();

    const handleClick = () => inputRef.current?.focus();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Scroll current word into view
  useEffect(() => {
    if (currentWordRef.current && textContainerRef.current) {
      const container = textContainerRef.current;
      const word = currentWordRef.current;
      const containerRect = container.getBoundingClientRect();
      const wordRect = word.getBoundingClientRect();

      // Check if word is outside the visible area
      if (wordRect.top < containerRect.top || wordRect.bottom > containerRect.bottom) {
        word.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentWordIndex]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // Start timer on first keystroke
      if (!stats.startTime) {
        setStats((s) => ({ ...s, startTime: Date.now() }));
      }

      // Check if space was pressed (word submitted)
      if (value.endsWith(" ")) {
        const typedWord = value.trim();

        if (typedWord === currentWord) {
          // Correct word
          setStats((s) => ({
            ...s,
            wordsTyped: s.wordsTyped + 1,
            correctKeystrokes: s.correctKeystrokes + typedWord.length,
            totalKeystrokes: s.totalKeystrokes + typedWord.length,
          }));

          if (currentWordIndex === words.length - 1) {
            // Completed!
            setIsComplete(true);
            setStats((s) => ({ ...s, endTime: Date.now() }));
          } else {
            setCurrentWordIndex((i) => i + 1);
          }
          setCurrentInput("");
        } else {
          // Wrong word - shake and clear
          setShake(true);
          setTimeout(() => setShake(false), 300);
          setStats((s) => ({
            ...s,
            totalKeystrokes: s.totalKeystrokes + typedWord.length,
          }));
          setCurrentInput("");
        }
      } else {
        setCurrentInput(value);
      }
    },
    [currentWord, currentWordIndex, words.length, stats.startTime]
  );

  // Calculate WPM
  const calculateWPM = () => {
    if (!stats.startTime) return 0;
    const endTime = stats.endTime || Date.now();
    const minutes = (endTime - stats.startTime) / 60000;
    if (minutes < 0.01) return 0;
    return Math.round(stats.wordsTyped / minutes);
  };

  // Calculate accuracy
  const calculateAccuracy = () => {
    if (stats.totalKeystrokes === 0) return 100;
    return Math.round((stats.correctKeystrokes / stats.totalKeystrokes) * 100);
  };

  // Render word with character highlighting
  const renderCurrentWordInput = () => {
    const chars = currentWord.split("");
    const inputChars = currentInput.split("");

    return (
      <div className="flex items-center justify-center mb-8">
        <div
          className={`text-4xl font-mono tracking-wider ${
            shake ? "animate-[shake_0.3s_ease-in-out]" : ""
          }`}
        >
          {chars.map((char, i) => {
            let color = "text-[var(--muted)]"; // Not typed yet
            if (i < inputChars.length) {
              color =
                inputChars[i] === char
                  ? "text-[var(--foreground)]" // Correct
                  : "text-[var(--error)]"; // Wrong
            }
            return (
              <span key={i} className={`${color} transition-colors duration-75`}>
                {char}
              </span>
            );
          })}
          <span className="caret text-[var(--accent)] ml-px">|</span>
        </div>
      </div>
    );
  };

  if (isComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">✓</div>
          <h2 className="text-3xl font-bold mb-2">Complete!</h2>
          <p className="text-[var(--muted)] mb-8">You&apos;ve read &ldquo;{title}&rdquo;</p>

          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="text-center">
              <div className="text-4xl font-bold">{calculateWPM()}</div>
              <div className="text-sm text-[var(--muted)]">WPM</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{calculateAccuracy()}%</div>
              <div className="text-sm text-[var(--muted)]">Accuracy</div>
            </div>
          </div>

          <div className="text-sm text-[var(--muted)] mb-8">
            {stats.wordsTyped} words in{" "}
            {Math.round(((stats.endTime || 0) - (stats.startTime || 0)) / 1000)}s
          </div>

          <button
            onClick={onReset}
            className="px-8 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Start New Text
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with progress */}
      <header className="sticky top-0 bg-[var(--background)] border-b border-[var(--foreground)]/5 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onReset}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-sm font-medium truncate max-w-[60%]">{title}</h1>
            <div className="text-sm text-[var(--muted)]">
              {calculateWPM()} WPM
            </div>
          </div>
          <div className="h-1 bg-[var(--foreground)]/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--foreground)] progress-fill rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main typing area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-8">
        {/* Current word to type */}
        {renderCurrentWordInput()}

        {/* Hidden input */}
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={handleInput}
          className="sr-only"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Text display */}
        <div
          ref={textContainerRef}
          className="typing-area flex-1 overflow-y-auto leading-relaxed text-lg"
        >
          <div className="max-w-2xl mx-auto">
            {words.map((word, index) => {
              let className = "inline ";
              if (index < currentWordIndex) {
                className += "text-[var(--muted)]"; // Already typed
              } else if (index === currentWordIndex) {
                className += "text-[var(--foreground)] font-semibold bg-[var(--foreground)]/5 px-1 rounded"; // Current
              } else {
                className += "text-[var(--foreground)]/60"; // Upcoming
              }

              return (
                <span
                  key={index}
                  ref={index === currentWordIndex ? currentWordRef : null}
                  className={className}
                >
                  {word}{" "}
                </span>
              );
            })}
          </div>
        </div>

        {/* Stats footer */}
        <div className="mt-6 pt-4 border-t border-[var(--foreground)]/5 flex justify-center gap-8 text-sm text-[var(--muted)]">
          <span>{currentWordIndex} / {words.length} words</span>
          <span>{calculateAccuracy()}% accuracy</span>
        </div>
      </main>

      {/* Shake animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
