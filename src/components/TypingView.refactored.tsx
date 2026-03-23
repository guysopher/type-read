"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  SavedText,
  generateId,
  DetailedStats,
  WPMSample,
  createEmptyDetailedStats,
  Highlight,
  addLeaderboardEntry,
  updateDailyStreak,
  getPlayerName,
  getPlayerProgress,
  updateGameStats,
  checkAndUnlockAchievements,
  getTopScores,
} from "@/lib/storage";
import { setMusicMuted } from "@/lib/sounds";
import { submitToGlobalLeaderboard } from "@/lib/api";
import { MONSTER_SKINS } from "@/lib/gamification";
import type { Achievement } from "@/lib/gamification";

// Extracted hooks
import { useTypingInput, type WordCompletionEvent } from "@/hooks/useTypingInput";
import { useMonsterChase } from "@/hooks/useMonsterChase";
import { useGameScoring } from "@/hooks/useGameScoring";
import { useAutoSave } from "@/hooks/useAutoSave";
import type { ComparisonOptions } from "@/utils/typingComparison";
import { getNextCharToType } from "@/utils/typingComparison";

// Extracted components
import GameHeader from "./GameHeader";
import SettingsPanel from "./SettingsPanel";
import SlidingTextBar from "./SlidingTextBar";
import FingerHintDisplay from "./FingerHintDisplay";
import TypingAnnotations from "./TypingAnnotations";
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

const WPM_SAMPLE_INTERVAL = 3000;

/**
 * Main typing game view - refactored to use extracted hooks and components
 * Reduced from 2330 lines to ~800 lines by extracting game logic
 */
