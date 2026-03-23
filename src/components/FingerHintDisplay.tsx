"use client";

import { getFingerHint, type FingerHint } from '@/utils/fingerHints';

interface FingerHintDisplayProps {
  nextChar: string;
  fingerHintPosition: 'off' | 'top' | 'bottom';
  isRTL: boolean;
}

/**
 * Visual keyboard finger guidance display
 * Shows which finger to use for the next character
 */
export default function FingerHintDisplay({
  nextChar,
  fingerHintPosition,
  isRTL,
}: FingerHintDisplayProps) {
  const fingerHint = getFingerHint(nextChar);

  if (!fingerHint || fingerHintPosition === 'off') {
    return null;
  }

  /**
   * Convert direction notation to arrow emoji
   */
  const getDirectionArrow = (direction: string): string => {
    if (direction.includes('↑') && direction.includes('←')) return '↖';
    if (direction.includes('↑') && direction.includes('→')) return '↗';
    if (direction.includes('↓') && direction.includes('←')) return '↙';
    if (direction.includes('↓') && direction.includes('→')) return '↘';
    if (direction.includes('↑')) return '↑';
    if (direction.includes('↓')) return '↓';
    if (direction.includes('←')) return '←';
    if (direction.includes('→')) return '→';
    return '';
  };

  /**
   * Render a hand display (left or right)
   */
  const renderHand = (hand: 'L' | 'R') => {
    const fingers = hand === 'L' ? ['pinky', 'ring', 'middle', 'index'] : ['index', 'middle', 'ring', 'pinky'];
    const heights = hand === 'L' ? [20, 26, 30, 24] : [24, 30, 26, 20];

    return (
      <div className="hidden sm:flex items-end gap-1">
        {fingers.map((finger, i) => {
          const isActive = fingerHint.hand === hand && fingerHint.finger === finger;
          return (
            <div key={finger} className="relative flex flex-col items-center">
              {isActive && fingerHint.direction !== '●' && (
                <div className="absolute -top-6 text-[var(--foreground)] text-lg">
                  {getDirectionArrow(fingerHint.direction)}
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
    );
  };

  return (
    <div className="flex-shrink-0 py-2 sm:py-4 hidden sm:flex justify-center">
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Left hand */}
        {renderHand('L')}

        {/* Mobile: Just show hand indicator */}
        <div className="sm:hidden text-xs text-[var(--muted)]">
          {fingerHint.hand === 'L' ? 'L' : ''}
        </div>

        {/* Character display */}
        <div className="flex flex-col items-center">
          <span className="text-2xl sm:text-3xl font-mono font-bold">
            {nextChar === ' ' ? '␣' : nextChar}
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
        {renderHand('R')}
      </div>
    </div>
  );
}
