'use client';

import { useState, useEffect } from 'react';
import { getPlayerProgress } from '@/lib/storage';
import type { DailyChallenge } from '@/lib/gamification';

interface DailyChallengesPanelProps {
  onClose: () => void;
}

export default function DailyChallengesPanel({ onClose }: DailyChallengesPanelProps) {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);

  useEffect(() => {
    const progress = getPlayerProgress();
    setChallenges(progress.dailyChallenges);
  }, []);

  // Refresh when storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const progress = getPlayerProgress();
      setChallenges(progress.dailyChallenges);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getProgressPercentage = (progress: number, target: number) => {
    return Math.min(100, (progress / target) * 100);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black max-w-md w-full pixel-corners shadow-retro-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-400 to-blue-500 border-b-4 border-black p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <h2 className="text-xl font-bold text-white pixel-text">
                DAILY CHALLENGES
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl pixel-text"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-blue-100 mt-1">
            Complete challenges to earn XP and power-ups!
          </p>
        </div>

        {/* Challenges List */}
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`border-2 p-3 pixel-corners transition-all ${
                challenge.completed
                  ? 'bg-green-100 border-green-500'
                  : 'bg-white border-gray-400'
              }`}
            >
              {/* Challenge header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl">{challenge.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold pixel-text">
                      {challenge.description}
                    </div>
                  </div>
                </div>
                {challenge.completed && (
                  <span className="text-lg">✓</span>
                )}
              </div>

              {/* Progress bar */}
              {!challenge.completed && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>
                      {challenge.progress}/{challenge.target}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 border border-gray-400 pixel-corners overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
                      style={{
                        width: `${getProgressPercentage(challenge.progress, challenge.target)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Rewards */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-600">Reward:</span>
                {challenge.reward.xp && (
                  <div className="bg-yellow-100 border border-yellow-400 px-2 py-0.5 pixel-corners">
                    <span className="text-yellow-700 font-bold">
                      +{challenge.reward.xp} XP
                    </span>
                  </div>
                )}
                {challenge.reward.powerUp && (
                  <div className="bg-blue-100 border border-blue-400 px-2 py-0.5 pixel-corners">
                    <span className="text-blue-700 font-bold">
                      {challenge.reward.powerUp.type === 'freezeMonster' && '❄️'}
                      {challenge.reward.powerUp.type === 'shield' && '🛡️'}
                      {challenge.reward.powerUp.type === 'slowMo' && '⏱️'}
                      {' '}+{challenge.reward.powerUp.amount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 p-3 bg-gray-50 text-center text-xs text-gray-600">
          Challenges reset daily at midnight
        </div>
      </div>

      <style jsx>{`
        .pixel-corners {
          clip-path: polygon(
            4px 0, calc(100% - 4px) 0,
            100% 4px, 100% calc(100% - 4px),
            calc(100% - 4px) 100%, 4px 100%,
            0 calc(100% - 4px), 0 4px
          );
        }

        .pixel-text {
          text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.1);
        }

        .shadow-retro-lg {
          box-shadow: 8px 8px 0px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
