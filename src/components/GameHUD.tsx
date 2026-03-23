'use client';

interface GameHUDProps {
  onUsePowerUp?: (type: 'freezeMonster' | 'shield' | 'slowMo') => void;
  combo?: number;
  currentWPM?: number;
}

// WPM status levels with funny names
const WPM_STATUS_LEVELS = [
  { min: 0, max: 10, name: '🐌 Sleepy Snail', color: 'from-red-500 to-red-600' },
  { min: 10, max: 20, name: '🐢 Turtle Tapper', color: 'from-red-400 to-orange-500' },
  { min: 20, max: 30, name: '🦥 Slow Poke', color: 'from-orange-500 to-yellow-500' },
  { min: 30, max: 40, name: '✌️ Two Fingers', color: 'from-yellow-500 to-yellow-400' },
  { min: 40, max: 50, name: '👆 Pointer Pro', color: 'from-yellow-400 to-lime-400' },
  { min: 50, max: 65, name: '✍️ Steady Scribe', color: 'from-lime-400 to-green-400' },
  { min: 65, max: 80, name: '⚡ Speed Typist', color: 'from-green-400 to-green-500' },
  { min: 80, max: 100, name: '🚀 Rocket Fingers', color: 'from-green-500 to-cyan-500' },
  { min: 100, max: 120, name: '🔥 Blazing Keys', color: 'from-cyan-500 to-blue-500' },
  { min: 120, max: 999, name: '👻 Typing Ghost', color: 'from-blue-500 to-purple-500' },
];

function getWPMStatus(wpm: number) {
  return WPM_STATUS_LEVELS.find(level => wpm >= level.min && wpm < level.max) || WPM_STATUS_LEVELS[0];
}

export default function GameHUD({ onUsePowerUp, combo = 1, currentWPM = 0 }: GameHUDProps) {
  const wpmStatus = getWPMStatus(currentWPM);
  const maxWPM = 120; // Max for the progress bar
  const wpmPercentage = Math.min(100, (currentWPM / maxWPM) * 100);

  return (
    <>
      {/* WPM Status Bar - Top Left */}
      <div className="fixed top-4 left-4 z-40">
        <div className="bg-white border-2 border-black p-2 pixel-corners shadow-retro min-w-[220px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold pixel-text">{wpmStatus.name}</span>
            <span className="text-xs text-gray-600">
              {currentWPM} WPM
            </span>
          </div>
          <div className="h-3 bg-gray-200 border-2 border-gray-400 pixel-corners overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${wpmStatus.color} transition-all duration-500`}
              style={{ width: `${wpmPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Combo Multiplier - Top Right */}
      {combo > 1 && (
        <div className="fixed top-4 right-4 z-40">
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
        </div>
      )}

      {/* Power-ups are now floating collectibles above words - no inventory needed */}

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
    </>
  );
}
