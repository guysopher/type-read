"use client";

interface PowerUpInventoryProps {
  activePowerUps: {
    freeze: boolean;
    shield: boolean;
    slowMo: boolean;
  };
}

/**
 * Display active power-ups that the player currently has
 * Shows icons with visual indication when active
 */
export default function PowerUpInventory({ activePowerUps }: PowerUpInventoryProps) {
  const powerUps = [
    { type: 'freeze', icon: '❄️', label: 'Freeze', active: activePowerUps.freeze },
    { type: 'shield', icon: '🛡️', label: 'Shield', active: activePowerUps.shield },
    { type: 'slowMo', icon: '⏱️', label: 'Slow-Mo', active: activePowerUps.slowMo },
  ];

  const activePowerUpsList = powerUps.filter((p) => p.active);

  if (activePowerUpsList.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-[var(--foreground)]/5 rounded-lg border border-[var(--foreground)]/10">
      <span className="text-xs text-[var(--muted)] hidden sm:inline">Active:</span>
      {activePowerUpsList.map((powerUp) => (
        <div
          key={powerUp.type}
          className="relative flex items-center gap-1"
          title={powerUp.label}
        >
          <span
            className="text-base sm:text-lg animate-pulse"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))',
            }}
          >
            {powerUp.icon}
          </span>
          {powerUp.type === 'freeze' && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
          )}
          {powerUp.type === 'shield' && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping" />
          )}
          {powerUp.type === 'slowMo' && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
          )}
        </div>
      ))}
    </div>
  );
}
