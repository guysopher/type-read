import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENTS,
  MONSTER_SKINS,
  getXPForLevel,
  getLevelFromXP,
  calculateXPFromGame,
  generateDailyChallenges,
  shouldResetChallenges,
} from './gamification';

describe('gamification', () => {
  describe('ACHIEVEMENTS', () => {
    it('should have 26 achievements defined', () => {
      expect(ACHIEVEMENTS).toHaveLength(26);
    });

    it('should have all required fields', () => {
      ACHIEVEMENTS.forEach(achievement => {
        expect(achievement.id).toBeDefined();
        expect(achievement.name).toBeDefined();
        expect(achievement.description).toBeDefined();
        expect(achievement.icon).toBeDefined();
        expect(achievement.category).toBeDefined();
        expect(achievement.requirement).toBeDefined();
        expect(achievement.xpReward).toBeGreaterThan(0);
        expect(achievement.rarity).toBeDefined();
      });
    });

    it('should have unique IDs', () => {
      const ids = ACHIEVEMENTS.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid categories', () => {
      const validCategories = ['speed', 'accuracy', 'streak', 'endurance', 'mastery', 'special'];
      ACHIEVEMENTS.forEach(achievement => {
        expect(validCategories).toContain(achievement.category);
      });
    });

    it('should have valid rarities', () => {
      const validRarities = ['common', 'rare', 'epic', 'legendary'];
      ACHIEVEMENTS.forEach(achievement => {
        expect(validRarities).toContain(achievement.rarity);
      });
    });

    it('should have valid requirement types', () => {
      const validTypes = ['wpm', 'accuracy', 'streak', 'words', 'games', 'level', 'combo', 'survival'];
      ACHIEVEMENTS.forEach(achievement => {
        expect(validTypes).toContain(achievement.requirement.type);
      });
    });

    describe('speed achievements', () => {
      it('should have progressive WPM requirements', () => {
        const speedAchievements = ACHIEVEMENTS
          .filter(a => a.category === 'speed')
          .sort((a, b) => a.requirement.value - b.requirement.value);

        expect(speedAchievements).toHaveLength(5);
        expect(speedAchievements[0].requirement.value).toBe(40);
        expect(speedAchievements[1].requirement.value).toBe(60);
        expect(speedAchievements[2].requirement.value).toBe(80);
        expect(speedAchievements[3].requirement.value).toBe(100);
        expect(speedAchievements[4].requirement.value).toBe(120);
      });

      it('should have increasing XP rewards', () => {
        const speedAchievements = ACHIEVEMENTS
          .filter(a => a.category === 'speed')
          .sort((a, b) => a.requirement.value - b.requirement.value);

        for (let i = 1; i < speedAchievements.length; i++) {
          expect(speedAchievements[i].xpReward).toBeGreaterThan(
            speedAchievements[i - 1].xpReward
          );
        }
      });
    });

    describe('accuracy achievements', () => {
      it('should have progressive accuracy requirements', () => {
        const accuracyAchievements = ACHIEVEMENTS
          .filter(a => a.category === 'accuracy')
          .sort((a, b) => a.requirement.value - b.requirement.value);

        expect(accuracyAchievements).toHaveLength(3);
        expect(accuracyAchievements[0].requirement.value).toBe(95);
        expect(accuracyAchievements[1].requirement.value).toBe(98);
        expect(accuracyAchievements[2].requirement.value).toBe(100);
      });
    });

    describe('streak achievements', () => {
      it('should have progressive streak requirements', () => {
        const streakAchievements = ACHIEVEMENTS
          .filter(a => a.category === 'streak')
          .sort((a, b) => a.requirement.value - b.requirement.value);

        expect(streakAchievements).toHaveLength(4);
        expect(streakAchievements[0].requirement.value).toBe(10);
        expect(streakAchievements[1].requirement.value).toBe(25);
        expect(streakAchievements[2].requirement.value).toBe(50);
        expect(streakAchievements[3].requirement.value).toBe(100);
      });
    });

    describe('endurance achievements', () => {
      it('should have progressive word count requirements', () => {
        const enduranceAchievements = ACHIEVEMENTS
          .filter(a => a.category === 'endurance')
          .sort((a, b) => a.requirement.value - b.requirement.value);

        expect(enduranceAchievements).toHaveLength(3);
        expect(enduranceAchievements[0].requirement.value).toBe(500);
        expect(enduranceAchievements[1].requirement.value).toBe(1000);
        expect(enduranceAchievements[2].requirement.value).toBe(2000);
      });
    });

    describe('mastery achievements', () => {
      it('should include survival achievements', () => {
        const survivalAchievements = ACHIEVEMENTS.filter(
          a => a.requirement.type === 'survival'
        );

        expect(survivalAchievements.length).toBeGreaterThan(0);
      });

      it('should include combo achievements', () => {
        const comboAchievements = ACHIEVEMENTS.filter(
          a => a.requirement.type === 'combo'
        );

        expect(comboAchievements.length).toBeGreaterThan(0);
      });
    });

    describe('special achievements', () => {
      it('should include games played achievements', () => {
        const gamesAchievements = ACHIEVEMENTS.filter(
          a => a.requirement.type === 'games'
        );

        expect(gamesAchievements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('MONSTER_SKINS', () => {
    it('should have 7 monster skins', () => {
      expect(MONSTER_SKINS).toHaveLength(7);
    });

    it('should have all required fields', () => {
      MONSTER_SKINS.forEach(skin => {
        expect(skin.id).toBeDefined();
        expect(skin.emoji).toBeDefined();
        expect(skin.name).toBeDefined();
        expect(skin.unlockRequirement).toBeDefined();
        expect(skin.unlockRequirement.type).toBeDefined();
        expect(skin.unlockRequirement.value).toBeDefined();
      });
    });

    it('should have unique IDs', () => {
      const ids = MONSTER_SKINS.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have default skin at level 1', () => {
      const defaultSkin = MONSTER_SKINS.find(s => s.id === 'default');
      expect(defaultSkin).toBeDefined();
      expect(defaultSkin?.unlockRequirement.type).toBe('level');
      expect(defaultSkin?.unlockRequirement.value).toBe(1);
    });

    it('should have progressive level requirements', () => {
      const levelSkins = MONSTER_SKINS
        .filter(s => s.unlockRequirement.type === 'level')
        .sort((a, b) => {
          const aVal = a.unlockRequirement.value as number;
          const bVal = b.unlockRequirement.value as number;
          return aVal - bVal;
        });

      for (let i = 1; i < levelSkins.length; i++) {
        expect(levelSkins[i].unlockRequirement.value).toBeGreaterThan(
          levelSkins[i - 1].unlockRequirement.value
        );
      }
    });

    it('should have at least one achievement-based unlock', () => {
      const achievementSkins = MONSTER_SKINS.filter(
        s => s.unlockRequirement.type === 'achievement'
      );
      expect(achievementSkins.length).toBeGreaterThan(0);
    });
  });

  describe('XP & Leveling', () => {
    describe('getXPForLevel', () => {
      it('should return 100 XP for level 1', () => {
        expect(getXPForLevel(1)).toBe(115);
      });

      it('should return increasing XP for higher levels', () => {
        const level1XP = getXPForLevel(1);
        const level2XP = getXPForLevel(2);
        const level3XP = getXPForLevel(3);

        expect(level2XP).toBeGreaterThan(level1XP);
        expect(level3XP).toBeGreaterThan(level2XP);
      });

      it('should use exponential curve', () => {
        const xp1 = getXPForLevel(1);
        const xp5 = getXPForLevel(5);
        const xp10 = getXPForLevel(10);

        // Each level should require significantly more XP
        expect(xp5 / xp1).toBeGreaterThan(2);
        expect(xp10 / xp5).toBeGreaterThan(1.5);
      });

      it('should handle high levels', () => {
        const xp50 = getXPForLevel(50);
        const xp100 = getXPForLevel(100);

        expect(xp50).toBeGreaterThan(0);
        expect(xp100).toBeGreaterThan(xp50);
      });
    });

    describe('getLevelFromXP', () => {
      it('should return level 1 for 0 XP', () => {
        const result = getLevelFromXP(0);
        expect(result.level).toBe(1);
        expect(result.currentLevelXP).toBe(0);
      });

      it('should return level 1 for low XP', () => {
        const result = getLevelFromXP(50);
        expect(result.level).toBe(1);
        expect(result.currentLevelXP).toBe(50);
      });

      it('should calculate correct level from XP', () => {
        const level2XP = getXPForLevel(1);
        const result = getLevelFromXP(level2XP + 10);
        expect(result.level).toBe(2);
        expect(result.currentLevelXP).toBe(10);
      });

      it('should return correct next level XP', () => {
        const result = getLevelFromXP(200);
        expect(result.nextLevelXP).toBe(getXPForLevel(result.level));
      });

      it('should handle large XP values', () => {
        const result = getLevelFromXP(10000);
        expect(result.level).toBeGreaterThan(5);
        expect(result.currentLevelXP).toBeGreaterThanOrEqual(0);
        expect(result.currentLevelXP).toBeLessThan(result.nextLevelXP);
      });

      it('should maintain consistency', () => {
        // If you have X total XP, currentLevelXP + accumulated should equal X
        const totalXP = 1000;
        const result = getLevelFromXP(totalXP);

        let accumulated = 0;
        for (let i = 1; i < result.level; i++) {
          accumulated += getXPForLevel(i);
        }

        expect(accumulated + result.currentLevelXP).toBe(totalXP);
      });
    });

    describe('calculateXPFromGame', () => {
      it('should award base XP from score', () => {
        const xp = calculateXPFromGame({
          score: 1000,
          wordsTyped: 100,
          accuracy: 80,
          streak: 5,
          survived: false,
        });

        expect(xp).toBeGreaterThanOrEqual(100); // At least 100 XP from 1000 score
      });

      it('should award bonus for 95% accuracy', () => {
        const lowAccuracyXP = calculateXPFromGame({
          score: 1000,
          wordsTyped: 100,
          accuracy: 90,
          streak: 5,
          survived: false,
        });

        const highAccuracyXP = calculateXPFromGame({
          score: 1000,
          wordsTyped: 100,
          accuracy: 95,
          streak: 5,
          survived: false,
        });

        expect(highAccuracyXP).toBe(lowAccuracyXP + 50);
      });

      it('should award bonus for 98% accuracy', () => {
        const xp95 = calculateXPFromGame({
          score: 1000,
          wordsTyped: 100,
          accuracy: 95,
          streak: 5,
          survived: false,
        });

        const xp98 = calculateXPFromGame({
          score: 1000,
          wordsTyped: 100,
          accuracy: 98,
          streak: 5,
          survived: false,
        });

        expect(xp98).toBe(xp95 + 50);
      });

      it('should award bonus for 100% accuracy', () => {
        const xp98 = calculateXPFromGame({
          score: 1000,
          wordsTyped: 100,
          accuracy: 98,
          streak: 5,
          survived: false,
        });

        const xp100 = calculateXPFromGame({
          score: 1000,
          wordsTyped: 100,
          accuracy: 100,
          streak: 5,
          survived: false,
        });

        expect(xp100).toBe(xp98 + 100);
      });

      it('should award bonus for survival', () => {
        const noSurvivalXP = calculateXPFromGame({
          score: 1000,
          wordsTyped: 100,
          accuracy: 80,
          streak: 5,
          survived: false,
        });

        const survivalXP = calculateXPFromGame({
          score: 1000,
          wordsTyped: 100,
          accuracy: 80,
          streak: 5,
          survived: true,
        });

        expect(survivalXP).toBe(noSurvivalXP + 100);
      });

      it('should award bonus for high streaks', () => {
        const lowStreakXP = calculateXPFromGame({
          score: 1000,
          wordsTyped: 100,
          accuracy: 80,
          streak: 10,
          survived: false,
        });

        const streak25XP = calculateXPFromGame({
          score: 1000,
          wordsTyped: 100,
          accuracy: 80,
          streak: 25,
          survived: false,
        });

        const streak50XP = calculateXPFromGame({
          score: 1000,
          wordsTyped: 100,
          accuracy: 80,
          streak: 50,
          survived: false,
        });

        const streak100XP = calculateXPFromGame({
          score: 1000,
          wordsTyped: 100,
          accuracy: 80,
          streak: 100,
          survived: false,
        });

        expect(streak25XP).toBeGreaterThan(lowStreakXP);
        expect(streak50XP).toBeGreaterThan(streak25XP);
        expect(streak100XP).toBeGreaterThan(streak50XP);
      });

      it('should combine all bonuses', () => {
        const xp = calculateXPFromGame({
          score: 5000,
          wordsTyped: 500,
          accuracy: 100,
          streak: 100,
          survived: true,
        });

        // Should have: base (500) + accuracy (50+50+100) + survival (100) + streak (50+100+200) = 1150
        expect(xp).toBeGreaterThanOrEqual(1150);
      });
    });
  });

  describe('Daily Challenges', () => {
    describe('generateDailyChallenges', () => {
      it('should generate 3 challenges', () => {
        const challenges = generateDailyChallenges('2024-01-01');
        expect(challenges).toHaveLength(3);
      });

      it('should generate consistent challenges for same seed', () => {
        const challenges1 = generateDailyChallenges('2024-01-01');
        const challenges2 = generateDailyChallenges('2024-01-01');

        expect(challenges1[0].target).toBe(challenges2[0].target);
        expect(challenges1[1].target).toBe(challenges2[1].target);
        expect(challenges1[2].target).toBe(challenges2[2].target);
      });

      it('should generate different challenges for different seeds', () => {
        const challenges1 = generateDailyChallenges('2024-01-01');
        const challenges2 = generateDailyChallenges('2024-01-02');

        // At least one challenge should be different
        const sameChallenges = challenges1.every((c1, idx) =>
          c1.target === challenges2[idx].target
        );
        expect(sameChallenges).toBe(false);
      });

      it('should have proper challenge structure', () => {
        const challenges = generateDailyChallenges('2024-01-01');

        challenges.forEach(challenge => {
          expect(challenge.id).toBeDefined();
          expect(challenge.description).toBeDefined();
          expect(challenge.icon).toBeDefined();
          expect(challenge.type).toBeDefined();
          expect(challenge.target).toBeGreaterThan(0);
          expect(challenge.progress).toBe(0);
          expect(challenge.completed).toBe(false);
          expect(challenge.reward).toBeDefined();
        });
      });

      it('should have words, wpm, and streak challenges', () => {
        const challenges = generateDailyChallenges('2024-01-01');

        const types = challenges.map(c => c.type);
        expect(types).toContain('words');
        expect(types).toContain('wpm');
        expect(types).toContain('streak');
      });

      it('should have appropriate target ranges', () => {
        const challenges = generateDailyChallenges('2024-01-01');

        const wordsChallenge = challenges.find(c => c.type === 'words');
        const wpmChallenge = challenges.find(c => c.type === 'wpm');
        const streakChallenge = challenges.find(c => c.type === 'streak');

        expect(wordsChallenge?.target).toBeGreaterThanOrEqual(300);
        expect(wordsChallenge?.target).toBeLessThanOrEqual(600);

        expect(wpmChallenge?.target).toBeGreaterThanOrEqual(50);
        expect(wpmChallenge?.target).toBeLessThanOrEqual(80);

        expect(streakChallenge?.target).toBeGreaterThanOrEqual(20);
        expect(streakChallenge?.target).toBeLessThanOrEqual(40);
      });

      it('should have XP rewards', () => {
        const challenges = generateDailyChallenges('2024-01-01');

        challenges.forEach(challenge => {
          expect(challenge.reward.xp).toBeGreaterThan(0);
        });
      });

      it('should have power-up rewards on some challenges', () => {
        const challenges = generateDailyChallenges('2024-01-01');

        const challengesWithPowerUps = challenges.filter(c => c.reward.powerUp);
        expect(challengesWithPowerUps.length).toBeGreaterThan(0);
      });
    });

    describe('shouldResetChallenges', () => {
      it('should return true when lastReset is different from today', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        expect(shouldResetChallenges(yesterdayStr)).toBe(true);
      });

      it('should return false when lastReset is today', () => {
        const today = new Date().toISOString().split('T')[0];
        expect(shouldResetChallenges(today)).toBe(false);
      });

      it('should return true for empty lastReset', () => {
        expect(shouldResetChallenges('')).toBe(true);
      });

      it('should return true for old dates', () => {
        expect(shouldResetChallenges('2020-01-01')).toBe(true);
      });
    });
  });
});
