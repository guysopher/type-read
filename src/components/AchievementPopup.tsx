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

  // Simplified rarity system - using notebook ink colors
  const rarityLabels = {
    common: 'COMMON',
    rare: 'RARE',
    epic: 'EPIC',
    legendary: 'LEGENDARY',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div
        className={`transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        <div
          className="relative bg-white border-3 border-[var(--ink-black)] shadow-retro-lg p-6 max-w-sm pixel-corners pointer-events-auto"
        >
          {/* Rarity banner - simplified */}
          <div
            className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-[var(--ink-blue)] border-2 border-[var(--ink-black)] text-white text-xs font-bold uppercase tracking-wider pixel-corners"
          >
            {rarityLabels[achievement.rarity]}
          </div>

          {/* Achievement content */}
          <div className="text-center mt-2">
            {/* Icon with pulse animation */}
            <div className="text-6xl mb-3 animate-bounce-slow">
              {achievement.icon}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold mb-2 pixel-text text-[var(--ink-black)]">
              {achievement.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-[var(--pencil-gray)] mb-3">
              {achievement.description}
            </p>
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
