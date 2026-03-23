/**
 * TypeRead Design System
 * "Video Game on Paper" - Clean design tokens
 */

export const colors = {
  // Paper & Ink Theme
  paper: '#F5F1E8',
  paperDark: '#E8E4D8',
  ink: '#1a1a1a',
  pencil: '#666666',
  pencilLight: '#999999',

  // Accent Colors (like pen marks and highlighters)
  accent: '#4A90E2',        // Notebook blue
  error: '#E74C3C',         // Red pen
  success: '#2ECC71',       // Green highlighter
  monster: '#9B59B6',       // Purple crayon

  // Transparency levels
  inkFaded: 'rgba(26, 26, 26, 0.4)',
  inkVeryFaded: 'rgba(26, 26, 26, 0.2)',
  accentFaded: 'rgba(74, 144, 226, 0.2)',
} as const;

export const spacing = {
  // Layout
  marginWidth: 120,
  marginWidthMobile: 24,
  maxTextWidth: 680,
  baseUnit: 16,

  // Vertical rhythm
  lineHeight: 1.8,
  paragraphSpacing: 32,
  sectionSpacing: 48,
} as const;

export const typography = {
  // Font families
  fontHeading: '"Courier New", "Courier Prime", monospace',
  fontReading: 'Georgia, "Crimson Text", serif',
  fontUI: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  fontMono: '"Cousine", "Geist Mono", monospace',

  // Font sizes
  displayLarge: '48px',
  displayMedium: '36px',
  heading: '24px',
  body: '18px',
  bodySmall: '14px',
  caption: '12px',

  // Reading text sizes
  readingDesktop: '32px',
  readingMobile: '24px',
} as const;

export const effects = {
  // Paper aesthetics
  paperTexture: 'url("/paper-texture.svg")',
  paperShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  paperShadowHover: '0 6px 16px rgba(0, 0, 0, 0.12)',

  // Rounded corners (like notebook pages)
  borderRadius: '8px',
  borderRadiusSmall: '4px',

  // Transitions
  transitionFast: '150ms ease',
  transitionMedium: '250ms ease',
  transitionSlow: '400ms ease',
} as const;

export const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
} as const;

// Helper function to create margin layout
export function getMarginLayout(isMobile: boolean) {
  return {
    marginWidth: isMobile ? spacing.marginWidthMobile : spacing.marginWidth,
    textWidth: spacing.maxTextWidth,
    totalWidth: spacing.maxTextWidth + (isMobile ? spacing.marginWidthMobile : spacing.marginWidth) * 2,
  };
}
