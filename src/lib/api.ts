import { LeaderboardEntry } from './storage';

export async function submitToGlobalLeaderboard(entry: Omit<LeaderboardEntry, 'id'>): Promise<{
  success: boolean;
  rank?: number;
  error?: string;
}> {
  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Failed to submit score',
    };
  }
}

export async function fetchGlobalLeaderboard(
  type: 'daily' | 'weekly' | 'alltime' = 'alltime',
  limit: number = 50
): Promise<{
  success: boolean;
  entries?: LeaderboardEntry[];
  total?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/leaderboard?type=${type}&limit=${limit}`);
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch leaderboard',
    };
  }
}
