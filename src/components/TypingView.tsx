"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SavedText, saveText, generateId, DetailedStats, WPMSample, PauseEvent, createEmptyDetailedStats, Highlight, addLeaderboardEntry, updateDailyStreak, getPlayerName, getPlayerProgress, updateGameStats, checkAndUnlockAchievements, markAchievementSeen, getTopScores } from "@/lib/storage";
import { playCorrectSound, playErrorSound, playWordCompleteSound, playPunctuationSound, playBackgroundMusic, stopBackgroundMusic, pauseBackgroundMusic, resumeBackgroundMusic, setMusicMuted } from "@/lib/sounds";
import { submitToGlobalLeaderboard } from "@/lib/api";
import { MONSTER_SKINS } from "@/lib/gamification";
import type { Achievement } from "@/lib/gamification";
import StatsView from "./StatsView";
import LeaderboardView from "./LeaderboardView";
import AchievementPopup from "./AchievementPopup";
import LevelUpPopup from "./LevelUpPopup";
import GameHUD from "./GameHUD";
import DailyChallengesPanel from "./DailyChallengesPanel";
import ArcadeNameEntry from "./ArcadeNameEntry";

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

const WPM_SAMPLE_INTERVAL = 3000; // Sample WPM every 3 seconds
const AUTO_SAVE_INTERVAL = 10000; // Auto-save every 10 seconds

