'use client';

import { useEffect, useState } from 'react';
import type { Achievement } from '@/lib/gamification';

interface AchievementPopupProps {
  achievement: Achievement;
  onClose: () => void;
}

export default function AchievementPopup({ achievement, onClose }: AchievementPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 50);

    // Auto-close after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600',
  };

  const rarityBorder = {
    common: 'border-gray-500',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-yellow-500',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div
        className={`transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        <div
          className={`relative bg-white border-4 ${rarityBorder[achievement.rarity]} shadow-2xl p-6 max-w-sm
            pixel-corners pointer-events-auto`}
          style={{
            boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Rarity banner */}
          <div
            className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r ${
              rarityColors[achievement.rarity]
            } text-white text-xs font-bold uppercase tracking-wider pixel-corners`}
          >
            {achievement.rarity}
          </div>

          {/* Achievement content */}
          <div className="text-center mt-2">
            {/* Icon with pulse animation */}
            <div className="text-6xl mb-3 animate-bounce-slow">
              {achievement.icon}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold mb-2 pixel-text">
              {achievement.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-3">
              {achievement.description}
            </p>

            {/* XP Reward */}
            <div className="flex items-center justify-center gap-2 bg-yellow-100 border-2 border-yellow-400 px-3 py-1 pixel-corners">
              <span className="text-lg">⭐</span>
              <span className="font-bold text-yellow-700">
                +{achievement.xpReward} XP
              </span>
            </div>
          </div>

          {/* Sparkle effects */}
          <div className="absolute top-2 right-2 text-2xl animate-ping-slow">✨</div>
          <div className="absolute bottom-2 left-2 text-2xl animate-ping-slow animation-delay-200">✨</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes ping-slow {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          75%, 100% {
            opacity: 0;
            transform: scale(1.5);
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 1.5s ease-in-out infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
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
          text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
