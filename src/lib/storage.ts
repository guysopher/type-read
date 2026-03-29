import { prepareTextForTyping, sanitizeTypingText } from './textProcessing';

export interface WPMSample {
  timestamp: number; // ms since start
  wpm: number;
  wordsTyped: number;
}

export interface PauseEvent {
  startTime: number; // ms since start
  endTime: number | null; // null if still paused
  duration: number; // ms
}

export interface DetailedStats {
  wpmSamples: WPMSample[];
  pauses: PauseEvent[];
  peakWpm: number;
  averageWpm: number;
  totalActiveTime: number; // excluding pauses
  totalPauseTime: number;
  wordsPerMinuteByMinute: { minute: number; wpm: number }[];
}

export interface Highlight {
  id: string;
  startWordIndex: number;
  endWordIndex: number;
  note: string;
  color: string;
  createdAt: number;
}

export interface SavedText {
  id: string;
  title: string;
  text: string;
  progress: {
    currentWordIndex: number;
    wordsTyped: number;
    correctKeystrokes: number;
    totalKeystrokes: number;
    totalTime: number; // accumulated time in ms
  };
  detailedStats?: DetailedStats;
  highlights?: Highlight[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "typeread_saved_texts";

export function getSavedTexts(): SavedText[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data) as SavedText[];
    const sanitized = parsed.map(sanitizeSavedText);

    // Self-heal older saves that still contain illegal characters.
    if (JSON.stringify(parsed) !== JSON.stringify(sanitized)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    }

    return sanitized;
  } catch {
    return [];
  }
}

export function saveText(saved: SavedText): void {
  const texts = getSavedTexts();
  const sanitizedSaved = sanitizeSavedText(saved);
  const existingIndex = texts.findIndex((t) => t.id === sanitizedSaved.id);

  if (existingIndex >= 0) {
    const existing = texts[existingIndex];
    // Never save older progress over newer progress
    if (sanitizedSaved.progress.currentWordIndex < existing.progress.currentWordIndex) {
      return; // Don't overwrite - existing has more progress
    }
    texts[existingIndex] = sanitizedSaved;
  } else {
    texts.unshift(sanitizedSaved);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(texts));
}

function sanitizeSavedText(saved: SavedText): SavedText {
  return {
    ...saved,
    title: sanitizeTypingText(saved.title).trim(),
    text: prepareTextForTyping(saved.text),
  };
}

export function deleteText(id: string): void {
  const texts = getSavedTexts().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(texts));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function createEmptyDetailedStats(): DetailedStats {
  return {
    wpmSamples: [],
    pauses: [],
    peakWpm: 0,
    averageWpm: 0,
    totalActiveTime: 0,
    totalPauseTime: 0,
    wordsPerMinuteByMinute: [],
  };
}

// ============================================================================
// LEADERBOARD SYSTEM
// ============================================================================

export interface LeaderboardEntry {
  id: string;
  playerName: string; // User/player identifier
  date: number; // Timestamp of the game

  // Core metrics
  score: number;
  wordsTyped: number;
  wpm: number;
  peakWpm: number;
  accuracy: number; // percentage
  streak: number;

  // Additional context
  textTitle: string; // Which story/text was played
  duration: number; // Total time in ms
  survived: boolean; // Did they complete without getting caught?

  // Metadata
  language: 'en' | 'he'; // English or Hebrew
}

export interface DailyStreak {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string; // ISO date string (YYYY-MM-DD)
  streakHistory: { date: string; played: boolean }[];
}

const LEADERBOARD_KEY = "typeread_leaderboard";
const DAILY_STREAK_KEY = "typeread_daily_streak";
const PLAYER_NAME_KEY = "typeread_player_name";

// ============================================================================
// Leaderboard Functions
// ============================================================================

export function getLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id'>): LeaderboardEntry {
  const entries = getLeaderboard();
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: generateId(),
  };

  entries.unshift(newEntry);

  // Keep last 1000 entries to avoid localStorage limits
  const trimmed = entries.slice(0, 1000);

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
  return newEntry;
}