export default function TypingView({ text, title, onReset, savedData }: TypingViewProps) {
  // Split text into words while tracking paragraph breaks
  const { words, paragraphStarts } = useMemo(() => {
    const paragraphs = text.split(/\n\n+/);
    const allWords: string[] = [];
    const startIndices = new Set<number>();

    paragraphs.forEach((para, pIndex) => {
      const paraWords = para.split(/\s+/).filter((w) => w.length > 0);
      if (paraWords.length > 0) {
        if (pIndex > 0) {
          startIndices.add(allWords.length);
        }
        allWords.push(...paraWords);
      }
    });

    return { words: allWords, paragraphStarts: startIndices };
  }, [text]);

  // Initialize power-up placements when text changes
  useEffect(() => {
    if (words.length === 0) return;

    // Place 8-12 random power-ups throughout the text
    const placements = new Map<number, 'freezeMonster' | 'shield' | 'slowMo'>();
    const powerUpTypes: ('freezeMonster' | 'shield' | 'slowMo')[] = ['freezeMonster', 'shield', 'slowMo'];
    const numPowerUps = Math.floor(Math.random() * 5) + 8; // 8-12 power-ups

    for (let i = 0; i < numPowerUps; i++) {
      // Place power-ups throughout the entire text
      const minIndex = 5; // Start after first few words
      const maxIndex = words.length - 1;
      let wordIndex = Math.floor(Math.random() * (maxIndex - minIndex + 1)) + minIndex;

      // Ensure we don't place multiple power-ups on the same word
      while (placements.has(wordIndex)) {
        wordIndex = Math.floor(Math.random() * (maxIndex - minIndex + 1)) + minIndex;
      }

      // Randomly select a power-up type
      const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      placements.set(wordIndex, powerUpType);
    }

    setPowerUpPlacements(placements);
  }, [text, words]);

  const [currentWordIndex, setCurrentWordIndex] = useState(
    savedData?.progress.currentWordIndex || 0
  );
  const [currentInput, setCurrentInput] = useState("");
  // Track what was typed for each word and whether it was correct
  const [typedWords, setTypedWords] = useState<Map<number, { typed: string; correct: boolean }>>(new Map());
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
  const [justSaved, setJustSaved] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(savedData?.updatedAt || null);
  // Settings
  const [monsterMode, setMonsterMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('typeread_monster_mode');
    return saved !== null ? saved === 'true' : true;
  });
  const [forgiveCapitals, setForgiveCapitals] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('typeread_forgive_capitals');
    return saved !== null ? saved === 'true' : true;
  });
  const [forgiveNonAlpha, setForgiveNonAlpha] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('typeread_forgive_non_alpha');
    return saved !== null ? saved === 'true' : true;
  });
  const [musicEnabled, setMusicEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('typeread_music');
    return saved !== null ? saved === 'true' : true;
  });
  const [soundEffects, setSoundEffects] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('typeread_sound_effects');
    return saved !== null ? saved === 'true' : true;
  });
  const [fingerHintPosition, setFingerHintPosition] = useState<'off' | 'top' | 'bottom'>(() => {
    if (typeof window === 'undefined') return 'top';
    const saved = localStorage.getItem('typeread_finger_hint_position');
    return (saved as 'off' | 'top' | 'bottom') || 'top';
  });
  const [autosaveEnabled, setAutosaveEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('typeread_autosave');
    return saved !== null ? saved === 'true' : true;
  });
  const [allowMistakes, setAllowMistakes] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('typeread_allow_mistakes');
    return saved !== null ? saved === 'true' : false;
  });

  // Auto-pause and detailed stats
  const [isPaused, setIsPaused] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);

  // Gamification
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [maxComboReached, setMaxComboReached] = useState(0);
  const [achievementToShow, setAchievementToShow] = useState<Achievement | null>(null);
  const [levelUpToShow, setLevelUpToShow] = useState<number | null>(null);
  const [activePowerUps, setActivePowerUps] = useState<{
    freeze: boolean;
    shield: boolean;
    slowMo: boolean;
  }>({ freeze: false, shield: false, slowMo: false });

  // Floating power-ups on specific words
  const [powerUpPlacements, setPowerUpPlacements] = useState<Map<number, 'freezeMonster' | 'shield' | 'slowMo'>>(new Map());

  const [selectedMonsterSkin, setSelectedMonsterSkin] = useState('{selectedMonsterSkin}');

  // Chase game mode state
  const [monsterPosition, setMonsterPosition] = useState(0); // Monster waits at position 0
  const [gameScore, setGameScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showArcadeNameEntry, setShowArcadeNameEntry] = useState(false);
  const [showLeaderboardAfterGame, setShowLeaderboardAfterGame] = useState(false);
  const [monsterSpeed, setMonsterSpeed] = useState(2); // characters per second (will be set based on WPM)
  const [monsterStarted, setMonsterStarted] = useState(false);
  const monsterIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Streak tracking
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [streakBonus, setStreakBonus] = useState<{ amount: number; timestamp: number } | null>(null);

  // Monster countdown before chase begins
  const [monsterCountdown, setMonsterCountdown] = useState<number | null>(null);
  const monsterStartTimeRef = useRef<number | null>(null); // When monster started chasing

  // Rolling speed tracking for adaptive monster
  const recentKeystrokesRef = useRef<number[]>([]); // timestamps of recent keystrokes
  const allKeystrokesRef = useRef<number[]>([]); // all keystrokes for initial speed calc
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
  const slidingBarRef = useRef<HTMLDivElement>(null);
  const [slidingBarWidth, setSlidingBarWidth] = useState(0);
  const currentWordMistakesRef = useRef<boolean>(false); // Track if ANY mistake made in current word

  const currentWord = words[currentWordIndex] || "";
  const progress = (currentWordIndex / words.length) * 100;

  // Detect RTL text (Hebrew, Arabic, etc.)
  const isRTL = useMemo(() => {
    const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F]/;
    return rtlRegex.test(text);
  }, [text]);

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

      // Hebrew keyboard layout (standard SI-1452)
      // Left pinky
      'ש': ['pinky', '●', 'L'], 'ז': ['pinky', '↓', 'L'],
      // Left ring
      'ד': ['ring', '●', 'L'], 'ס': ['ring', '↓', 'L'],
      // Left middle
      'ק': ['middle', '↑', 'L'], 'ג': ['middle', '●', 'L'], 'ב': ['middle', '↓', 'L'],
      // Left index
      'ר': ['index', '↑', 'L'], 'כ': ['index', '●', 'L'], 'ה': ['index', '↓', 'L'],
      'א': ['index', '↑→', 'L'], 'ע': ['index', '→', 'L'], 'נ': ['index', '↓→', 'L'],
      // Right index
      'ט': ['index', '↑←', 'R'], 'י': ['index', '←', 'R'], 'מ': ['index', '↓←', 'R'],
      'ו': ['index', '↑', 'R'], 'ח': ['index', '●', 'R'], 'צ': ['index', '↓', 'R'],
      // Right middle
      'ן': ['middle', '↑', 'R'], 'ל': ['middle', '●', 'R'], 'ת': ['middle', '↓', 'R'],
      // Right ring
      'ם': ['ring', '↑', 'R'], 'ך': ['ring', '●', 'R'], 'ץ': ['ring', '↓', 'R'],
      // Right pinky
      'פ': ['pinky', '↑', 'R'], 'ף': ['pinky', '●', 'R'],
    };

    const mapping = fingerMap[key];
    if (!mapping) return null;

    return { finger: mapping[0], direction: mapping[1], hand: mapping[2] };
  }, []);

  const stripNonAlpha = useCallback((s: string) => {
    // If forgiveNonAlpha is on, strip punctuation and keep only letters
    return forgiveNonAlpha ? s.replace(/[^a-zA-Z\u0590-\u05FF]/g, "") : s;
  }, [forgiveNonAlpha]);

  const compareStrings = useCallback((a: string, b: string) => {
    // Strip punctuation if forgiveNonAlpha is on
    let strA = stripNonAlpha(a);
    let strB = stripNonAlpha(b);
    // Make case-insensitive if forgiveCapitals is on
    if (forgiveCapitals) {
      strA = strA.toLowerCase();
      strB = strB.toLowerCase();
    }
    // Empty strings don't match (need at least some letters)
    if (strA.length === 0 || strB.length === 0) return false;
    return strA === strB;
  }, [forgiveCapitals, forgiveNonAlpha, stripNonAlpha]);

  const isWordComplete = compareStrings(currentInput, currentWord);

  // Get the next character to type (or the character that needs fixing)
  const getNextCharToType = () => {
    // If word is complete, next is space
    if (isWordComplete) return ' ';

    // Find first incorrect character position
    for (let i = 0; i < currentInput.length; i++) {
      const inputChar = currentInput[i];
      const expectedChar = currentWord[i];
      if (!expectedChar) break; // Typed more than word length

      const isNonAlpha = /[^a-zA-Z\u0590-\u05FF]/.test(expectedChar);
      let isCorrect: boolean;
      if (forgiveNonAlpha && isNonAlpha) {
        isCorrect = true;
      } else if (forgiveCapitals) {
        isCorrect = inputChar.toLowerCase() === expectedChar.toLowerCase();
      } else {
        isCorrect = inputChar === expectedChar;
      }

      if (!isCorrect) {
        // Show the character they need to fix (use backspace indicator or the correct char)
        return expectedChar;
      }
    }

    // All typed chars are correct, show next expected char
    return currentWord[currentInput.length] || ' ';
  };

  const nextCharToType = getNextCharToType();
  const fingerHint = getFingerHint(nextCharToType);

  // Build the full text stream for the sliding view with powerup icons embedded
  // Also track word start positions for accurate cursor positioning
  const { fullTextStream, wordStartPositions } = useMemo(() => {
    const POWER_UP_ICONS = {
      freezeMonster: '❄️',
      shield: '🛡️',
      slowMo: '⏱️',
    };

    let stream = '';
    const positions = new Map<number, number>();

    words.forEach((word, idx) => {
      if (idx > 0) {
        stream += ' ';
      }

      // Check if word has a power-up - prepend icon to word
      const powerUpType = powerUpPlacements.get(idx);
      if (powerUpType) {
        const icon = POWER_UP_ICONS[powerUpType];
        stream += icon + ' ';
      }

      // Record where this word starts in the stream
      positions.set(idx, stream.length);
      stream += word;
    });

    return { fullTextStream: stream, wordStartPositions: positions };
  }, [words, powerUpPlacements]);

  // Calculate the absolute character position in the full text using word positions
  const absolutePosition = useMemo(() => {
    const wordStart = wordStartPositions.get(currentWordIndex) || 0;
    return wordStart + currentInput.length;
  }, [currentWordIndex, currentInput.length, wordStartPositions]);

  // Monster starts one character behind the cursor (on the space before current word)
  const oneWordBehindPosition = useMemo(() => {
    return Math.max(0, absolutePosition - 1);
  }, [absolutePosition]);

  // Calculate current WPM using standard formula: (characters / 5) / minutes
  const calculateWPM = useCallback(() => {
    if (!stats.startTime) return 0;
    const sessionTime = stats.startTime
      ? (stats.endTime || Date.now()) - stats.startTime
      : 0;
    const totalTime = accumulatedTime + sessionTime - detailedStats.totalPauseTime;
    const minutes = totalTime / 60000;
    if (minutes < 0.01) return 0;
    // Standard WPM formula: all characters typed / 5 / minutes
    // This gives the standard "words per minute" where a word = 5 characters
    return Math.round((stats.totalKeystrokes / 5) / minutes);
  }, [stats, accumulatedTime, detailedStats.totalPauseTime]);

  // Track CORRECT keystrokes for accurate speed calculation
  const correctKeystrokesRef = useRef<number[]>([]);

  // Calculate typing speed (chars/sec) from correctly typed chars over last 60 seconds
  const calculateLastMinuteSpeed = useCallback(() => {
    const now = Date.now();
    const windowMs = 60000; // 60 second window (1 minute)

    // Filter to correct keystrokes in the last minute
    const recentCorrect = correctKeystrokesRef.current.filter(ts => now - ts < windowMs);
    correctKeystrokesRef.current = recentCorrect; // Clean up old ones

    if (recentCorrect.length < 2) return 0;

    // Calculate chars per second based on correct keystrokes only
    const oldest = recentCorrect[0];
    const timeSpanSec = (now - oldest) / 1000;

    if (timeSpanSec < 1) return 0;

    // Return correctly typed chars per second
    return recentCorrect.length / timeSpanSec;
  }, []);

  const calculateAccuracy = useCallback(() => {
    if (stats.totalKeystrokes === 0) return 100;
    return Math.round((stats.correctKeystrokes / stats.totalKeystrokes) * 100);
  }, [stats]);

  // Power-up activation handler
  const handlePowerUpActivation = (type: 'freezeMonster' | 'shield' | 'slowMo') => {
    if (type === 'freezeMonster') {
      setActivePowerUps(prev => ({ ...prev, freeze: true }));
      // Freeze monster for 10 seconds
      setTimeout(() => {
        setActivePowerUps(prev => ({ ...prev, freeze: false }));
      }, 10000);
    } else if (type === 'shield') {
      setActivePowerUps(prev => ({ ...prev, shield: true }));
      // Shield lasts until used (one-time protection)
    } else if (type === 'slowMo') {
      setActivePowerUps(prev => ({ ...prev, slowMo: true }));
      // Slow-mo for 15 seconds
      setTimeout(() => {
        setActivePowerUps(prev => ({ ...prev, slowMo: false }));
      }, 15000);
    }
  };

  // Arcade-style game over handler
  const handleGameOver = useCallback(() => {
    setIsGameOver(true);

    // Check if score is in top 10
    const topScores = getTopScores(10);
    const isInTop10 = topScores.length < 10 || gameScore > topScores[topScores.length - 1].score;

    if (isInTop10) {
      // Show arcade name entry
      setShowArcadeNameEntry(true);
    } else {
      // Show leaderboard directly
      setShowLeaderboardAfterGame(true);
    }
  }, [gameScore]);

  // Handle arcade name submission
  const handleNameSubmit = useCallback((playerName: string) => {
    const entry = {
      playerName,
      score: gameScore,
      wpm: calculateWPM(),
      peakWpm: detailedStats.peakWpm || 0,
      accuracy: calculateAccuracy(),
      streak: bestStreak,
      wordsTyped: stats.wordsTyped,
      duration: detailedStats.totalActiveTime || 0,
      survived: false, // They got caught since isGameOver is true
      date: Date.now(),
      textTitle: title,
      language: (isRTL ? 'he' : 'en') as 'he' | 'en',
    };

    // Save to leaderboard
    addLeaderboardEntry(entry);

    // Also submit to global leaderboard
    submitToGlobalLeaderboard(entry);

    // Hide name entry and show leaderboard
    setShowArcadeNameEntry(false);
    setShowLeaderboardAfterGame(true);
  }, [gameScore, bestStreak, stats.wordsTyped, title, isRTL, detailedStats, calculateWPM, calculateAccuracy]);

  // Get elapsed time since session start (excluding pauses)
  const getActiveTime = useCallback(() => {
    if (!sessionStartRef.current) return accumulatedTime;
    const now = Date.now();
    const sessionTime = now - sessionStartRef.current;
    return accumulatedTime + sessionTime - detailedStats.totalPauseTime;
  }, [accumulatedTime, detailedStats.totalPauseTime]);

  // Focus input on mount and when clicking anywhere (except when note modal is open)
  const showNoteInputRef = useRef(showNoteInput);
  showNoteInputRef.current = showNoteInput;

  useEffect(() => {
    if (!showNoteInputRef.current) {
      inputRef.current?.focus();
    }

    const handleClick = () => {
      if (!showNoteInputRef.current) {
        inputRef.current?.focus();
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Measure sliding bar width for responsive character count
  useEffect(() => {
    const measureWidth = () => {
      if (slidingBarRef.current) {
        setSlidingBarWidth(slidingBarRef.current.offsetWidth);
      }
    };

    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('typeread_monster_mode', String(monsterMode));
  }, [monsterMode]);

  useEffect(() => {
    localStorage.setItem('typeread_forgive_capitals', String(forgiveCapitals));
  }, [forgiveCapitals]);

  useEffect(() => {
    localStorage.setItem('typeread_forgive_non_alpha', String(forgiveNonAlpha));
  }, [forgiveNonAlpha]);

  useEffect(() => {
    localStorage.setItem('typeread_music', String(musicEnabled));
  }, [musicEnabled]);

  useEffect(() => {
    localStorage.setItem('typeread_sound_effects', String(soundEffects));
  }, [soundEffects]);

  useEffect(() => {
    localStorage.setItem('typeread_finger_hint_position', fingerHintPosition);
  }, [fingerHintPosition]);

  useEffect(() => {
    localStorage.setItem('typeread_autosave', String(autosaveEnabled));
  }, [autosaveEnabled]);

  useEffect(() => {
    localStorage.setItem('typeread_allow_mistakes', String(allowMistakes));
  }, [allowMistakes]);

  // Auto-pause detection - completely disabled in chase/monster mode
  // Since this is always a chase game, we never pause
  useEffect(() => {
    // Chase mode is always on - no pausing allowed!
    // The monster waits for no one.
    return;
  }, []);

  // Keep monster at "one word behind" position until countdown starts
  // This ensures the monster is visible from the start and tracks player position
  const hasCountdown = monsterCountdown !== null;
  useEffect(() => {
    // Only update position if monster mode is on, not started, and no countdown
    if (monsterMode && !monsterStarted && !hasCountdown) {
      setMonsterPosition(oneWordBehindPosition);
    }
  }, [monsterMode, monsterStarted, hasCountdown, oneWordBehindPosition]);

  // Monster starts at the beginning of the previous word and waits for 10 seconds
  // Start the 10-second countdown when first char is typed
  const startMonsterCountdown = useCallback(() => {
    if (!monsterMode || monsterCountdown !== null || monsterStarted) return;
    // Start the 10-second grace period countdown (position is already set)
    setMonsterCountdown(10);
  }, [monsterMode, monsterCountdown, monsterStarted]);

  // Handle monster countdown timer
  useEffect(() => {
    if (monsterCountdown === null || monsterCountdown < 0) return;

    if (monsterCountdown === 0) {
      // Countdown finished - monster wakes up!
      // Calculate initial speed from keystrokes during the 10-second grace period
      const keystrokes = allKeystrokesRef.current;
      let playerCharsPerSec = 2; // default minimum

      if (keystrokes.length >= 2) {
        const firstKeystroke = keystrokes[0];
        const lastKeystroke = keystrokes[keystrokes.length - 1];
        const activeTypingTime = (lastKeystroke - firstKeystroke) / 1000;

        if (activeTypingTime > 0.5) {
          playerCharsPerSec = Math.max(keystrokes.length / activeTypingTime, 2);
        }
      }

      // Monster position is already at "one word behind" from the useEffect
      setMonsterSpeed(playerCharsPerSec);
      setMonsterStarted(true);
      setMonsterCountdown(null);
      monsterStartTimeRef.current = Date.now();
      // Start the chase music!
      if (musicEnabled) playBackgroundMusic();
      return;
    }

    // Tick down every second
    const timer = setTimeout(() => {
      setMonsterCountdown(monsterCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [monsterCountdown, musicEnabled]);

  // Handle music based on game state
  useEffect(() => {
    if (isGameOver || isComplete) {
      stopBackgroundMusic();
    } else if (isPaused) {
      pauseBackgroundMusic();
    } else if (monsterStarted && musicEnabled) {
      resumeBackgroundMusic();
    }
  }, [isGameOver, isComplete, isPaused, monsterStarted, musicEnabled]);

  // Sync mute state with music
  useEffect(() => {
    setMusicMuted(!musicEnabled);
  }, [musicEnabled]);

  // Stop music on unmount
  useEffect(() => {
    return () => {
      stopBackgroundMusic();
    };
  }, []);

  // Monster chase game loop
  useEffect(() => {
    if (!monsterStarted || isComplete || isGameOver || isPaused) {
      if (monsterIntervalRef.current) {
        clearInterval(monsterIntervalRef.current);
        monsterIntervalRef.current = null;
      }
      return;
    }

    // Monster moves every 50ms for smooth animation
    monsterIntervalRef.current = setInterval(() => {
      setMonsterPosition((prev: number) => {
        if (prev < 0) return prev; // Not started yet

        // Don't move if frozen
        if (activePowerUps.freeze) return prev;

        // Apply slow-mo if active
        const speedMultiplier = activePowerUps.slowMo ? 0.5 : 1;
        const newPos = prev + (monsterSpeed / 20) * speedMultiplier; // 20 updates per second

        // Check if monster caught the player
        if (newPos >= absolutePosition) {
          // Use shield if available
          if (activePowerUps.shield) {
            setActivePowerUps(p => ({ ...p, shield: false }));
            // Push monster back
            return prev - 50; // Move back significantly
          } else {
            handleGameOver();
            return prev;
          }
        }
        return newPos;
      });
    }, 50);

    // Update monster speed every second based on adaptive difficulty algorithm
    const speedUpdateInterval = setInterval(() => {
      const lastMinuteSpeed = calculateLastMinuteSpeed(); // chars/sec from last 60 seconds

      if (lastMinuteSpeed > 0 && monsterStartTimeRef.current) {
        const elapsedSeconds = (Date.now() - monsterStartTimeRef.current) / 1000;

        // 1. Skill-Based Scaling: Determine player skill tier
        // Fast typers (>5 c/s ≈ 60 WPM): 1.0-1.5x multiplier
        // Medium typers (3-5 c/s ≈ 36-60 WPM): 0.8-1.0x multiplier
        // Slow typers (<3 c/s ≈ <36 WPM): 0.6-0.8x multiplier
        const playerCPS = lastMinuteSpeed;
        const skillMultiplier = Math.min(Math.max(0.6 + (playerCPS / 10), 0.6), 1.5);

        // 2. Sigmoid Curve Progression: Smooth S-curve (starts gentle, accelerates mid-game, plateaus)
        // Formula: bonus = maxBonus / (1 + e^(-steepness * (time - midpoint)))
        const maxBonus = 8 * skillMultiplier; // Max bonus scaled by skill (4.8-12 c/s)
        const midpoint = 60; // S-curve inflection point at 60 seconds
        const steepness = 0.05 * skillMultiplier; // Curve steepness scales with skill
        const sigmoidBonus = maxBonus / (1 + Math.exp(-steepness * (elapsedSeconds - midpoint)));

        // 3. Rubber-Banding: Adjust based on player lead/lag
        // Distance in characters between player and monster
        const distance = absolutePosition - monsterPosition;
        const targetDistance = lastMinuteSpeed * 10; // Target: ~10 seconds of typing ahead

        // Rubber-banding factor: 0.9-1.1x based on distance from target
        // Player far ahead → monster speeds up (+10%)
        // Player close/behind → monster slows down (-10%)
        const distanceRatio = distance / Math.max(targetDistance, 20);
        const rubberBandFactor = Math.min(Math.max(0.9 + (1 - distanceRatio) * 0.2, 0.9), 1.1);

        // 4. Combine all factors: base speed * rubber-banding + sigmoid progression
        const baseSpeed = lastMinuteSpeed * rubberBandFactor;
        const newSpeed = baseSpeed + sigmoidBonus;

        // Clamp between minimum (2 c/s) and maximum (30 c/s for fast typers)
        const maxSpeed = 20 + (10 * (skillMultiplier - 0.6)); // 20-29 c/s based on skill
        setMonsterSpeed(Math.min(Math.max(newSpeed, 2), maxSpeed));
      }
    }, 1000);

    return () => {
      if (monsterIntervalRef.current) {
        clearInterval(monsterIntervalRef.current);
        monsterIntervalRef.current = null;
      }
      clearInterval(speedUpdateInterval);
    };
  }, [monsterStarted, isComplete, isGameOver, isPaused, absolutePosition, monsterSpeed, calculateLastMinuteSpeed]);

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

  // Update daily streak when game starts
  useEffect(() => {
    if (monsterStarted && monsterMode) {
      updateDailyStreak();
    }
  }, [monsterStarted, monsterMode]);

  // Save to leaderboard when game ends
  useEffect(() => {
    if ((isGameOver || isComplete) && stats.wordsTyped > 0 && stats.startTime) {
      const activeTime = getActiveTime();
      const accuracy = stats.totalKeystrokes > 0
        ? (stats.correctKeystrokes / stats.totalKeystrokes) * 100
        : 0;

      const avgWPM = detailedStats.averageWpm || calculateWPM();

      const entry = {
        playerName: getPlayerName(),
        date: Date.now(),
        score: gameScore,
        wordsTyped: stats.wordsTyped,
        wpm: avgWPM,
        peakWpm: detailedStats.peakWpm,
        accuracy: accuracy,
        streak: bestStreak,
        textTitle: title,
        duration: activeTime,
        survived: isComplete && !isGameOver,
        language: (isRTL ? 'he' : 'en') as 'he' | 'en',
      };

      // Save locally
      addLeaderboardEntry(entry);

      // Submit to global leaderboard (async, don't wait)
      submitToGlobalLeaderboard(entry).catch(() => {
        // Silently fail if global submission doesn't work
      });
    }
  }, [isGameOver, isComplete]);

  // Load selected monster skin
  useEffect(() => {
    const progress = getPlayerProgress();
    const skin = MONSTER_SKINS.find(s => s.id === progress.selectedSkin);
    if (skin) {
      setSelectedMonsterSkin(skin.emoji);
    }
  }, []);

  // Update game stats and check achievements when game ends
  useEffect(() => {
    if ((isGameOver || isComplete) && stats.wordsTyped > 0 && stats.startTime) {
      const activeTime = getActiveTime();
      const accuracy = stats.totalKeystrokes > 0
        ? (stats.correctKeystrokes / stats.totalKeystrokes) * 100
        : 0;

      const avgWPM = detailedStats.averageWpm || calculateWPM();

      // Update game stats (this also adds XP and checks achievements)
      updateGameStats({
        wordsTyped: stats.wordsTyped,
        wpm: avgWPM,
        accuracy: accuracy,
        streak: bestStreak,
        duration: activeTime,
        survived: isComplete && !isGameOver,
        score: gameScore,
      });

      // Check for new achievements
      const newAchievements = checkAndUnlockAchievements({
        wpm: avgWPM,
        accuracy: accuracy,
        streak: bestStreak,
        wordsTyped: stats.wordsTyped,
        survived: isComplete && !isGameOver,
        combo: maxComboReached,
      });

      // Show first achievement (others will be shown in sequence)
      if (newAchievements.length > 0) {
        setAchievementToShow(newAchievements[0]);
      }

      // Check if leveled up
      const progress = getPlayerProgress();
      const prevProgress = JSON.parse(localStorage.getItem('typeread_player_progress_before') || 'null');
      if (prevProgress && progress.level > prevProgress.level) {
        setLevelUpToShow(progress.level);
      }
    }
  }, [isGameOver, isComplete]);

  // Scroll current word to center
  useEffect(() => {
    if (currentWordRef.current) {
      currentWordRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentWordIndex]);

  // Auto-save
  useEffect(() => {
    if (isComplete || !stats.startTime || !autosaveEnabled) return;

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
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
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
    autosaveEnabled,
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

  // Handle backspace to go back to previous word
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && currentInput === '' && currentWordIndex > 0) {
        e.preventDefault();
        // Go back to previous word
        const prevIndex = currentWordIndex - 1;
        const prevTypedData = typedWords.get(prevIndex);

        // Remove the previous word from typed words so it can be re-typed
        setTypedWords(prev => {
          const newMap = new Map(prev);
          newMap.delete(prevIndex);
          return newMap;
        });

        // Restore the previous input (what was typed before)
        setCurrentInput(prevTypedData?.typed || '');
        setCurrentWordIndex(prevIndex);
        currentWordMistakesRef.current = false; // Reset for the word we're going back to

        // Adjust stats
        setStats(s => ({
          ...s,
          wordsTyped: Math.max(0, s.wordsTyped - 1),
          totalKeystrokes: Math.max(0, s.totalKeystrokes - (prevTypedData?.typed.length || 0)),
          correctKeystrokes: prevTypedData?.correct
            ? Math.max(0, s.correctKeystrokes - (prevTypedData?.typed.length || 0))
            : s.correctKeystrokes,
        }));
      }
    },
    [currentInput, currentWordIndex, typedWords]
  );

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

        if (typedWord.length === 0) {
          // Just a space with no content, ignore
          return;
        }

        const isCorrect = compareStrings(typedWord, currentWord);
        const lastChar = currentWord[currentWord.length - 1];
        const hasPunctuation = /[.,!?;:]/.test(lastChar);

        // Strip punctuation for length/mistake comparison if forgiveNonAlpha is on
        const strippedTyped = forgiveNonAlpha ? typedWord.replace(/[^a-zA-Z\u0590-\u05FF]/g, "") : typedWord;
        const strippedTarget = forgiveNonAlpha ? currentWord.replace(/[^a-zA-Z\u0590-\u05FF]/g, "") : currentWord;

        // Count mistakes in the word (comparing letter by letter)
        let mistakeCount = 0;
        const minLen = Math.min(strippedTyped.length, strippedTarget.length);
        for (let i = 0; i < minLen; i++) {
          const inputChar = strippedTyped[i];
          const expectedChar = strippedTarget[i];
          let charCorrect: boolean;
          if (forgiveCapitals) {
            charCorrect = inputChar.toLowerCase() === expectedChar.toLowerCase();
          } else {
            charCorrect = inputChar === expectedChar;
          }
          if (!charCorrect) {
            mistakeCount++;
            currentWordMistakesRef.current = true; // Mark that a mistake was made, even if backspaced
          }
        }
        // Extra or missing characters count as mistakes
        mistakeCount += Math.abs(strippedTyped.length - strippedTarget.length);

        // Word must be fully typed
        const isFullyTyped = strippedTyped.length === strippedTarget.length;

        // Block completion based on allowMistakes setting
        // If allowMistakes is OFF: block if not fully typed, or more than 3 mistakes, or not correct
        // If allowMistakes is ON: only block if not fully typed
        const shouldBlock = allowMistakes
          ? !isFullyTyped
          : (!isFullyTyped || mistakeCount > 3 || !isCorrect);

        if (shouldBlock) {
          if (soundEffects) playErrorSound();
          setShake(true);
          setTimeout(() => setShake(false), 300);
          // Remove the trailing space
          setCurrentInput(typedWord);
          return;
        }

        // Word completion successful - record the space keystroke for accurate CPM calculation
        // (The individual letter keystrokes are already recorded when typed)
        const now = Date.now();
        correctKeystrokesRef.current.push(now);
        recentKeystrokesRef.current.push(now);
        if (!monsterStarted) {
          allKeystrokesRef.current.push(now);
        }

        // Track what was typed for this word
        setTypedWords(prev => {
          const newMap = new Map(prev);
          newMap.set(currentWordIndex, { typed: typedWord, correct: isCorrect });
          return newMap;
        });

        // Play appropriate sound
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

        // Update streak and score
        if (isCorrect) {
          const newStreak = currentStreak + 1;
          setCurrentStreak(newStreak);
          setBestStreak((prev: number) => Math.max(prev, newStreak));

          // Increase combo multiplier (perfect words only - no mistakes ever made, even if fixed)
          if (!currentWordMistakesRef.current) {
            const newCombo = comboMultiplier + 1;
            setComboMultiplier(newCombo);
            setMaxComboReached(prev => Math.max(prev, newCombo));
          } else {
            setComboMultiplier(1);
          }

          // Award streak bonus at milestones
          let bonus = 0;
          if (newStreak === 5) bonus = 10;
          else if (newStreak === 10) bonus = 25;
          else if (newStreak === 20) bonus = 50;
          else if (newStreak === 50) bonus = 150;
          else if (newStreak === 100) bonus = 500;
          else if (newStreak % 25 === 0 && newStreak > 100) bonus = 100;

          if (bonus > 0) {
            setStreakBonus({ amount: bonus, timestamp: Date.now() });
            setTimeout(() => setStreakBonus(null), 1500);
          }

          // Update game score: word.length * streak multiplier * combo multiplier + bonus
          const streakMultiplier = Math.min(1 + Math.floor(newStreak / 5) * 0.1, 2); // Up to 2x at 50+ streak
          const baseScore = currentWord.length * streakMultiplier * comboMultiplier;
          setGameScore((prev: number) => prev + Math.round(baseScore) + bonus);

          // Check if this word has a power-up collectible
          const powerUpType = powerUpPlacements.get(currentWordIndex);
          if (powerUpType) {
            // Auto-collect and activate the power-up
            handlePowerUpActivation(powerUpType);
            // Remove it from placements so it's not collected again
            setPowerUpPlacements(prev => {
              const newPlacements = new Map(prev);
              newPlacements.delete(currentWordIndex);
              return newPlacements;
            });
          }
        } else {
          // Word has mistakes
          setCurrentStreak(0);
          setComboMultiplier(1); // Reset combo on mistakes
          // Lose 1 point per mistake
          setGameScore((prev: number) => Math.max(0, prev - mistakeCount));
        }

        // Update stats
        setStats((s) => ({
          ...s,
          wordsTyped: s.wordsTyped + 1,
          correctKeystrokes: s.correctKeystrokes + (isCorrect ? typedWord.length : 0),
          totalKeystrokes: s.totalKeystrokes + typedWord.length,
        }));

        // Always advance to next word
        if (currentWordIndex === words.length - 1) {
          setIsComplete(true);
          setStats((s) => ({ ...s, endTime: Date.now() }));
          setDetailedStats((prev) => ({
            ...prev,
            totalActiveTime: getActiveTime(),
          }));
        } else {
          setCurrentWordIndex((i) => i + 1);
          currentWordMistakesRef.current = false; // Reset for next word
        }
        setCurrentInput("");
      } else {
        const newCharIndex = value.length - 1;
        if (newCharIndex >= 0 && newCharIndex < currentWord.length) {
          const newChar = value[newCharIndex];
          const expectedChar = currentWord[newCharIndex];
          const isNonAlpha = /[^a-zA-Z\u0590-\u05FF]/.test(expectedChar);
          let isCorrect: boolean;
          if (forgiveNonAlpha && isNonAlpha) {
            // Skip non-alpha characters - always correct
            isCorrect = true;
          } else if (forgiveCapitals) {
            isCorrect = newChar.toLowerCase() === expectedChar.toLowerCase();
          } else {
            isCorrect = newChar === expectedChar;
          }

          // Record keystroke for rolling speed calculation
          const now = Date.now();
          recentKeystrokesRef.current.push(now);
          // Also track all keystrokes for initial monster speed calculation
          if (!monsterStarted) {
            allKeystrokesRef.current.push(now);
          }
          // Track CORRECT keystrokes only for accurate CPM calculation
          if (isCorrect) {
            correctKeystrokesRef.current.push(now);
          }

          if (soundEffects) {
            if (isCorrect) {
              playCorrectSound();
            } else {
              playErrorSound();
            }
          }

          // Reset combo immediately on incorrect keystroke
          if (!isCorrect) {
            setComboMultiplier(1);
          }

          // Start monster countdown on first correct keystroke
          if (isCorrect && monsterMode && monsterCountdown === null && !monsterStarted) {
            startMonsterCountdown();
          }
        } else if (newCharIndex >= currentWord.length) {
          // Typing beyond word length - always an error
          if (soundEffects) playErrorSound();
          setShake(true);
          setTimeout(() => setShake(false), 300);
        }
        setCurrentInput(value);
      }
    },
    [currentWord, currentWordIndex, words.length, stats.startTime, compareStrings, forgiveCapitals, forgiveNonAlpha, soundEffects, getActiveTime, isPaused, resumeFromPause, currentStreak, monsterMode, monsterCountdown, monsterStarted, startMonsterCountdown]
  );

  // Sliding text bar renderer
  const renderSlidingTextBar = () => {
    // Calculate character width based on container width
    // On mobile (text-2xl ~24px), chars are ~14px wide; on desktop (text-4xl ~36px), chars are ~22px wide
    const isMobile = slidingBarWidth < 640;
    const charWidth = isMobile ? 14 : 22;
    const availableWidth = slidingBarWidth - 32; // Account for padding and gradients
    const windowSize = Math.max(20, Math.floor(availableWidth / charWidth));
    // Keep cursor at exact center of the screen
    const centerOffset = Math.floor(windowSize / 2);

    // Calculate visible window with padding for centering
    const rawStartPos = absolutePosition - centerOffset;
    const startPos = Math.max(0, rawStartPos);

    // Add padding spaces at the beginning if cursor is near the start
    const leadingPadding = rawStartPos < 0 ? Math.abs(rawStartPos) : 0;

    // Calculate how many actual characters to show (accounting for leading padding)
    const charsToShow = windowSize - leadingPadding;
    const endPos = Math.min(fullTextStream.length, startPos + charsToShow);

    // Add padding spaces at the end if cursor is near the end
    const actualChars = endPos - startPos;
    const trailingPadding = windowSize - leadingPadding - actualChars;

    const visibleText = ' '.repeat(leadingPadding) + fullTextStream.slice(startPos, endPos) + ' '.repeat(trailingPadding);

    const cursorInWord = currentInput.length;

    // Check if monster is off-screen (behind the visible area) - show when waiting or chasing
    const monsterOffScreen = monsterMode && monsterPosition >= 0 && monsterPosition < startPos;
    const monsterDistance = monsterOffScreen ? Math.floor(startPos - monsterPosition) : 0;
    const isMonsterWaiting = !monsterStarted;

    return (
      <div ref={slidingBarRef}>
        <div
          className={`relative overflow-visible pt-8 pb-2 sm:pt-10 sm:pb-4 ${
            shake ? "animate-[shake_0.3s_ease-in-out]" : ""
          }`}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Monster off-screen indicator - position depends on text direction */}
          {monsterOffScreen && (
            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 ${
              isMonsterWaiting ? 'text-gray-400' : 'text-purple-500'
            } ${isRTL ? 'right-2 sm:right-4 flex-row-reverse' : 'left-2 sm:left-4'}`}>
              <div className="relative">
                <span className={`text-lg sm:text-xl ${isMonsterWaiting ? 'opacity-50' : ''}`}>{selectedMonsterSkin}</span>
                {/* Countdown above off-screen monster */}
                {monsterCountdown !== null && monsterCountdown > 0 && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-sm font-bold text-purple-500 whitespace-nowrap">
                    {monsterCountdown}s
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-mono font-bold">
                {isMonsterWaiting ? '💤' : (isRTL ? `${monsterDistance}→` : `←${monsterDistance}`)}
              </span>
            </div>
          )}

          <div className="flex justify-center items-center">
            <div
              className="text-2xl sm:text-4xl tracking-wide whitespace-pre"
              style={{ fontFamily: 'var(--font-cousine), var(--font-geist-mono), monospace' }}
            >
              {visibleText.split("").map((char: string, i: number) => {
                // Account for leading padding when calculating global position
                const globalPos = startPos + i - leadingPadding;
                const isPadding = i < leadingPadding || i >= visibleText.length - trailingPadding;
                const wordStartPos = absolutePosition - cursorInWord;
                const monsterAtThisPos = monsterMode && monsterPosition >= 0 && Math.floor(monsterPosition) === globalPos;

                // Monster replaces the character at its position (check BEFORE padding so monster is always visible)
                if (monsterAtThisPos) {
                  const gap = absolutePosition - monsterPosition;
                  const isClose = gap < 10 && monsterStarted;
                  const isWaiting = !monsterStarted;
                  return (
                    <span
                      key={`${globalPos}-monster`}
                      className={`inline-block relative ${isClose ? 'animate-pulse' : ''} ${isWaiting ? 'opacity-60' : ''}`}
                      style={{
                        filter: isClose ? 'drop-shadow(0 0 8px #ef4444)' : isWaiting ? 'drop-shadow(0 0 4px #666)' : 'drop-shadow(0 0 4px #a855f7)',
                      }}
                    >
                      {/* Countdown above monster */}
                      {monsterCountdown !== null && monsterCountdown > 0 && (
                        <span
                          className="absolute -top-8 left-1/2 -translate-x-1/2 text-base font-bold text-purple-500 whitespace-nowrap"
                          style={{ textShadow: '0 0 8px rgba(168, 85, 247, 0.5)' }}
                        >
                          {monsterCountdown}s
                        </span>
                      )}
                      {/* Sleeping indicator when waiting and no countdown yet */}
                      {isWaiting && monsterCountdown === null && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs">💤</span>
                      )}
                      {selectedMonsterSkin}
                    </span>
                  );
                }

                // Render padding as invisible space (after monster check so monster is always visible)
                if (isPadding) {
                  return (
                    <span key={`padding-${i}`} className="inline-block opacity-0">
                      {"\u00A0"}
                    </span>
                  );
                }

                let className = "inline-block transition-all duration-75 ";
                let displayChar: string | React.ReactNode = char;
                let isCorrect = true;

                // Characters eaten by monster are struck through
                if (monsterPosition >= 0 && globalPos < monsterPosition) {
                  className += "text-[var(--foreground)]/20 line-through decoration-red-500/50 decoration-2";
                } else if (globalPos < wordStartPos) {
                  className += "text-[var(--muted)]/40";
                } else if (globalPos < absolutePosition) {
                  const charIndexInWord = globalPos - wordStartPos;
                  const inputChar = currentInput[charIndexInWord] || "";
                  const targetChar = currentWord[charIndexInWord] || "";
                  const isNonAlpha = /[^a-zA-Z\u0590-\u05FF]/.test(targetChar);

                  if (forgiveNonAlpha && isNonAlpha) {
                    isCorrect = true;
                  } else if (forgiveCapitals) {
                    isCorrect = inputChar.toLowerCase() === targetChar.toLowerCase();
                  } else {
                    isCorrect = inputChar === targetChar;
                  }

                  // Always show what was actually typed
                  displayChar = inputChar;
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
                  <span key={`${globalPos}-${char}-${displayChar}`} className={className}>
                    {displayChar === " " ? "\u00A0" : displayChar}
                  </span>
                );
              })}
            </div>
          </div>

          {startPos > 0 && (
            <div
              className="absolute inset-y-0 w-8 sm:w-16 from-[var(--background)] to-transparent pointer-events-none"
              style={{
                [isRTL ? 'right' : 'left']: 0,
                background: `linear-gradient(to ${isRTL ? 'left' : 'right'}, var(--background), transparent)`
              }}
            />
          )}
          {endPos < fullTextStream.length && (
            <div
              className="absolute inset-y-0 w-8 sm:w-16 from-[var(--background)] to-transparent pointer-events-none"
              style={{
                [isRTL ? 'left' : 'right']: 0,
                background: `linear-gradient(to ${isRTL ? 'right' : 'left'}, var(--background), transparent)`
              }}
            />
          )}
        </div>
      </div>
    );
  };

  // Finger hint renderer (hidden on mobile - not useful with touch keyboard)
  const renderFingerHint = () => {
    if (!fingerHint || fingerHintPosition === 'off') return null;

    return (
      <div className="flex-shrink-0 py-2 sm:py-4 hidden sm:flex justify-center">
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Left hand */}
          <div className="hidden sm:flex items-end gap-1">
            {['pinky', 'ring', 'middle', 'index'].map((finger, i) => {
              const isActive = fingerHint.hand === 'L' && fingerHint.finger === finger;
              const heights = [20, 26, 30, 24];
              return (
                <div key={finger} className="relative flex flex-col items-center">
                  {isActive && fingerHint.direction !== '●' && (
                    <div className="absolute -top-6 text-[var(--foreground)] text-lg">
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
                        ? 'bg-[var(--foreground)] shadow-lg shadow-[var(--foreground)]/30'
                        : 'bg-[var(--foreground)]/15'
                    }`}
                    style={{ width: 16, height: heights[i] }}
                  />
                </div>
              );
            })}
          </div>

          {/* Mobile: Just show hand indicator */}
          <div className="sm:hidden text-xs text-[var(--muted)]">
            {fingerHint.hand === 'L' ? 'L' : ''}
          </div>

          {/* Character display */}
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-mono font-bold">
              {nextCharToType === ' ' ? '␣' : nextCharToType}
            </span>
            {/* Mobile: show finger below */}
            <span className="sm:hidden text-xs text-[var(--muted)] mt-1">
              {fingerHint.finger} {fingerHint.direction !== '●' ? fingerHint.direction : ''}
            </span>
          </div>

          {/* Mobile: Just show hand indicator */}
          <div className="sm:hidden text-xs text-[var(--muted)]">
            {fingerHint.hand === 'R' ? 'R' : ''}
          </div>

          {/* Right hand */}
          <div className="hidden sm:flex items-end gap-1">
            {['index', 'middle', 'ring', 'pinky'].map((finger, i) => {
              const isActive = fingerHint.hand === 'R' && fingerHint.finger === finger;
              const heights = [24, 30, 26, 20];
              return (
                <div key={finger} className="relative flex flex-col items-center">
                  {isActive && fingerHint.direction !== '●' && (
                    <div className="absolute -top-6 text-[var(--foreground)] text-lg">
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
                        ? 'bg-[var(--foreground)]/70 shadow-lg shadow-[var(--foreground)]/20'
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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="text-center max-w-md">
          <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">✓</div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Complete!</h2>
          {title && (
            <p className="text-[var(--muted)] mb-6 sm:mb-8 text-sm sm:text-base">
              You&apos;ve read &ldquo;{title}&rdquo;
            </p>
          )}
          {!title && <div className="mb-6 sm:mb-8" />}

          <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold">{calculateWPM()}</div>
              <div className="text-xs sm:text-sm text-[var(--muted)]">WPM</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold">{calculateAccuracy()}%</div>
              <div className="text-xs sm:text-sm text-[var(--muted)]">Accuracy</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8">
            <button
              onClick={() => setShowStats(true)}
              className="px-6 sm:px-8 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-medium hover:opacity-90 transition-opacity text-sm sm:text-base"
            >
              View Detailed Stats
            </button>
            <button
              onClick={onReset}
              className="px-6 sm:px-8 py-3 border border-[var(--foreground)]/20 rounded-xl font-medium hover:bg-[var(--foreground)]/5 transition-colors text-sm sm:text-base"
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
      {/* Pause banner - only shown before chase mode starts */}
      {isPaused && !monsterStarted && (
        <div
          className="flex-shrink-0 bg-[var(--foreground)] text-[var(--background)] py-2 sm:py-3 px-4 sm:px-6 flex items-center justify-center gap-2 sm:gap-4 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={resumeFromPause}
        >
          <span className="text-base sm:text-lg">⏸</span>
          <span className="font-medium text-sm sm:text-base">Paused</span>
          <span className="text-xs sm:text-sm opacity-75 hidden sm:inline">— Press Space, Esc, or click to resume</span>
          <span className="text-xs opacity-75 sm:hidden">Tap to resume</span>
        </div>
      )}

      {/* Header with progress */}
      <header className="flex-shrink-0 bg-[var(--background)] border-b border-[var(--foreground)]/5 z-10" dir={isRTL ? "rtl" : "ltr"}>
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2 sm:py-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <button
              onClick={onReset}
              className="text-xs sm:text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {isRTL ? 'חזרה →' : '← Back'}
            </button>
            {title && <h1 className="text-xs sm:text-sm font-medium truncate max-w-[30%] sm:max-w-[40%]">{title}</h1>}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Stats button */}
              <button
                onClick={() => setShowStats(true)}
                className="text-sm rounded text-[var(--pencil)] hover:text-[var(--ink)] transition-all"
                title="View statistics"
              >
                Stats
              </button>
              {/* Save button */}
              <button
                onClick={handleSave}
                className="text-sm rounded text-[var(--pencil)] hover:text-[var(--ink)] transition-all"
              >
                {showSaved ? <span className="text-[var(--success)]">✓</span> : "Save"}
              </button>
              {/* Settings button */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`text-sm rounded transition-all ${
                    showSettings
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "text-[var(--pencil)] hover:text-[var(--ink)]"
                  }`}
                  title="Settings"
                >
                  Settings
                </button>
                {/* Settings dropdown */}
                {showSettings && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                    <div className={`absolute top-full mt-2 w-72 bg-[var(--background)] border border-[var(--foreground)]/10 rounded-xl shadow-xl z-50 py-2 ${isRTL ? 'left-0' : 'right-0'}`} dir="ltr">
                      <div className="px-3 py-2 border-b border-[var(--foreground)]/5">
                        <span className="text-xs font-medium text-[var(--muted)]">Settings</span>
                      </div>
                      {/* Monster Mode */}
                      <button
                        onClick={() => setMonsterMode(!monsterMode)}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
                        title="Enable the chase game with the monster"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm">{selectedMonsterSkin} Monster Mode</span>
                          <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">Chase game with the monster</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${monsterMode ? 'bg-green-500/20 text-green-600' : 'bg-[var(--foreground)]/10 text-[var(--muted)]'}`}>
                          {monsterMode ? 'ON' : 'OFF'}
                        </span>
                      </button>
                      {/* Forgive Capitals */}
                      <button
                        onClick={() => setForgiveCapitals(!forgiveCapitals)}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
                        title="Ignore uppercase/lowercase differences"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm">Forgive Capitals</span>
                          <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">Aa = aa (case insensitive)</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${forgiveCapitals ? 'bg-green-500/20 text-green-600' : 'bg-[var(--foreground)]/10 text-[var(--muted)]'}`}>
                          {forgiveCapitals ? 'ON' : 'OFF'}
                        </span>
                      </button>
                      {/* Forgive Non-Alpha */}
                      <button
                        onClick={() => setForgiveNonAlpha(!forgiveNonAlpha)}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
                        title="Skip punctuation and special characters"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm">Forgive Punctuation</span>
                          <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">Skip commas, periods, etc.</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${forgiveNonAlpha ? 'bg-green-500/20 text-green-600' : 'bg-[var(--foreground)]/10 text-[var(--muted)]'}`}>
                          {forgiveNonAlpha ? 'ON' : 'OFF'}
                        </span>
                      </button>
                      {/* Music */}
                      <button
                        onClick={() => setMusicEnabled(!musicEnabled)}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
                        title="Background music during chase"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm">🎵 Music</span>
                          <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">Background chase music</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${musicEnabled ? 'bg-green-500/20 text-green-600' : 'bg-[var(--foreground)]/10 text-[var(--muted)]'}`}>
                          {musicEnabled ? 'ON' : 'OFF'}
                        </span>
                      </button>
                      {/* Sound Effects */}
                      <button
                        onClick={() => setSoundEffects(!soundEffects)}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
                        title="Typing sounds for correct/incorrect keys"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm">🔊 Sound Effects</span>
                          <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">Typing feedback sounds</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${soundEffects ? 'bg-green-500/20 text-green-600' : 'bg-[var(--foreground)]/10 text-[var(--muted)]'}`}>
                          {soundEffects ? 'ON' : 'OFF'}
                        </span>
                      </button>
                      {/* Finger hints */}
                      <button
                        onClick={() => setFingerHintPosition(p => p === 'off' ? 'top' : p === 'top' ? 'bottom' : 'off')}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
                        title="Show which finger to use for each key"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm">👆 Finger Tips</span>
                          <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">Shows correct finger for each key</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${fingerHintPosition !== 'off' ? 'bg-green-500/20 text-green-600' : 'bg-[var(--foreground)]/10 text-[var(--muted)]'}`}>
                          {fingerHintPosition === 'off' ? 'OFF' : fingerHintPosition.toUpperCase()}
                        </span>
                      </button>
                      {/* Autosave */}
                      <button
                        onClick={() => setAutosaveEnabled(!autosaveEnabled)}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
                        title="Automatically save progress"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm">💾 Autosave</span>
                          <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">Save progress automatically</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${autosaveEnabled ? 'bg-green-500/20 text-green-600' : 'bg-[var(--foreground)]/10 text-[var(--muted)]'}`}>
                          {autosaveEnabled ? 'ON' : 'OFF'}
                        </span>
                      </button>
                      {/* Allow Mistakes */}
                      <button
                        onClick={() => setAllowMistakes(!allowMistakes)}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
                        title="Allow completing words with mistakes"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm">Allow Mistakes</span>
                          <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">Space works even with typos</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${allowMistakes ? 'bg-green-500/20 text-green-600' : 'bg-[var(--foreground)]/10 text-[var(--muted)]'}`}>
                          {allowMistakes ? 'ON' : 'OFF'}
                        </span>
                      </button>
                      {/* Leaderboard */}
                      <button
                        onClick={() => {
                          setShowSettings(false);
                          setShowLeaderboard(true);
                        }}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
                        title="View leaderboard and rankings"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm">🏆 Leaderboard</span>
                          <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">Rankings and achievements</span>
                        </div>
                        <span className="text-lg">→</span>
                      </button>
                      {/* Daily Challenges */}
                      <button
                        onClick={() => {
                          setShowSettings(false);
                          setShowChallenges(true);
                        }}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
                        title="View and complete daily challenges"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm">📋 Daily Challenges</span>
                          <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">Complete quests for rewards</span>
                        </div>
                        <span className="text-lg">→</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
              {/* Score display */}
              <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-3">
                <div className="relative flex items-center gap-1 px-2 sm:px-3 py-1 bg-yellow-500/10 rounded-lg">
                  <span className="text-base sm:text-lg">🏆</span>
                  <span className="text-base sm:text-xl font-bold text-yellow-600 dark:text-yellow-400 tabular-nums">{gameScore}</span>
                  {streakBonus && (
                    <span
                      className="absolute -top-4 left-1/2 -translate-x-1/2 text-sm font-bold text-green-500 whitespace-nowrap"
                      style={{ animation: 'floatUp 1s ease-out forwards' }}
                    >
                      +{streakBonus.amount}
                    </span>
                  )}
                </div>
                {currentStreak >= 3 && (
                  <div className="flex items-center gap-0.5 px-2 py-1 bg-orange-500/10 rounded-lg">
                    <span className="text-sm">🔥</span>
                    <span className="text-sm font-bold text-orange-500 tabular-nums">{currentStreak}</span>
                  </div>
                )}
                {/* Speed comparison display */}
                {monsterStarted && (() => {
                  const lastMinuteSpeed = calculateLastMinuteSpeed();
                  const playerCpm = lastMinuteSpeed > 0 ? Math.round(lastMinuteSpeed * 60) : calculateWPM() * 5;
                  const monsterCpm = Math.round(monsterSpeed * 60);
                  const isAhead = playerCpm > monsterCpm;
                  // Calculate the bonus cpm the monster has
                  const bonusCpm = monsterStartTimeRef.current
                    ? Math.floor((Date.now() - monsterStartTimeRef.current) / 10000)
                    : 0;
                  return (
                    <div className="flex items-center gap-1 px-2 py-1 bg-[var(--foreground)]/5 rounded-lg">
                      <span className={`text-xs sm:text-sm font-bold tabular-nums ${isAhead ? 'text-green-500' : 'text-red-500'}`}>
                        {playerCpm}
                      </span>
                      <span className="text-xs text-[var(--muted)]">vs</span>
                      <span className="text-xs sm:text-sm font-bold text-purple-500 tabular-nums">{monsterCpm}</span>
                      {bonusCpm > 0 && (
                        <span className="text-[10px] text-purple-400">+{bonusCpm}</span>
                      )}
                      <span className="text-sm">{selectedMonsterSkin}</span>
                      <span className="text-xs text-[var(--muted)] hidden sm:inline">c/m</span>
                    </div>
                  );
                })()}
                <span className="text-xs sm:text-sm font-medium text-[var(--muted)] tabular-nums">
                  {calculateWPM()} <span className="text-xs hidden sm:inline">WPM</span>
                </span>
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

      {/* Sliding text bar */}
      <div className="flex-shrink-0 w-full px-2 sm:px-4 py-2 sm:py-6">
        {renderSlidingTextBar()}
      </div>

      {/* Finger hint - top position */}
      {fingerHintPosition === 'top' && renderFingerHint()}

      {/* Main typing area with side notes */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          className="sr-only"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          disabled={showNoteInput}
          dir={isRTL ? "rtl" : "ltr"}
        />

        {/* Content area with side notes */}
        <div className={`flex-1 flex min-h-0 overflow-hidden ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Spacer for symmetry on desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0" />

          {/* Main text content */}
          <div
            ref={textContainerRef}
            className="typing-area flex-1 overflow-y-auto leading-relaxed text-base sm:text-lg py-2 sm:py-8 px-3 sm:px-6"
            dir={isRTL ? "rtl" : "ltr"}
          >
          <div className="max-w-2xl mx-auto py-[10vh] sm:py-[30vh]">
            {words.map((word, index) => {
              const highlight = getHighlightForWord(index);
              const isSelected = selectedRange && index >= selectedRange.start && index <= selectedRange.end;
              const isHighlightEnd = highlight && index === highlight.endWordIndex;
              const isParagraphStart = paragraphStarts.has(index);
              const highlightIndex = highlight ? highlights.findIndex(h => h.id === highlight.id) : -1;
              const typedWordData = typedWords.get(index);

              // Determine word display based on typing status
              let wordContent: React.ReactNode = word;
              let className = "inline cursor-pointer transition-all ";

              if (index < currentWordIndex) {
                // Already typed word
                if (typedWordData) {
                  if (typedWordData.correct) {
                    // Correct - bright white
                    className += "text-[var(--foreground)]";
                  } else {
                    // Wrong - show what was typed in red
                    className += "text-[var(--error)]";
                    wordContent = typedWordData.typed;
                  }
                } else {
                  // No data (shouldn't happen, but fallback)
                  className += "text-[var(--foreground)]";
                }
              } else if (index === currentWordIndex) {
                // Current word - subtle highlight
                className += "px-1";
                wordContent = (
                  <>
                    {word.split('').map((char, charIndex) => {
                      const inputChar = currentInput[charIndex];
                      if (inputChar === undefined) {
                        // Not yet typed - gray
                        return <span key={charIndex} className="text-[var(--muted)]">{char}</span>;
                      }
                      // Check if correct
                      const isNonAlpha = /[^a-zA-Z\u0590-\u05FF]/.test(char);
                      let charCorrect: boolean;
                      if (forgiveNonAlpha && isNonAlpha) {
                        charCorrect = true;
                      } else if (forgiveCapitals) {
                        charCorrect = inputChar.toLowerCase() === char.toLowerCase();
                      } else {
                        charCorrect = inputChar === char;
                      }
                      return (
                        <span key={charIndex} className={charCorrect ? "text-[var(--foreground)] font-semibold" : "text-[var(--error)] font-semibold"}>
                          {inputChar}
                        </span>
                      );
                    })}
                    {/* Show extra typed characters in red */}
                    {currentInput.length > word.length && (
                      <span className="text-[var(--error)] font-semibold">
                        {currentInput.slice(word.length)}
                      </span>
                    )}
                  </>
                );
              } else {
                // Future word - gray/dull
                className += "text-[var(--muted)]";
              }

              // Add highlight styling with underline instead of background
              if (highlight) {
                className += " underline decoration-2 decoration-yellow-400/60 underline-offset-2";
              }
              if (isSelected) {
                className += " bg-[var(--foreground)]/10";
              }

              // Check if this word has a power-up collectible and add background highlight
              const powerUpType = powerUpPlacements.get(index);
              if (powerUpType && index >= currentWordIndex) {
                const powerUpHighlights = {
                  freezeMonster: 'bg-cyan-400/40 px-1 rounded shadow-sm',
                  shield: 'bg-yellow-400/40 px-1 rounded shadow-sm',
                  slowMo: 'bg-purple-400/40 px-1 rounded shadow-sm',
                };
                className += ' ' + powerUpHighlights[powerUpType];
              }

              return (
                <span key={index} className="relative">
                  {/* Add paragraph break */}
                  {isParagraphStart && <><br /><br /></>}

                  <span
                    ref={index === currentWordIndex ? currentWordRef : null}
                    className={className}
                    onClick={(e) => handleWordClick(index, e)}
                  >
                    {wordContent}
                  </span>
                  {/* Small note indicator at end of highlight */}
                  {isHighlightEnd && (
                    <sup
                      className="ml-0.5 text-xs text-yellow-600 dark:text-yellow-400 cursor-pointer hover:text-yellow-700 font-medium"
                      onClick={(e) => { e.stopPropagation(); setActiveHighlight(activeHighlight === highlight.id ? null : highlight.id); }}
                    >
                      {highlightIndex + 1}
                    </sup>
                  )}
                  {" "}
                </span>
              );
            })}
          </div>
        </div>

          {/* Side notes panel */}
          <div className="hidden lg:block w-64 flex-shrink-0 overflow-y-auto py-8 pr-6">
            <div className="space-y-4">
              {highlights.map((highlight, index) => (
                <div
                  key={highlight.id}
                  className={`p-3 rounded-lg border-l-2 transition-all cursor-pointer ${
                    activeHighlight === highlight.id
                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-[var(--foreground)]/10 hover:border-yellow-400/50 hover:bg-[var(--foreground)]/5'
                  }`}
                  onClick={() => setActiveHighlight(activeHighlight === highlight.id ? null : highlight.id)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mt-0.5">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--muted)] mb-1 truncate italic">
                        &ldquo;{words.slice(highlight.startWordIndex, highlight.endWordIndex + 1).slice(0, 5).join(' ')}{highlight.endWordIndex - highlight.startWordIndex > 4 ? '...' : ''}&rdquo;
                      </p>
                      <p className="text-sm">{highlight.note}</p>
                      {activeHighlight === highlight.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteHighlight(highlight.id); }}
                          className="mt-2 text-xs text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: Bottom sheet for active note */}
        {activeHighlight && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--background)] border-t border-[var(--foreground)]/10 p-4 z-30 shadow-lg">
            {(() => {
              const highlight = highlights.find(h => h.id === activeHighlight);
              if (!highlight) return null;
              return (
                <div>
                  <p className="text-xs text-[var(--muted)] mb-1 italic">
                    &ldquo;{words.slice(highlight.startWordIndex, highlight.endWordIndex + 1).slice(0, 8).join(' ')}{highlight.endWordIndex - highlight.startWordIndex > 7 ? '...' : ''}&rdquo;
                  </p>
                  <p className="text-sm mb-2">{highlight.note}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveHighlight(null)}
                      className="flex-1 py-2 text-sm bg-[var(--foreground)]/10 rounded-lg"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleDeleteHighlight(highlight.id)}
                      className="px-4 py-2 text-sm text-red-500 border border-red-500/30 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Note input - inline tooltip style */}
        {showNoteInput && selectedRange && (
          <div
            className="fixed z-40 bg-[var(--background)] rounded-xl shadow-2xl border border-[var(--foreground)]/10 p-4 w-72"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-yellow-400 rounded-full" />
              <p className="text-xs text-[var(--muted)] truncate flex-1">
                {words.slice(selectedRange.start, selectedRange.end + 1).slice(0, 4).join(' ')}{selectedRange.end - selectedRange.start > 3 ? '...' : ''}
              </p>
            </div>
            <textarea
              ref={noteInputRef}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note..."
              className="w-full p-2 text-sm border border-[var(--foreground)]/10 rounded-lg bg-transparent resize-none focus:outline-none focus:border-yellow-400/50"
              rows={2}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAddHighlight}
                disabled={!noteText.trim()}
                className="flex-1 py-1.5 text-sm bg-yellow-400 text-black rounded-lg font-medium disabled:opacity-50 hover:bg-yellow-500 transition-colors"
              >
                Save
              </button>
              <button
                onClick={cancelHighlight}
                className="px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {showNoteInput && <div className="fixed inset-0 z-30" onClick={cancelHighlight} />}

        <div className="flex-shrink-0 hidden sm:flex mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[var(--foreground)]/5 flex-wrap justify-center gap-3 sm:gap-8 text-xs sm:text-sm text-[var(--muted)]">
          <span>
            {currentWordIndex} / {words.length} <span className="hidden sm:inline">words</span>
          </span>
          <span>{calculateAccuracy()}%<span className="hidden sm:inline"> accuracy</span></span>
          {detailedStats.pauses.length > 0 && (
            <span className="hidden sm:inline">{detailedStats.pauses.length} pauses</span>
          )}
          {lastSavedTime && (
            <span className={`flex items-center gap-1 transition-all duration-300 ${justSaved ? 'text-green-500 scale-110' : ''}`}>
              <svg className={`w-3 h-3 ${justSaved ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {justSaved ? 'Saving...' : 'Saved'}
            </span>
          )}
        </div>

        {/* Finger hint - bottom position */}
        {fingerHintPosition === 'bottom' && renderFingerHint()}
      </main>

      {/* Arcade Name Entry - shown if player got into top 10 */}
      {showArcadeNameEntry && (
        <ArcadeNameEntry
          score={gameScore}
          wpm={calculateWPM()}
          accuracy={calculateAccuracy()}
          streak={bestStreak}
          wordsTyped={stats.wordsTyped}
          onSubmit={handleNameSubmit}
          onSkip={() => {
            setShowArcadeNameEntry(false);
            setShowLeaderboardAfterGame(true);
          }}
        />
      )}

      {/* Leaderboard after game - shown immediately after game ends (or after name entry) */}
      {showLeaderboardAfterGame && (
        <LeaderboardView onClose={() => {
          setShowLeaderboardAfterGame(false);
          onReset(); // Go back to text selection after closing leaderboard
        }} />
      )}

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

      {/* Leaderboard modal */}
      {showLeaderboard && (
        <LeaderboardView onClose={() => setShowLeaderboard(false)} />
      )}

      {/* Daily Challenges modal */}
      {showChallenges && (
        <DailyChallengesPanel onClose={() => setShowChallenges(false)} />
      )}

      {/* Game HUD (WPM status bar, combo) */}
      {monsterMode && (
        <GameHUD
          onUsePowerUp={handlePowerUpActivation}
          combo={comboMultiplier}
          currentWPM={calculateWPM()}
        />
      )}

      {/* Achievement unlock popup */}
      {achievementToShow && (
        <AchievementPopup
          achievement={achievementToShow}
          onClose={() => {
            markAchievementSeen(achievementToShow.id);
            setAchievementToShow(null);
          }}
        />
      )}

      {/* Level up popup */}
      {levelUpToShow && (
        <LevelUpPopup
          level={levelUpToShow}
          onClose={() => setLevelUpToShow(null)}
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
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-30px);
          }
        }
        @keyframes countdownPulse {
          0% {
            transform: scale(1.5);
            opacity: 0;
          }
          30% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(0.9);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
