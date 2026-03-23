import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes
// For production, use a proper database like Vercel Postgres, Supabase, or MongoDB
let globalLeaderboard: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'daily';
    const limit = parseInt(searchParams.get('limit') || '50');

    let filteredEntries = [...globalLeaderboard];

    // Filter by time period
    if (type === 'daily') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();
      filteredEntries = filteredEntries.filter(e => e.date >= todayTimestamp);
    } else if (type === 'weekly') {
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      filteredEntries = filteredEntries.filter(e => e.date >= weekAgo);
    }

    // Sort by score
    filteredEntries.sort((a, b) => b.score - a.score);

    // Limit results
    const results = filteredEntries.slice(0, limit);

    return NextResponse.json({
      success: true,
      entries: results,
      total: filteredEntries.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate entry
    if (!body.playerName || !body.score || !body.wpm) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create entry with server timestamp
    const entry = {
      ...body,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      date: Date.now(), // Use server time to prevent cheating
      verified: true, // Mark as verified by server
    };

    // Add to global leaderboard
    globalLeaderboard.push(entry);

    // Keep only last 10,000 entries to prevent memory issues
    if (globalLeaderboard.length > 10000) {
      globalLeaderboard.sort((a, b) => b.date - a.date);
      globalLeaderboard = globalLeaderboard.slice(0, 10000);
    }

    return NextResponse.json({
      success: true,
      entry,
      rank: calculateRank(entry.score)
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to save entry' },
      { status: 500 }
    );
  }
}

function calculateRank(score: number): number {
  return globalLeaderboard.filter(e => e.score > score).length + 1;
}
