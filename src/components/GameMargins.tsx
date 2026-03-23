/**
 * Game Margins Layout
 * Displays game state (left) and power-ups (right) in notebook margins
 */

'use client';

import { ReactNode } from 'react';

interface GameMarginsProps {
  leftMargin: ReactNode;
  rightMargin: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function GameMargins({
  leftMargin,
  rightMargin,
  children,
  className = ''
}: GameMarginsProps) {
  return (
    <div className={`relative w-full max-w-[1000px] mx-auto ${className}`}>
      {/* Desktop: Three-column layout */}
      <div className="hidden md:grid md:grid-cols-[120px_1fr_120px] gap-4 items-start">
        {/* Left Margin - Game State */}
        <aside className="sticky top-4">
          {leftMargin}
        </aside>

        {/* Center - Reading Area */}
        <main className="min-h-[400px]">
          {children}
        </main>

        {/* Right Margin - Power-ups */}
        <aside className="sticky top-4">
          {rightMargin}
        </aside>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="md:hidden">
        {/* Top bar - compact stats */}
        <div className="mb-4">
          {leftMargin}
        </div>

        {/* Reading area */}
        <main className="min-h-[400px]">
          {children}
        </main>

        {/* Bottom - power-ups */}
        <div className="mt-4">
          {rightMargin}
        </div>
      </div>
    </div>
  );
}
