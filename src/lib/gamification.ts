// ============================================================================
// ACHIEVEMENTS & BADGES SYSTEM
// ============================================================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  category: 'speed' | 'accuracy' | 'streak' | 'endurance' | 'mastery' | 'special';
  requirement: {
    type: 'wpm' | 'accuracy' | 'streak' | 'words' | 'games' | 'level' | 'combo' | 'survival';
    value: number;
    comparison?: 'gte' | 'lte' | 'eq';
  };
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: number;
  seen: boolean; // Has the user seen the celebration?
}

export interface PlayerProgress {
  level: number;
  xp: number;
  totalXP: number;
  achievements: UnlockedAchievement[];
  powerUps: {
    freezeMonster: number;
    shield: number;
    slowMo: number;
  };
  unlockedSkins: string[];
  selectedSkin: string;
  dailyChallenges: DailyChallenge[];
  lastChallengeReset: string; // ISO date
  stats: {
    totalGamesPlayed: number;
    totalWordsTyped: number;
    highestStreak: number;
    fastestWPM: number;
    bestAccuracy: number;
    totalPlayTime: number; // ms
  };
}

export interface DailyChallenge {
  id: string;
  description: string;
  icon: string;
  type: 'words' | 'wpm' | 'streak' | 'accuracy' | 'games' | 'time';
  target: number;
  progress: number;
  completed: boolean;
  reward: {
    xp?: number;
    powerUp?: { type: 'freezeMonster' | 'shield' | 'slowMo'; amount: number };
  };
}

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

