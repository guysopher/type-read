'use client';

import { colors } from '@/styles/designTokens';

interface GameHUDProps {
  onUsePowerUp?: (type: 'freezeMonster' | 'shield' | 'slowMo') => void;
  combo?: number;
  currentWPM?: number;
}

/**
 * Clean minimal HUD - just combo in top right
 * WPM status moved to left margin
 */
export default function GameHUD({ combo = 1 }: GameHUDProps) {
  return (
    <>
      {/* Combo Multiplier - Top Right Corner */}
      {combo > 1 && (
        <div className="fixed top-6 right-6 z-40">
          <div
            className="px-4 py-2 rounded-lg shadow-lg"
            style={{
              backgroundColor: '#fff',
              border: `2px solid ${colors.success}`,
              boxShadow: '0 4px 12px rgba(46, 204, 113, 0.2)'
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">💥</span>
              <div className="text-right">
                <div className="text-xs font-medium" style={{ color: colors.pencil }}>
                  Combo
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: colors.success, fontFamily: '"Courier New", monospace' }}
                >
                  {combo}x
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