export function updateLeaderboardEntry(
  id: string,
  updates: Partial<Omit<LeaderboardEntry, 'id'>>
): void {
  const entries = getLeaderboard();
  const entryIndex = entries.findIndex((entry) => entry.id === id);

  if (entryIndex === -1) {
    return;
  }

  entries[entryIndex] = {
    ...entries[entryIndex],
    ...updates,
    id,
  };

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

export function getTopScores(limit: number = 10): LeaderboardEntry[] {
  return getLeaderboard()
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getTopWPM(limit: number = 10): LeaderboardEntry[] {
  return getLeaderboard()
    .sort((a, b) => b.wpm - a.wpm)
    .slice(0, limit);
}

export function getTopStreaks(limit: number = 10): LeaderboardEntry[] {
  return getLeaderboard()
    .sort((a, b) => b.streak - a.streak)
    .slice(0, limit);
}

export function getTopAccuracy(limit: number = 10): LeaderboardEntry[] {
  return getLeaderboard()
    .filter(e => e.wordsTyped >= 50) // Minimum 50 words for accuracy ranking
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, limit);
}

export function getRecentGames(limit: number = 10): LeaderboardEntry[] {
  return getLeaderboard()
    .sort((a, b) => b.date - a.date)
    .slice(0, limit);
}

export function getDailyLeaderboard(): LeaderboardEntry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  return getLeaderboard()
    .filter(e => e.date >= todayTimestamp)
    .sort((a, b) => b.score - a.score);
}

export function getWeeklyLeaderboard(): LeaderboardEntry[] {
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  return getLeaderboard()
    .filter(e => e.date >= weekAgo)
    .sort((a, b) => b.score - a.score);
}

export function getPersonalBests(playerName: string): {
  highestScore: number;
  bestWPM: number;
  longestStreak: number;
  bestAccuracy: number;
  totalGamesPlayed: number;
  totalWordsTyped: number;
} {
  const playerEntries = getLeaderboard().filter(e => e.playerName === playerName);

  if (playerEntries.length === 0) {
    return {
      highestScore: 0,
      bestWPM: 0,
      longestStreak: 0,
      bestAccuracy: 0,
      totalGamesPlayed: 0,
      totalWordsTyped: 0,
    };
  }

  return {
    highestScore: Math.max(...playerEntries.map(e => e.score)),
    bestWPM: Math.max(...playerEntries.map(e => e.wpm)),
    longestStreak: Math.max(...playerEntries.map(e => e.streak)),
    bestAccuracy: Math.max(...playerEntries.map(e => e.accuracy)),
    totalGamesPlayed: playerEntries.length,
    totalWordsTyped: playerEntries.reduce((sum, e) => sum + e.wordsTyped, 0),
  };
}

export function clearLeaderboard(): void {
  localStorage.removeItem(LEADERBOARD_KEY);
}

// ============================================================================
// Daily Streak Functions
// ============================================================================

export function getDailyStreak(): DailyStreak {
  if (typeof window === "undefined") {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: '',
      streakHistory: [],
    };
  }

  try {
    const data = localStorage.getItem(DAILY_STREAK_KEY);
    return data ? JSON.parse(data) : {
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: '',
      streakHistory: [],
    };
  } catch {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: '',
      streakHistory: [],
    };
  }
}

export function updateDailyStreak(): DailyStreak {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const streak = getDailyStreak();

  // Already played today
  if (streak.lastPlayedDate === today) {
    return streak;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Check if streak continues
  if (streak.lastPlayedDate === yesterdayStr) {
    // Streak continues!
    streak.currentStreak += 1;
  } else if (streak.lastPlayedDate === '') {
    // First time playing
    streak.currentStreak = 1;
  } else {
    // Streak broken, start over
    streak.currentStreak = 1;
  }

  // Update longest streak
  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak;
  }

  streak.lastPlayedDate = today;

  // Add to history (keep last 365 days)
  streak.streakHistory.push({ date: today, played: true });
  streak.streakHistory = streak.streakHistory.slice(-365);

  localStorage.setItem(DAILY_STREAK_KEY, JSON.stringify(streak));
  return streak;
}

