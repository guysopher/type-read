'use client';

import { useState, useRef, useEffect } from 'react';
import { colors } from '@/styles/designTokens';

interface ArcadeNameEntryProps {
  score: number;
  wpm: number;
  accuracy: number;
  streak: number;
  wordsTyped: number;
  onSubmit: (name: string) => void;
  onSkip: () => void;
}

export default function ArcadeNameEntry({
  score,
  wpm,
  accuracy,
  streak,
  wordsTyped,
  onSubmit,
  onSkip,
}: ArcadeNameEntryProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (value.length <= 5) {
      setName(value);
    }
  };

  const handleSubmit = () => {
    if (name.length > 0) {
      onSubmit(name.padEnd(5, ' ').substring(0, 5));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onSkip();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center paper-texture"
      style={{ backgroundColor: colors.paper }}
    >
      <div className="text-center p-8 max-w-2xl">
        {/* Title */}
        <div className="mb-12">
          <h1
            className="text-5xl font-bold mb-4 heading-text"
            style={{ color: colors.ink }}
          >
            New High Score
          </h1>
        </div>

        {/* Score Display */}
        <div
          className="bg-white rounded-lg p-8 mb-8"
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}
        >
          <div
            className="text-7xl font-bold mb-6"
            style={{
              fontFamily: '"Courier New", "Courier Prime", monospace',
              color: colors.ink
            }}
          >
            {score.toLocaleString()}
          </div>

          <div
            className="h-px mb-6 mx-auto"
            style={{
              width: '200px',
              backgroundColor: colors.pencilLight,
              opacity: 0.4
            }}
          />

          <div className="flex justify-center gap-8 text-sm">
            <div>
              <div className="text-xl font-bold" style={{ color: colors.ink }}>
                {wordsTyped}
              </div>
              <div style={{ color: colors.pencil }}>words</div>
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: colors.ink }}>
                {wpm}
              </div>
              <div style={{ color: colors.pencil }}>wpm</div>
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: colors.ink }}>
                {accuracy}%
              </div>
              <div style={{ color: colors.pencil }}>accuracy</div>
            </div>
            {streak > 0 && (
              <div>
                <div className="text-xl font-bold flex items-center justify-center gap-1">
                  <span style={{ color: colors.success }}>{streak}</span>
                  <span className="text-base">🔥</span>
                </div>
                <div style={{ color: colors.pencil }}>streak</div>
              </div>
            )}
          </div>
        </div>

        {/* Name Input */}
        <div className="mb-8">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            maxLength={5}
            placeholder="_____"
            className="w-full max-w-md px-6 py-4 text-5xl font-bold text-center bg-white rounded border-2 transition-all focus:outline-none uppercase tracking-widest"
            style={{
              fontFamily: '"Courier New", "Courier Prime", monospace',
              color: colors.ink,
              borderColor: name.length > 0 ? colors.accent : colors.pencilLight,
              letterSpacing: '0.3em',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
            }}
          />
        </div>

        {/* Instructions */}
        <div className="text-sm space-y-1" style={{ color: colors.pencil }}>
          <p>Enter your name</p>
          <p className="text-xs opacity-60">Press Enter to save · Press Esc to skip</p>
        </div>
      </div>
    </div>
  );
}
