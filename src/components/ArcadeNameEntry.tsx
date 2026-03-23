'use client';

import { useState } from 'react';

interface ArcadeNameEntryProps {
  score: number;
  wpm: number;
  accuracy: number;
  streak: number;
  wordsTyped: number;
  onSubmit: (name: string) => void;
}

export default function ArcadeNameEntry({
  score,
  wpm,
  accuracy,
  streak,
  wordsTyped,
  onSubmit,
}: ArcadeNameEntryProps) {
  const [name, setName] = useState(['A', 'A', 'A']); // 3-letter initials
  const [activeIndex, setActiveIndex] = useState(0);

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const handleLetterChange = (direction: 'up' | 'down') => {
    const currentLetter = name[activeIndex];
    const currentIndex = letters.indexOf(currentLetter);
    const newIndex = direction === 'up'
      ? (currentIndex + 1) % letters.length
      : (currentIndex - 1 + letters.length) % letters.length;

    const newName = [...name];
    newName[activeIndex] = letters[newIndex];
    setName(newName);
  };

  const handleSubmit = () => {
    onSubmit(name.join(''));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleLetterChange('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleLetterChange('down');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(2, prev + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex < 2) {
        setActiveIndex(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="text-center p-8 max-w-2xl">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-yellow-400 mb-2 pixel-text animate-pulse">
            🏆 NEW HIGH SCORE! 🏆
          </h1>
          <p className="text-xl text-gray-300">Enter your initials</p>
        </div>

        {/* Score Display */}
        <div className="bg-white/10 border-4 border-yellow-400 p-6 mb-8 pixel-corners shadow-retro-xl">
          <div className="text-6xl font-bold text-yellow-400 mb-4">{score.toLocaleString()}</div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold text-white">{wordsTyped}</div>
              <div className="text-gray-400">Words</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{wpm}</div>
              <div className="text-gray-400">WPM</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{accuracy}%</div>
              <div className="text-gray-400">Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">🔥 {streak}</div>
              <div className="text-gray-400">Streak</div>
            </div>
          </div>
        </div>

        {/* Letter Selection */}
        <div className="flex justify-center gap-8 mb-8">
          {name.map((letter, index) => (
            <div key={index} className="flex flex-col items-center gap-3">
              {/* Up Arrow */}
              <button
                onClick={() => {
                  setActiveIndex(index);
                  handleLetterChange('up');
                }}
                className={`text-2xl transition-all ${
                  activeIndex === index
                    ? 'text-yellow-400 scale-125'
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                ▲
              </button>

              {/* Letter */}
              <div
                className={`w-20 h-24 flex items-center justify-center border-4 pixel-corners text-5xl font-bold transition-all cursor-pointer ${
                  activeIndex === index
                    ? 'bg-yellow-400 border-yellow-400 text-black animate-pulse scale-110'
                    : 'bg-white/10 border-white/30 text-white hover:border-white/50'
                }`}
                onClick={() => setActiveIndex(index)}
              >
                {letter}
              </div>

              {/* Down Arrow */}
              <button
                onClick={() => {
                  setActiveIndex(index);
                  handleLetterChange('down');
                }}
                className={`text-2xl transition-all ${
                  activeIndex === index
                    ? 'text-yellow-400 scale-125'
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                ▼
              </button>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-400 mb-6">
          <p>Use ← → to move, ↑ ↓ to change letter, Enter to continue</p>
          <p className="mt-1">or click the arrows and letters</p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="px-12 py-4 bg-yellow-400 text-black font-bold text-xl pixel-corners shadow-retro-lg hover:bg-yellow-300 transition-all hover:scale-105"
        >
          SUBMIT
        </button>
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
