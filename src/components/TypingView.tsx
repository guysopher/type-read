"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SavedText, saveText, generateId, DetailedStats, WPMSample, PauseEvent, createEmptyDetailedStats, Highlight } from "@/lib/storage";
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
const AUTO_SAVE_INTERVAL = 10000; // Auto-save every 10 seconds

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
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(savedData?.updatedAt || null);
  const [forgivingMode, setForgivingMode] = useState(true);
  const [muted, setMuted] = useState(false);
  const [fingerHintPosition, setFingerHintPosition] = useState<'off' | 'top' | 'bottom'>('bottom');

  // Auto-pause and detailed stats
  const [isPaused, setIsPaused] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [detailedStats, setDetailedStats] = useState<DetailedStats>(
    savedData?.detailedStats || createEmptyDetailedStats()
  );

  // Highlights and notes
  const [highlights, setHighlights] = useState<Highlight[]>(savedData?.highlights || []);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLSpanElement>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const pauseStartRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const wordsAtLastSampleRef = useRef<number>(savedData?.progress.wordsTyped || 0);

  const currentWord = words[currentWordIndex] || "";
  const progress = (currentWordIndex / words.length) * 100;

  // Finger mapping for touch typing hints
  const getFingerHint = useCallback((char: string): { finger: string; direction: string; hand: string } | null => {
    const key = char.toLowerCase();

    // Finger assignments: [finger name, direction from home, hand]
    const fingerMap: Record<string, [string, string, string]> = {
      // Left pinky
      'q': ['pinky', '↑', 'L'], 'a': ['pinky', '●', 'L'], 'z': ['pinky', '↓', 'L'],
      '1': ['pinky', '↑↑', 'L'], '`': ['pinky', '↑←', 'L'],
      // Left ring
      'w': ['ring', '↑', 'L'], 's': ['ring', '●', 'L'], 'x': ['ring', '↓', 'L'],
      '2': ['ring', '↑↑', 'L'],
      // Left middle
      'e': ['middle', '↑', 'L'], 'd': ['middle', '●', 'L'], 'c': ['middle', '↓', 'L'],
      '3': ['middle', '↑↑', 'L'],
      // Left index
      'r': ['index', '↑', 'L'], 'f': ['index', '●', 'L'], 'v': ['index', '↓', 'L'],
      't': ['index', '↑→', 'L'], 'g': ['index', '→', 'L'], 'b': ['index', '↓→', 'L'],
      '4': ['index', '↑↑', 'L'], '5': ['index', '↑↑→', 'L'],
      // Right index
      'y': ['index', '↑←', 'R'], 'h': ['index', '←', 'R'], 'n': ['index', '↓←', 'R'],
      'u': ['index', '↑', 'R'], 'j': ['index', '●', 'R'], 'm': ['index', '↓', 'R'],
      '6': ['index', '↑↑←', 'R'], '7': ['index', '↑↑', 'R'],
      // Right middle
      'i': ['middle', '↑', 'R'], 'k': ['middle', '●', 'R'], ',': ['middle', '↓', 'R'],
      '8': ['middle', '↑↑', 'R'],
      // Right ring
      'o': ['ring', '↑', 'R'], 'l': ['ring', '●', 'R'], '.': ['ring', '↓', 'R'],
      '9': ['ring', '↑↑', 'R'],
      // Right pinky
      'p': ['pinky', '↑', 'R'], ';': ['pinky', '●', 'R'], '/': ['pinky', '↓', 'R'],
      '0': ['pinky', '↑↑', 'R'], '-': ['pinky', '↑↑→', 'R'], '=': ['pinky', '↑↑→→', 'R'],
      '[': ['pinky', '↑→', 'R'], ']': ['pinky', '↑→→', 'R'], '\\': ['pinky', '↑→→→', 'R'],
      "'": ['pinky', '→', 'R'],
      // Space - thumbs
      ' ': ['thumb', '●', 'either'],
    };

    const mapping = fingerMap[key];
    if (!mapping) return null;

    return { finger: mapping[0], direction: mapping[1], hand: mapping[2] };
  }, []);

  const stripNonAlpha = useCallback((s: string) => {
    // In forgiving mode, only keep letters (a-z) and spaces
    return forgivingMode ? s.replace(/[^a-zA-Z\s]/g, "") : s;
  }, [forgivingMode]);

  const compareStrings = useCallback((a: string, b: string) => {
    let strA = stripNonAlpha(a);
    let strB = stripNonAlpha(b);
    if (forgivingMode) {
      strA = strA.toLowerCase();
      strB = strB.toLowerCase();
    }
    return strA === strB;
  }, [forgivingMode, stripNonAlpha]);

  const isWordComplete = compareStrings(currentInput, currentWord);

  // Get the next character to type
  const nextCharToType = currentWord[currentInput.length] || (isWordComplete ? ' ' : '');
  const fingerHint = getFingerHint(nextCharToType);

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
      inputRef.current?.focus();
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

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

  // Scroll current word to center
  useEffect(() => {
    if (currentWordRef.current) {
      currentWordRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentWordIndex]);

  // Auto-save
  useEffect(() => {
    if (isComplete || !stats.startTime) return;

    const autoSave = setInterval(() => {
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
        highlights,
        createdAt: savedData?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      saveText(savedText);
      setLastSavedTime(Date.now());
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(autoSave);
  }, [
    isComplete,
    stats,
    accumulatedTime,
    saveId,
    title,
    text,
    currentWordIndex,
    detailedStats,
    highlights,
    getActiveTime,
    savedData?.createdAt,
  ]);

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

  // Resume from pause with space or escape
  useEffect(() => {
    if (!isPaused) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Escape") {
        e.preventDefault();
        resumeFromPause();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, resumeFromPause]);

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
      highlights,
      createdAt: savedData?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    saveText(savedText);
    setLastSavedTime(Date.now());
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
    highlights,
    getActiveTime,
  ]);

  // Highlight functions
  const getHighlightForWord = useCallback((wordIndex: number): Highlight | null => {
    return highlights.find(h => wordIndex >= h.startWordIndex && wordIndex <= h.endWordIndex) || null;
  }, [highlights]);

  const handleWordClick = useCallback((wordIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();

    // If clicking on highlighted word, show the note
    const existingHighlight = getHighlightForWord(wordIndex);
    if (existingHighlight) {
      setActiveHighlight(activeHighlight === existingHighlight.id ? null : existingHighlight.id);
      return;
    }

    // Start or extend selection
    if (selectedRange === null) {
      setSelectedRange({ start: wordIndex, end: wordIndex });
    } else {
      // Extend selection
      const newStart = Math.min(selectedRange.start, wordIndex);
      const newEnd = Math.max(selectedRange.end, wordIndex);
      setSelectedRange({ start: newStart, end: newEnd });
      setShowNoteInput(true);
      setTimeout(() => noteInputRef.current?.focus(), 100);
    }
  }, [selectedRange, getHighlightForWord, activeHighlight]);

  const handleAddHighlight = useCallback(() => {
    if (!selectedRange || !noteText.trim()) return;

    const newHighlight: Highlight = {
      id: generateId(),
      startWordIndex: selectedRange.start,
      endWordIndex: selectedRange.end,
      note: noteText.trim(),
      color: 'yellow',
      createdAt: Date.now(),
    };

    setHighlights(prev => [...prev, newHighlight]);
    setSelectedRange(null);
    setShowNoteInput(false);
    setNoteText("");
  }, [selectedRange, noteText]);

  const handleDeleteHighlight = useCallback((highlightId: string) => {
    setHighlights(prev => prev.filter(h => h.id !== highlightId));
    setActiveHighlight(null);
  }, []);

  const cancelHighlight = useCallback(() => {
    setSelectedRange(null);
    setShowNoteInput(false);
    setNoteText("");
  }, []);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      lastActivityRef.current = Date.now();

      // Resume from pause if paused
      if (isPaused) {
        resumeFromPause();
      }

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
          const isNonAlpha = /[^a-zA-Z]/.test(expectedChar);
          let isCorrect: boolean;
          if (forgivingMode && isNonAlpha) {
            // In forgiving mode, skip non-alpha check - always correct
            isCorrect = true;
          } else if (forgivingMode) {
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
    [currentWord, currentWordIndex, words.length, stats.startTime, compareStrings, forgivingMode, muted, getActiveTime, isPaused, resumeFromPause]
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
                  const isNonAlpha = /[^a-zA-Z]/.test(targetChar);
                  let isCorrect: boolean;
                  if (forgivingMode && isNonAlpha) {
                    isCorrect = true;
                  } else if (forgivingMode) {
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

  // Finger hint renderer
  const renderFingerHint = () => {
    if (!fingerHint || fingerHintPosition === 'off') return null;

    return (
      <div className="flex-shrink-0 py-4 flex justify-center">
        <div className="flex items-center gap-6">
          {/* Left hand */}
          <div className="flex items-end gap-1">
            {['pinky', 'ring', 'middle', 'index'].map((finger, i) => {
              const isActive = fingerHint.hand === 'L' && fingerHint.finger === finger;
              const heights = [20, 26, 30, 24];
              return (
                <div key={finger} className="relative flex flex-col items-center">
                  {isActive && fingerHint.direction !== '●' && (
                    <div className="absolute -top-6 text-blue-500 text-lg">
                      {fingerHint.direction.includes('↑') && fingerHint.direction.includes('←') ? '↖' :
                       fingerHint.direction.includes('↑') && fingerHint.direction.includes('→') ? '↗' :
                       fingerHint.direction.includes('↓') && fingerHint.direction.includes('←') ? '↙' :
                       fingerHint.direction.includes('↓') && fingerHint.direction.includes('→') ? '↘' :
                       fingerHint.direction.includes('↑') ? '↑' :
                       fingerHint.direction.includes('↓') ? '↓' :
                       fingerHint.direction.includes('←') ? '←' :
                       fingerHint.direction.includes('→') ? '→' : ''}
                    </div>
                  )}
                  <div
                    className={`rounded-t-full transition-all ${
                      isActive
                        ? 'bg-blue-500 shadow-lg shadow-blue-500/30'
                        : 'bg-[var(--foreground)]/15'
                    }`}
                    style={{ width: 16, height: heights[i] }}
                  />
                </div>
              );
            })}
          </div>

          {/* Character display */}
          <div className="flex flex-col items-center">
            <span className="text-3xl font-mono font-bold">
              {nextCharToType === ' ' ? '␣' : nextCharToType}
            </span>
          </div>

          {/* Right hand */}
          <div className="flex items-end gap-1">
            {['index', 'middle', 'ring', 'pinky'].map((finger, i) => {
              const isActive = fingerHint.hand === 'R' && fingerHint.finger === finger;
              const heights = [24, 30, 26, 20];
              return (
                <div key={finger} className="relative flex flex-col items-center">
                  {isActive && fingerHint.direction !== '●' && (
                    <div className="absolute -top-6 text-green-500 text-lg">
                      {fingerHint.direction.includes('↑') && fingerHint.direction.includes('←') ? '↖' :
                       fingerHint.direction.includes('↑') && fingerHint.direction.includes('→') ? '↗' :
                       fingerHint.direction.includes('↓') && fingerHint.direction.includes('←') ? '↙' :
                       fingerHint.direction.includes('↓') && fingerHint.direction.includes('→') ? '↘' :
                       fingerHint.direction.includes('↑') ? '↑' :
                       fingerHint.direction.includes('↓') ? '↓' :
                       fingerHint.direction.includes('←') ? '←' :
                       fingerHint.direction.includes('→') ? '→' : ''}
                    </div>
                  )}
                  <div
                    className={`rounded-t-full transition-all ${
                      isActive
                        ? 'bg-green-500 shadow-lg shadow-green-500/30'
                        : 'bg-[var(--foreground)]/15'
                    }`}
                    style={{ width: 16, height: heights[i] }}
                  />
                </div>
              );
            })}
          </div>
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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Pause banner */}
      {isPaused && (
        <div
          className="flex-shrink-0 bg-[var(--foreground)] text-[var(--background)] py-3 px-6 flex items-center justify-center gap-4 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={resumeFromPause}
        >
          <span className="text-lg">⏸</span>
          <span className="font-medium">Paused</span>
          <span className="text-sm opacity-75">— Press Space, Esc, or click to resume</span>
        </div>
      )}

      {/* Header with progress */}
      <header className="flex-shrink-0 bg-[var(--background)] border-b border-[var(--foreground)]/5 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onReset}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-sm font-medium truncate max-w-[40%]">{title}</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setForgivingMode(!forgivingMode)}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                  forgivingMode
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "bg-[var(--foreground)]/10 text-[var(--muted)] hover:bg-[var(--foreground)]/20"
                }`}
                title={forgivingMode ? "Forgiving mode ON: only a-z and space count (click to toggle)" : "Strict mode: exact match required (click to toggle)"}
              >
                {forgivingMode ? "Forgiving" : "Strict"}
              </button>
              <button
                onClick={() => setMuted(!muted)}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  muted
                    ? "bg-[var(--foreground)]/10 text-[var(--muted)] hover:bg-[var(--foreground)]/20"
                    : "bg-[var(--foreground)] text-[var(--background)]"
                }`}
                title={muted ? "Sound off (click to unmute)" : "Sound on (click to mute)"}
              >
                {muted ? "🔇" : "🔊"}
              </button>
              <button
                onClick={() => setFingerHintPosition(p => p === 'off' ? 'top' : p === 'top' ? 'bottom' : 'off')}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  fingerHintPosition !== 'off'
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "bg-[var(--foreground)]/10 text-[var(--muted)] hover:bg-[var(--foreground)]/20"
                }`}
                title={`Finger hints: ${fingerHintPosition} (click to cycle)`}
              >
                {fingerHintPosition === 'off' ? '✋' : fingerHintPosition === 'top' ? '☝️' : '👇'}
              </button>
              <button
                onClick={() => setShowStats(true)}
                className="px-2 py-1 text-xs rounded bg-[var(--foreground)]/10 text-[var(--muted)] hover:bg-[var(--foreground)]/20 transition-all"
                title="View statistics"
              >
                📊
              </button>
              <button
                onClick={handleSave}
                className="px-2 py-1 text-xs rounded bg-[var(--foreground)]/10 text-[var(--muted)] hover:bg-[var(--foreground)]/20 transition-all"
              >
                {showSaved ? (
                  <span className="text-[var(--success)]">Saved ✓</span>
                ) : (
                  "💾"
                )}
              </button>
              <div className="text-sm font-medium text-[var(--muted)] ml-2">
                {calculateWPM()} <span className="text-xs">WPM</span>
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
      <div className="flex-shrink-0 w-full px-4 py-8">
        {renderSlidingTextBar()}
      </div>

      {/* Finger hint - top position */}
      {fingerHintPosition === 'top' && renderFingerHint()}

      {/* Main typing area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 min-h-0">
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
          className="typing-area flex-1 overflow-y-auto leading-relaxed text-lg min-h-0 py-8"
        >
          <div className="max-w-2xl mx-auto py-[30vh]">
            {words.map((word, index) => {
              const highlight = getHighlightForWord(index);
              const isSelected = selectedRange && index >= selectedRange.start && index <= selectedRange.end;
              const isHighlightStart = highlight && index === highlight.startWordIndex;

              let className = "inline cursor-pointer transition-all ";
              if (index < currentWordIndex) {
                className += "text-[var(--muted)]";
              } else if (index === currentWordIndex) {
                className +=
                  "text-[var(--foreground)] font-semibold bg-[var(--foreground)]/5 px-1 rounded";
              } else {
                className += "text-[var(--foreground)]/60";
              }

              // Add highlight styling
              if (highlight) {
                className += " bg-yellow-200/40 dark:bg-yellow-500/20";
              }
              if (isSelected) {
                className += " bg-blue-200/50 dark:bg-blue-500/30";
              }

              return (
                <span key={index} className="relative inline">
                  <span
                    ref={index === currentWordIndex ? currentWordRef : null}
                    className={className}
                    onClick={(e) => handleWordClick(index, e)}
                  >
                    {word}
                  </span>
                  {" "}
                  {/* Show note popup for active highlight */}
                  {isHighlightStart && activeHighlight === highlight.id && (
                    <div className="absolute left-0 top-full mt-1 z-30 bg-[var(--background)] border border-[var(--foreground)]/20 rounded-lg shadow-lg p-3 min-w-[200px] max-w-[300px]">
                      <p className="text-sm mb-2">{highlight.note}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteHighlight(highlight.id); }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete note
                      </button>
                    </div>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* Note input modal */}
        {showNoteInput && selectedRange && (
          <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center" onClick={cancelHighlight}>
            <div className="bg-[var(--background)] rounded-xl p-6 shadow-2xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="font-medium mb-2">Add a note</h3>
              <p className="text-sm text-[var(--muted)] mb-4">
                Selected: &ldquo;{words.slice(selectedRange.start, selectedRange.end + 1).join(' ')}&rdquo;
              </p>
              <textarea
                ref={noteInputRef}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your note here..."
                className="w-full p-3 border border-[var(--foreground)]/20 rounded-lg bg-transparent resize-none"
                rows={3}
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddHighlight}
                  disabled={!noteText.trim()}
                  className="flex-1 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg font-medium disabled:opacity-50"
                >
                  Save Note
                </button>
                <button
                  onClick={cancelHighlight}
                  className="px-4 py-2 border border-[var(--foreground)]/20 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-shrink-0 mt-6 pt-4 border-t border-[var(--foreground)]/5 flex justify-center gap-8 text-sm text-[var(--muted)]">
          <span>
            {currentWordIndex} / {words.length} words
          </span>
          <span>{calculateAccuracy()}% accuracy</span>
          {detailedStats.pauses.length > 0 && (
            <span>{detailedStats.pauses.length} pauses</span>
          )}
          {lastSavedTime && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
        </div>

        {/* Finger hint - bottom position */}
        {fingerHintPosition === 'bottom' && renderFingerHint()}
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
