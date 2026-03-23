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
  setPlayerName,
  type LeaderboardEntry,
  type DailyStreak,
} from '@/lib/storage';
import { fetchGlobalLeaderboard, submitToGlobalLeaderboard } from '@/lib/api';

type LeaderboardTab = 'daily' | 'weekly' | 'alltime' | 'personal' | 'global';
type MetricType = 'score' | 'wpm' | 'streak' | 'accuracy';

export default function LeaderboardView({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('daily');
  const [metric, setMetric] = useState<MetricType>('score');
  const [playerName, setPlayerNameState] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [dailyStreak, setDailyStreak] = useState<DailyStreak | null>(null);
  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntry[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  useEffect(() => {
    setPlayerNameState(getPlayerName());
    setDailyStreak(getDailyStreak());
  }, []);

  // Fetch global leaderboard when global tab is selected
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

  const handleSaveName = () => {
    if (playerName.trim()) {
      setPlayerName(playerName.trim());
      setIsEditingName(false);
    }
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

    // All-time by metric
    if (metric === 'score') return getTopScores(50);
    if (metric === 'wpm') return getTopWPM(50);
    if (metric === 'streak') return getTopStreaks(50);
    if (metric === 'accuracy') return getTopAccuracy(50);
    return [];
  };

  const entries = getEntries();
  const personalBests = getPersonalBests(playerName);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  const getMetricValue = (entry: LeaderboardEntry) => {
    if (metric === 'score') return entry.score.toLocaleString();
    if (metric === 'wpm') return `${Math.round(entry.wpm)} WPM`;
    if (metric === 'streak') return `${entry.streak} 🔥`;
    if (metric === 'accuracy') return `${entry.accuracy.toFixed(1)}%`;
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] border border-[var(--foreground)]/20 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--foreground)]/10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">🏆 Leaderboard</h2>
              {isEditingName ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerNameState(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="px-2 py-1 border border-[var(--foreground)]/20 rounded text-sm"
                    placeholder="Enter your name"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Player: {playerName} ✏️
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-2xl text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              ×
            </button>
          </div>

          {/* Daily Streak Banner */}
          {dailyStreak && dailyStreak.currentStreak > 0 && (
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔥</span>
                  <div>
                    <div className="font-bold text-lg">{dailyStreak.currentStreak} Day Streak!</div>
                    <div className="text-xs text-[var(--muted)]">
                      Longest: {dailyStreak.longestStreak} days
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-[var(--muted)]">
                  Keep playing daily to maintain your streak!
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['daily', 'weekly', 'alltime', 'global', 'personal'] as LeaderboardTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-500 text-white'
                    : 'bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10'
                }`}
              >
                {tab === 'daily' && '📅 Today'}
                {tab === 'weekly' && '📊 This Week'}
                {tab === 'alltime' && '⭐ All Time'}
                {tab === 'global' && '🌍 Global'}
                {tab === 'personal' && '👤 My Games'}
              </button>
            ))}
          </div>

          {/* Metric Selector (for all-time) */}
          {activeTab === 'alltime' && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {(['score', 'wpm', 'streak', 'accuracy'] as MetricType[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    metric === m
                      ? 'bg-green-500 text-white'
                      : 'bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10'
                  }`}
                >
                  {m === 'score' && '💯 High Scores'}
                  {m === 'wpm' && '⚡ Fastest WPM'}
                  {m === 'streak' && '🔥 Best Streaks'}
                  {m === 'accuracy' && '🎯 Best Accuracy'}
                </button>
              ))}
            </div>
          )}

          {/* Personal Bests */}
          {activeTab === 'personal' && personalBests.totalGamesPlayed > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
              <div className="bg-[var(--foreground)]/5 rounded p-2 text-center">
                <div className="text-xs text-[var(--muted)]">High Score</div>
                <div className="font-bold text-lg">{personalBests.highestScore.toLocaleString()}</div>
              </div>
              <div className="bg-[var(--foreground)]/5 rounded p-2 text-center">
                <div className="text-xs text-[var(--muted)]">Best WPM</div>
                <div className="font-bold text-lg">{Math.round(personalBests.bestWPM)}</div>
              </div>
              <div className="bg-[var(--foreground)]/5 rounded p-2 text-center">
                <div className="text-xs text-[var(--muted)]">Best Streak</div>
                <div className="font-bold text-lg">{personalBests.longestStreak} 🔥</div>
              </div>
              <div className="bg-[var(--foreground)]/5 rounded p-2 text-center">
                <div className="text-xs text-[var(--muted)]">Best Accuracy</div>
                <div className="font-bold text-lg">{personalBests.bestAccuracy.toFixed(1)}%</div>
              </div>
              <div className="bg-[var(--foreground)]/5 rounded p-2 text-center">
                <div className="text-xs text-[var(--muted)]">Games Played</div>
                <div className="font-bold text-lg">{personalBests.totalGamesPlayed}</div>
              </div>
              <div className="bg-[var(--foreground)]/5 rounded p-2 text-center">
                <div className="text-xs text-[var(--muted)]">Total Words</div>
                <div className="font-bold text-lg">{personalBests.totalWordsTyped.toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingGlobal ? (
            <div className="text-center py-12 text-[var(--muted)]">
              <div className="text-4xl mb-3 animate-pulse">🌍</div>
              <div className="text-lg mb-2">Loading global leaderboard...</div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted)]">
              <div className="text-4xl mb-3">🎮</div>
              <div className="text-lg mb-2">No games yet!</div>
              <div className="text-sm">
                {activeTab === 'global'
                  ? 'No global scores yet. Be the first!'
                  : 'Start playing to see your scores here.'}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    entry.playerName === playerName
                      ? 'bg-blue-500/10 border border-blue-500/30'
                      : 'bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10'
                  }`}
                >
                  {/* Rank */}
                  <div className="text-lg font-bold w-12 text-center flex-shrink-0">
                    {getMedalEmoji(index + 1)}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{entry.playerName}</span>
                      {entry.survived && <span className="text-xs">✅</span>}
                      {entry.language === 'he' && <span className="text-xs">🇮🇱</span>}
                    </div>
                    <div className="text-xs text-[var(--muted)] truncate">
                      {entry.textTitle} • {formatDate(entry.date)}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-sm flex-shrink-0">
                    {activeTab === 'personal' || activeTab === 'daily' || activeTab === 'weekly' ? (
                      <>
                        <div className="text-center">
                          <div className="text-xs text-[var(--muted)]">Score</div>
                          <div className="font-bold">{entry.score.toLocaleString()}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-[var(--muted)]">WPM</div>
                          <div className="font-bold">{Math.round(entry.wpm)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-[var(--muted)]">Streak</div>
                          <div className="font-bold">{entry.streak} 🔥</div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center min-w-[100px]">
                        <div className="text-xs text-[var(--muted)]">
                          {metric === 'score' && 'Score'}
                          {metric === 'wpm' && 'Speed'}
                          {metric === 'streak' && 'Streak'}
                          {metric === 'accuracy' && 'Accuracy'}
                        </div>
                        <div className="font-bold text-lg">{getMetricValue(entry)}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--foreground)]/10 text-center text-xs text-[var(--muted)]">
          {entries.length > 0 && `Showing ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
        </div>
      </div>
    </div>
  );
}
