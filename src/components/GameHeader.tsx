"use client";

import type { ReactNode } from 'react';
import { colors } from '@/styles/designTokens';

interface GameHeaderProps {
  title: string;
  isRTL: boolean;
  onReset: () => void;
  onToggleSettings: () => void;
  showSettings: boolean;
  settingsPanel?: ReactNode;
}

/**
 * Minimal game header - just title and settings
 * Stats moved to left margin, power-ups to right margin
 */
export default function GameHeader({
  title,
  isRTL,
  onReset,
  onToggleSettings,
  showSettings,
  settingsPanel,
}: GameHeaderProps) {
  return (
    <header
      className="flex-shrink-0 border-b py-4 px-6"
      style={{
        backgroundColor: colors.paper,
        borderColor: colors.pencilLight,
        opacity: 0.3
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Back button */}
        <button
          onClick={onReset}
          className="text-sm transition-colors heading-text"
          style={{ color: colors.pencil }}
        >
          {isRTL ? 'חזרה →' : '← Back'}
        </button>

        {/* Title */}
        {title && (
          <h1
            className="text-base font-medium truncate max-w-[50%] heading-text"
            style={{ color: colors.ink }}
          >
            {title}
          </h1>
        )}

        {/* Settings button */}
        <div className="relative">
          <button
            onClick={onToggleSettings}
            className="px-3 py-1 text-sm rounded transition-all"
            style={{
              backgroundColor: showSettings ? colors.accent : 'transparent',
              color: showSettings ? '#fff' : colors.pencil,
              border: `1px solid ${showSettings ? colors.accent : 'transparent'}`
            }}
            title="Settings"
          >
            ⚙
          </button>

          {/* Settings panel */}
          {settingsPanel}
        </div>
      </div>
    </header>
  );
}
