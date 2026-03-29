import { LeaderboardEntry } from './storage';

export async function extractTextFromUrl(url: string): Promise<{
  title?: string;
  content?: string;
  error?: string;
}> {
  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || 'Failed to extract text from URL',
      };
    }

    return data;
  } catch (error) {
    return {
      error: 'Failed to extract text from URL',
    };
  }
}

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
