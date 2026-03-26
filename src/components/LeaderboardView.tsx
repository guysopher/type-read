'use client';

import { useState, useEffect } from 'react';
import {
  getLeaderboard,
  getTopScores,
  getTopWPM,
  getTopStreaks,
  getTopAccuracy,
  getDailyLeaderboard,
  getWeeklyLeaderboard,
  getPersonalBests,
  getDailyStreak,
  getPlayerName,
  setPlayerName as savePlayerName,
  addLeaderboardEntry,
  clearLeaderboard,
  type LeaderboardEntry,
  type DailyStreak,
} from '@/lib/storage';
import { submitToGlobalLeaderboard } from '@/lib/api';
import { fetchGlobalLeaderboard } from '@/lib/api';
import { colors } from '@/styles/designTokens';

type LeaderboardTab = 'daily' | 'weekly' | 'alltime' | 'personal' | 'global';
type MetricType = 'score' | 'wpm' | 'streak' | 'accuracy';

interface GameOverStats {
  score: number;
  wpm: number;
  peakWpm: number;
  accuracy: number;
  streak: number;
  wordsTyped: number;
  duration: number;
  survived: boolean;
  textTitle: string;
  language: 'he' | 'en';
}

interface LeaderboardViewProps {
  onClose: () => void;
  gameOverStats?: GameOverStats;
}

