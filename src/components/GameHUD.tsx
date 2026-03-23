'use client';

import { useState, useEffect } from 'react';
import { getPlayerProgress, usePowerUp, getLevelFromXP } from '@/lib/storage';
import type { PlayerProgress } from '@/lib/gamification';

interface GameHUDProps {
  onUsePowerUp?: (type: 'freezeMonster' | 'shield' | 'slowMo') => void;
  combo?: number;
  showPowerUps?: boolean;
}

export default function GameHUD({ onUsePowerUp, combo = 1, showPowerUps = true }: GameHUDProps) {
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [xpProgress, setXpProgress] = useState({ current: 0, needed: 100, percentage: 0 });

  useEffect(() => {
    const playerProgress = getPlayerProgress();
    setProgress(playerProgress);

    const { currentLevelXP, nextLevelXP } = getLevelFromXP(playerProgress.totalXP);
    const percentage = (currentLevelXP / nextLevelXP) * 100;

    setXpProgress({
      current: Math.floor(currentLevelXP),
      needed: nextLevelXP,
      percentage: Math.min(100, percentage)
    });
  }, []);

  // Refresh when storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const playerProgress = getPlayerProgress();
      setProgress(playerProgress);

      const { currentLevelXP, nextLevelXP } = getLevelFromXP(playerProgress.totalXP);
      const percentage = (currentLevelXP / nextLevelXP) * 100;

      setXpProgress({
        current: Math.floor(currentLevelXP),
        needed: nextLevelXP,
        percentage: Math.min(100, percentage)
      });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleUsePowerUp = (type: 'freezeMonster' | 'shield' | 'slowMo') => {
    if (usePowerUp(type)) {
      onUsePowerUp?.(type);
      // Refresh display
      setProgress(getPlayerProgress());
    }
  };

  if (!progress) return null;

  return (
    <div className="fixed top-4 left-4 z-40 space-y-2">
      {/* XP Bar */}
      <div className="bg-white border-2 border-black p-2 pixel-corners shadow-retro min-w-[200px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold pixel-text">LVL {progress.level}</span>
          <span className="text-xs text-gray-600">
            {xpProgress.current}/{xpProgress.needed} XP
          </span>
        </div>
        <div className="h-3 bg-gray-200 border-2 border-gray-400 pixel-corners overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
            style={{ width: `${xpProgress.percentage}%` }}
          />
        </div>
      </div>

      {/* Combo Multiplier */}
      {combo > 1 && (
        <div className="bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-500 p-2 pixel-corners shadow-retro animate-pulse-subtle">
          <div className="flex items-center gap-2">
            <span className="text-xl">💥</span>
            <div>
              <div className="text-xs text-gray-700">Combo</div>
              <div className="text-lg font-bold text-orange-700 pixel-text">
                {combo}x
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Power-Ups */}
      {showPowerUps && (
        <div className="bg-white border-2 border-black p-2 pixel-corners shadow-retro space-y-1">
          <div className="text-xs font-bold mb-1 pixel-text">POWER-UPS</div>

          {/* Freeze Monster */}
          <button
            onClick={() => handleUsePowerUp('freezeMonster')}
            disabled={progress.powerUps.freezeMonster === 0}
            className={`w-full flex items-center gap-2 p-1 text-xs border-2 pixel-corners transition-colors ${
              progress.powerUps.freezeMonster > 0
                ? 'bg-blue-100 border-blue-500 hover:bg-blue-200 cursor-pointer'
                : 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
            }`}
            title="Freeze monster for 10 seconds"
          >
            <span className="text-base">❄️</span>
            <span className="flex-1 text-left">Freeze</span>
            <span className="font-bold">{progress.powerUps.freezeMonster}</span>
          </button>

          {/* Shield */}
          <button
            onClick={() => handleUsePowerUp('shield')}
            disabled={progress.powerUps.shield === 0}
            className={`w-full flex items-center gap-2 p-1 text-xs border-2 pixel-corners transition-colors ${
              progress.powerUps.shield > 0
                ? 'bg-green-100 border-green-500 hover:bg-green-200 cursor-pointer'
                : 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
            }`}
            title="Survive one monster catch"
          >
            <span className="text-base">🛡️</span>
            <span className="flex-1 text-left">Shield</span>
            <span className="font-bold">{progress.powerUps.shield}</span>
          </button>

          {/* Slow-Mo (if available) */}
          {progress.powerUps.slowMo > 0 && (
            <button
              onClick={() => handleUsePowerUp('slowMo')}
              disabled={progress.powerUps.slowMo === 0}
              className="w-full flex items-center gap-2 p-1 text-xs border-2 pixel-corners bg-purple-100 border-purple-500 hover:bg-purple-200 cursor-pointer"
              title="Slow down monster temporarily"
            >
              <span className="text-base">⏱️</span>
              <span className="flex-1 text-left">Slow-Mo</span>
              <span className="font-bold">{progress.powerUps.slowMo}</span>
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }

        .pixel-corners {
          clip-path: polygon(
            4px 0, calc(100% - 4px) 0,
            100% 4px, 100% calc(100% - 4px),
            calc(100% - 4px) 100%, 4px 100%,
            0 calc(100% - 4px), 0 4px
          );
        }

        .pixel-text {
          text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.1);
        }

        .shadow-retro {
          box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
