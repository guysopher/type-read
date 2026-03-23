/**
 * Power-Up Margin Component
 * Displays power-up collection in the right margin (or bottom on mobile)
 */

'use client';

import { useMemo } from 'react';
import { colors } from '@/styles/designTokens';

interface PowerUp {
  type: 'freezeMonster' | 'shield' | 'slowMo';
  wordIndex: number;
  state: 'upcoming' | 'collected' | 'active' | 'used';
  countdown?: number; // Seconds remaining for active power-ups
}

interface PowerUpMarginProps {
  powerUps: PowerUp[];
  currentWordIndex: number;
  className?: string;
}

const POWER_UP_ICONS = {
  freezeMonster: '❄️',
  shield: '🛡️',
  slowMo: '⏱️',
};

const POWER_UP_NAMES = {
  freezeMonster: 'Freeze',
  shield: 'Shield',
  slowMo: 'Slow-Mo',
};

export default function PowerUpMargin({
  powerUps,
  currentWordIndex,
  className = ''
}: PowerUpMarginProps) {
  // Sort power-ups by word index
  const sortedPowerUps = useMemo(() => {
    return [...powerUps].sort((a, b) => a.wordIndex - b.wordIndex);
  }, [powerUps]);

  // Find next upcoming power-up
  const nextPowerUp = useMemo(() => {
    return sortedPowerUps.find(
      p => p.state === 'upcoming' && p.wordIndex > currentWordIndex
    );
  }, [sortedPowerUps, currentWordIndex]);

  const distanceToNext = nextPowerUp
    ? nextPowerUp.wordIndex - currentWordIndex
    : null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Title */}
      <div
        className="text-xs font-bold uppercase tracking-wide pb-2"
        style={{ color: colors.pencil, opacity: 0.6 }}
      >
        Power-ups
      </div>

      {/* Next power-up indicator */}
      {distanceToNext !== null && distanceToNext <= 10 && (
        <div
          className="text-xs mb-3 p-2 rounded"
          style={{
            backgroundColor: colors.accentFaded,
            color: colors.accent,
          }}
        >
          Next in {distanceToNext} {distanceToNext === 1 ? 'word' : 'words'}
        </div>
      )}

      {/* Power-up list */}
      <div className="space-y-2">
        {sortedPowerUps.slice(0, 6).map((powerUp, index) => {
          const icon = POWER_UP_ICONS[powerUp.type];
          const name = POWER_UP_NAMES[powerUp.type];
          const isActive = powerUp.state === 'active';
          const isCollected = powerUp.state === 'collected' || powerUp.state === 'active';
          const isUsed = powerUp.state === 'used';
          const isUpcoming = powerUp.state === 'upcoming';

          return (
            <div
              key={`${powerUp.type}-${powerUp.wordIndex}-${index}`}
              className={`flex items-center gap-2 p-2 rounded border transition-all duration-200 ${
                isActive ? 'pulse-subtle' : ''
              }`}
              style={{
                borderColor: isActive
                  ? colors.success
                  : isCollected
                  ? colors.accent
                  : colors.pencilLight,
                borderWidth: isActive ? '2px' : '1px',
                backgroundColor: isActive
                  ? 'rgba(46, 204, 113, 0.1)'
                  : isCollected
                  ? 'rgba(74, 144, 226, 0.05)'
                  : 'transparent',
                opacity: isUsed ? 0.3 : isUpcoming ? 0.6 : 1,
              }}
            >
              {/* Icon */}
              <span className="text-lg flex-shrink-0">{icon}</span>

              {/* Status & Name */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium" style={{ color: colors.ink }}>
                  {name}
                </div>
                {isActive && powerUp.countdown && (
                  <div className="text-xs font-bold" style={{ color: colors.success }}>
                    {powerUp.countdown}s
                  </div>
                )}
              </div>

              {/* Checkbox/Status indicator */}
              <div className="flex-shrink-0">
                {isUsed && <span className="text-xs opacity-40">✓</span>}
                {isActive && <span className="text-xs">🔥</span>}
                {isCollected && !isActive && !isUsed && (
                  <span className="text-xs" style={{ color: colors.accent }}>
                    ✓
                  </span>
                )}
                {isUpcoming && (
                  <span
                    className="text-xs border rounded px-1"
                    style={{ borderColor: colors.pencilLight, color: colors.pencil }}
                  >
                    {powerUp.wordIndex}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show count if more than 6 */}
      {sortedPowerUps.length > 6 && (
        <div className="text-xs text-center pt-2" style={{ color: colors.pencil, opacity: 0.5 }}>
          +{sortedPowerUps.length - 6} more
        </div>
      )}
    </div>
  );
}
