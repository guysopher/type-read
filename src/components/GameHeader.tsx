"use client";

import type { ReactNode } from 'react';
import PowerUpInventory from './PowerUpInventory';

interface GameHeaderProps {
  title: string;
  isRTL: boolean;
  progress: number; // 0-100
  wordsTyped: number;
  totalWords: number;
  currentWPM: number;
  gameScore: number;
  currentStreak: number;
  streakBonus: { amount: number; timestamp: number } | null;
  monsterStarted: boolean;
  monsterSpeed: number;
  monsterSkin: string;
  monsterStartTime: number | null;
  playerSpeed: number; // characters per minute (CPM)
  showSaved: boolean;
  activePowerUps: {
    freeze: boolean;
    shield: boolean;
    slowMo: boolean;
  };
  onReset: () => void;
  onShowStats: () => void;
  onSave: () => void;
  onToggleSettings: () => void;
  showSettings: boolean;
  settingsPanel?: ReactNode;
}

/**
 * Game header with progress bar, stats, and controls
 */
export default function GameHeader({
  title,
  isRTL,
  progress,
  currentWPM,
  gameScore,
  currentStreak,
  streakBonus,
  monsterStarted,
  monsterSpeed,
  monsterSkin,
  monsterStartTime,
  playerSpeed,
  showSaved,
  activePowerUps,
  onReset,
  onShowStats,
  onSave,
  onToggleSettings,
  showSettings,
  settingsPanel,
}: GameHeaderProps) {
  // Calculate speed comparison
  const monsterCpm = Math.round(monsterSpeed * 60);
  const playerCpm = playerSpeed;
  const isAhead = playerCpm > monsterCpm;

  // Calculate the bonus cpm the monster has
  const bonusCpm = monsterStartTime
    ? Math.floor((Date.now() - monsterStartTime) / 10000)
    : 0;

  return (
    <header
      className="flex-shrink-0 bg-[var(--background)] border-b border-[var(--foreground)]/5 z-10"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2 sm:py-4">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          {/* Back button */}
          <button
            onClick={onReset}
            className="text-xs sm:text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            {isRTL ? 'חזרה →' : '← Back'}
          </button>

          {/* Title */}
          {title && (
            <h1 className="text-xs sm:text-sm font-medium truncate max-w-[30%] sm:max-w-[40%]">
              {title}
            </h1>
          )}

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Stats button */}
            <button
              onClick={onShowStats}
              className="px-2 py-1 text-xs rounded bg-[var(--foreground)]/10 text-[var(--muted)] hover:bg-[var(--foreground)]/20 transition-all"
              title="View statistics"
            >
              📊
            </button>

            {/* Save button */}
            <button
              onClick={onSave}
              className="px-2 py-1 text-xs rounded bg-[var(--foreground)]/10 text-[var(--muted)] hover:bg-[var(--foreground)]/20 transition-all"
            >
              {showSaved ? <span className="text-[var(--success)]">✓</span> : '💾'}
            </button>

            {/* Settings button */}
            <div className="relative">
              <button
                onClick={onToggleSettings}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  showSettings
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'bg-[var(--foreground)]/10 text-[var(--muted)] hover:bg-[var(--foreground)]/20'
                }`}
                title="Settings"
              >
                ⚙️
              </button>

              {/* Settings panel (rendered by parent) */}
              {settingsPanel}
            </div>

            {/* Score display */}
            <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-3">
              <div className="relative flex items-center gap-1 px-2 sm:px-3 py-1 bg-yellow-500/10 rounded-lg">
                <span className="text-base sm:text-lg">🏆</span>
                <span className="text-base sm:text-xl font-bold text-yellow-600 dark:text-yellow-400 tabular-nums">
                  {gameScore}
                </span>
                {streakBonus && (
                  <span
                    className="absolute -top-4 left-1/2 -translate-x-1/2 text-sm font-bold text-green-500 whitespace-nowrap"
                    style={{ animation: 'floatUp 1s ease-out forwards' }}
                  >
                    +{streakBonus.amount}
                  </span>
                )}
              </div>

              {/* Streak counter */}
              {currentStreak >= 3 && (
                <div className="flex items-center gap-0.5 px-2 py-1 bg-orange-500/10 rounded-lg">
                  <span className="text-sm">🔥</span>
                  <span className="text-sm font-bold text-orange-500 tabular-nums">
                    {currentStreak}
                  </span>
                </div>
              )}

              {/* Speed comparison display */}
              {monsterStarted && (
                <div className="flex items-center gap-1 px-2 py-1 bg-[var(--foreground)]/5 rounded-lg">
                  <span
                    className={`text-xs sm:text-sm font-bold tabular-nums ${
                      isAhead ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {playerCpm}
                  </span>
                  <span className="text-xs text-[var(--muted)]">vs</span>
                  <span className="text-xs sm:text-sm font-bold text-purple-500 tabular-nums">
                    {monsterCpm}
                  </span>
                  {bonusCpm > 0 && (
                    <span className="text-[10px] text-purple-400">+{bonusCpm}</span>
                  )}
                  <span className="text-sm">{monsterSkin}</span>
                  <span className="text-xs text-[var(--muted)] hidden sm:inline">c/m</span>
                </div>
              )}

              {/* WPM display */}
              <span className="text-xs sm:text-sm font-medium text-[var(--muted)] tabular-nums">
                {currentWPM} <span className="text-xs hidden sm:inline">WPM</span>
              </span>

              {/* Power-up inventory */}
              <PowerUpInventory activePowerUps={activePowerUps} />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[var(--foreground)]/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--foreground)] progress-fill rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </header>
  );
}
