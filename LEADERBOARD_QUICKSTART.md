# 🎮 Leaderboard System - Quick Start

## ✅ Integration Complete!

Your typing game now has a **fully functional leaderboard system**!

## 🚀 What Was Added

### 1. **Database Layer** (`src/lib/storage.ts`)
- ✅ Local leaderboard storage
- ✅ Daily streak tracking (Duolingo-style 🔥)
- ✅ Player name management
- ✅ Multiple leaderboard views

### 2. **API Backend** (`src/app/api/leaderboard/route.ts`)
- ✅ Vercel Edge Function for global leaderboard
- ✅ GET endpoint to fetch scores
- ✅ POST endpoint to submit scores
- ✅ Supports daily/weekly/alltime filtering

### 3. **UI Component** (`src/components/LeaderboardView.tsx`)
- ✅ Beautiful modal with 5 tabs:
  - 📅 **Today** - Today's high scores
  - 📊 **This Week** - Last 7 days
  - ⭐ **All Time** - Best ever (Score/WPM/Streak/Accuracy)
  - 🌍 **Global** - Online leaderboard
  - 👤 **My Games** - Personal history
- ✅ Medal rankings (🥇🥈🥉)
- ✅ Daily streak display
- ✅ Personal bests statistics

### 4. **Integration** (`src/components/TypingView.tsx`)
- ✅ Auto-saves scores when games end
- ✅ Auto-submits to global leaderboard
- ✅ Updates daily streak on game start
- ✅ Button in settings menu
- ✅ Button on Game Over screen

## 🎯 How to Use

### Start Development Server

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000`

### Test the Leaderboard

1. **Play a game** - Type through a story with monster mode on
2. **Complete or get caught** - Your score will auto-save
3. **Open leaderboard**:
   - Click ⚙️ (settings) → "🏆 Leaderboard"
   - OR click "🏆 View Leaderboard" on Game Over screen

4. **Check different tabs**:
   - See today's scores
   - View weekly rankings
   - Check your personal bests
   - See global competition

### Set Your Player Name

1. Open leaderboard
2. Click "Player: Player ✏️" at the top
3. Type your name and click "Save"

### Build Your Streak

Play at least once every day to build your daily streak! The current streak displays in a special banner with a 🔥 emoji.

## 📊 Features Overview

### Local Leaderboard Features
- ✅ Stores up to 1000 entries in browser
- ✅ Never loses data (unless you clear browser storage)
- ✅ Filter by time period (daily/weekly/all-time)
- ✅ Filter by metric (score/wpm/streak/accuracy)
- ✅ Personal game history
- ✅ Personal best tracking
- ✅ Daily streak counter

### Global Leaderboard Features
- ✅ Compete with all players worldwide
- ✅ Auto-submission on game end
- ✅ Real-time rankings
- ✅ Currently uses in-memory storage (resets on deployment)
- 🔜 **To enable persistence**: Set up Vercel Postgres (see LEADERBOARD_SETUP.md)

## 🗄️ Current Storage

### Local (Browser)
- **Location**: Browser localStorage
- **Keys**:
  - `typeread_leaderboard` - All scores (max 1000)
  - `typeread_daily_streak` - Streak data
  - `typeread_player_name` - Your name
- **Persistence**: Permanent (unless cleared)

### Global (Online)
- **Location**: Vercel Edge Function (in-memory)
- **Persistence**: Temporary (resets on deployment)
- **Max entries**: 10,000
- **To make persistent**: Follow database setup in LEADERBOARD_SETUP.md

## 🔧 Next Steps (Optional)

### Make Global Leaderboard Persistent

The global leaderboard currently uses in-memory storage. For production:

**Option 1: Vercel Postgres (Easiest)**
```bash
# Install
npm install @vercel/postgres

# Create database through Vercel dashboard
# Then update src/app/api/leaderboard/route.ts
```

**Option 2: Supabase (Free tier available)**
```bash
npm install @supabase/supabase-js
```

**Option 3: MongoDB Atlas (Flexible)**
```bash
npm install mongodb
```

See `LEADERBOARD_SETUP.md` for detailed instructions.

## 📝 API Endpoints

### GET `/api/leaderboard`
Fetch leaderboard entries

**Query params:**
- `type`: "daily" | "weekly" | "alltime" (default: "alltime")
- `limit`: number (default: 50)

**Example:**
```
GET /api/leaderboard?type=daily&limit=10
```

### POST `/api/leaderboard`
Submit new score

**Body:**
```json
{
  "playerName": "YourName",
  "score": 5000,
  "wpm": 65,
  "peakWpm": 80,
  "accuracy": 95.5,
  "streak": 25,
  "wordsTyped": 100,
  "textTitle": "Story Title",
  "duration": 180000,
  "survived": true,
  "language": "en"
}
```

## 🧪 Testing

### Test with Fake Data

Open browser console and run:

```javascript
// Add 10 random test scores
for (let i = 0; i < 10; i++) {
  const entry = {
    id: Date.now() + '-' + i,
    playerName: `Player ${i+1}`,
    date: Date.now() - (i * 3600000), // Spread over hours
    score: Math.floor(Math.random() * 10000),
    wordsTyped: Math.floor(Math.random() * 500),
    wpm: 40 + Math.floor(Math.random() * 60),
    peakWpm: 50 + Math.floor(Math.random() * 70),
    accuracy: 85 + Math.random() * 15,
    streak: Math.floor(Math.random() * 50),
    textTitle: 'Test Story',
    duration: Math.floor(Math.random() * 300000),
    survived: Math.random() > 0.5,
    language: 'en'
  };

  const existing = JSON.parse(localStorage.getItem('typeread_leaderboard') || '[]');
  existing.push(entry);
  localStorage.setItem('typeread_leaderboard', JSON.stringify(existing));
}

// Set a streak
localStorage.setItem('typeread_daily_streak', JSON.stringify({
  currentStreak: 7,
  longestStreak: 15,
  lastPlayedDate: new Date().toISOString().split('T')[0],
  streakHistory: []
}));

// Reload page to see changes
location.reload();
```

### Clear Test Data

```javascript
localStorage.removeItem('typeread_leaderboard');
localStorage.removeItem('typeread_daily_streak');
location.reload();
```

## 🐛 Troubleshooting

### Leaderboard is empty
- Play at least one complete game first
- Check browser console for errors
- Try adding test data (see above)

### Global tab shows "No games yet"
- The global leaderboard is empty until someone submits a score
- Try playing a game to submit the first score
- In development, data is temporary (resets when you restart server)

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Restart your dev server

### Changes not showing
- Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
- Clear browser cache
- Check for JavaScript errors in console

## 📚 Additional Resources

- **Full Setup Guide**: See `LEADERBOARD_SETUP.md`
- **Integration Details**: See `LEADERBOARD_INTEGRATION.md`
- **Code Locations**:
  - UI: `src/components/LeaderboardView.tsx`
  - DB: `src/lib/storage.ts`
  - API: `src/app/api/leaderboard/route.ts`
  - Integration: `src/components/TypingView.tsx`

## 🎉 That's It!

You're all set! The leaderboard is fully integrated and ready to use.

**Try it now:**
1. Start dev server: `npm run dev`
2. Play a game
3. Click ⚙️ → 🏆 Leaderboard
4. See your score!

Enjoy! 🚀