export const ACHIEVEMENTS: Achievement[] = [
  // Speed Achievements
  {
    id: 'speed_novice',
    name: 'Speed Novice',
    description: 'Reach 40 WPM',
    icon: '🏃',
    category: 'speed',
    requirement: { type: 'wpm', value: 40, comparison: 'gte' },
    xpReward: 50,
    rarity: 'common'
  },
  {
    id: 'speed_intermediate',
    name: 'Speed Demon',
    description: 'Reach 60 WPM',
    icon: '⚡',
    category: 'speed',
    requirement: { type: 'wpm', value: 60, comparison: 'gte' },
    xpReward: 100,
    rarity: 'common'
  },
  {
    id: 'speed_advanced',
    name: 'Lightning Fingers',
    description: 'Reach 80 WPM',
    icon: '⚡',
    category: 'speed',
    requirement: { type: 'wpm', value: 80, comparison: 'gte' },
    xpReward: 200,
    rarity: 'rare'
  },
  {
    id: 'speed_expert',
    name: 'Sonic Typist',
    description: 'Reach 100 WPM',
    icon: '💨',
    category: 'speed',
    requirement: { type: 'wpm', value: 100, comparison: 'gte' },
    xpReward: 500,
    rarity: 'epic'
  },
  {
    id: 'speed_master',
    name: 'Speed of Light',
    description: 'Reach 120 WPM',
    icon: '🌟',
    category: 'speed',
    requirement: { type: 'wpm', value: 120, comparison: 'gte' },
    xpReward: 1000,
    rarity: 'legendary'
  },

  // Accuracy Achievements
  {
    id: 'accuracy_good',
    name: 'Careful Typer',
    description: '95% accuracy on 100+ words',
    icon: '🎯',
    category: 'accuracy',
    requirement: { type: 'accuracy', value: 95, comparison: 'gte' },
    xpReward: 100,
    rarity: 'common'
  },
  {
    id: 'accuracy_great',
    name: 'Precision Master',
    description: '98% accuracy on 100+ words',
    icon: '🎯',
    category: 'accuracy',
    requirement: { type: 'accuracy', value: 98, comparison: 'gte' },
    xpReward: 250,
    rarity: 'rare'
  },
  {
    id: 'accuracy_perfect',
    name: 'Perfectionist',
    description: '100% accuracy on 100+ words',
    icon: '💎',
    category: 'accuracy',
    requirement: { type: 'accuracy', value: 100, comparison: 'gte' },
    xpReward: 500,
    rarity: 'epic'
  },

  // Streak Achievements
  {
    id: 'streak_10',
    name: 'On Fire',
    description: 'Achieve 10 word streak',
    icon: '🔥',
    category: 'streak',
    requirement: { type: 'streak', value: 10, comparison: 'gte' },
    xpReward: 50,
    rarity: 'common'
  },
  {
    id: 'streak_25',
    name: 'Unstoppable',
    description: 'Achieve 25 word streak',
    icon: '🔥',
    category: 'streak',
    requirement: { type: 'streak', value: 25, comparison: 'gte' },
    xpReward: 150,
    rarity: 'common'
  },
  {
    id: 'streak_50',
    name: 'Streak Legend',
    description: 'Achieve 50 word streak',
    icon: '🔥',
    category: 'streak',
    requirement: { type: 'streak', value: 50, comparison: 'gte' },
    xpReward: 300,
    rarity: 'rare'
  },
  {
    id: 'streak_100',
    name: 'Immortal Streak',
    description: 'Achieve 100 word streak',
    icon: '👑',
    category: 'streak',
    requirement: { type: 'streak', value: 100, comparison: 'gte' },
    xpReward: 1000,
    rarity: 'legendary'
  },

  // Endurance Achievements
  {
    id: 'words_500',
    name: 'Word Warrior',
    description: 'Type 500 words in one session',
    icon: '📝',
    category: 'endurance',
    requirement: { type: 'words', value: 500, comparison: 'gte' },
    xpReward: 100,
    rarity: 'common'
  },
  {
    id: 'words_1000',
    name: 'Marathon Typist',
    description: 'Type 1000 words in one session',
    icon: '📚',
    category: 'endurance',
    requirement: { type: 'words', value: 1000, comparison: 'gte' },
    xpReward: 300,
    rarity: 'rare'
  },
  {
    id: 'words_2000',
    name: 'Typing Machine',
    description: 'Type 2000 words in one session',
    icon: '🤖',
    category: 'endurance',
    requirement: { type: 'words', value: 2000, comparison: 'gte' },
    xpReward: 750,
    rarity: 'epic'
  },

  // Survival Achievements
  {
    id: 'first_survival',
    name: 'Monster Survivor',
    description: 'Complete a text without getting caught',
    icon: '✅',
    category: 'mastery',
    requirement: { type: 'survival', value: 1, comparison: 'gte' },
    xpReward: 100,
    rarity: 'common'
  },
  {
    id: 'survival_5',
    name: 'Monster Slayer',
    description: 'Survive 5 texts',
    icon: '⚔️',
    category: 'mastery',
    requirement: { type: 'survival', value: 5, comparison: 'gte' },
    xpReward: 300,
    rarity: 'rare'
  },
  {
    id: 'survival_10',
    name: 'Apex Predator',
    description: 'Survive 10 texts',
    icon: '👾',
    category: 'mastery',
    requirement: { type: 'survival', value: 10, comparison: 'gte' },
    xpReward: 750,
    rarity: 'epic'
  },

  // Combo Achievements
  {
    id: 'combo_10',
    name: 'Combo Starter',
    description: 'Reach 10x combo multiplier',
    icon: '💥',
    category: 'mastery',
    requirement: { type: 'combo', value: 10, comparison: 'gte' },
    xpReward: 150,
    rarity: 'common'
  },
  {
    id: 'combo_25',
    name: 'Combo Master',
    description: 'Reach 25x combo multiplier',
    icon: '💥',
    category: 'mastery',
    requirement: { type: 'combo', value: 25, comparison: 'gte' },
    xpReward: 400,
    rarity: 'rare'
  },
  {
    id: 'combo_50',
    name: 'Combo God',
    description: 'Reach 50x combo multiplier',
    icon: '⭐',
    category: 'mastery',
    requirement: { type: 'combo', value: 50, comparison: 'gte' },
    xpReward: 1000,
    rarity: 'legendary'
  },

  // Games Played
  {
    id: 'games_10',
    name: 'Getting Started',
    description: 'Play 10 games',
    icon: '🎮',
    category: 'special',
    requirement: { type: 'games', value: 10, comparison: 'gte' },
    xpReward: 50,
    rarity: 'common'
  },
  {
    id: 'games_50',
    name: 'Dedicated Player',
    description: 'Play 50 games',
    icon: '🎮',
    category: 'special',
    requirement: { type: 'games', value: 50, comparison: 'gte' },
    xpReward: 250,
    rarity: 'rare'
  },
  {
    id: 'games_100',
    name: 'Type Master',
    description: 'Play 100 games',
    icon: '🏆',
    category: 'special',
    requirement: { type: 'games', value: 100, comparison: 'gte' },
    xpReward: 500,
    rarity: 'epic'
  },
];

