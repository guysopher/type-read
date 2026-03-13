"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SavedText, saveText, generateId, DetailedStats, WPMSample, PauseEvent, createEmptyDetailedStats } from "@/lib/storage";
import { playCorrectSound, playErrorSound, playWordCompleteSound, playPunctuationSound } from "@/lib/sounds";
import StatsView from "./StatsView";

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

const AUTO_PAUSE_DELAY = 5000; // 5 seconds
const WPM_SAMPLE_INTERVAL = 3000; // Sample WPM every 3 seconds

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
  const [accumulatedTime, setAccumulatedTime] = useState(savedData?.progress.totalTime || 0);
  const [isComplete, setIsComplete] = useState(false);
  const [shake, setShake] = useState(false);
  const [saveId] = useState(savedData?.id || generateId());
  const [showSaved, setShowSaved] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [ignorePunctuation, setIgnorePunctuation] = useState(false);
  const [muted, setMuted] = useState(false);

  // Auto-pause and detailed stats
  const [isPaused, setIsPaused] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [detailedStats, setDetailedStats] = useState<DetailedStats>(
    savedData?.detailedStats || createEmptyDetailedStats()
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLSpanElement>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const pauseStartRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const wordsAtLastSampleRef = useRef<number>(savedData?.progress.wordsTyped || 0);

  const currentWord = words[currentWordIndex] || "";
  const progress = (currentWordIndex / words.length) * 100;

  const stripPunctuation = useCallback((s: string) => {
    return ignorePunctuation ? s.replace(/[.,!?;:'"()-]/g, "") : s;
  }, [ignorePunctuation]);

  const compareStrings = useCallback((a: string, b: string) => {
    let strA = stripPunctuation(a);
    let strB = stripPunctuation(b);
    if (ignoreCase) {
      strA = strA.toLowerCase();
      strB = strB.toLowerCase();
    }
    return strA === strB;
  }, [ignoreCase, stripPunctuation]);

  const isWordComplete = compareStrings(currentInput, currentWord);

  // Build the full text stream for the sliding view
  const fullTextStream = useMemo(() => words.join(" "), [words]);

  // Calculate the absolute character position in the full text
  const absolutePosition = useMemo(() => {
    let pos = 0;
    for (let i = 0; i < currentWordIndex; i++) {
      pos += words[i].length + 1;
    }
    return pos + currentInput.length;
  }, [currentWordIndex, currentInput.length, words]);

  // Calculate current WPM
  const calculateWPM = useCallback(() => {
    if (!stats.startTime) return 0;
    const sessionTime = stats.startTime
      ? (stats.endTime || Date.now()) - stats.startTime
      : 0;
    const totalTime = accumulatedTime + sessionTime - detailedStats.totalPauseTime;
    const minutes = totalTime / 60000;
    if (minutes < 0.01) return 0;
    return Math.round(stats.wordsTyped / minutes);
  }, [stats, accumulatedTime, detailedStats.totalPauseTime]);

  const calculateAccuracy = useCallback(() => {
    if (stats.totalKeystrokes === 0) return 100;
    return Math.round((stats.correctKeystrokes / stats.totalKeystrokes) * 100);
  }, [stats]);

  // Get elapsed time since session start (excluding pauses)
  const getActiveTime = useCallback(() => {
    if (!sessionStartRef.current) return accumulatedTime;
    const now = Date.now();
    const sessionTime = now - sessionStartRef.current;
    return accumulatedTime + sessionTime - detailedStats.totalPauseTime;
  }, [accumulatedTime, detailedStats.totalPauseTime]);

  // Focus input on mount and when clicking anywhere
  useEffect(() => {
    inputRef.current?.focus();

    const handleClick = () => {
      if (!isPaused) {
        inputRef.current?.focus();
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isPaused]);

  // Auto-pause detection
  useEffect(() => {
    if (isComplete || isPaused || !stats.startTime) return;

    const checkActivity = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      if (timeSinceActivity >= AUTO_PAUSE_DELAY) {
        // Auto-pause
        setIsPaused(true);
        pauseStartRef.current = Date.now();
      }
    }, 1000);

    return () => clearInterval(checkActivity);
  }, [isComplete, isPaused, stats.startTime]);

  // WPM sampling
  useEffect(() => {
    if (isComplete || isPaused || !stats.startTime) return;

    const sampleWPM = setInterval(() => {
      const activeTime = getActiveTime();
      const currentWpm = calculateWPM();

      if (currentWpm > 0) {
        setDetailedStats((prev) => {
          const newSample: WPMSample = {
            timestamp: activeTime,
            wpm: currentWpm,
            wordsTyped: stats.wordsTyped,
          };

          const newPeakWpm = Math.max(prev.peakWpm, currentWpm);
          const newSamples = [...prev.wpmSamples, newSample];
          const avgWpm = Math.round(
            newSamples.reduce((sum, s) => sum + s.wpm, 0) / newSamples.length
          );

          // Calculate words per minute by minute
          const minuteMap = new Map<number, { words: number; samples: number }>();
          newSamples.forEach((s) => {
            const minute = Math.floor(s.timestamp / 60000);
            const existing = minuteMap.get(minute) || { words: 0, samples: 0 };
            minuteMap.set(minute, {
              words: existing.words + s.wpm,
              samples: existing.samples + 1,
            });
          });

          const wordsPerMinuteByMinute = Array.from(minuteMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([minute, data]) => ({
              minute,
              wpm: Math.round(data.words / data.samples),
            }));

          return {
            ...prev,
            wpmSamples: newSamples,
            peakWpm: newPeakWpm,
            averageWpm: avgWpm,
            totalActiveTime: activeTime,
            wordsPerMinuteByMinute,
          };
        });
      }
    }, WPM_SAMPLE_INTERVAL);

    return () => clearInterval(sampleWPM);
  }, [isComplete, isPaused, stats.startTime, stats.wordsTyped, getActiveTime, calculateWPM]);

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

  const resumeFromPause = useCallback(() => {
    if (pauseStartRef.current) {
      const pauseDuration = Date.now() - pauseStartRef.current;
      const newPause: PauseEvent = {
        startTime: getActiveTime(),
        endTime: getActiveTime() + pauseDuration,
        duration: pauseDuration,
      };

      setDetailedStats((prev) => ({
        ...prev,
        pauses: [...prev.pauses, newPause],
        totalPauseTime: prev.totalPauseTime + pauseDuration,
      }));
    }

    setIsPaused(false);
    pauseStartRef.current = null;
    lastActivityRef.current = Date.now();
    inputRef.current?.focus();
  }, [getActiveTime]);

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
      detailedStats: {
        ...detailedStats,
        totalActiveTime: getActiveTime(),
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
    detailedStats,
    getActiveTime,
  ]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      lastActivityRef.current = Date.now();

      if (!stats.startTime) {
        const now = Date.now();
        setStats((s) => ({ ...s, startTime: now }));
        sessionStartRef.current = now;
      }

      if (value.endsWith(" ")) {
        const typedWord = value.trim();

        if (compareStrings(typedWord, currentWord)) {
          const lastChar = currentWord[currentWord.length - 1];
          const hasPunctuation = /[.,!?;:]/.test(lastChar);

          if (!muted) {
            if (hasPunctuation) {
              playPunctuationSound();
            } else {
              playWordCompleteSound();
            }
          }

          setStats((s) => ({
            ...s,
            wordsTyped: s.wordsTyped + 1,
            correctKeystrokes: s.correctKeystrokes + typedWord.length,
            totalKeystrokes: s.totalKeystrokes + typedWord.length,
          }));

          if (currentWordIndex === words.length - 1) {
            setIsComplete(true);
            setStats((s) => ({ ...s, endTime: Date.now() }));
            // Final stats update
            setDetailedStats((prev) => ({
              ...prev,
              totalActiveTime: getActiveTime(),
            }));
          } else {
            setCurrentWordIndex((i) => i + 1);
          }
          setCurrentInput("");
        } else {
          if (!muted) playErrorSound();
          setShake(true);
          setTimeout(() => setShake(false), 300);
          setStats((s) => ({
            ...s,
            totalKeystrokes: s.totalKeystrokes + typedWord.length,
          }));
          setCurrentInput("");
        }
      } else {
        const newCharIndex = value.length - 1;
        if (newCharIndex >= 0 && newCharIndex < currentWord.length) {
          const newChar = value[newCharIndex];
          const expectedChar = currentWord[newCharIndex];
          const isPunc = /[.,!?;:'"()-]/.test(expectedChar);
          let isCorrect: boolean;
          if (ignorePunctuation && isPunc) {
            // Skip punctuation check - always correct if we're ignoring punctuation
            isCorrect = true;
          } else if (ignoreCase) {
            isCorrect = newChar.toLowerCase() === expectedChar.toLowerCase();
          } else {
            isCorrect = newChar === expectedChar;
          }

          if (!muted) {
            if (isCorrect) {
              playCorrectSound();
            } else {
              playErrorSound();
            }
          }
        }
        setCurrentInput(value);
      }
    },
    [currentWord, currentWordIndex, words.length, stats.startTime, compareStrings, ignoreCase, ignorePunctuation, muted, getActiveTime]
  );

  // Sliding text bar renderer
  const renderSlidingTextBar = () => {
    const windowSize = 50;
    const centerOffset = 20;

    const startPos = Math.max(0, absolutePosition - centerOffset);
    const endPos = Math.min(fullTextStream.length, startPos + windowSize);
    const visibleText = fullTextStream.slice(startPos, endPos);

    const cursorInWord = currentInput.length;

    return (
      <div>
        <div
          className={`relative overflow-hidden py-4 ${
            shake ? "animate-[shake_0.3s_ease-in-out]" : ""
          }`}
        >
          <div className="flex justify-center items-center">
            <div className="font-mono text-4xl tracking-wide whitespace-pre">
              {visibleText.split("").map((char, i) => {
                const globalPos = startPos + i;
                const wordStartPos = absolutePosition - cursorInWord;

                let className = "inline-block transition-all duration-75 ";

                if (globalPos < wordStartPos) {
                  className += "text-[var(--muted)]/40";
                } else if (globalPos < absolutePosition) {
                  const charIndexInWord = globalPos - wordStartPos;
                  const inputChar = currentInput[charIndexInWord] || "";
                  const targetChar = currentWord[charIndexInWord] || "";
                  const isPunc = /[.,!?;:'"()-]/.test(targetChar);
                  let isCorrect: boolean;
                  if (ignorePunctuation && isPunc) {
                    isCorrect = true;
                  } else if (ignoreCase) {
                    isCorrect = inputChar.toLowerCase() === targetChar.toLowerCase();
                  } else {
                    isCorrect = inputChar === targetChar;
                  }
                  className += isCorrect ? "text-[var(--foreground)]" : "text-[var(--error)]";
                } else if (globalPos === absolutePosition && !isWordComplete) {
                  className += "text-[var(--foreground)] bg-[var(--accent)]/20 border-b-2 border-[var(--foreground)]";
                } else if (globalPos === absolutePosition && isWordComplete) {
                  className += "bg-[var(--accent)]/20 border-b-2 border-[var(--foreground)]";
                } else {
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
            </div>
          </div>

          {startPos > 0 && (
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--background)] to-transparent pointer-events-none" />
          )}
          {endPos < fullTextStream.length && (
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none" />
          )}
        </div>
      </div>
    );
  };

  // Pause overlay
  if (isPaused && !isComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⏸</div>
          <h2 className="text-3xl font-bold mb-2">Paused</h2>
          <p className="text-[var(--muted)] mb-8">
            Auto-paused after 5 seconds of inactivity
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

          <div className="flex gap-4 justify-center">
            <button
              onClick={resumeFromPause}
              className="px-8 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Resume Typing
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="px-8 py-3 border border-[var(--foreground)]/20 rounded-xl font-medium hover:bg-[var(--foreground)]/5 transition-colors"
            >
              View Stats
            </button>
          </div>
        </div>

        {showStats && (
          <StatsView
            stats={detailedStats}
            wordsTyped={stats.wordsTyped}
            totalWords={stats.totalWords}
            accuracy={calculateAccuracy()}
            onClose={() => setShowStats(false)}
          />
        )}
      </div>
    );
  }

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

          <div className="flex gap-4 justify-center mb-8">
            <button
              onClick={() => setShowStats(true)}
              className="px-8 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              View Detailed Stats
            </button>
            <button
              onClick={onReset}
              className="px-8 py-3 border border-[var(--foreground)]/20 rounded-xl font-medium hover:bg-[var(--foreground)]/5 transition-colors"
            >
              Start New Text
            </button>
          </div>
        </div>

        {showStats && (
          <StatsView
            stats={detailedStats}
            wordsTyped={stats.wordsTyped}
            totalWords={stats.totalWords}
            accuracy={calculateAccuracy()}
            onClose={() => setShowStats(false)}
          />
        )}
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
                onClick={() => setIgnoreCase(!ignoreCase)}
                className={`text-sm transition-colors flex items-center gap-1 ${
                  ignoreCase ? "text-[var(--foreground)]" : "text-[var(--muted)]"
                }`}
                title={ignoreCase ? "Case insensitive (click to toggle)" : "Case sensitive (click to toggle)"}
              >
                Aa
              </button>
              <button
                onClick={() => setIgnorePunctuation(!ignorePunctuation)}
                className={`text-sm transition-colors flex items-center gap-1 ${
                  ignorePunctuation ? "text-[var(--foreground)]" : "text-[var(--muted)]"
                }`}
                title={ignorePunctuation ? "Ignoring punctuation (click to toggle)" : "Strict punctuation (click to toggle)"}
              >
                .,
              </button>
              <button
                onClick={() => setMuted(!muted)}
                className={`text-sm transition-colors ${
                  muted ? "text-[var(--muted)]" : "text-[var(--foreground)]"
                }`}
                title={muted ? "Sound off (click to unmute)" : "Sound on (click to mute)"}
              >
                {muted ? "🔇" : "🔊"}
              </button>
              <button
                onClick={() => setShowStats(true)}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                title="View statistics"
              >
                📊
              </button>
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

      {/* Sliding text bar - full width */}
      <div className="w-full px-4 py-8">
        {renderSlidingTextBar()}
      </div>

      {/* Main typing area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6">
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
          {detailedStats.pauses.length > 0 && (
            <span>{detailedStats.pauses.length} pauses</span>
          )}
        </div>
      </main>

      {/* Stats modal */}
      {showStats && (
        <StatsView
          stats={detailedStats}
          wordsTyped={stats.wordsTyped}
          totalWords={stats.totalWords}
          accuracy={calculateAccuracy()}
          onClose={() => setShowStats(false)}
        />
      )}

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
