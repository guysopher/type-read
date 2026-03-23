'use client';

import { useEffect, useState } from 'react';

interface LevelUpPopupProps {
  level: number;
  onClose: () => void;
}

export default function LevelUpPopup({ level, onClose }: LevelUpPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3500);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div
        className={`transform transition-all duration-500 ${
          isVisible ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-45'
        }`}
      >
        <div
          className="relative bg-white border-4 border-[var(--ink-black)] shadow-retro-xl p-8 max-w-md pixel-corners pointer-events-auto"
        >
          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Star burst */}
            <div className="text-7xl mb-4 animate-pulse-scale">
              ⭐
            </div>

            {/* Level Up text */}
            <h2 className="text-3xl font-bold mb-2 pixel-text text-[var(--ink-blue)]">
              LEVEL UP!
            </h2>

            {/* Level number */}
            <div className="bg-[var(--ink-blue)]/10 border-4 border-[var(--ink-blue)] px-6 py-3 inline-block pixel-corners mb-3">
              <div className="text-sm text-[var(--pencil-gray)] mb-1">Level</div>
              <div className="text-5xl font-bold text-[var(--ink-blue)] pixel-text">
                {level}
              </div>
            </div>

            {/* Encouragement */}
            <p className="text-[var(--ink-black)] font-medium">
              You're getting stronger! 💪
            </p>
          </div>

          {/* Corner decorations */}
          <div className="absolute top-2 left-2 text-3xl animate-bounce-slow">✨</div>
          <div className="absolute top-2 right-2 text-3xl animate-bounce-slow animation-delay-100">✨</div>
          <div className="absolute bottom-2 left-2 text-3xl animate-bounce-slow animation-delay-200">✨</div>
          <div className="absolute bottom-2 right-2 text-3xl animate-bounce-slow animation-delay-300">✨</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-scale {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-pulse-scale {
          animation: pulse-scale 1.5s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 1.5s ease-in-out infinite;
        }

        .animation-delay-100 {
          animation-delay: 100ms;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-300 {
          animation-delay: 300ms;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .pixel-corners {
          clip-path: polygon(
            6px 0, calc(100% - 6px) 0,
            100% 6px, 100% calc(100% - 6px),
            calc(100% - 6px) 100%, 6px 100%,
            0 calc(100% - 6px), 0 6px
          );
        }

        .pixel-text {
          text-shadow: 3px 3px 0px rgba(0, 0, 0, 0.1);
        }

        .bg-gradient-conic {
          background: conic-gradient(from 0deg, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
}