export default function LeaderboardView({ onClose, gameOverStats }: LeaderboardViewProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>(
    gameOverStats ? 'alltime' : 'daily'
  );
  const [metric, setMetric] = useState<MetricType>('score');
  const [playerName, setPlayerNameState] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [dailyStreak, setDailyStreak] = useState<DailyStreak | null>(null);
  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntry[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  // Game over state
  const [newPlayerName, setNewPlayerName] = useState('');
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);

  const handleClearLeaderboard = () => {
    if (confirm('Are you sure you want to clear all leaderboard data? This cannot be undone!')) {
      clearLeaderboard();
      window.location.reload(); // Reload to refresh the data
    }
  };

  useEffect(() => {
    setPlayerNameState(getPlayerName());
    setDailyStreak(getDailyStreak());

    // Add keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close
      if (e.key === 'Escape') {
        onClose();
      }
      // L to toggle between leaderboard tabs
      if (e.key === 'l' || e.key === 'L') {
        const tabs: LeaderboardTab[] = ['daily', 'weekly', 'alltime', 'global', 'personal'];
        const currentIndex = tabs.indexOf(activeTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        setActiveTab(tabs[nextIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, activeTab]);

  useEffect(() => {
    if (activeTab === 'global') {
      setLoadingGlobal(true);
      fetchGlobalLeaderboard('alltime', 100).then((result) => {
        if (result.success && result.entries) {
          setGlobalEntries(result.entries);
        }
        setLoadingGlobal(false);
      });
    }
  }, [activeTab]);

  // Auto-submit score if user is NOT in top 10
  useEffect(() => {
    if (gameOverStats && !hasSubmittedScore) {
      const topScores = getTopScores(10);
      let rank = topScores.findIndex(e => gameOverStats.score > e.score);
      if (rank === -1) {
        rank = topScores.length < 10 ? topScores.length : 10;
      }

      // If not in top 10, auto-submit with existing player name (or "Anonymous")
      if (rank >= 10) {
        const existingName = getPlayerName() || 'Anonymous';
        const entry: LeaderboardEntry = {
          id: `${Date.now()}-${Math.random()}`,
          playerName: existingName,
          score: gameOverStats.score,
          wpm: gameOverStats.wpm,
          peakWpm: gameOverStats.peakWpm,
          accuracy: gameOverStats.accuracy,
          streak: gameOverStats.streak,
          wordsTyped: gameOverStats.wordsTyped,
          duration: gameOverStats.duration,
          survived: gameOverStats.survived,
          date: Date.now(),
          textTitle: gameOverStats.textTitle,
          language: gameOverStats.language,
        };

        addLeaderboardEntry(entry);
        submitToGlobalLeaderboard(entry);
        setHasSubmittedScore(true);
      }
    }
  }, [gameOverStats, hasSubmittedScore]);

  const handleSaveName = () => {
    if (playerName.trim()) {
      savePlayerName(playerName.trim());
      setIsEditingName(false);
    }
  };

  // Handle new high score submission
  const handleNewScoreSubmit = (name: string) => {
    if (!gameOverStats || hasSubmittedScore) return;

    const trimmedName = name.trim().toUpperCase();
    if (trimmedName.length === 0) return;

    const entry: LeaderboardEntry = {
      id: `${Date.now()}-${Math.random()}`,
      playerName: trimmedName,
      score: gameOverStats.score,
      wpm: gameOverStats.wpm,
      peakWpm: gameOverStats.peakWpm,
      accuracy: gameOverStats.accuracy,
      streak: gameOverStats.streak,
      wordsTyped: gameOverStats.wordsTyped,
      duration: gameOverStats.duration,
      survived: gameOverStats.survived,
      date: Date.now(),
      textTitle: gameOverStats.textTitle,
      language: gameOverStats.language,
    };

    addLeaderboardEntry(entry);
    submitToGlobalLeaderboard(entry);

    setHasSubmittedScore(true);
    setNewPlayerName(trimmedName);
    savePlayerName(trimmedName); // Save as default player name
  };

  const getEntries = (): LeaderboardEntry[] => {
    if (activeTab === 'global') return globalEntries;
    if (activeTab === 'daily') return getDailyLeaderboard();
    if (activeTab === 'weekly') return getWeeklyLeaderboard();
    if (activeTab === 'personal') {
      return getLeaderboard()
        .filter(e => e.playerName === playerName)
        .sort((a, b) => b.date - a.date);
    }

    if (metric === 'score') return getTopScores(50);
    if (metric === 'wpm') return getTopWPM(50);
    if (metric === 'streak') return getTopStreaks(50);
    if (metric === 'accuracy') return getTopAccuracy(50);
    return [];
  };

  let entries = getEntries();
  const personalBests = getPersonalBests(playerName);

  // Handle game over state - show user's new score in context
  let userRank: number | null = null;
  let entriesToDisplay: (LeaderboardEntry | 'NEW_SCORE')[] = entries;

  if (gameOverStats && activeTab === 'alltime' && metric === 'score' && !hasSubmittedScore) {
    const topScores = getTopScores(10);

    // Find where the user's score ranks
    userRank = topScores.findIndex(e => gameOverStats.score > e.score);
    if (userRank === -1) {
      // User's score is lower than all top 10, or there are fewer than 10 scores
      if (topScores.length < 10) {
        userRank = topScores.length; // User goes after existing scores
      } else {
        userRank = 10; // User goes in position 11
      }
    }

    if (userRank < 10) {
      // User is in top 10 - insert placeholder in their position
      entriesToDisplay = [
        ...topScores.slice(0, userRank),
        'NEW_SCORE' as const,
        ...topScores.slice(userRank, 10)
      ];
    } else {
      // User is position 11 - show top 10 + user
      entriesToDisplay = [...topScores.slice(0, 10), 'NEW_SCORE' as const];
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)' }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: colors.pencilLight, opacity: 0.3 }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2 heading-text" style={{ color: colors.ink }}>
                Leaderboard
              </h2>
              {isEditingName ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerNameState(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="px-2 py-1 border rounded text-sm"
                    style={{ borderColor: colors.pencilLight }}
                    placeholder="Enter your name"
                    autoFocus
                  />
                  <button onClick={handleSaveName} className="ink-button px-3 py-1 text-xs">
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-sm transition-colors"
                  style={{ color: colors.pencil }}
                >
                  Player: {playerName} ✏️
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-4xl font-bold transition-all hover:scale-110 px-3 py-1 rounded"
              style={{ color: colors.pencil }}
              title="Close (ESC)"
            >
              ×
            </button>
          </div>

          {/* Daily Streak Banner */}
          {dailyStreak && dailyStreak.currentStreak > 0 && (
            <div
              className="border rounded p-3 mb-4"
              style={{
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderColor: colors.error
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <div className="font-bold" style={{ color: colors.ink }}>
                      {dailyStreak.currentStreak} Day Streak!
                    </div>
                    <div className="text-xs" style={{ color: colors.pencil }}>
                      Longest: {dailyStreak.longestStreak} days
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs" style={{ color: colors.pencil }}>
                  Keep playing daily to maintain your streak!
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap mb-3">
            {(['daily', 'weekly', 'alltime', 'global', 'personal'] as LeaderboardTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded text-sm transition-all relative"
                style={{
                  backgroundColor: activeTab === tab ? colors.accent : 'transparent',
                  color: activeTab === tab ? '#fff' : colors.ink,
                  border: `1px solid ${activeTab === tab ? colors.accent : colors.pencilLight}`
                }}
              >
                {tab === 'daily' && 'Today'}
                {tab === 'weekly' && 'This Week'}
                {tab === 'alltime' && 'All Time'}
                {tab === 'global' && 'Global'}
                {tab === 'personal' && 'My Games'}
                {activeTab === tab && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: '#fff' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Metric Selector */}
          {activeTab === 'alltime' && (
            <div className="flex gap-2 flex-wrap text-xs">
              {(['score', 'wpm', 'streak', 'accuracy'] as MetricType[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className="px-3 py-1 rounded transition-all"
                  style={{
                    backgroundColor: metric === m ? colors.accentFaded : 'transparent',
                    color: metric === m ? colors.accent : colors.pencil,
                    border: `1px solid ${metric === m ? colors.accent : 'transparent'}`
                  }}
                >
                  {m === 'score' && 'Score'}
                  {m === 'wpm' && 'WPM'}
                  {m === 'streak' && 'Streak'}
                  {m === 'accuracy' && 'Accuracy'}
                </button>
              ))}
            </div>
          )}

          {/* Personal Bests */}
          {activeTab === 'personal' && personalBests.totalGamesPlayed > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
              {[
                { label: 'High Score', value: personalBests.highestScore.toLocaleString() },
                { label: 'Best WPM', value: Math.round(personalBests.bestWPM) },
                { label: 'Best Streak', value: `${personalBests.longestStreak} 🔥` },
                { label: 'Best Accuracy', value: `${personalBests.bestAccuracy.toFixed(1)}%` },
                { label: 'Games Played', value: personalBests.totalGamesPlayed },
                { label: 'Total Words', value: personalBests.totalWordsTyped.toLocaleString() },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="rounded border p-2 text-center"
                  style={{
                    backgroundColor: colors.paperDark,
                    borderColor: colors.pencilLight
                  }}
                >
                  <div className="text-xs" style={{ color: colors.pencil }}>{stat.label}</div>
                  <div className="font-bold" style={{ color: colors.ink }}>{stat.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingGlobal ? (
            <div className="text-center py-12" style={{ color: colors.pencil }}>
              <div className="text-4xl mb-3">🌍</div>
              <div>Loading global leaderboard...</div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12" style={{ color: colors.pencil }}>
              <div className="text-4xl mb-3">🎮</div>
              <div className="mb-2">No games yet!</div>
              <div className="text-sm">
                {activeTab === 'global'
                  ? 'No global scores yet'
                  : 'Start playing to see your scores here'}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {entriesToDisplay.map((entry, index) => {
                // Handle new score entry
                if (entry === 'NEW_SCORE' && gameOverStats) {
                  // Check if user is in top 10 or not
                  const isTop10 = userRank !== null && userRank < 10;

                  if (!isTop10) {
                    // User is NOT in top 10 - just show score without name input
                    return (
                      <div
                        key="new-score"
                        className="flex items-center gap-3 p-4 rounded border transition-all"
                        style={{
                          backgroundColor: colors.accent,
                          borderColor: colors.accent,
                          boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
                        }}
                      >
                        <div
                          className="text-sm font-bold w-8 text-center flex-shrink-0 margin-text"
                          style={{ color: '#fff' }}
                        >
                          {index + 1}.
                        </div>

                        <div className="flex-1">
                          <div className="font-bold text-lg mb-1" style={{ color: '#fff' }}>
                            YOUR SCORE
                          </div>
                          <div className="text-sm" style={{ color: '#fff', opacity: 0.9 }}>
                            Position #{index + 1} • Not in Top 10
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="text-right">
                            <div className="text-xs" style={{ color: '#fff', opacity: 0.8 }}>Score</div>
                            <div className="font-bold text-lg" style={{ color: '#fff' }}>
                              {gameOverStats.score.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs" style={{ color: '#fff', opacity: 0.8 }}>WPM</div>
                            <div className="font-bold" style={{ color: '#fff' }}>
                              {Math.round(gameOverStats.wpm)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs" style={{ color: '#fff', opacity: 0.8 }}>Streak</div>
                            <div className="font-bold" style={{ color: '#fff' }}>
                              {gameOverStats.streak} 🔥
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs" style={{ color: '#fff', opacity: 0.8 }}>Accuracy</div>
                            <div className="font-bold" style={{ color: '#fff' }}>
                              {Math.round(gameOverStats.accuracy)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // User IS in top 10 - show name input
                  return (
                    <div
                      key="new-score"
                      className="flex items-center gap-3 p-3 rounded border transition-all animate-pulse"
                      style={{
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                        boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
                      }}
                    >
                      <div
                        className="text-sm font-bold w-8 text-center flex-shrink-0 margin-text"
                        style={{ color: '#fff' }}
                      >
                        {index + 1}.
                      </div>

                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={newPlayerName}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                            if (value.length <= 5) {
                              setNewPlayerName(value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newPlayerName.length > 0) {
                              handleNewScoreSubmit(newPlayerName);
                            }
                          }}
                          maxLength={5}
                          placeholder="NAME?"
                          autoFocus
                          className="w-full px-3 py-1 text-lg font-bold uppercase bg-white rounded border-2 focus:outline-none text-center"
                          style={{
                            fontFamily: '"Courier New", monospace',
                            color: colors.ink,
                            borderColor: '#fff',
                            letterSpacing: '0.3em',
                            maxWidth: '200px'
                          }}
                        />
                        <div className="text-xs mt-1" style={{ color: '#fff', opacity: 0.9 }}>
                          {gameOverStats.textTitle} · Just now
                        </div>
                      </div>

                      <div className="flex gap-4 text-sm flex-shrink-0 margin-text">
                        <div className="text-right">
                          <div className="text-xs" style={{ color: '#fff', opacity: 0.8 }}>Score</div>
                          <div className="font-bold" style={{ color: '#fff' }}>
                            {gameOverStats.score.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs" style={{ color: '#fff', opacity: 0.8 }}>WPM</div>
                          <div className="font-bold" style={{ color: '#fff' }}>
                            {Math.round(gameOverStats.wpm)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs" style={{ color: '#fff', opacity: 0.8 }}>Streak</div>
                          <div className="font-bold" style={{ color: '#fff' }}>
                            {gameOverStats.streak} 🔥
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Regular entry
                if (entry !== 'NEW_SCORE') {
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-3 rounded border transition-all"
                      style={{
                        backgroundColor: entry.playerName === playerName ? colors.accentFaded : '#fff',
                        borderColor: entry.playerName === playerName ? colors.accent : colors.pencilLight
                      }}
                    >
                      <div
                        className="text-sm font-bold w-8 text-center flex-shrink-0 margin-text"
                        style={{ color: colors.pencil }}
                      >
                        {index + 1}.
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold truncate" style={{ color: colors.ink }}>
                            {entry.playerName}
                          </span>
                          {entry.survived && <span className="text-xs">✅</span>}
                          {entry.language === 'he' && <span className="text-xs">🇮🇱</span>}
                        </div>
                        <div className="text-xs truncate" style={{ color: colors.pencil }}>
                          {entry.textTitle} · {formatDate(entry.date)}
                        </div>
                      </div>

                      <div className="flex gap-4 text-sm flex-shrink-0 margin-text">
                        <div className="text-right">
                          <div className="text-xs" style={{ color: colors.pencil }}>Score</div>
                          <div className="font-bold" style={{ color: colors.ink }}>
                            {entry.score.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs" style={{ color: colors.pencil }}>WPM</div>
                          <div className="font-bold" style={{ color: colors.ink }}>
                            {Math.round(entry.wpm)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs" style={{ color: colors.pencil }}>Streak</div>
                          <div className="font-bold" style={{ color: colors.ink }}>
                            {entry.streak} 🔥
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t text-center text-xs flex items-center justify-between"
          style={{ borderColor: colors.pencilLight, color: colors.pencil }}
        >
          <div className="opacity-60">
            {entries.length > 0 && `Showing ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
          </div>
          <div className="flex gap-2 items-center">
            <span className="opacity-60 text-xs">Hotkeys: ESC (close), L (switch tabs)</span>
            <button
              onClick={handleClearLeaderboard}
              className="px-3 py-1 rounded text-xs transition-all hover:scale-105"
              style={{
                backgroundColor: colors.error,
                color: '#fff',
              }}
              title="Clear all leaderboard data"
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
