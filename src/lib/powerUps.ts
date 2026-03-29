export type PowerUpType = 'freezeMonster' | 'shield' | 'slowMo';

export const POWER_UP_TYPES: PowerUpType[] = ['freezeMonster', 'shield', 'slowMo'];

export const INLINE_POWER_UP_MARKERS: Record<PowerUpType, string> = {
  freezeMonster: '❄️',
  shield: '🛡️',
  slowMo: '⏱️',
};

export function isSentenceEndingWord(word: string): boolean {
  return /\.[)"'\]]*$/.test(word);
}

export function getSentencePowerUpPlacements(
  words: string[],
  minDistance: number = 5
): Map<number, PowerUpType> {
  const placements = new Map<number, PowerUpType>();
  let lastPlacedIndex = -Infinity;
  let nextTypeIndex = 0;

  words.forEach((word, index) => {
    if (!isSentenceEndingWord(word)) {
      return;
    }

    if (index - lastPlacedIndex < minDistance) {
      return;
    }

    placements.set(index, POWER_UP_TYPES[nextTypeIndex % POWER_UP_TYPES.length]);
    lastPlacedIndex = index;
    nextTypeIndex += 1;
  });

  return placements;
}
