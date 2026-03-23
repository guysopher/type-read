# 🏆 Leaderboard System - Complete Setup

Your typing game now has a **complete leaderboard system** with both local and global (online) leaderboards!

## ✅ What's Been Integrated

### 1. **Local Leaderboard** (Already Working!)
- Saves all game sessions to browser localStorage
- Tracks: Score, WPM, Accuracy, Streaks, Duration
- Multiple views: Daily, Weekly, All-Time, Personal
- Personal best statistics
- Daily streak tracking (like Duolingo! 🔥)

### 2. **Global Leaderboard** (Vercel API)
- Online leaderboard shared across all players
- Automatic submission when games end
- Hosted on Vercel Edge Functions
- Real-time rankings

### 3. **UI Integration**
- ✅ Leaderboard button in settings menu
- ✅ Leaderboard button on Game Over screen
- ✅ Beautiful modal with tabs
- ✅ Daily streak banner
- ✅ Personal bests grid
- ✅ Medal rankings (🥇🥈🥉)

## 🚀 How to Use

### For Players

1. **Open Leaderboard**: Click the gear icon ⚙️ → "🏆 Leaderboard"

2. **View Different Tabs**:
   - **📅 Today**: Today's high scores
   - **📊 This Week**: Last 7 days
   - **⭐ All Time**: Filter by Score, WPM, Streak, or Accuracy
   - **🌍 Global**: Compete with everyone online!
   - **👤 My Games**: Your personal game history

3. **Set Your Name**: Click "Player: ..." to edit your display name

4. **Track Your Streak**: Keep playing daily to build your 🔥 streak!

### For Developers

## 📦 Files Created/Modified

### New Files:
- `src/components/LeaderboardView.tsx` - UI component
- `src/app/api/leaderboard/route.ts` - Vercel API endpoint
- `src/lib/api.ts` - API helper functions
- `LEADERBOARD_INTEGRATION.md` - Integration guide
- `LEADERBOARD_SETUP.md` - This file

### Modified Files:
- `src/lib/storage.ts` - Added leaderboard database functions
- `src/components/TypingView.tsx` - Integrated leaderboard

## 🗄️ Database Structure

### Local Storage (Browser)
```typescript
interface LeaderboardEntry {
  id: string;
  playerName: string;
  date: number;
  score: number;
  wordsTyped: number;
  wpm: number;
  peakWpm: number;
  accuracy: number;
  streak: number;
  textTitle: string;
  duration: number;
  survived: boolean;
  language: 'en' | 'he';
}
```

### LocalStorage Keys:
- `typeread_leaderboard` - Array of all entries (max 1000)
- `typeread_daily_streak` - Daily streak data
- `typeread_player_name` - Player's display name

## 🌐 Upgrading to Production Database

The current API uses **in-memory storage** which resets on deployment. For production, integrate a real database:

### Option 1: Vercel Postgres (Recommended)

```bash
# Install Vercel Postgres
npm install @vercel/postgres

# Link your Vercel project
vercel link

# Create database
vercel storage create kv
```

Update `src/app/api/leaderboard/route.ts`:
```typescript
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await sql`
    INSERT INTO leaderboard (
      player_name, score, wpm, peak_wpm, accuracy,
      streak, words_typed, text_title, duration,
      survived, language, created_at
    ) VALUES (
      ${body.playerName}, ${body.score}, ${body.wpm},
      ${body.peakWpm}, ${body.accuracy}, ${body.streak},
      ${body.wordsTyped}, ${body.textTitle}, ${body.duration},
      ${body.survived}, ${body.language}, NOW()
    )
    RETURNING *
  `;

  return NextResponse.json({ success: true, entry: result.rows[0] });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'daily';
  const limit = parseInt(searchParams.get('limit') || '50');

  let query = 'SELECT * FROM leaderboard';

  if (type === 'daily') {
    query += ' WHERE created_at >= CURRENT_DATE';
  } else if (type === 'weekly') {
    query += ' WHERE created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
  }

  query += ' ORDER BY score DESC LIMIT $1';

  const result = await sql.query(query, [limit]);

  return NextResponse.json({
    success: true,
    entries: result.rows,
    total: result.rowCount
  });
}
```

Create table schema:
```sql
CREATE TABLE leaderboard (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  wpm DECIMAL(5,2) NOT NULL,
  peak_wpm DECIMAL(5,2) NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  streak INTEGER NOT NULL,
  words_typed INTEGER NOT NULL,
  text_title VARCHAR(200) NOT NULL,
  duration INTEGER NOT NULL,
  survived BOOLEAN NOT NULL,
  language VARCHAR(2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_score (score DESC),
  INDEX idx_created_at (created_at DESC)
);
```

### Option 2: Supabase

```bash
npm install @supabase/supabase-js
```