// ============================================================================
// MONSTER SKINS
// ============================================================================

export interface MonsterSkin {
  id: string;
  emoji: string;
  name: string;
  unlockRequirement: {
    type: 'level' | 'achievement';
    value: number | string;
  };
}

export const MONSTER_SKINS: MonsterSkin[] = [
  { id: 'default', emoji: '👾', name: 'Classic Monster', unlockRequirement: { type: 'level', value: 1 } },
  { id: 'robot', emoji: '🤖', name: 'Robot', unlockRequirement: { type: 'level', value: 3 } },
  { id: 'alien', emoji: '👽', name: 'Alien', unlockRequirement: { type: 'level', value: 5 } },
  { id: 'ghost', emoji: '👻', name: 'Ghost', unlockRequirement: { type: 'level', value: 7 } },
  { id: 'dragon', emoji: '🐉', name: 'Dragon', unlockRequirement: { type: 'level', value: 10 } },
  { id: 'demon', emoji: '😈', name: 'Demon', unlockRequirement: { type: 'level', value: 15 } },
  { id: 'skull', emoji: '💀', name: 'Skull', unlockRequirement: { type: 'achievement', value: 'survival_10' } },
];

// ============================================================================
// XP & LEVELING
// ============================================================================

export function getXPForLevel(level: number): number {
  // Exponential curve: level 1 = 100 XP, level 2 = 200, level 3 = 350, etc.
  return Math.floor(100 * level * (1 + level * 0.15));
}

export function getLevelFromXP(totalXP: number): { level: number; currentLevelXP: number; nextLevelXP: number } {
  let level = 1;
  let accumulatedXP = 0;

  while (accumulatedXP + getXPForLevel(level) <= totalXP) {
    accumulatedXP += getXPForLevel(level);
    level++;
  }

  const currentLevelXP = totalXP - accumulatedXP;
  const nextLevelXP = getXPForLevel(level);

  return { level, currentLevelXP, nextLevelXP };
}

export function calculateXPFromGame(stats: {
  score: number;
  wordsTyped: number;
  accuracy: number;
  streak: number;
  survived: boolean;
}): number {
  let xp = 0;

  // Base XP from score (1 XP per 10 score points)
  xp += Math.floor(stats.score / 10);

  // Bonus for accuracy
  if (stats.accuracy >= 95) xp += 50;
  if (stats.accuracy >= 98) xp += 50;
  if (stats.accuracy === 100) xp += 100;

  // Bonus for survival
  if (stats.survived) xp += 100;

  // Bonus for high streak
  if (stats.streak >= 25) xp += 50;
  if (stats.streak >= 50) xp += 100;
  if (stats.streak >= 100) xp += 200;

  return xp;
}

// ============================================================================
// DAILY CHALLENGES
// ============================================================================

export function generateDailyChallenges(seed: string): DailyChallenge[] {
  // Use date as seed for consistent daily challenges
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number, offset: number = 0) =>
    min + ((hash + offset) % (max - min + 1));

  return [
    {
      id: 'daily_words',
      description: `Type ${random(300, 600, 1)} words today`,
      icon: '📝',
      type: 'words',
      target: random(300, 600, 1),
      progress: 0,
      completed: false,
      reward: { xp: 150, powerUp: { type: 'freezeMonster', amount: 1 } }
    },
    {
      id: 'daily_wpm',
      description: `Reach ${random(50, 80, 2)} WPM`,
      icon: '⚡',
      type: 'wpm',
      target: random(50, 80, 2),
      progress: 0,
      completed: false,
      reward: { xp: 200 }
    },
    {
      id: 'daily_streak',
      description: `Achieve a ${random(20, 40, 3)} word streak`,
      icon: '🔥',
      type: 'streak',
      target: random(20, 40, 3),
      progress: 0,
      completed: false,
      reward: { xp: 100, powerUp: { type: 'shield', amount: 1 } }
    }
  ];
}

export function shouldResetChallenges(lastReset: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return lastReset !== today;
}
