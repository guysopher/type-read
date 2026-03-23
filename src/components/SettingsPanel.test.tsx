import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsPanel from './SettingsPanel';

describe('SettingsPanel', () => {
  const defaultSettings = {
    monsterMode: false,
    forgiveCapitals: false,
    forgiveNonAlpha: false,
    musicEnabled: true,
    soundEffects: true,
    fingerHintPosition: 'off' as const,
    autosaveEnabled: true,
    allowMistakes: false,
  };

  const defaultProps = {
    settings: defaultSettings,
    onSettingChange: vi.fn(),
    onShowLeaderboard: vi.fn(),
    onShowChallenges: vi.fn(),
    onClose: vi.fn(),
    isRTL: false,
    monsterSkin: '👾',
  };

  describe('rendering', () => {
    it('should render all settings options', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByText(/Monster Mode/i)).toBeInTheDocument();
      expect(screen.getByText(/Forgive Capitals/i)).toBeInTheDocument();
      expect(screen.getByText(/Forgive Punctuation/i)).toBeInTheDocument();
      expect(screen.getByText(/Music/i)).toBeInTheDocument();
      expect(screen.getByText(/Sound Effects/i)).toBeInTheDocument();
      expect(screen.getByText(/Finger Tips/i)).toBeInTheDocument();
      expect(screen.getByText(/Autosave/i)).toBeInTheDocument();
      expect(screen.getByText(/Allow Mistakes/i)).toBeInTheDocument();
    });

    it('should render leaderboard and challenges buttons', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByText(/Leaderboard/i)).toBeInTheDocument();
      expect(screen.getByText(/Daily Challenges/i)).toBeInTheDocument();
    });

    it('should display monster skin emoji', () => {
      render(<SettingsPanel {...defaultProps} monsterSkin="🤖" />);

      expect(screen.getByText(/🤖 Monster Mode/i)).toBeInTheDocument();
    });

    it('should show correct ON/OFF states', () => {
      render(<SettingsPanel {...defaultProps} />);

      // Find all ON/OFF indicators
      const onIndicators = screen.getAllByText('ON');
      const offIndicators = screen.getAllByText('OFF');

      expect(onIndicators.length).toBeGreaterThan(0);
      expect(offIndicators.length).toBeGreaterThan(0);
    });

    it('should position panel on right by default', () => {
      const { container } = render(<SettingsPanel {...defaultProps} />);

      const panel = container.querySelector('.absolute');
      expect(panel).toHaveClass('right-0');
      expect(panel).not.toHaveClass('left-0');
    });

    it('should position panel on left for RTL', () => {
      const { container } = render(<SettingsPanel {...defaultProps} isRTL={true} />);

      const panel = container.querySelector('.absolute');
      expect(panel).toHaveClass('left-0');
      expect(panel).not.toHaveClass('right-0');
    });
  });

  describe('Monster Mode toggle', () => {
    it('should call onSettingChange when clicked', () => {
      const onSettingChange = vi.fn();
      render(<SettingsPanel {...defaultProps} onSettingChange={onSettingChange} />);

      const button = screen.getByText(/Monster Mode/i).closest('button');
      fireEvent.click(button!);

      expect(onSettingChange).toHaveBeenCalledWith('monsterMode', true);
    });

    it('should toggle from true to false', () => {
      const onSettingChange = vi.fn();
      const settings = { ...defaultSettings, monsterMode: true };

      render(<SettingsPanel {...defaultProps} settings={settings} onSettingChange={onSettingChange} />);

      const button = screen.getByText(/Monster Mode/i).closest('button');
      fireEvent.click(button!);

      expect(onSettingChange).toHaveBeenCalledWith('monsterMode', false);
    });

    it('should show ON when enabled', () => {
      const settings = { ...defaultSettings, monsterMode: true };
      render(<SettingsPanel {...defaultProps} settings={settings} />);

      const button = screen.getByText(/Monster Mode/i).closest('button');
      expect(button).toHaveTextContent('ON');
    });

    it('should show OFF when disabled', () => {
      const settings = { ...defaultSettings, monsterMode: false };
      render(<SettingsPanel {...defaultProps} settings={settings} />);

      const button = screen.getByText(/Monster Mode/i).closest('button');
      expect(button).toHaveTextContent('OFF');
    });
  });

  describe('Forgive Capitals toggle', () => {
    it('should call onSettingChange when clicked', () => {
      const onSettingChange = vi.fn();
      render(<SettingsPanel {...defaultProps} onSettingChange={onSettingChange} />);

      const button = screen.getByText(/Forgive Capitals/i).closest('button');
      fireEvent.click(button!);

      expect(onSettingChange).toHaveBeenCalledWith('forgiveCapitals', true);
    });

    it('should toggle state correctly', () => {
      const onSettingChange = vi.fn();
      const settings = { ...defaultSettings, forgiveCapitals: true };

      render(<SettingsPanel {...defaultProps} settings={settings} onSettingChange={onSettingChange} />);

      const button = screen.getByText(/Forgive Capitals/i).closest('button');
      fireEvent.click(button!);

      expect(onSettingChange).toHaveBeenCalledWith('forgiveCapitals', false);
    });
  });

  describe('Forgive Punctuation toggle', () => {
    it('should call onSettingChange when clicked', () => {
      const onSettingChange = vi.fn();
      render(<SettingsPanel {...defaultProps} onSettingChange={onSettingChange} />);

      const button = screen.getByText(/Forgive Punctuation/i).closest('button');
      fireEvent.click(button!);

      expect(onSettingChange).toHaveBeenCalledWith('forgiveNonAlpha', true);
    });

    it('should toggle state correctly', () => {
      const onSettingChange = vi.fn();
      const settings = { ...defaultSettings, forgiveNonAlpha: true };

      render(<SettingsPanel {...defaultProps} settings={settings} onSettingChange={onSettingChange} />);

      const button = screen.getByText(/Forgive Punctuation/i).closest('button');
      fireEvent.click(button!);

      expect(onSettingChange).toHaveBeenCalledWith('forgiveNonAlpha', false);
    });
  });

  describe('Music toggle', () => {
    it('should call onSettingChange when clicked', () => {
      const onSettingChange = vi.fn();
      render(<SettingsPanel {...defaultProps} onSettingChange={onSettingChange} />);

      const button = screen.getByText(/🎵 Music/i).closest('button');
      fireEvent.click(button!);

      expect(onSettingChange).toHaveBeenCalledWith('musicEnabled', false);
    });

    it('should toggle state correctly', () => {
      const onSettingChange = vi.fn();
      const settings = { ...defaultSettings, musicEnabled: false };

      render(<SettingsPanel {...defaultProps} settings={settings} onSettingChange={onSettingChange} />);

      const button = screen.getByText(/🎵 Music/i).closest('button');
      fireEvent.click(button!);

      expect(onSettingChange).toHaveBeenCalledWith('musicEnabled', true);
    });
  });

  describe('Sound Effects toggle', () => {
    it('should call onSettingChange when clicked', () => {
      const onSettingChange = vi.fn();
      render(<SettingsPanel {...defaultProps} onSettingChange={onSettingChange} />);

      const button = screen.getByText(/🔊 Sound Effects/i).closest('button');
      fireEvent.click(button!);

      expect(onSettingChange).toHaveBeenCalledWith('soundEffects', false);
    });

    it('should toggle state correctly', () => {
      const onSettingChange = vi.fn();
      const settings = { ...defaultSettings, soundEffects: false };

      render(<SettingsPanel {...defaultProps} settings={settings} onSettingChange={onSettingChange} />);

      const button = screen.getByText(/🔊 Sound Effects/i).closest('button');
      fireEvent.click(button!);

      expect(onSettingChange).toHaveBeenCalledWith('soundEffects', true);
    });
  });

  describe('Finger Tips toggle', () => {
    it('should cycle through positions: off -> top -> bottom -> off', () => {
      const onSettingChange = vi.fn();
      render(<SettingsPanel {...defaultProps} onSettingChange={onSettingChange} />);

      const button = screen.getByText(/👆 Finger Tips/i).closest('button');

      // First click: off -> top
      fireEvent.click(button!);
      expect(onSettingChange).toHaveBeenCalledWith('fingerHintPosition', 'top');

      // Second click: top -> bottom
      onSettingChange.mockClear();
      const { rerender } = render(
        <SettingsPanel {...defaultProps} settings={{ ...defaultSettings, fingerHintPosition: 'top' }} onSettingChange={onSettingChange} />
      );
      const button2 = screen.getByText(/👆 Finger Tips/i).closest('button');
      fireEvent.click(button2!);
      expect(onSettingChange).toHaveBeenCalledWith('fingerHintPosition', 'bottom');

      // Third click: bottom -> off
      onSettingChange.mockClear();
      render(
        <SettingsPanel {...defaultProps} settings={{ ...defaultSettings, fingerHintPosition: 'bottom' }} onSettingChange={onSettingChange} />
      );
      const button3 = screen.getByText(/👆 Finger Tips/i).closest('button');
      fireEvent.click(button3!);
      expect(onSettingChange).toHaveBeenCalledWith('fingerHintPosition', 'off');
    });

    it('should show OFF when position is off', () => {
      const settings = { ...defaultSettings, fingerHintPosition: 'off' as const };
      render(<SettingsPanel {...defaultProps} settings={settings} />);

      const button = screen.getByText(/👆 Finger Tips/i).closest('button');
      expect(button).toHaveTextContent('OFF');
    });

    it('should show TOP when position is top', () => {
      const settings = { ...defaultSettings, fingerHintPosition: 'top' as const };
      render(<SettingsPanel {...defaultProps} settings={settings} />);

      const button = screen.getByText(/👆 Finger Tips/i).closest('button');
      expect(button).toHaveTextContent('TOP');
    });

    it('should show BOTTOM when position is bottom', () => {
      const settings = { ...defaultSettings, fingerHintPosition: 'bottom' as const };
      render(<SettingsPanel {...defaultProps} settings={settings} />);

      const button = screen.getByText(/👆 Finger Tips/i).closest('button');
      expect(button).toHaveTextContent('BOTTOM');
    });
  });

  describe('Autosave toggle', () => {
    it('should call onSettingChange when clicked', () => {
      const onSettingChange = vi.fn();
      render(<SettingsPanel {...defaultProps} onSettingChange={onSettingChange} />);

      const button = screen.getByText(/💾 Autosave/i).closest('button');
      fireEvent.click(button!);

      expect(onSettingChange).toHaveBeenCalledWith('autosaveEnabled', false);
    });

    it('should toggle state correctly', () => {
      const onSettingChange = vi.fn();
      const settings = { ...defaultSettings, autosaveEnabled: false };

      render(<SettingsPanel {...defaultProps} settings={settings} onSettingChange={onSettingChange} />);

      const button = screen.getByText(/💾 Autosave/i).closest('button');
      fireEvent.click(button!);

      expect(onSettingChange).toHaveBeenCalledWith('autosaveEnabled', true);
    });
  });

  describe('Allow Mistakes toggle', () => {
    it('should call onSettingChange when clicked', () => {
      const onSettingChange = vi.fn();
      render(<SettingsPanel {...defaultProps} onSettingChange={onSettingChange} />);

      const button = screen.getByText(/Allow Mistakes/i).closest('button');
      fireEvent.click(button!);

      expect(onSettingChange).toHaveBeenCalledWith('allowMistakes', true);
    });

    it('should toggle state correctly', () => {
      const onSettingChange = vi.fn();
      const settings = { ...defaultSettings, allowMistakes: true };

      render(<SettingsPanel {...defaultProps} settings={settings} onSettingChange={onSettingChange} />);

      const button = screen.getByText(/Allow Mistakes/i).closest('button');
      fireEvent.click(button!);

      expect(onSettingChange).toHaveBeenCalledWith('allowMistakes', false);
    });
  });

  describe('Leaderboard button', () => {
    it('should call onShowLeaderboard when clicked', () => {
      const onShowLeaderboard = vi.fn();
      render(<SettingsPanel {...defaultProps} onShowLeaderboard={onShowLeaderboard} />);

      const button = screen.getByText(/🏆 Leaderboard/i).closest('button');
      fireEvent.click(button!);

      expect(onShowLeaderboard).toHaveBeenCalled();
    });

    it('should call onClose when showing leaderboard', () => {
      const onClose = vi.fn();
      render(<SettingsPanel {...defaultProps} onClose={onClose} />);

      const button = screen.getByText(/🏆 Leaderboard/i).closest('button');
      fireEvent.click(button!);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Daily Challenges button', () => {
    it('should call onShowChallenges when clicked', () => {
      const onShowChallenges = vi.fn();
      render(<SettingsPanel {...defaultProps} onShowChallenges={onShowChallenges} />);

      const button = screen.getByText(/📋 Daily Challenges/i).closest('button');
      fireEvent.click(button!);

      expect(onShowChallenges).toHaveBeenCalled();
    });

    it('should call onClose when showing challenges', () => {
      const onClose = vi.fn();
      render(<SettingsPanel {...defaultProps} onClose={onClose} />);

      const button = screen.getByText(/📋 Daily Challenges/i).closest('button');
      fireEvent.click(button!);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('backdrop', () => {
    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      const { container } = render(<SettingsPanel {...defaultProps} onClose={onClose} />);

      const backdrop = container.querySelector('.fixed.inset-0');
      fireEvent.click(backdrop!);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have title attributes on all settings', () => {
      render(<SettingsPanel {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('title');
      });
    });

    it('should have proper button roles', () => {
      render(<SettingsPanel {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(10); // 8 settings + 2 navigation
    });
  });

  describe('visual states', () => {
    it('should apply green styling to enabled settings', () => {
      const settings = { ...defaultSettings, monsterMode: true };
      const { container } = render(<SettingsPanel {...defaultProps} settings={settings} />);

      const onIndicator = screen.getAllByText('ON')[0];
      expect(onIndicator).toHaveClass('text-green-600');
    });

    it('should apply muted styling to disabled settings', () => {
      const settings = { ...defaultSettings, monsterMode: false };
      render(<SettingsPanel {...defaultProps} settings={settings} />);

      // OFF indicators should have muted styling
      const offIndicators = screen.getAllByText('OFF');
      offIndicators.forEach(indicator => {
        expect(indicator.className).toContain('text-[var(--muted)]');
      });
    });
  });

  describe('integration', () => {
    it('should handle multiple setting changes', () => {
      const onSettingChange = vi.fn();
      render(<SettingsPanel {...defaultProps} onSettingChange={onSettingChange} />);

      // Toggle multiple settings
      fireEvent.click(screen.getByText(/Monster Mode/i).closest('button')!);
      fireEvent.click(screen.getByText(/Forgive Capitals/i).closest('button')!);
      fireEvent.click(screen.getByText(/🎵 Music/i).closest('button')!);

      expect(onSettingChange).toHaveBeenCalledTimes(3);
      expect(onSettingChange).toHaveBeenCalledWith('monsterMode', true);
      expect(onSettingChange).toHaveBeenCalledWith('forgiveCapitals', true);
      expect(onSettingChange).toHaveBeenCalledWith('musicEnabled', false);
    });

    it('should handle all settings being enabled', () => {
      const allEnabled = {
        monsterMode: true,
        forgiveCapitals: true,
        forgiveNonAlpha: true,
        musicEnabled: true,
        soundEffects: true,
        fingerHintPosition: 'top' as const,
        autosaveEnabled: true,
        allowMistakes: true,
      };

      render(<SettingsPanel {...defaultProps} settings={allEnabled} />);

      const onIndicators = screen.getAllByText(/^ON$|^TOP$/);
      expect(onIndicators.length).toBeGreaterThanOrEqual(7); // 7 boolean settings + fingerHint TOP
    });

    it('should handle all settings being disabled', () => {
      const allDisabled = {
        monsterMode: false,
        forgiveCapitals: false,
        forgiveNonAlpha: false,
        musicEnabled: false,
        soundEffects: false,
        fingerHintPosition: 'off' as const,
        autosaveEnabled: false,
        allowMistakes: false,
      };

      render(<SettingsPanel {...defaultProps} settings={allDisabled} />);

      const offIndicators = screen.getAllByText('OFF');
      expect(offIndicators.length).toBe(8); // All 8 settings off
    });
  });
});