Update API route:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from('leaderboard')
    .insert([body])
    .select();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, entry: data[0] });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'daily';
  const limit = parseInt(searchParams.get('limit') || '50');

  let query = supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit);

  if (type === 'daily') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query = query.gte('created_at', today.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, entries: data, total: data.length });
}
```

### Option 3: MongoDB Atlas

```bash
npm install mongodb
```

## 🔒 Security Considerations

### Anti-Cheating Measures

Add to `src/app/api/leaderboard/route.ts`:

```typescript
// Validate scores are realistic
function validateEntry(entry: any): boolean {
  // WPM should be reasonable (world record is ~216)
  if (entry.wpm > 250) return false;

  // Accuracy should be 0-100
  if (entry.accuracy < 0 || entry.accuracy > 100) return false;

  // Score should correlate with words typed
  const maxScore = entry.wordsTyped * 50; // Generous max
  if (entry.score > maxScore) return false;

  return true;
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!validateEntry(body)) {
    return NextResponse.json(
      { success: false, error: 'Invalid entry detected' },
      { status: 400 }
    );
  }

  // ... rest of code
}
```

### Rate Limiting

```typescript
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown';

  const { success } = await rateLimit(ip);
  if (!success) {
    return NextResponse.json(
      { success: false, error: 'Too many submissions' },
      { status: 429 }
    );
  }

  // ... rest of code
}
```

## 🎨 Customization

### Change Leaderboard Colors

Edit `src/components/LeaderboardView.tsx`:

```typescript
// Medal colors
const getMedalClass = (rank: number) => {
  if (rank === 1) return 'bg-yellow-500/20 border-yellow-500/30'; // Gold
  if (rank === 2) return 'bg-gray-400/20 border-gray-400/30'; // Silver
  if (rank === 3) return 'bg-orange-600/20 border-orange-600/30'; // Bronze
  return 'bg-[var(--foreground)]/5';
};
```

### Add More Metrics

In `src/lib/storage.ts`:

```typescript
export interface LeaderboardEntry {
  // ... existing fields
  averageAccuracy: number; // NEW
  longestSessionTime: number; // NEW
  totalPauses: number; // NEW
}
```

## 📊 Analytics & Insights

Add analytics to track leaderboard usage:

```typescript
// In LeaderboardView.tsx
useEffect(() => {
  // Track which tab users view most
  analytics.track('leaderboard_tab_viewed', {
    tab: activeTab,
    playerName: playerName
  });
}, [activeTab]);
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect to GitHub for auto-deploys
```

### Environment Variables

For production database, add to Vercel:

```
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

## 🧪 Testing

### Test Local Leaderboard

Open browser console:

```javascript
// Add test entries
for (let i = 0; i < 10; i++) {
  const entry = {
    playerName: `Player ${i}`,
    date: Date.now() - (i * 1000000),
    score: Math.floor(Math.random() * 10000),
    wordsTyped: Math.floor(Math.random() * 500),
    wpm: Math.floor(Math.random() * 100),
    peakWpm: Math.floor(Math.random() * 120),
    accuracy: 90 + Math.random() * 10,
    streak: Math.floor(Math.random() * 50),
    textTitle: 'Test Story',
    duration: Math.floor(Math.random() * 300000),
    survived: Math.random() > 0.5,
    language: 'en'
  };

  const existing = JSON.parse(localStorage.getItem('typeread_leaderboard') || '[]');
  existing.push({ ...entry, id: Date.now() + '-' + i });
  localStorage.setItem('typeread_leaderboard', JSON.stringify(existing));
}
```

### Test Global API

```bash
# Test POST
curl -X POST http://localhost:3000/api/leaderboard \
  -H "Content-Type: application/json" \
  -d '{
    "playerName": "Test Player",
    "score": 5000,
    "wpm": 65,
    "peakWpm": 80,
    "accuracy": 95.5,
    "streak": 25,
    "wordsTyped": 100,
    "textTitle": "Sample Story",
    "duration": 180000,
    "survived": true,
    "language": "en"
  }'

# Test GET
curl http://localhost:3000/api/leaderboard?type=daily&limit=10
```

## 🎯 Next Features to Add

1. **Achievements System** - Unlock badges for milestones
2. **Friends/Teams** - Compete with friends
3. **Challenges** - Daily/weekly challenges
4. **Replay System** - Watch top performances
5. **Export/Share** - Share results on social media
6. **Season/Ladder** - Monthly resets with rewards
7. **Spectator Mode** - Watch live games
8. **Profile Pages** - Detailed player stats

## 🐛 Troubleshooting

### Leaderboard not showing?
- Check browser console for errors
- Verify localStorage has data: `localStorage.getItem('typeread_leaderboard')`
- Clear and reload: `localStorage.clear()` then refresh

### Global leaderboard empty?
- Check API is running: Visit `/api/leaderboard` in browser
- Check network tab for failed requests
- Verify Vercel deployment is live

### Scores not saving?
- Check game is completing properly
- Verify `wordsTyped > 0` before game ends
- Check browser console for errors

## 📚 API Reference

### POST /api/leaderboard
Submit new score

**Request Body:**
```json
{
  "playerName": "string",
  "score": "number",
  "wpm": "number",
  "peakWpm": "number",
  "accuracy": "number",
  "streak": "number",
  "wordsTyped": "number",
  "textTitle": "string",
  "duration": "number",
  "survived": "boolean",
  "language": "en" | "he"
}
```

**Response:**
```json
{
  "success": true,
  "entry": { ...entry },
  "rank": 42
}
```

### GET /api/leaderboard?type={type}&limit={limit}
Fetch leaderboard

**Query Parameters:**
- `type`: "daily" | "weekly" | "alltime" (default: "alltime")
- `limit`: number (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "entries": [ ...entries ],
  "total": 123
}
```

## 🎉 You're All Set!

The leaderboard is now fully integrated and ready to use! Players' scores will automatically be saved both locally and to the global leaderboard.

Try playing a game and check out the leaderboard! 🏆