export function resetDailyStreak(): void {
  localStorage.removeItem(DAILY_STREAK_KEY);
}

// ============================================================================
// Player Name Functions
// ============================================================================

export function getPlayerName(): string {
  if (typeof window === "undefined") return "Player";
  return localStorage.getItem(PLAYER_NAME_KEY) || "Player";
}

export function setPlayerName(name: string): void {
  localStorage.setItem(PLAYER_NAME_KEY, name);
}

// ============================================================================
// GAMIFICATION SYSTEM
// ============================================================================

import type { PlayerProgress, UnlockedAchievement, DailyChallenge, Achievement } from './gamification';
import { ACHIEVEMENTS, MONSTER_SKINS, generateDailyChallenges, shouldResetChallenges } from './gamification';

const PLAYER_PROGRESS_KEY = "typeread_player_progress";

export function getPlayerProgress(): PlayerProgress {
  if (typeof window === "undefined") {
    return createDefaultProgress();
  }

  try {
    const data = localStorage.getItem(PLAYER_PROGRESS_KEY);
    if (!data) return createDefaultProgress();

    const progress: PlayerProgress = JSON.parse(data);

    // Reset daily challenges if needed
    if (shouldResetChallenges(progress.lastChallengeReset)) {
      const today = new Date().toISOString().split('T')[0];
      progress.dailyChallenges = generateDailyChallenges(today);
      progress.lastChallengeReset = today;
      savePlayerProgress(progress);
    }

    return progress;
  } catch {
    return createDefaultProgress();
  }
}

export function savePlayerProgress(progress: PlayerProgress): void {
  localStorage.setItem(PLAYER_PROGRESS_KEY, JSON.stringify(progress));
}

export function createDefaultProgress(): PlayerProgress {
  const today = new Date().toISOString().split('T')[0];
  return {
    achievements: [],
    powerUps: {
      freezeMonster: 1, // Start with 1 of each
      shield: 1,
      slowMo: 0,
    },
    unlockedSkins: ['default', 'robot', 'alien', 'ghost'], // Start with default skins unlocked
    selectedSkin: 'default',
    dailyChallenges: generateDailyChallenges(today),
    lastChallengeReset: today,
    stats: {
      totalGamesPlayed: 0,
      totalWordsTyped: 0,
      highestStreak: 0,
      fastestWPM: 0,
      bestAccuracy: 0,
      totalPlayTime: 0,
    },
  };
}

export function checkAndUnlockAchievements(gameStats: {
  wpm: number;
  accuracy: number;
  streak: number;
  wordsTyped: number;
  survived: boolean;
  combo?: number;
}): Achievement[] {
  const progress = getPlayerProgress();
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip if already unlocked
    if (progress.achievements.some(a => a.achievementId === achievement.id)) {
      continue;
    }

    let unlocked = false;
    const { type, value, comparison = 'gte' } = achievement.requirement;

    switch (type) {
      case 'wpm':
        if (comparison === 'gte' && gameStats.wpm >= value) unlocked = true;
        break;
      case 'accuracy':
        if (comparison === 'gte' && gameStats.accuracy >= value && gameStats.wordsTyped >= 100) unlocked = true;
        break;
      case 'streak':
        if (comparison === 'gte' && gameStats.streak >= value) unlocked = true;
        break;
      case 'words':
        if (comparison === 'gte' && gameStats.wordsTyped >= value) unlocked = true;
        break;
      case 'survival':
        if (comparison === 'gte' && gameStats.survived) {
          const survivalCount = progress.achievements.filter(a =>
            ACHIEVEMENTS.find(ach => ach.id === a.achievementId)?.requirement.type === 'survival'
          ).length + 1;
          if (survivalCount >= value) unlocked = true;
        }
        break;
      case 'combo':
        if (comparison === 'gte' && (gameStats.combo || 0) >= value) unlocked = true;
        break;
      case 'games':
        if (comparison === 'gte' && progress.stats.totalGamesPlayed >= value) unlocked = true;
        break;
    }

    if (unlocked) {
      progress.achievements.push({
        achievementId: achievement.id,
        unlockedAt: Date.now(),
        seen: false,
      });
      newlyUnlocked.push(achievement);

      // Check if this achievement unlocks a monster skin
      const skin = MONSTER_SKINS.find(s => s.unlockRequirement.type === 'achievement' && s.unlockRequirement.value === achievement.id);
      if (skin && !progress.unlockedSkins.includes(skin.id)) {
        progress.unlockedSkins.push(skin.id);
      }
    }
  }

  if (newlyUnlocked.length > 0) {
    savePlayerProgress(progress);
  }

  return newlyUnlocked;
}

