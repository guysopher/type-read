/**
 * Margin Stats Component
 * Displays game stats in the left margin (or top on mobile)
 */

'use client';

import { colors } from '@/styles/designTokens';

interface MarginStatsProps {
  score: number;
  streak: number;
  combo: number;
  progress: number; // 0-100
  wordsTyped: number;
  totalWords: number;
  wpm: number;
  accuracy: number;
  monsterDistance?: number; // Characters away (when off-screen)
  monsterSkin?: string;
  showMonster?: boolean;
}

export default function MarginStats({
  score,
  streak,
  combo,
  progress,
  wordsTyped,
  totalWords,
  wpm,
  accuracy,
  monsterDistance,
  monsterSkin = '👾',
  showMonster = false,
}: MarginStatsProps) {
  return (
    <div className="margin-text space-y-3">
      {/* Monster Tracker (when off-screen) */}
      {showMonster && monsterDistance !== undefined && monsterDistance > 0 && (
        <div
          className="pb-3 border-b"
          style={{ borderColor: colors.pencilLight, opacity: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{monsterSkin}</span>
            <span className="text-xs" style={{ color: colors.monster }}>
              ←{monsterDistance}
            </span>
          </div>
        </div>
      )}

      {/* Score */}
      <div>
        <div className="text-xs opacity-60">Score</div>
        <div className="font-bold text-base" style={{ color: colors.ink }}>
          {score.toLocaleString()}
        </div>
      </div>

      {/* Streak (only show if >= 3) */}
      {streak >= 3 && (
        <div>
          <div className="text-xs opacity-60">Streak</div>
          <div className="font-bold text-base flex items-center gap-1">
            <span style={{ color: colors.success }}>{streak}</span>
            <span className="text-sm">🔥</span>
          </div>
        </div>
      )}

      {/* Combo (only show if > 1) */}
      {combo > 1 && (
        <div>
          <div className="text-xs opacity-60">Combo</div>
          <div className="font-bold text-base" style={{ color: colors.accent }}>
            {combo}x
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="pt-2">
        <div className="text-xs opacity-60 mb-1">Progress</div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: colors.paperDark }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: colors.accent,
            }}
          />
        </div>
        <div className="text-xs mt-1 opacity-60">{Math.round(progress)}%</div>
      </div>

      {/* Compact Stats */}
      <div className="pt-2 space-y-1 text-xs opacity-60">
        <div>{wordsTyped} / {totalWords} words</div>
        <div>{wpm} wpm</div>
        <div>{accuracy}% accuracy</div>
      </div>
    </div>
  );
}
