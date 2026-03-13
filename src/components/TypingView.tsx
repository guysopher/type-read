"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SavedText, saveText, generateId } from "@/lib/storage";

interface TypingViewProps {
  text: string;
  title: string;
  onReset: () => void;
  savedData?: SavedText;
}

interface Stats {
  wordsTyped: number;
  totalWords: number;
  correctKeystrokes: number;
  totalKeystrokes: number;
  startTime: number | null;
  endTime: number | null;
}

export default function TypingView({ text, title, onReset, savedData }: TypingViewProps) {
  const words = useMemo(() => text.split(/\s+/).filter((w) => w.length > 0), [text]);

  const [currentWordIndex, setCurrentWordIndex] = useState(
    savedData?.progress.currentWordIndex || 0
  );
  const [currentInput, setCurrentInput] = useState("");
  const [stats, setStats] = useState<Stats>({
    wordsTyped: savedData?.progress.wordsTyped || 0,
    totalWords: words.length,
    correctKeystrokes: savedData?.progress.correctKeystrokes || 0,
    totalKeystrokes: savedData?.progress.totalKeystrokes || 0,
    startTime: null,
    endTime: null,
  });
  const [accumulatedTime] = useState(savedData?.progress.totalTime || 0);
  const [isComplete, setIsComplete] = useState(false);
  const [shake, setShake] = useState(false);
  const [saveId] = useState(savedData?.id || generateId());
  const [showSaved, setShowSaved] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLSpanElement>(null);

  const currentWord = words[currentWordIndex] || "";
  const progress = (currentWordIndex / words.length) * 100;
  const isWordComplete = currentInput.toLowerCase() === currentWord.toLowerCase();

  // Build the full text stream for the sliding view
  const fullTextStream = useMemo(() => words.join(" "), [words]);

  // Calculate the absolute character position in the full text
  const absolutePosition = useMemo(() => {
    let pos = 0;
    for (let i = 0; i < currentWordIndex; i++) {
      pos += words[i].length + 1; // +1 for space
    }
    return pos + currentInput.length;
  }, [currentWordIndex, currentInput.length, words]);

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

      if (wordRect.top < containerRect.top || wordRect.bottom > containerRect.bottom) {
        word.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentWordIndex]);

  const handleSave = useCallback(() => {
    const sessionTime = stats.startTime ? Date.now() - stats.startTime : 0;
    const totalTime = accumulatedTime + sessionTime;

    const savedText: SavedText = {
      id: saveId,
      title,
      text,
      progress: {
        currentWordIndex,
        wordsTyped: stats.wordsTyped,
        correctKeystrokes: stats.correctKeystrokes,
        totalKeystrokes: stats.totalKeystrokes,
        totalTime,
      },
      createdAt: savedData?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    saveText(savedText);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, [
    saveId,
    title,
    text,
    currentWordIndex,
    stats,
    accumulatedTime,
    savedData?.createdAt,
  ]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (!stats.startTime) {
        setStats((s) => ({ ...s, startTime: Date.now() }));
      }

      if (value.endsWith(" ")) {
        const typedWord = value.trim();

        if (typedWord.toLowerCase() === currentWord.toLowerCase()) {
          setStats((s) => ({
            ...s,
            wordsTyped: s.wordsTyped + 1,
            correctKeystrokes: s.correctKeystrokes + typedWord.length,
            totalKeystrokes: s.totalKeystrokes + typedWord.length,
          }));

          if (currentWordIndex === words.length - 1) {
            setIsComplete(true);
            setStats((s) => ({ ...s, endTime: Date.now() }));
          } else {
            setCurrentWordIndex((i) => i + 1);
          }
          setCurrentInput("");
        } else {
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

  const calculateWPM = () => {
    const sessionTime = stats.startTime
      ? (stats.endTime || Date.now()) - stats.startTime
      : 0;
    const totalTime = accumulatedTime + sessionTime;
    const minutes = totalTime / 60000;
    if (minutes < 0.01) return 0;
    return Math.round(stats.wordsTyped / minutes);
  };

  const calculateAccuracy = () => {
    if (stats.totalKeystrokes === 0) return 100;
    return Math.round((stats.correctKeystrokes / stats.totalKeystrokes) * 100);
  };

  // Sliding text bar renderer
  const renderSlidingTextBar = () => {
    const windowSize = 50; // Total chars to show
    const centerOffset = 20; // How many chars before cursor

    // Get the window of characters to display
    const startPos = Math.max(0, absolutePosition - centerOffset);
    const endPos = Math.min(fullTextStream.length, startPos + windowSize);
    const visibleText = fullTextStream.slice(startPos, endPos);

    // Calculate position of cursor within the current word
    const cursorInWord = currentInput.length;

    // Calculate position in the visible window where the current char should be
    const cursorPosInWindow = absolutePosition - startPos;

    return (
      <div className="mb-8 py-8">
        <div
          className={`relative overflow-hidden py-4 ${
            shake ? "animate-[shake_0.3s_ease-in-out]" : ""
          }`}
        >
          {/* The sliding text container */}
          <div className="flex justify-center items-center">
            <div className="font-mono text-4xl tracking-wide whitespace-pre">
              {visibleText.split("").map((char, i) => {
                const globalPos = startPos + i;
                const wordStartPos = absolutePosition - cursorInWord;

                let className = "inline-block transition-all duration-75 ";

                if (globalPos < wordStartPos) {
                  // Already typed words - faded
                  className += "text-[var(--muted)]/40";
                } else if (globalPos < absolutePosition) {
                  // Currently typing - check if correct
                  const charIndexInWord = globalPos - wordStartPos;
                  const isCorrect = currentInput[charIndexInWord]?.toLowerCase() === currentWord[charIndexInWord]?.toLowerCase();
                  className += isCorrect ? "text-[var(--foreground)]" : "text-[var(--error)]";
                } else if (globalPos === absolutePosition && !isWordComplete) {
                  // Current character to type (not when word is complete - waiting for space)
                  className += "text-[var(--foreground)] bg-[var(--foreground)]/10 rounded px-0.5";
                } else if (globalPos === absolutePosition && isWordComplete) {
                  // Space after completed word - subtle indication
                  className += "text-[var(--foreground)]/30";
                } else {
                  // Upcoming characters
                  const distance = globalPos - absolutePosition;
                  if (distance < 5) {
                    className += "text-[var(--foreground)]/70";
                  } else if (distance < 15) {
                    className += "text-[var(--foreground)]/40";
                  } else {
                    className += "text-[var(--foreground)]/20";
                  }
                }

                return (
                  <span key={`${globalPos}-${char}`} className={className}>
                    {char === " " ? "\u00A0" : char}
                  </span>
                );
              })}
              {/* Blinking caret */}
              <span
                className="caret text-[var(--accent)] absolute"
                style={{
                  left: `${cursorPosInWindow * 0.6}em`,
                  marginLeft: "0.3em",
                }}
              >
                |
              </span>
            </div>
          </div>

          {/* Gradient fades on edges */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--background)] to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none" />
        </div>

        {/* Spacebar indicator */}
        <div
          className={`mt-6 flex items-center justify-center gap-2 transition-opacity duration-150 ${
            isWordComplete ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="px-4 py-1.5 bg-[var(--foreground)]/10 rounded-md text-sm font-mono border border-[var(--foreground)]/20">
            space
          </span>
          <span className="text-sm text-[var(--muted)]">to continue</span>
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
          <p className="text-[var(--muted)] mb-8">
            You&apos;ve read &ldquo;{title}&rdquo;
          </p>

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
            {Math.round(
              (accumulatedTime +
                ((stats.endTime || 0) - (stats.startTime || 0))) /
                1000
            )}
            s
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
            <h1 className="text-sm font-medium truncate max-w-[40%]">{title}</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
              >
                {showSaved ? (
                  <span className="text-[var(--success)]">Saved ✓</span>
                ) : (
                  "Save"
                )}
              </button>
              <div className="text-sm text-[var(--muted)]">
                {calculateWPM()} WPM
              </div>
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
        {renderSlidingTextBar()}

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

        <div
          ref={textContainerRef}
          className="typing-area flex-1 overflow-y-auto leading-relaxed text-lg"
        >
          <div className="max-w-2xl mx-auto">
            {words.map((word, index) => {
              let className = "inline ";
              if (index < currentWordIndex) {
                className += "text-[var(--muted)]";
              } else if (index === currentWordIndex) {
                className +=
                  "text-[var(--foreground)] font-semibold bg-[var(--foreground)]/5 px-1 rounded";
              } else {
                className += "text-[var(--foreground)]/60";
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

        <div className="mt-6 pt-4 border-t border-[var(--foreground)]/5 flex justify-center gap-8 text-sm text-[var(--muted)]">
          <span>
            {currentWordIndex} / {words.length} words
          </span>
          <span>{calculateAccuracy()}% accuracy</span>
        </div>
      </main>

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }
      `}</style>
    </div>
  );
}