export function markAchievementSeen(achievementId: string): void {
  const progress = getPlayerProgress();
  const achievement = progress.achievements.find(a => a.achievementId === achievementId);
  if (achievement) {
    achievement.seen = true;
    savePlayerProgress(progress);
  }
}

export function updateDailyChallengeProgress(
  challengeType: 'words' | 'wpm' | 'streak' | 'accuracy' | 'games' | 'time',
  value: number
): DailyChallenge[] {
  const progress = getPlayerProgress();
  const completedChallenges: DailyChallenge[] = [];

  for (const challenge of progress.dailyChallenges) {
    if (challenge.completed) continue;
    if (challenge.type !== challengeType) continue;

    // Update progress
    challenge.progress = Math.max(challenge.progress, value);

    // Check if completed
    if (challenge.progress >= challenge.target) {
      challenge.completed = true;
      completedChallenges.push(challenge);

      // Award rewards
      if (challenge.reward.powerUp) {
        usePowerUp(challenge.reward.powerUp.type, -challenge.reward.powerUp.amount); // Negative to add
      }
    }
  }

  if (completedChallenges.length > 0) {
    savePlayerProgress(progress);
  }

  return completedChallenges;
}

export function usePowerUp(type: 'freezeMonster' | 'shield' | 'slowMo', amount: number = 1): boolean {
  const progress = getPlayerProgress();

  if (progress.powerUps[type] < amount) {
    return false; // Not enough power-ups
  }

  progress.powerUps[type] -= amount;
  savePlayerProgress(progress);
  return true;
}

export function unlockMonsterSkin(skinId: string): void {
  const progress = getPlayerProgress();
  if (!progress.unlockedSkins.includes(skinId)) {
    progress.unlockedSkins.push(skinId);
    savePlayerProgress(progress);
  }
}

export function selectMonsterSkin(skinId: string): boolean {
  const progress = getPlayerProgress();
  if (!progress.unlockedSkins.includes(skinId)) {
    return false; // Skin not unlocked
  }

  progress.selectedSkin = skinId;
  savePlayerProgress(progress);
  return true;
}

export function updateGameStats(stats: {
  wordsTyped: number;
  wpm: number;
  accuracy: number;
  streak: number;
  duration: number;
  survived: boolean;
  score: number;
}): void {
  const progress = getPlayerProgress();

  progress.stats.totalGamesPlayed += 1;
  progress.stats.totalWordsTyped += stats.wordsTyped;
  progress.stats.highestStreak = Math.max(progress.stats.highestStreak, stats.streak);
  progress.stats.fastestWPM = Math.max(progress.stats.fastestWPM, stats.wpm);
  progress.stats.bestAccuracy = Math.max(progress.stats.bestAccuracy, stats.accuracy);
  progress.stats.totalPlayTime += stats.duration;

  // Check achievements
  checkAndUnlockAchievements({
    wpm: stats.wpm,
    accuracy: stats.accuracy,
    streak: stats.streak,
    wordsTyped: stats.wordsTyped,
    survived: stats.survived,
  });

  // Update daily challenges
  updateDailyChallengeProgress('words', progress.stats.totalWordsTyped);
  updateDailyChallengeProgress('wpm', stats.wpm);
  updateDailyChallengeProgress('streak', stats.streak);
  updateDailyChallengeProgress('accuracy', stats.accuracy);
  updateDailyChallengeProgress('games', progress.stats.totalGamesPlayed);

  savePlayerProgress(progress);
}
