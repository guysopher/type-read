"use client";

import { useRef, useState, useEffect } from 'react';
import type { ComparisonOptions } from '@/utils/typingComparison';
import { isCorrectChar } from '@/utils/typingComparison';

interface SlidingTextBarProps {
  words: string[];
  currentWordIndex: number;
  currentInput: string;
  currentWord: string;
  absolutePosition: number; // Current character position in full text
  monsterMode: boolean;
  monsterPosition: number;
  monsterStarted: boolean;
  monsterCountdown: number | null;
  monsterSkin: string;
  isWordComplete: boolean;
  shake: boolean;
  isRTL: boolean;
  comparisonOptions: ComparisonOptions;
  powerUpPlacements?: Map<number, 'freezeMonster' | 'shield' | 'slowMo'>;
}

/**
 * Sliding text display with centered cursor, monster chase, and visual feedback
 * Power-up words are highlighted with colored backgrounds
 */
export default function SlidingTextBar({
  words,
  currentWordIndex,
  currentInput,
  currentWord,
  absolutePosition,
  monsterMode,
  monsterPosition,
  monsterStarted,
  monsterCountdown,
  monsterSkin,
  isWordComplete,
  shake,
  isRTL,
  comparisonOptions,
  powerUpPlacements = new Map(),
}: SlidingTextBarProps) {
  const slidingBarRef = useRef<HTMLDivElement>(null);
  const [slidingBarWidth, setSlidingBarWidth] = useState(0);

  // Build text stream and track word positions and powerups
  const { fullTextStream, wordRanges } = useRef((() => {
    let stream = '';
    const ranges = new Map<number, { start: number; end: number; hasPowerUp: boolean; powerUpType?: 'freezeMonster' | 'shield' | 'slowMo' }>();

    words.forEach((word, idx) => {
      const startPos = stream.length;
      stream += word;
      const endPos = stream.length;

      // Check if this word has a power-up
      const powerUpType = powerUpPlacements.get(idx);
      ranges.set(idx, {
        start: startPos,
        end: endPos,
        hasPowerUp: !!powerUpType,
        powerUpType: powerUpType,
      });

      if (idx < words.length - 1) {
        stream += ' '; // Normal space between words
      }
    });

    return { fullTextStream: stream, wordRanges: ranges };
  })()).current;

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

  // Calculate character width based on container width
  const isMobile = slidingBarWidth < 640;
  const charWidth = isMobile ? 14 : 22;
  const availableWidth = slidingBarWidth - 32;
  const windowSize = Math.max(20, Math.floor(availableWidth / charWidth));
  const centerOffset = Math.floor(windowSize / 2);

  // Calculate visible window with padding for centering
  const rawStartPos = absolutePosition - centerOffset;
  const startPos = Math.max(0, rawStartPos);
  const leadingPadding = rawStartPos < 0 ? Math.abs(rawStartPos) : 0;
  const charsToShow = windowSize - leadingPadding;
  const endPos = Math.min(fullTextStream.length, startPos + charsToShow);
  const actualChars = endPos - startPos;
  const trailingPadding = windowSize - leadingPadding - actualChars;

  const visibleText =
    ' '.repeat(leadingPadding) + fullTextStream.slice(startPos, endPos) + ' '.repeat(trailingPadding);

  const cursorInWord = currentInput.length;
  const wordStartPos = absolutePosition - cursorInWord;

  // Check if monster is off-screen
  const monsterOffScreen = monsterMode && monsterPosition >= 0 && monsterPosition < startPos;
  const monsterDistance = monsterOffScreen ? Math.floor(startPos - monsterPosition) : 0;
  const isMonsterWaiting = !monsterStarted;

  return (
    <div ref={slidingBarRef}>
      <div
        className={`relative overflow-visible pt-8 pb-2 sm:pt-10 sm:pb-4 ${
          shake ? 'animate-[shake_0.3s_ease-in-out]' : ''
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Monster off-screen indicator */}
        {monsterOffScreen && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 ${
              isMonsterWaiting ? 'text-gray-400' : 'text-purple-500'
            } ${isRTL ? 'right-2 sm:right-4 flex-row-reverse' : 'left-2 sm:left-4'}`}
          >
            <div className="relative">
              <span className={`text-lg sm:text-xl ${isMonsterWaiting ? 'opacity-50' : ''}`}>
                {monsterSkin}
              </span>
              {monsterCountdown !== null && monsterCountdown > 0 && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-sm font-bold text-purple-500 whitespace-nowrap">
                  {monsterCountdown}s
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm font-mono font-bold">
              {isMonsterWaiting ? '💤' : isRTL ? `${monsterDistance}→` : `←${monsterDistance}`}
            </span>
          </div>
        )}

        <div className="flex justify-center items-center">
          <div
            className="text-2xl sm:text-4xl tracking-wide whitespace-pre"
            style={{ fontFamily: 'var(--font-cousine), var(--font-geist-mono), monospace' }}
          >
            {visibleText.split('').map((char: string, i: number) => {
              const globalPos = startPos + i - leadingPadding;
              const isPadding = i < leadingPadding || i >= visibleText.length - trailingPadding;
              const monsterAtThisPos =
                monsterMode && monsterPosition >= 0 && Math.floor(monsterPosition) === globalPos;

              // Check if this position is in a word with a power-up
              let wordWithPowerUp: { hasPowerUp: boolean; powerUpType?: 'freezeMonster' | 'shield' | 'slowMo' } | null = null;
              for (const [_, range] of wordRanges) {
                if (globalPos >= range.start && globalPos < range.end && range.hasPowerUp) {
                  wordWithPowerUp = range;
                  break;
                }
              }

              // Monster rendering
              if (monsterAtThisPos) {
                const gap = absolutePosition - monsterPosition;
                const isClose = gap < 10 && monsterStarted;
                const isWaiting = !monsterStarted;
                return (
                  <span
                    key={`${globalPos}-monster`}
                    className={`inline-block relative ${isClose ? 'animate-pulse' : ''} ${
                      isWaiting ? 'opacity-60' : ''
                    }`}
                    style={{
                      filter: isClose
                        ? 'drop-shadow(0 0 8px #ef4444)'
                        : isWaiting
                        ? 'drop-shadow(0 0 4px #666)'
                        : 'drop-shadow(0 0 4px #a855f7)',
                    }}
                  >
                    {monsterCountdown !== null && monsterCountdown > 0 && (
                      <span
                        className="absolute -top-8 left-1/2 -translate-x-1/2 text-base font-bold text-purple-500 whitespace-nowrap"
                        style={{ textShadow: '0 0 8px rgba(168, 85, 247, 0.5)' }}
                      >
                        {monsterCountdown}s
                      </span>
                    )}
                    {isWaiting && monsterCountdown === null && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs">💤</span>
                    )}
                    {monsterSkin}
                  </span>
                );
              }

              // Padding spaces
              if (isPadding) {
                return (
                  <span key={`padding-${i}`} className="inline-block opacity-0">
                    {'\u00A0'}
                  </span>
                );
              }

              // Regular character rendering
              let className = 'inline-block transition-all duration-75 ';
              let displayChar: string = char;

              // Add powerup highlight background if this character is in a word with a powerup
              if (wordWithPowerUp?.hasPowerUp && wordWithPowerUp.powerUpType && globalPos >= absolutePosition) {
                const powerUpColors = {
                  freezeMonster: 'bg-cyan-400/30 shadow-[0_0_8px_rgba(34,211,238,0.4)]',
                  shield: 'bg-yellow-400/30 shadow-[0_0_8px_rgba(250,204,21,0.4)]',
                  slowMo: 'bg-purple-400/30 shadow-[0_0_8px_rgba(192,132,252,0.4)]',
                };
                className += powerUpColors[wordWithPowerUp.powerUpType] + ' ';
              }

              // Characters eaten by monster
              if (monsterPosition >= 0 && globalPos < monsterPosition) {
                className +=
                  'text-[var(--foreground)]/20 line-through decoration-red-500/50 decoration-2';
              } else if (globalPos < wordStartPos) {
                // Past words
                className += 'text-[var(--muted)]/40';
              } else if (globalPos < absolutePosition) {
                // Current word - already typed
                const charIndexInWord = globalPos - wordStartPos;
                const inputChar = currentInput[charIndexInWord] || '';
                const targetChar = currentWord[charIndexInWord] || '';
                const isCorrect = isCorrectChar(inputChar, targetChar, comparisonOptions);

                displayChar = inputChar;
                className += isCorrect ? 'text-[var(--foreground)]' : 'text-[var(--error)]';
              } else if (globalPos === absolutePosition && !isWordComplete) {
                // Current cursor position
                className +=
                  'text-[var(--foreground)] bg-[var(--accent)]/20 border-b-2 border-[var(--foreground)]';
              } else if (globalPos === absolutePosition && isWordComplete) {
                // Space after completed word
                className += 'bg-[var(--accent)]/20 border-b-2 border-[var(--foreground)]';
              } else {
                // Future characters - fade based on distance
                const distance = globalPos - absolutePosition;
                if (distance < 5) {
                  className += 'text-[var(--foreground)]/70';
                } else if (distance < 15) {
                  className += 'text-[var(--foreground)]/40';
                } else {
                  className += 'text-[var(--foreground)]/20';
                }
              }

              return (
                <span key={`${globalPos}-${char}-${displayChar}`} className={className}>
                  {displayChar === ' ' ? '\u00A0' : displayChar}
                </span>
              );
            })}
          </div>
        </div>

        {/* Gradient fades */}
        {startPos > 0 && (
          <div
            className="absolute inset-y-0 w-8 sm:w-16 from-[var(--background)] to-transparent pointer-events-none"
            style={{
              [isRTL ? 'right' : 'left']: 0,
              background: `linear-gradient(to ${isRTL ? 'left' : 'right'}, var(--background), transparent)`,
            }}
          />
        )}
        {endPos < fullTextStream.length && (
          <div
            className="absolute inset-y-0 w-8 sm:w-16 from-[var(--background)] to-transparent pointer-events-none"
            style={{
              [isRTL ? 'left' : 'right']: 0,
              background: `linear-gradient(to ${isRTL ? 'right' : 'left'}, var(--background), transparent)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
