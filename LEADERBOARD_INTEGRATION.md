# Leaderboard Integration Guide

## What's Been Built

I've created a comprehensive leaderboard system with:

### Database Features (`src/lib/storage.ts`)
- ✅ **LeaderboardEntry** - Stores score, WPM, accuracy, streak, and more
- ✅ **Daily Streak Tracking** - Tracks consecutive days playing
- ✅ **Multiple Leaderboards** - Daily, Weekly, All-time, Personal
- ✅ **Multiple Metrics** - High Scores, Best WPM, Longest Streaks, Best Accuracy
- ✅ **Personal Bests** - Track individual player achievements
- ✅ **Player Names** - Customizable player identification

### UI Component (`src/components/LeaderboardView.tsx`)
- ✅ Beautiful modal with tabs and filtering
- ✅ Medal rankings (🥇🥈🥉)
- ✅ Daily streak display with fire emoji
- ✅ Personal best statistics grid
- ✅ Editable player names
- ✅ Responsive design

## How to Integrate

### Step 1: Import the Functions

Add these imports to `src/components/TypingView.tsx`:

```typescript
import {
  addLeaderboardEntry,
  updateDailyStreak,
  getPlayerName
} from '@/lib/storage';
import LeaderboardView from './LeaderboardView';
```

### Step 2: Add Leaderboard State

Add this state near the top of the TypingView component (around line 100):

```typescript
const [showLeaderboard, setShowLeaderboard] = useState(false);
```

### Step 3: Update Daily Streak on Game Start

When the user starts typing (around line 840 where `monsterStarted` is set to true), add:

```typescript
// Update daily streak when starting a game
useEffect(() => {
  if (monsterStarted) {
    updateDailyStreak();
  }
}, [monsterStarted]);
```

### Step 4: Save Score When Game Ends

When `isGameOver` is set to true (around line 525) or when the game completes (`isComplete`), save the entry.

Add this useEffect around line 600:

```typescript
// Save to leaderboard when game ends
useEffect(() => {
  if ((isGameOver || isComplete) && wordsTyped > 0) {
    const accuracy = totalKeystrokes > 0
      ? (correctKeystrokes / totalKeystrokes) * 100
      : 0;

    addLeaderboardEntry({
      playerName: getPlayerName(),
      date: Date.now(),
      score: gameScore,
      wordsTyped: wordsTyped,
      wpm: averageWPM,
      peakWpm: peakWPM,
      accuracy: accuracy,
      streak: bestStreak,
      textTitle: selectedText?.title || 'Custom Text',
      duration: totalTime,
      survived: isComplete && !isGameOver,
      language: isRTL ? 'he' : 'en',
    });
  }
}, [isGameOver, isComplete]);
```

### Step 5: Add Leaderboard Button

Add a button to open the leaderboard in the settings menu (around line 1460):

```tsx
{/* Leaderboard Button */}
<button
  onClick={() => setShowLeaderboard(true)}
  className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors"
>
  <span className="text-sm">🏆 View Leaderboard</span>
</button>
```

### Step 6: Render the Leaderboard Modal

At the end of the component's return statement (around line 2000), add:

```tsx
{/* Leaderboard Modal */}
{showLeaderboard && (
  <LeaderboardView onClose={() => setShowLeaderboard(false)} />
)}
```

### Step 7: Show Leaderboard After Game Ends

In the Game Over overlay (around line 1912), you can add a button to view the leaderboard:

```tsx
<button
  onClick={() => setShowLeaderboard(true)}
  className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
>
  🏆 View Leaderboard
</button>
```

## Quick Test

To test the leaderboard system immediately:

1. Open your browser's console
2. Run these commands:

```javascript
// Set a player name
localStorage.setItem('typeread_player_name', 'Test Player');

// Add a fake entry
const entry = {
  id: Date.now().toString(),
  playerName: 'Test Player',
  date: Date.now(),
  score: 5000,
  wordsTyped: 100,
  wpm: 65,
  peakWpm: 80,
  accuracy: 95.5,
  streak: 25,
  textTitle: 'Sample Story',
  duration: 180000,
  survived: true,
  language: 'en'
};

const existing = JSON.parse(localStorage.getItem('typeread_leaderboard') || '[]');
existing.push(entry);
localStorage.setItem('typeread_leaderboard', JSON.stringify(existing));

// Add daily streak
localStorage.setItem('typeread_daily_streak', JSON.stringify({
  currentStreak: 5,
  longestStreak: 10,
  lastPlayedDate: new Date().toISOString().split('T')[0],
  streakHistory: []
}));
```

Then click the leaderboard button to see your test data!

## Features Ready to Use

✅ **Multiple Leaderboard Views**
- Daily (today's games)
- Weekly (last 7 days)
- All-time (with metric filtering)
- Personal (all your games)

✅ **Daily Streak System**
- Automatically tracks consecutive days
- Shows current and longest streaks
- Visual streak banner

✅ **Personal Bests**
- High score
- Best WPM
- Longest streak
- Best accuracy
- Total games played
- Total words typed

✅ **Smart Ranking**
- Medal emojis for top 3
- Highlights your own entries
- Shows survival status (completed without getting caught)
- Shows language (Hebrew flag for Hebrew texts)

## Next Steps (Optional Enhancements)

1. **Export/Import** - Add buttons to export leaderboard data as JSON
2. **Clear Data** - Add a "Clear Leaderboard" option in settings
3. **Filters** - Filter by language, text, or date range
4. **Charts** - Add progress charts over time
5. **Sharing** - Generate shareable achievement images
6. **Online Sync** - Use a backend to share scores across devices

Let me know when you're ready to implement this, or if you'd like me to add the integration automatically!
