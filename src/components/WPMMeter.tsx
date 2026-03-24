'use client';

import { colors } from '@/styles/designTokens';

interface WPMMeterProps {
  wpm: number;
}

const getSpeedNickname = (wpm: number): { name: string; emoji: string; color: string } => {
  if (wpm === 0) return { name: 'Ready?', emoji: '⌨️', color: colors.pencil };
  if (wpm <= 20) return { name: 'Typing Snail', emoji: '🐌', color: '#8B4513' };
  if (wpm <= 40) return { name: 'Slow Typer', emoji: '🐢', color: '#6B8E23' };
  if (wpm <= 60) return { name: 'Getting There', emoji: '🚶', color: '#4682B4' };
  if (wpm <= 80) return { name: 'Word Walker', emoji: '🏃', color: '#FF8C00' };
  if (wpm <= 100) return { name: 'Speed Demon', emoji: '⚡', color: '#FF6347' };
  return { name: 'Word Goat', emoji: '🐐', color: '#FFD700' };
};

export default function WPMMeter({ wpm }: WPMMeterProps) {
  const speedInfo = getSpeedNickname(wpm);
  const percentage = Math.min((wpm / 100) * 100, 100);

  return (
    <div
      className="fixed top-4 left-4 z-30 bg-white rounded-lg shadow-lg p-3 border-2"
      style={{
        borderColor: colors.pencilLight,
        minWidth: '160px',
        maxWidth: '180px'
      }}
    >
      {/* WPM Display */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold" style={{
          fontFamily: '"Courier New", monospace',
          color: speedInfo.color
        }}>
          {Math.round(wpm)}
        </span>
        <span className="text-xs" style={{ color: colors.pencil }}>WPM</span>
      </div>

      {/* Progress Bar */}
      <div
        className="h-2 rounded-full mb-2"
        style={{ backgroundColor: colors.paperDark }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: speedInfo.color
          }}
        />
      </div>

      {/* Speed Nickname */}
      <div className="flex items-center gap-1">
        <span className="text-base">{speedInfo.emoji}</span>
        <span
          className="text-xs font-medium"
          style={{ color: speedInfo.color }}
        >
          {speedInfo.name}
        </span>
      </div>
    </div>
  );
}
