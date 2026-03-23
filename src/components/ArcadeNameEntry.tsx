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
    <>
      {/* Opaque backdrop */}
      <div
        className="fixed inset-0 z-[9999]"
        style={{ backgroundColor: colors.paper }}
      />

      {/* Content layer */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-auto">
        <div className="text-center p-8 max-w-2xl w-full">
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
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-md">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              maxLength={5}
              placeholder="·  ·  ·  ·  ·"
              className="w-full px-6 py-4 text-5xl font-bold text-center bg-white rounded border-2 transition-all focus:outline-none uppercase"
              style={{
                fontFamily: '"Courier New", "Courier Prime", monospace',
                color: colors.ink,
                borderColor: name.length > 0 ? colors.accent : colors.pencilLight,
                letterSpacing: '0.5em',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                minHeight: '80px'
              }}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="text-sm space-y-1 mb-6" style={{ color: colors.pencil }}>
          <p>Enter your name</p>
          <p className="text-xs opacity-60">Press Enter to save · Press Esc to skip</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleSubmit}
            disabled={name.length === 0}
            className={`px-8 py-3 text-lg font-medium rounded-lg border-2 transition-all ${
              name.length === 0
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
            }`}
            style={{
              backgroundColor: name.length > 0 ? colors.accent : colors.paper,
              borderColor: colors.accent,
              color: name.length > 0 ? '#000' : colors.pencil,
              boxShadow: name.length > 0 ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            Submit
          </button>
          <button
            onClick={onSkip}
            className="px-8 py-3 text-lg font-medium rounded-lg border-2 transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: colors.paper,
              borderColor: colors.pencilLight,
              color: colors.pencil,
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
