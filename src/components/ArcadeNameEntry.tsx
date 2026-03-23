'use client';

import { useState, useRef, useEffect } from 'react';

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
  const [name, setName] = useState(''); // 5-letter name
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--notebook-bg)]/95 backdrop-blur-sm">
      <div className="text-center p-8 max-w-2xl">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-[var(--ink-blue)] mb-2 pixel-text animate-pulse">
            🏆 NEW HIGH SCORE! 🏆
          </h1>
          <p className="text-xl text-[var(--ink-black)]">Enter your name</p>
        </div>

        {/* Score Display */}
        <div className="bg-white border-4 border-[var(--ink-black)] p-6 mb-8 pixel-corners shadow-retro-xl">
          <div className="text-6xl font-bold text-[var(--ink-blue)] mb-4">{score.toLocaleString()}</div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold text-[var(--ink-black)]">{wordsTyped}</div>
              <div className="text-[var(--pencil-gray)]">Words</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--ink-black)]">{wpm}</div>
              <div className="text-[var(--pencil-gray)]">WPM</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--ink-black)]">{accuracy}%</div>
              <div className="text-[var(--pencil-gray)]">Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--ink-red)]">🔥 {streak}</div>
              <div className="text-[var(--pencil-gray)]">Streak</div>
            </div>
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
            placeholder="ENTER NAME"
            className="w-full max-w-md px-6 py-6 text-6xl font-bold text-center bg-white border-4 border-[var(--ink-blue)] text-[var(--ink-blue)] pixel-corners shadow-retro-xl focus:outline-none focus:border-[var(--ink-black)] transition-all placeholder-[var(--ink-blue)]/30 uppercase tracking-widest"
            style={{ letterSpacing: '0.3em' }}
          />
          <p className="text-sm text-[var(--pencil-gray)] mt-3">{5 - name.length} characters remaining</p>
        </div>

        {/* Instructions */}
        <div className="text-sm text-[var(--pencil-gray)] mb-6">
          <p>Type your name (up to 5 letters)</p>
          <p className="mt-1">Press Enter to submit</p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleSubmit}
            disabled={name.length === 0}
            className={`ink-button px-12 py-4 text-xl pixel-corners shadow-retro-lg ${
              name.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            SUBMIT
          </button>
          <button
            onClick={onSkip}
            className="px-8 py-4 text-xl border-2 border-[var(--ink-black)] text-[var(--ink-black)] hover:bg-[var(--ink-black)] hover:text-white transition-colors pixel-corners shadow-retro-lg"
          >
            SKIP
          </button>
        </div>
      </div>

      <style jsx>{`
        .pixel-corners {
          clip-path: polygon(
            6px 0, calc(100% - 6px) 0,
            100% 6px, 100% calc(100% - 6px),
            calc(100% - 6px) 100%, 6px 100%,
            0 calc(100% - 6px), 0 6px
          );
        }

        .pixel-text {
          text-shadow: 3px 3px 0px rgba(0, 0, 0, 0.3);
        }

        .shadow-retro-lg {
          box-shadow: 8px 8px 0px rgba(0, 0, 0, 0.3);
        }

        .shadow-retro-xl {
          box-shadow: 12px 12px 0px rgba(0, 0, 0, 0.3);
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