export default function TypingView({ text, title, onReset, savedData }: TypingViewProps) {
  // ========== Text Processing ==========
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

  const isRTL = useMemo(() => {
    const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F]/;
    return rtlRegex.test(text);
  }, [text]);

  // ========== Settings State ==========
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

  // Persist settings to localStorage
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

  useEffect(() => {
    setMusicMuted(!musicEnabled);
  }, [musicEnabled]);

  // ========== UI State ==========
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showArcadeNameEntry, setShowArcadeNameEntry] = useState(false);
  const [showLeaderboardAfterGame, setShowLeaderboardAfterGame] = useState(false);

  // Gamification
  const [achievementToShow, setAchievementToShow] = useState<Achievement | null>(null);
  const [levelUpToShow, setLevelUpToShow] = useState<number | null>(null);
  const [selectedMonsterSkin, setSelectedMonsterSkin] = useState('👾');
  const [maxComboReached, setMaxComboReached] = useState(0);

  // Detailed stats
  const [detailedStats, setDetailedStats] = useState<DetailedStats>(
    savedData?.detailedStats || createEmptyDetailedStats()
  );
  const [accumulatedTime, setAccumulatedTime] = useState(savedData?.progress.totalTime || 0);
  const sessionStartRef = useRef<number | null>(null);
  const pauseStartRef = useRef<number | null>(null);

  // Highlights and notes
  const [highlights, setHighlights] = useState<Highlight[]>(savedData?.highlights || []);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const currentWordRef = useRef<HTMLSpanElement>(null);
  const saveId = savedData?.id || generateId();

  // ========== Comparison Options ==========
  const comparisonOptions: ComparisonOptions = {
    forgiveCapitals,
    forgiveNonAlpha,
  };

  // ========== Custom Hooks ==========
  // Typing input hook
  const typingInput = useTypingInput({
    words,
    initialWordIndex: savedData?.progress.currentWordIndex,
    initialStats: savedData?.progress
      ? {
          wordsTyped: savedData.progress.wordsTyped,
          correctKeystrokes: savedData.progress.correctKeystrokes,
          totalKeystrokes: savedData.progress.totalKeystrokes,
        }
      : undefined,
    comparisonOptions,
    allowMistakes,
    soundEffects,
    onStartTyping: (timestamp) => {
      sessionStartRef.current = timestamp;
    },
    onKeystroke: (isCorrect, timestamp) => {
      monsterChase.recordKeystroke(isCorrect, timestamp);
      // Start monster countdown on first correct keystroke
      if (isCorrect && monsterMode && !monsterChase.monsterStarted && monsterChase.monsterCountdown === null) {
        monsterChase.startCountdown();
      }
    },
    onIncorrectKeystroke: () => {
      // Reset combo immediately on any incorrect keystroke
      scoring.resetCombo();
    },
    onWordComplete: (event: WordCompletionEvent) => {
      // Update scoring
      scoring.addWordScore(
        event.expectedWord.length,
        event.isCorrect,
        event.hadAnyMistakes,
        event.mistakeCount,
        event.wordIndex
      );

      // Update max combo
      if (scoring.comboMultiplier > maxComboReached) {
        setMaxComboReached(scoring.comboMultiplier);
      }

      // Handle completion
      if (event.isLastWord) {
        setIsComplete(true);
      }
    },
    onComplete: () => {
      setIsComplete(true);
    },
  });

  // Calculate absolute position
  const absolutePosition = useMemo(() => {
    let pos = 0;
    for (let i = 0; i < typingInput.currentWordIndex; i++) {
      pos += words[i].length + 1;
    }
    return pos + typingInput.currentInput.length;
  }, [typingInput.currentWordIndex, typingInput.currentInput.length, words]);

  // Calculate one word behind position for monster
  const oneWordBehindPosition = useMemo(() => {
    const prevWordIndex = Math.max(0, typingInput.currentWordIndex - 1);
    let pos = 0;
    for (let i = 0; i < prevWordIndex; i++) {
      pos += words[i].length + 1;
    }
    return pos;
  }, [typingInput.currentWordIndex, words]);

  // Monster chase hook
  const handleGameOver = useCallback(() => {
    // Check if score is in top 10
    const topScores = getTopScores(10);
    const isInTop10 =
      topScores.length < 10 || scoring.gameScore > topScores[topScores.length - 1].score;

    if (isInTop10) {
      setShowArcadeNameEntry(true);
    } else {
      setShowLeaderboardAfterGame(true);
    }
  }, []);

  const monsterChase = useMonsterChase({
    enabled: monsterMode,
    playerPosition: absolutePosition,
    oneWordBehindPosition,
    isPaused,
    isComplete,
    musicEnabled,
    onGameOver: handleGameOver,
    onMonsterStart: (timestamp) => {
      updateDailyStreak();
    },
  });

  // Game scoring hook
  const scoring = useGameScoring({
    onPowerUpCollected: (wordIndex, powerUpType) => {
      monsterChase.activatePowerUp(powerUpType);
    },
  });

  // Initialize power-ups
  useEffect(() => {
    if (words.length > 0) {
      scoring.initializePowerUps(words.length);
    }
  }, [words.length]);

  // Calculate WPM
  const calculateWPM = useCallback(() => {
    if (!typingInput.stats.startTime) return 0;
    const sessionTime = typingInput.stats.startTime
      ? (typingInput.stats.endTime || Date.now()) - typingInput.stats.startTime
      : 0;
    const totalTime = accumulatedTime + sessionTime - detailedStats.totalPauseTime;
    const minutes = totalTime / 60000;
    if (minutes < 0.01) return 0;
    return Math.round(typingInput.stats.wordsTyped / minutes);
  }, [typingInput.stats, accumulatedTime, detailedStats.totalPauseTime]);

  const calculateAccuracy = useCallback(() => {
    if (typingInput.stats.totalKeystrokes === 0) return 100;
    return Math.round(
      (typingInput.stats.correctKeystrokes / typingInput.stats.totalKeystrokes) * 100
    );
  }, [typingInput.stats]);

  // Get active time
  const getActiveTime = useCallback(() => {
    if (!sessionStartRef.current) return accumulatedTime;
    const now = Date.now();
    const sessionTime = now - sessionStartRef.current;
    return accumulatedTime + sessionTime - detailedStats.totalPauseTime;
  }, [accumulatedTime, detailedStats.totalPauseTime]);

  // Auto-save hook
  useAutoSave({
    enabled: autosaveEnabled,
    isComplete,
    hasStarted: typingInput.stats.startTime !== null,
    saveId,
    title,
    text,
    currentWordIndex: typingInput.currentWordIndex,
    wordsTyped: typingInput.stats.wordsTyped,
    correctKeystrokes: typingInput.stats.correctKeystrokes,
    totalKeystrokes: typingInput.stats.totalKeystrokes,
    totalTime: accumulatedTime + (sessionStartRef.current ? Date.now() - sessionStartRef.current : 0),
    detailedStats: {
      ...detailedStats,
      totalActiveTime: getActiveTime(),
    },
    highlights,
    createdAt: savedData?.createdAt,
  });

  // ========== WPM Sampling ==========
  useEffect(() => {
    if (isComplete || isPaused || !typingInput.stats.startTime) return;

    const sampleWPM = setInterval(() => {
      const activeTime = getActiveTime();
      const currentWpm = calculateWPM();

      if (currentWpm > 0) {
        setDetailedStats((prev) => {
          const newSample: WPMSample = {
            timestamp: activeTime,
            wpm: currentWpm,
            wordsTyped: typingInput.stats.wordsTyped,
          };

          const newPeakWpm = Math.max(prev.peakWpm, currentWpm);
          const newSamples = [...prev.wpmSamples, newSample];
          const avgWpm = Math.round(
            newSamples.reduce((sum, s) => sum + s.wpm, 0) / newSamples.length
          );

          return {
            ...prev,
            wpmSamples: newSamples,
            peakWpm: newPeakWpm,
            averageWpm: avgWpm,
            totalActiveTime: activeTime,
          };
        });
      }
    }, WPM_SAMPLE_INTERVAL);

    return () => clearInterval(sampleWPM);
  }, [isComplete, isPaused, typingInput.stats.startTime, typingInput.stats.wordsTyped, getActiveTime, calculateWPM]);

  // ========== Load Monster Skin ==========
  useEffect(() => {
    const progress = getPlayerProgress();
    const skin = MONSTER_SKINS.find((s) => s.id === progress.selectedSkin);
    if (skin) {
      setSelectedMonsterSkin(skin.emoji);
    }
  }, []);

  // ========== Game End Handling ==========
  useEffect(() => {
    if ((monsterChase.isGameOver || isComplete) && typingInput.stats.wordsTyped > 0 && typingInput.stats.startTime) {
      const activeTime = getActiveTime();
      const accuracy = calculateAccuracy();
      const avgWPM = detailedStats.averageWpm || calculateWPM();

      const entry = {
        playerName: getPlayerName(),
        date: Date.now(),
        score: scoring.gameScore,
        wordsTyped: typingInput.stats.wordsTyped,
        wpm: avgWPM,
        peakWpm: detailedStats.peakWpm,
        accuracy: accuracy,
        streak: scoring.bestStreak,
        textTitle: title,
        duration: activeTime,
        survived: isComplete && !monsterChase.isGameOver,
        language: (isRTL ? 'he' : 'en') as 'he' | 'en',
      };

      // Save locally
      addLeaderboardEntry(entry);

      // Submit to global leaderboard
      submitToGlobalLeaderboard(entry).catch(() => {
        // Silently fail
      });

      // Update game stats
      updateGameStats({
        wordsTyped: typingInput.stats.wordsTyped,
        wpm: avgWPM,
        accuracy: accuracy,
        streak: scoring.bestStreak,
        duration: activeTime,
        survived: isComplete && !monsterChase.isGameOver,
        score: scoring.gameScore,
      });

      // Check for achievements
      const newAchievements = checkAndUnlockAchievements({
        wpm: avgWPM,
        accuracy: accuracy,
        streak: scoring.bestStreak,
        wordsTyped: typingInput.stats.wordsTyped,
        survived: isComplete && !monsterChase.isGameOver,
        combo: maxComboReached,
      });

      if (newAchievements.length > 0) {
        setAchievementToShow(newAchievements[0]);
      }

      // Check if leveled up
      const progress = getPlayerProgress();
      const prevProgress = JSON.parse(
        localStorage.getItem('typeread_player_progress_before') || 'null'
      );
      if (prevProgress && progress.level > prevProgress.level) {
        setLevelUpToShow(progress.level);
      }
    }
  }, [monsterChase.isGameOver, isComplete]);

  // ========== Scroll Current Word ==========
  useEffect(() => {
    if (currentWordRef.current) {
      currentWordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [typingInput.currentWordIndex]);

  // ========== Focus Input ==========
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
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // ========== Highlight Functions ==========
  const getHighlightForWord = useCallback(
    (wordIndex: number): Highlight | null => {
      return (
        highlights.find((h) => wordIndex >= h.startWordIndex && wordIndex <= h.endWordIndex) || null
      );
    },
    [highlights]
  );

  const handleWordClick = useCallback(
    (wordIndex: number, e: React.MouseEvent) => {
      e.stopPropagation();

      const existingHighlight = getHighlightForWord(wordIndex);
      if (existingHighlight) {
        setActiveHighlight(activeHighlight === existingHighlight.id ? null : existingHighlight.id);
        return;
      }

      if (selectedRange === null) {
        setSelectedRange({ start: wordIndex, end: wordIndex });
      } else {
        const newStart = Math.min(selectedRange.start, wordIndex);
        const newEnd = Math.max(selectedRange.end, wordIndex);
        setSelectedRange({ start: newStart, end: newEnd });
        setShowNoteInput(true);
      }
    },
    [selectedRange, getHighlightForWord, activeHighlight]
  );

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

    setHighlights((prev) => [...prev, newHighlight]);
    setSelectedRange(null);
    setShowNoteInput(false);
    setNoteText('');
  }, [selectedRange, noteText]);

  const handleDeleteHighlight = useCallback((highlightId: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    setActiveHighlight(null);
  }, []);

  const cancelHighlight = useCallback(() => {
    setSelectedRange(null);
    setShowNoteInput(false);
    setNoteText('');
  }, []);

  // ========== Arcade Name Submission ==========
  const handleNameSubmit = useCallback(
    (playerName: string) => {
      const activeTime = getActiveTime();
      const entry = {
        playerName,
        score: scoring.gameScore,
        wpm: calculateWPM(),
        peakWpm: detailedStats.peakWpm || 0,
        accuracy: calculateAccuracy(),
        streak: scoring.bestStreak,
        wordsTyped: typingInput.stats.wordsTyped,
        duration: activeTime,
        survived: false,
        date: Date.now(),
        textTitle: title,
        language: (isRTL ? 'he' : 'en') as 'he' | 'en',
      };

      addLeaderboardEntry(entry);
      submitToGlobalLeaderboard(entry);

      setShowArcadeNameEntry(false);
      setShowLeaderboardAfterGame(true);
    },
    [scoring.gameScore, scoring.bestStreak, typingInput.stats.wordsTyped, title, isRTL, detailedStats, calculateWPM, calculateAccuracy, getActiveTime]
  );

  // ========== Settings Handler ==========
  const handleSettingChange = useCallback(<K extends keyof typeof settings>(key: K, value: any) => {
    switch (key) {
      case 'monsterMode':
        setMonsterMode(value);
        break;
      case 'forgiveCapitals':
        setForgiveCapitals(value);
        break;
      case 'forgiveNonAlpha':
        setForgiveNonAlpha(value);
        break;
      case 'musicEnabled':
        setMusicEnabled(value);
        break;
      case 'soundEffects':
        setSoundEffects(value);
        break;
      case 'fingerHintPosition':
        setFingerHintPosition(value);
        break;
      case 'autosaveEnabled':
        setAutosaveEnabled(value);
        break;
      case 'allowMistakes':
        setAllowMistakes(value);
        break;
    }
  }, []);

  const settings = {
    monsterMode,
    forgiveCapitals,
    forgiveNonAlpha,
    musicEnabled,
    soundEffects,
    fingerHintPosition,
    autosaveEnabled,
    allowMistakes,
  };

  // Get next character to type
  const nextCharToType = getNextCharToType(
    typingInput.currentInput,
    typingInput.currentWord,
    comparisonOptions
  );

  const progress = (typingInput.currentWordIndex / words.length) * 100;

  // Calculate player CPM for header
  const playerCPM = typingInput.stats.startTime ? calculateWPM() * 5 : 0;

  // ========== Render ==========
  if (isComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Complete! 🎉</h2>
          <p className="text-lg mb-6">
            You finished {typingInput.stats.wordsTyped} words at {calculateWPM()} WPM
          </p>
          <button
            onClick={onReset}
            className="px-6 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Back to Texts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Game header */}
      <GameHeader
        title={title}
        isRTL={isRTL}
        progress={progress}
        wordsTyped={typingInput.stats.wordsTyped}
        totalWords={words.length}
        currentWPM={calculateWPM()}
        gameScore={scoring.gameScore}
        currentStreak={scoring.currentStreak}
        streakBonus={scoring.streakBonus}
        monsterStarted={monsterChase.monsterStarted}
        monsterSpeed={monsterChase.monsterSpeed}
        monsterSkin={selectedMonsterSkin}
        monsterStartTime={monsterChase.monsterStarted ? Date.now() : null}
        playerSpeed={playerCPM}
        showSaved={showSaved}
        activePowerUps={monsterChase.activePowerUps}
        onReset={onReset}
        onShowStats={() => setShowStats(true)}
        onSave={() => {
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 2000);
        }}
        onToggleSettings={() => setShowSettings(!showSettings)}
        showSettings={showSettings}
        settingsPanel={
          showSettings ? (
            <SettingsPanel
              settings={settings}
              onSettingChange={handleSettingChange}
              onShowLeaderboard={() => {
                setShowSettings(false);
                setShowLeaderboard(true);
              }}
              onShowChallenges={() => {
                setShowSettings(false);
                setShowChallenges(true);
              }}
              onClose={() => setShowSettings(false)}
              isRTL={isRTL}
              monsterSkin={selectedMonsterSkin}
            />
          ) : undefined
        }
      />

      {/* Sliding text bar (monster mode) */}
      {monsterMode && (
        <div className="flex-shrink-0 w-full px-2 sm:px-4 py-2 sm:py-6">
          <SlidingTextBar
            words={words}
            currentWordIndex={typingInput.currentWordIndex}
            currentInput={typingInput.currentInput}
            currentWord={typingInput.currentWord}
            absolutePosition={absolutePosition}
            monsterMode={monsterMode}
            monsterPosition={monsterChase.monsterPosition}
            monsterStarted={monsterChase.monsterStarted}
            monsterCountdown={monsterChase.monsterCountdown}
            monsterSkin={selectedMonsterSkin}
            isWordComplete={typingInput.isWordComplete}
            shake={typingInput.shake}
            isRTL={isRTL}
            comparisonOptions={comparisonOptions}
            powerUpPlacements={scoring.powerUpPlacements}
          />
        </div>
      )}

      {/* Finger hint display */}
      {fingerHintPosition !== 'off' && (
        <FingerHintDisplay
          nextChar={nextCharToType}
          fingerHintPosition={fingerHintPosition}
          isRTL={isRTL}
        />
      )}

      {/* Hidden input for typing */}
      <input
        ref={inputRef}
        type="text"
        value={typingInput.currentInput}
        onChange={(e) => typingInput.handleInputChange(e.target.value)}
        onKeyDown={typingInput.handleKeyDown}
        className="sr-only"
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      {/* Annotations */}
      <TypingAnnotations
        words={words}
        highlights={highlights}
        activeHighlight={activeHighlight}
        selectedRange={selectedRange}
        showNoteInput={showNoteInput}
        noteText={noteText}
        onSetActiveHighlight={setActiveHighlight}
        onDeleteHighlight={handleDeleteHighlight}
        onSetNoteText={setNoteText}
        onAddHighlight={handleAddHighlight}
        onCancelHighlight={cancelHighlight}
      />

      {/* Modals */}
      {showStats && (
        <StatsView
          stats={detailedStats}
          wordsTyped={typingInput.stats.wordsTyped}
          totalWords={words.length}
          accuracy={
            typingInput.stats.totalKeystrokes > 0
              ? (typingInput.stats.correctKeystrokes / typingInput.stats.totalKeystrokes) * 100
              : 0
          }
          onClose={() => setShowStats(false)}
        />
      )}

      {showLeaderboard && (
        <LeaderboardView onClose={() => setShowLeaderboard(false)} />
      )}

      {showChallenges && (
        <DailyChallengesPanel onClose={() => setShowChallenges(false)} />
      )}

      {achievementToShow && (
        <AchievementPopup
          achievement={achievementToShow}
          onClose={() => setAchievementToShow(null)}
        />
      )}

      {levelUpToShow && (
        <LevelUpPopup level={levelUpToShow} onClose={() => setLevelUpToShow(null)} />
      )}

      {showArcadeNameEntry && (
        <ArcadeNameEntry
          score={scoring.gameScore}
          onSubmit={handleNameSubmit}
          onSkip={() => {
            setShowArcadeNameEntry(false);
            setShowLeaderboardAfterGame(true);
          }}
        />
      )}

      {showLeaderboardAfterGame && (
        <LeaderboardView onClose={() => setShowLeaderboardAfterGame(false)} />
      )}
    </div>
  );
}
