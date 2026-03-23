'use client';

interface GameHUDProps {
  onUsePowerUp?: (type: 'freezeMonster' | 'shield' | 'slowMo') => void;
  combo?: number;
  currentWPM?: number;
}

// WPM status levels with funny names - using notebook ink colors
const WPM_STATUS_LEVELS = [
  { min: 0, max: 10, name: '🐌 Sleepy Snail', fillPercent: 10 },
  { min: 10, max: 20, name: '🐢 Turtle Tapper', fillPercent: 20 },
  { min: 20, max: 30, name: '🦥 Slow Poke', fillPercent: 30 },
  { min: 30, max: 40, name: '✌️ Two Fingers', fillPercent: 40 },
  { min: 40, max: 50, name: '👆 Pointer Pro', fillPercent: 50 },
  { min: 50, max: 65, name: '✍️ Steady Scribe', fillPercent: 65 },
  { min: 65, max: 80, name: '⚡ Speed Typist', fillPercent: 80 },
  { min: 80, max: 100, name: '🚀 Rocket Fingers', fillPercent: 90 },
  { min: 100, max: 120, name: '🔥 Blazing Keys', fillPercent: 95 },
  { min: 120, max: 999, name: '👻 Typing Ghost', fillPercent: 100 },
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
        <div className="bg-white border-3 border-[var(--ink-black)] p-2 pixel-corners shadow-retro min-w-[220px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold pixel-text text-[var(--ink-black)]">{wpmStatus.name}</span>
            <span className="text-xs text-[var(--pencil-gray)]">
              {currentWPM} WPM
            </span>
          </div>
          <div className="h-3 bg-[var(--notebook-line)] border-2 border-[var(--ink-black)] pixel-corners overflow-hidden">
            <div
              className="h-full bg-[var(--ink-blue)] transition-all duration-500"
              style={{ width: `${wpmPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Combo Multiplier - Top Right */}
      {combo > 1 && (
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-white border-3 border-[var(--ink-red)] p-2 pixel-corners shadow-retro animate-pulse-subtle">
            <div className="flex items-center gap-2">
              <span className="text-xl">💥</span>
              <div>
                <div className="text-xs text-[var(--pencil-gray)]">Combo</div>
                <div className="text-lg font-bold text-[var(--ink-red)] pixel-text">
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
