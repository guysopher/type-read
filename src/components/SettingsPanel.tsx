"use client";

interface SettingsState {
  monsterMode: boolean;
  forgiveCapitals: boolean;
  forgiveNonAlpha: boolean;
  musicEnabled: boolean;
  soundEffects: boolean;
  fingerHintPosition: 'off' | 'top' | 'bottom';
  autosaveEnabled: boolean;
  allowMistakes: boolean;
}

interface SettingsPanelProps {
  settings: SettingsState;
  onSettingChange: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  onShowLeaderboard: () => void;
  onShowChallenges: () => void;
  onClose: () => void;
  isRTL: boolean;
  monsterSkin: string;
}

/**
 * Settings dropdown panel with toggle options
 */
export default function SettingsPanel({
  settings,
  onSettingChange,
  onShowLeaderboard,
  onShowChallenges,
  onClose,
  isRTL,
  monsterSkin,
}: SettingsPanelProps) {
  const cycleFingerHintPosition = () => {
    const current = settings.fingerHintPosition;
    const next = current === 'off' ? 'top' : current === 'top' ? 'bottom' : 'off';
    onSettingChange('fingerHintPosition', next);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Settings dropdown */}
      <div
        className={`absolute top-full mt-2 w-72 bg-[var(--background)] border border-[var(--foreground)]/10 rounded-xl shadow-xl z-50 py-2 ${
          isRTL ? 'left-0' : 'right-0'
        }`}
        dir="ltr"
      >
        <div className="px-3 py-2 border-b border-[var(--foreground)]/5">
          <span className="text-xs font-medium text-[var(--muted)]">Settings</span>
        </div>

        {/* Monster Mode */}
        <button
          onClick={() => onSettingChange('monsterMode', !settings.monsterMode)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
          title="Enable the chase game with the monster"
        >
          <div className="flex flex-col items-start">
            <span className="text-sm">{monsterSkin} Monster Mode</span>
            <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
              Chase game with the monster
            </span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              settings.monsterMode
                ? 'bg-green-500/20 text-green-600'
                : 'bg-[var(--foreground)]/10 text-[var(--muted)]'
            }`}
          >
            {settings.monsterMode ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Forgive Capitals */}
        <button
          onClick={() => onSettingChange('forgiveCapitals', !settings.forgiveCapitals)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
          title="Ignore uppercase/lowercase differences"
        >
          <div className="flex flex-col items-start">
            <span className="text-sm">Forgive Capitals</span>
            <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
              Aa = aa (case insensitive)
            </span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              settings.forgiveCapitals
                ? 'bg-green-500/20 text-green-600'
                : 'bg-[var(--foreground)]/10 text-[var(--muted)]'
            }`}
          >
            {settings.forgiveCapitals ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Forgive Non-Alpha */}
        <button
          onClick={() => onSettingChange('forgiveNonAlpha', !settings.forgiveNonAlpha)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
          title="Skip punctuation and special characters"
        >
          <div className="flex flex-col items-start">
            <span className="text-sm">Forgive Punctuation</span>
            <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
              Skip commas, periods, etc.
            </span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              settings.forgiveNonAlpha
                ? 'bg-green-500/20 text-green-600'
                : 'bg-[var(--foreground)]/10 text-[var(--muted)]'
            }`}
          >
            {settings.forgiveNonAlpha ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Music */}
        <button
          onClick={() => onSettingChange('musicEnabled', !settings.musicEnabled)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
          title="Background music during chase"
        >
          <div className="flex flex-col items-start">
            <span className="text-sm">🎵 Music</span>
            <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
              Background chase music
            </span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              settings.musicEnabled
                ? 'bg-green-500/20 text-green-600'
                : 'bg-[var(--foreground)]/10 text-[var(--muted)]'
            }`}
          >
            {settings.musicEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Sound Effects */}
        <button
          onClick={() => onSettingChange('soundEffects', !settings.soundEffects)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
          title="Typing sounds for correct/incorrect keys"
        >
          <div className="flex flex-col items-start">
            <span className="text-sm">🔊 Sound Effects</span>
            <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
              Typing feedback sounds
            </span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              settings.soundEffects
                ? 'bg-green-500/20 text-green-600'
                : 'bg-[var(--foreground)]/10 text-[var(--muted)]'
            }`}
          >
            {settings.soundEffects ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Finger hints */}
        <button
          onClick={cycleFingerHintPosition}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
          title="Show which finger to use for each key"
        >
          <div className="flex flex-col items-start">
            <span className="text-sm">👆 Finger Tips</span>
            <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
              Shows correct finger for each key
            </span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              settings.fingerHintPosition !== 'off'
                ? 'bg-green-500/20 text-green-600'
                : 'bg-[var(--foreground)]/10 text-[var(--muted)]'
            }`}
          >
            {settings.fingerHintPosition === 'off'
              ? 'OFF'
              : settings.fingerHintPosition.toUpperCase()}
          </span>
        </button>

        {/* Autosave */}
        <button
          onClick={() => onSettingChange('autosaveEnabled', !settings.autosaveEnabled)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
          title="Automatically save progress"
        >
          <div className="flex flex-col items-start">
            <span className="text-sm">💾 Autosave</span>
            <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
              Save progress automatically
            </span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              settings.autosaveEnabled
                ? 'bg-green-500/20 text-green-600'
                : 'bg-[var(--foreground)]/10 text-[var(--muted)]'
            }`}
          >
            {settings.autosaveEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Allow Mistakes */}
        <button
          onClick={() => onSettingChange('allowMistakes', !settings.allowMistakes)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
          title="Allow completing words with mistakes"
        >
          <div className="flex flex-col items-start">
            <span className="text-sm">Allow Mistakes</span>
            <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
              Space works even with typos
            </span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              settings.allowMistakes
                ? 'bg-green-500/20 text-green-600'
                : 'bg-[var(--foreground)]/10 text-[var(--muted)]'
            }`}
          >
            {settings.allowMistakes ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Leaderboard */}
        <button
          onClick={() => {
            onClose();
            onShowLeaderboard();
          }}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
          title="View leaderboard and rankings"
        >
          <div className="flex flex-col items-start">
            <span className="text-sm">🏆 Leaderboard</span>
            <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
              Rankings and achievements
            </span>
          </div>
          <span className="text-lg">→</span>
        </button>

        {/* Daily Challenges */}
        <button
          onClick={() => {
            onClose();
            onShowChallenges();
          }}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
          title="View and complete daily challenges"
        >
          <div className="flex flex-col items-start">
            <span className="text-sm">📋 Daily Challenges</span>
            <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
              Complete quests for rewards
            </span>
          </div>
          <span className="text-lg">→</span>
        </button>
      </div>
    </>
  );
}
