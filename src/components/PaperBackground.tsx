/**
 * Paper Background Component
 * Adds subtle paper texture and lined notebook aesthetic
 */

import { colors } from '@/styles/designTokens';

interface PaperBackgroundProps {
  children: React.ReactNode;
  showLines?: boolean;
  className?: string;
}

export default function PaperBackground({
  children,
  showLines = false,
  className = ''
}: PaperBackgroundProps) {
  return (
    <div className={`relative min-h-screen ${className}`} style={{ backgroundColor: colors.paper }}>
      {/* Paper grain texture */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none opacity-[0.03]" aria-hidden="true">
        <filter id="paper-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#paper-noise)" />
      </svg>

      {/* Optional horizontal ruled lines (like lined paper) */}
      {showLines && (
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              transparent,
              transparent 28px,
              ${colors.pencilLight} 28px,
              ${colors.pencilLight} 29px
            )`
          }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
