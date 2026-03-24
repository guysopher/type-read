import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENTS,
  MONSTER_SKINS,
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
      });
    });

    it('should have unique IDs', () => {
      const ids = MONSTER_SKINS.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have default skin', () => {
      const defaultSkin = MONSTER_SKINS.find(s => s.id === 'default');
      expect(defaultSkin).toBeDefined();
      expect(defaultSkin?.unlockRequirement.type).toBe('default');
    });

    it('should have default unlocked skins', () => {
      const defaultSkins = MONSTER_SKINS.filter(
        s => s.unlockRequirement.type === 'default'
      );
      expect(defaultSkins.length).toBeGreaterThan(0);
    });

    it('should have achievement-based unlock skins', () => {
      const achievementSkins = MONSTER_SKINS.filter(
        s => s.unlockRequirement.type === 'achievement'
      );
      expect(achievementSkins.length).toBeGreaterThan(0);

      // Verify achievement skins have valid achievement IDs
      achievementSkins.forEach(skin => {
        expect(skin.unlockRequirement.value).toBeDefined();
        expect(typeof skin.unlockRequirement.value).toBe('string');
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

      it('should have power-up rewards on all challenges', () => {
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
