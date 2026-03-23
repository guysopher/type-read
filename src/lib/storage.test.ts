import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSavedTexts,
  saveText,
  deleteText,
  generateId,
  createEmptyDetailedStats,
  getLeaderboard,
  addLeaderboardEntry,
  getTopScores,
  getTopWPM,
  getTopStreaks,
  getTopAccuracy,
  getRecentGames,
  getDailyLeaderboard,
  getWeeklyLeaderboard,
  getPersonalBests,
  clearLeaderboard,
  getDailyStreak,
  updateDailyStreak,
  resetDailyStreak,
  getPlayerName,
  setPlayerName,
  getPlayerProgress,
  savePlayerProgress,
  createDefaultProgress,
  addXP,
  checkAndUnlockAchievements,
  markAchievementSeen,
  updateDailyChallengeProgress,
  usePowerUp,
  unlockMonsterSkin,
  selectMonsterSkin,
  updateGameStats,
  type SavedText,
  type LeaderboardEntry,
} from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('SavedText functions', () => {
    describe('getSavedTexts', () => {
      it('should return empty array when no texts are saved', () => {
        expect(getSavedTexts()).toEqual([]);
      });

      it('should return saved texts from localStorage', () => {
        const text: SavedText = {
          id: '1',
          title: 'Test',
          text: 'Hello world',
          progress: {
            currentWordIndex: 0,
            wordsTyped: 0,
            correctKeystrokes: 0,
            totalKeystrokes: 0,
            totalTime: 0,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        localStorage.setItem('typeread_saved_texts', JSON.stringify([text]));
        expect(getSavedTexts()).toEqual([text]);
      });

      it('should handle corrupted localStorage data', () => {
        localStorage.setItem('typeread_saved_texts', 'invalid json');
        expect(getSavedTexts()).toEqual([]);
      });
    });

    describe('saveText', () => {
      it('should save new text to localStorage', () => {
        const text: SavedText = {
          id: '1',
          title: 'Test',
          text: 'Hello world',
          progress: {
            currentWordIndex: 5,
            wordsTyped: 5,
            correctKeystrokes: 25,
            totalKeystrokes: 30,
            totalTime: 10000,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        saveText(text);
        expect(getSavedTexts()).toEqual([text]);
      });

      it('should update existing text', () => {
        const text: SavedText = {
          id: '1',
          title: 'Test',
          text: 'Hello world',
          progress: {
            currentWordIndex: 5,
            wordsTyped: 5,
            correctKeystrokes: 25,
            totalKeystrokes: 30,
            totalTime: 10000,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        saveText(text);

        const updated = {
          ...text,
          progress: {
            ...text.progress,
            currentWordIndex: 10,
            wordsTyped: 10,
          },
        };

        saveText(updated);
        const saved = getSavedTexts();
        expect(saved).toHaveLength(1);
        expect(saved[0].progress.currentWordIndex).toBe(10);
      });

      it('should not overwrite with older progress', () => {
        const text: SavedText = {
          id: '1',
          title: 'Test',
          text: 'Hello world',
          progress: {
            currentWordIndex: 10,
            wordsTyped: 10,
            correctKeystrokes: 50,
            totalKeystrokes: 60,
            totalTime: 20000,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        saveText(text);

        const older = {
          ...text,
          progress: {
            ...text.progress,
            currentWordIndex: 5, // Older progress
          },
        };

        saveText(older);
        const saved = getSavedTexts();
        expect(saved[0].progress.currentWordIndex).toBe(10); // Should keep newer
      });

      it('should add new texts to the beginning', () => {
        const text1: SavedText = {
          id: '1',
          title: 'Test 1',
          text: 'Hello',
          progress: {
            currentWordIndex: 0,
            wordsTyped: 0,
            correctKeystrokes: 0,
            totalKeystrokes: 0,
            totalTime: 0,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const text2: SavedText = {
          id: '2',
          title: 'Test 2',
          text: 'World',
          progress: {
            currentWordIndex: 0,
            wordsTyped: 0,
            correctKeystrokes: 0,
            totalKeystrokes: 0,
            totalTime: 0,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        saveText(text1);
        saveText(text2);

        const saved = getSavedTexts();
        expect(saved[0].id).toBe('2'); // Most recent first
        expect(saved[1].id).toBe('1');
      });
    });

    describe('deleteText', () => {
      it('should remove text from localStorage', () => {
        const text: SavedText = {
          id: '1',
          title: 'Test',
          text: 'Hello world',
          progress: {
            currentWordIndex: 0,
            wordsTyped: 0,
            correctKeystrokes: 0,
            totalKeystrokes: 0,
            totalTime: 0,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        saveText(text);
        expect(getSavedTexts()).toHaveLength(1);

        deleteText('1');
        expect(getSavedTexts()).toHaveLength(0);
      });

      it('should not affect other texts', () => {
        const text1: SavedText = {
          id: '1',
          title: 'Test 1',
          text: 'Hello',
          progress: {
            currentWordIndex: 0,
            wordsTyped: 0,
            correctKeystrokes: 0,
            totalKeystrokes: 0,
            totalTime: 0,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const text2: SavedText = {
          id: '2',
          title: 'Test 2',
          text: 'World',
          progress: {
            currentWordIndex: 0,
            wordsTyped: 0,
            correctKeystrokes: 0,
            totalKeystrokes: 0,
            totalTime: 0,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        saveText(text1);
        saveText(text2);

        deleteText('1');
        const saved = getSavedTexts();
        expect(saved).toHaveLength(1);
        expect(saved[0].id).toBe('2');
      });
    });

    describe('generateId', () => {
      it('should generate unique IDs', () => {
        const id1 = generateId();
        const id2 = generateId();
        expect(id1).not.toBe(id2);
      });

      it('should generate IDs in expected format', () => {
        const id = generateId();
        expect(id).toMatch(/^\d+-[a-z0-9]+$/);
      });
    });

    describe('createEmptyDetailedStats', () => {
      it('should create stats with expected structure', () => {
        const stats = createEmptyDetailedStats();
        expect(stats).toEqual({
          wpmSamples: [],
          pauses: [],
          peakWpm: 0,
          averageWpm: 0,
          totalActiveTime: 0,
          totalPauseTime: 0,
          wordsPerMinuteByMinute: [],
        });
      });
    });
  });

  describe('Leaderboard functions', () => {
    const createEntry = (overrides: Partial<LeaderboardEntry> = {}): Omit<LeaderboardEntry, 'id'> => ({
      playerName: 'Player1',
      date: Date.now(),
      score: 1000,
      wordsTyped: 100,
      wpm: 50,
      peakWpm: 60,
      accuracy: 95,
      streak: 20,
      textTitle: 'Test Story',
      duration: 120000,
      survived: true,
      language: 'en',
      ...overrides,
    });

    describe('getLeaderboard', () => {
      it('should return empty array when no entries exist', () => {
        expect(getLeaderboard()).toEqual([]);
      });

      it('should return leaderboard entries', () => {
        const entry = createEntry();
        addLeaderboardEntry(entry);
        const board = getLeaderboard();
        expect(board).toHaveLength(1);
        expect(board[0]).toMatchObject(entry);
      });
    });

    describe('addLeaderboardEntry', () => {
      it('should add entry with generated ID', () => {
        const entry = createEntry();
        addLeaderboardEntry(entry);
        const board = getLeaderboard();
        expect(board).toHaveLength(1);
        expect(board[0].id).toBeDefined();
      });

      it('should add entries to the beginning', () => {
        addLeaderboardEntry(createEntry({ score: 100 }));
        addLeaderboardEntry(createEntry({ score: 200 }));
        const board = getLeaderboard();
        expect(board[0].score).toBe(200);
        expect(board[1].score).toBe(100);
      });

      it('should limit entries to 1000', () => {
        // Add 1001 entries
        for (let i = 0; i < 1001; i++) {
          addLeaderboardEntry(createEntry({ score: i }));
        }
        expect(getLeaderboard()).toHaveLength(1000);
      });
    });

    describe('getTopScores', () => {
      it('should return top scores sorted by score', () => {
        addLeaderboardEntry(createEntry({ score: 500 }));
        addLeaderboardEntry(createEntry({ score: 1000 }));
        addLeaderboardEntry(createEntry({ score: 250 }));

        const top = getTopScores(2);
        expect(top).toHaveLength(2);
        expect(top[0].score).toBe(1000);
        expect(top[1].score).toBe(500);
      });

      it('should default to 10 entries', () => {
        for (let i = 0; i < 15; i++) {
          addLeaderboardEntry(createEntry({ score: i * 100 }));
        }
        expect(getTopScores()).toHaveLength(10);
      });
    });

    describe('getTopWPM', () => {
      it('should return top entries sorted by WPM', () => {
        addLeaderboardEntry(createEntry({ wpm: 50 }));
        addLeaderboardEntry(createEntry({ wpm: 80 }));
        addLeaderboardEntry(createEntry({ wpm: 60 }));

        const top = getTopWPM(2);
        expect(top).toHaveLength(2);
        expect(top[0].wpm).toBe(80);
        expect(top[1].wpm).toBe(60);
      });
    });

    describe('getTopStreaks', () => {
      it('should return top entries sorted by streak', () => {
        addLeaderboardEntry(createEntry({ streak: 10 }));
        addLeaderboardEntry(createEntry({ streak: 50 }));
        addLeaderboardEntry(createEntry({ streak: 25 }));

        const top = getTopStreaks(2);
        expect(top[0].streak).toBe(50);
        expect(top[1].streak).toBe(25);
      });
    });

    describe('getTopAccuracy', () => {
      it('should return top entries sorted by accuracy', () => {
        addLeaderboardEntry(createEntry({ accuracy: 90, wordsTyped: 100 }));
        addLeaderboardEntry(createEntry({ accuracy: 98, wordsTyped: 100 }));
        addLeaderboardEntry(createEntry({ accuracy: 95, wordsTyped: 100 }));

        const top = getTopAccuracy(2);
        expect(top[0].accuracy).toBe(98);
        expect(top[1].accuracy).toBe(95);
      });

      it('should filter out entries with less than 50 words', () => {
        addLeaderboardEntry(createEntry({ accuracy: 100, wordsTyped: 10 }));
        addLeaderboardEntry(createEntry({ accuracy: 95, wordsTyped: 100 }));

        const top = getTopAccuracy();
        expect(top).toHaveLength(1);
        expect(top[0].accuracy).toBe(95);
      });
    });

    describe('getRecentGames', () => {
      it('should return games sorted by date', () => {
        const now = Date.now();
        addLeaderboardEntry(createEntry({ date: now - 10000 }));
        addLeaderboardEntry(createEntry({ date: now }));
        addLeaderboardEntry(createEntry({ date: now - 5000 }));

        const recent = getRecentGames(2);
        expect(recent[0].date).toBe(now);
        expect(recent[1].date).toBe(now - 5000);
      });
    });

    describe('getDailyLeaderboard', () => {
      it('should return only today\'s games', () => {
        const now = Date.now();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime();

        addLeaderboardEntry(createEntry({ date: todayStart + 1000, score: 500 }));
        addLeaderboardEntry(createEntry({ date: todayStart - 10000, score: 1000 })); // Yesterday
        addLeaderboardEntry(createEntry({ date: now, score: 800 }));

        const daily = getDailyLeaderboard();
        expect(daily).toHaveLength(2);
        expect(daily[0].score).toBe(800);
        expect(daily[1].score).toBe(500);
      });
    });

    describe('getWeeklyLeaderboard', () => {
      it('should return games from last 7 days', () => {
        const now = Date.now();
        const sixDaysAgo = now - (6 * 24 * 60 * 60 * 1000);
        const eightDaysAgo = now - (8 * 24 * 60 * 60 * 1000);

        addLeaderboardEntry(createEntry({ date: now, score: 500 }));
        addLeaderboardEntry(createEntry({ date: sixDaysAgo, score: 300 }));
        addLeaderboardEntry(createEntry({ date: eightDaysAgo, score: 1000 })); // Too old

        const weekly = getWeeklyLeaderboard();
        expect(weekly).toHaveLength(2);
      });
    });

    describe('getPersonalBests', () => {
      it('should return personal best stats', () => {
        addLeaderboardEntry(createEntry({
          playerName: 'Player1',
          score: 500,
          wpm: 50,
          streak: 20,
          accuracy: 90,
          wordsTyped: 100,
        }));
        addLeaderboardEntry(createEntry({
          playerName: 'Player1',
          score: 800,
          wpm: 60,
          streak: 30,
          accuracy: 95,
          wordsTyped: 150,
        }));
        addLeaderboardEntry(createEntry({
          playerName: 'Player2',
          score: 1000,
          wpm: 70,
          streak: 40,
          accuracy: 98,
          wordsTyped: 200,
        }));

        const bests = getPersonalBests('Player1');
        expect(bests.highestScore).toBe(800);
        expect(bests.bestWPM).toBe(60);
        expect(bests.longestStreak).toBe(30);
        expect(bests.bestAccuracy).toBe(95);
        expect(bests.totalGamesPlayed).toBe(2);
        expect(bests.totalWordsTyped).toBe(250);
      });

      it('should return zeros for player with no games', () => {
        const bests = getPersonalBests('NonExistent');
        expect(bests.highestScore).toBe(0);
        expect(bests.bestWPM).toBe(0);
        expect(bests.totalGamesPlayed).toBe(0);
      });
    });

    describe('clearLeaderboard', () => {
      it('should remove all leaderboard entries', () => {
        addLeaderboardEntry(createEntry());
        addLeaderboardEntry(createEntry());
        expect(getLeaderboard()).toHaveLength(2);

        clearLeaderboard();
        expect(getLeaderboard()).toHaveLength(0);
      });
    });
  });

  describe('Daily Streak functions', () => {
    describe('getDailyStreak', () => {
      it('should return default streak when none exists', () => {
        const streak = getDailyStreak();
        expect(streak).toEqual({
          currentStreak: 0,
          longestStreak: 0,
          lastPlayedDate: '',
          streakHistory: [],
        });
      });

      it('should return saved streak', () => {
        const savedStreak = {
          currentStreak: 5,
          longestStreak: 10,
          lastPlayedDate: '2024-01-01',
          streakHistory: [],
        };
        localStorage.setItem('typeread_daily_streak', JSON.stringify(savedStreak));
        expect(getDailyStreak()).toEqual(savedStreak);
      });
    });

    describe('updateDailyStreak', () => {
      it('should start streak at 1 for first play', () => {
        const streak = updateDailyStreak();
        expect(streak.currentStreak).toBe(1);
        expect(streak.longestStreak).toBe(1);
      });

      it('should not update if already played today', () => {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('typeread_daily_streak', JSON.stringify({
          currentStreak: 5,
          longestStreak: 10,
          lastPlayedDate: today,
          streakHistory: [],
        }));

        const streak = updateDailyStreak();
        expect(streak.currentStreak).toBe(5); // Unchanged
      });

      it('should continue streak if played yesterday', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        localStorage.setItem('typeread_daily_streak', JSON.stringify({
          currentStreak: 5,
          longestStreak: 10,
          lastPlayedDate: yesterdayStr,
          streakHistory: [],
        }));

        const streak = updateDailyStreak();
        expect(streak.currentStreak).toBe(6);
      });

      it('should reset streak if missed a day', () => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

        localStorage.setItem('typeread_daily_streak', JSON.stringify({
          currentStreak: 5,
          longestStreak: 10,
          lastPlayedDate: twoDaysAgoStr,
          streakHistory: [],
        }));

        const streak = updateDailyStreak();
        expect(streak.currentStreak).toBe(1); // Reset
        expect(streak.longestStreak).toBe(10); // Longest unchanged
      });

      it('should update longest streak when current exceeds it', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        localStorage.setItem('typeread_daily_streak', JSON.stringify({
          currentStreak: 10,
          longestStreak: 10,
          lastPlayedDate: yesterdayStr,
          streakHistory: [],
        }));

        const streak = updateDailyStreak();
        expect(streak.currentStreak).toBe(11);
        expect(streak.longestStreak).toBe(11);
      });

      it('should maintain streak history', () => {
        const streak = updateDailyStreak();
        expect(streak.streakHistory).toHaveLength(1);
        expect(streak.streakHistory[0].played).toBe(true);
      });
    });

    describe('resetDailyStreak', () => {
      it('should remove streak from localStorage', () => {
        localStorage.setItem('typeread_daily_streak', JSON.stringify({
          currentStreak: 5,
          longestStreak: 10,
          lastPlayedDate: '2024-01-01',
          streakHistory: [],
        }));

        resetDailyStreak();
        expect(getDailyStreak().currentStreak).toBe(0);
      });
    });
  });

  describe('Player Name functions', () => {
    describe('getPlayerName', () => {
      it('should return default name when none is set', () => {
        expect(getPlayerName()).toBe('Player');
      });

      it('should return saved player name', () => {
        localStorage.setItem('typeread_player_name', 'TestPlayer');
        expect(getPlayerName()).toBe('TestPlayer');
      });
    });

    describe('setPlayerName', () => {
      it('should save player name to localStorage', () => {
        setPlayerName('NewPlayer');
        expect(getPlayerName()).toBe('NewPlayer');
      });
    });
  });

  describe('Player Progress functions', () => {
    describe('createDefaultProgress', () => {
      it('should create progress with expected structure', () => {
        const progress = createDefaultProgress();
        expect(progress.level).toBe(1);
        expect(progress.xp).toBe(0);
        expect(progress.totalXP).toBe(0);
        expect(progress.achievements).toEqual([]);
        expect(progress.powerUps).toEqual({
          freezeMonster: 1,
          shield: 1,
          slowMo: 0,
        });
        expect(progress.unlockedSkins).toEqual(['default']);
        expect(progress.selectedSkin).toBe('default');
        expect(progress.dailyChallenges).toHaveLength(3);
      });
    });

    describe('getPlayerProgress and savePlayerProgress', () => {
      it('should return default progress when none exists', () => {
        const progress = getPlayerProgress();
        expect(progress.level).toBe(1);
      });

      it('should save and retrieve progress', () => {
        const progress = createDefaultProgress();
        progress.level = 5;
        progress.xp = 500;
        savePlayerProgress(progress);

        const retrieved = getPlayerProgress();
        expect(retrieved.level).toBe(5);
        expect(retrieved.xp).toBe(500);
      });
    });

    describe('addXP', () => {
      it('should add XP to player progress', () => {
        const result = addXP(100);
        expect(result.totalXP).toBe(100);
        expect(result.newLevel).toBe(1);
        expect(result.leveledUp).toBe(false);
      });

      it('should level up when XP threshold is reached', () => {
        addXP(500);
        const result = addXP(500);
        expect(result.leveledUp).toBe(true);
        expect(result.newLevel).toBeGreaterThan(1);
      });
    });

    describe('usePowerUp', () => {
      it('should use power-up when available', () => {
        const result = usePowerUp('freezeMonster', 1);
        expect(result).toBe(true);

        const progress = getPlayerProgress();
        expect(progress.powerUps.freezeMonster).toBe(0); // Started with 1
      });

      it('should not use power-up when not available', () => {
        usePowerUp('slowMo', 1); // Uses the initial 0
        const result = usePowerUp('slowMo', 1);
        expect(result).toBe(false);
      });

      it('should allow negative amounts to add power-ups', () => {
        usePowerUp('slowMo', -3); // Add 3
        const progress = getPlayerProgress();
        expect(progress.powerUps.slowMo).toBe(3);
      });
    });

    describe('unlockMonsterSkin', () => {
      it('should unlock new skin', () => {
        unlockMonsterSkin('robot');
        const progress = getPlayerProgress();
        expect(progress.unlockedSkins).toContain('robot');
      });

      it('should not duplicate skins', () => {
        unlockMonsterSkin('robot');
        unlockMonsterSkin('robot');
        const progress = getPlayerProgress();
        expect(progress.unlockedSkins.filter(s => s === 'robot')).toHaveLength(1);
      });
    });

    describe('selectMonsterSkin', () => {
      it('should select unlocked skin', () => {
        unlockMonsterSkin('robot');
        const result = selectMonsterSkin('robot');
        expect(result).toBe(true);

        const progress = getPlayerProgress();
        expect(progress.selectedSkin).toBe('robot');
      });

      it('should not select locked skin', () => {
        const result = selectMonsterSkin('dragon');
        expect(result).toBe(false);

        const progress = getPlayerProgress();
        expect(progress.selectedSkin).not.toBe('dragon');
      });
    });

    describe('checkAndUnlockAchievements', () => {
      it('should unlock achievement when requirement is met', () => {
        const unlocked = checkAndUnlockAchievements({
          wpm: 40,
          accuracy: 95,
          streak: 10,
          wordsTyped: 100,
          survived: true,
        });

        expect(unlocked.length).toBeGreaterThan(0);
      });

      it('should not unlock already unlocked achievements', () => {
        checkAndUnlockAchievements({
          wpm: 40,
          accuracy: 95,
          streak: 10,
          wordsTyped: 100,
          survived: true,
        });

        const secondCheck = checkAndUnlockAchievements({
          wpm: 40,
          accuracy: 95,
          streak: 10,
          wordsTyped: 100,
          survived: true,
        });

        expect(secondCheck.length).toBe(0); // Already unlocked
      });
    });

    describe('markAchievementSeen', () => {
      it('should mark achievement as seen', () => {
        const unlocked = checkAndUnlockAchievements({
          wpm: 40,
          accuracy: 95,
          streak: 10,
          wordsTyped: 100,
          survived: true,
        });

        if (unlocked.length > 0) {
          markAchievementSeen(unlocked[0].id);
          const progress = getPlayerProgress();
          const achievement = progress.achievements.find(a => a.achievementId === unlocked[0].id);
          expect(achievement?.seen).toBe(true);
        }
      });
    });

    describe('updateGameStats', () => {
      it('should update player stats', () => {
        updateGameStats({
          wordsTyped: 100,
          wpm: 50,
          accuracy: 95,
          streak: 20,
          duration: 120000,
          survived: true,
          score: 1000,
        });

        const progress = getPlayerProgress();
        expect(progress.stats.totalGamesPlayed).toBe(1);
        expect(progress.stats.totalWordsTyped).toBe(100);
        expect(progress.stats.fastestWPM).toBe(50);
        expect(progress.stats.highestStreak).toBe(20);
        expect(progress.stats.bestAccuracy).toBe(95);
      });

      it('should track best stats across multiple games', () => {
        updateGameStats({
          wordsTyped: 100,
          wpm: 50,
          accuracy: 90,
          streak: 20,
          duration: 120000,
          survived: true,
          score: 1000,
        });

        updateGameStats({
          wordsTyped: 150,
          wpm: 60,
          accuracy: 95,
          streak: 30,
          duration: 180000,
          survived: true,
          score: 1500,
        });

        const progress = getPlayerProgress();
        expect(progress.stats.totalGamesPlayed).toBe(2);
        expect(progress.stats.totalWordsTyped).toBe(250);
        expect(progress.stats.fastestWPM).toBe(60);
        expect(progress.stats.highestStreak).toBe(30);
        expect(progress.stats.bestAccuracy).toBe(95);
      });
    });
  });
});
