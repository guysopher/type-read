"use client";

import { useState, useEffect } from "react";
import TypingView from "@/components/TypingView";
import { SavedText, getSavedTexts, deleteText } from "@/lib/storage";
import { ENGLISH_STORIES, HEBREW_STORIES, Story } from "@/lib/stories";

const TUTORIAL_TEXT = `Welcome to TypeRead, the app that transforms reading into an active adventure. Instead of passively scrolling through articles, you will type every single word, engaging both your mind and your fingers in a dance of comprehension and muscle memory.

Here is how it works. You paste a URL or some text, and then you start typing. Each word you type correctly advances you through the content. Make a mistake and you will see it highlighted in red, exactly as you typed it. Just backspace and try again. No pressure, no judgment, just practice.

The finger hints at the bottom of the screen show you which finger should press each key and in which direction to move from the home row. This is perfect for learning touch typing or refining your technique. You can toggle this feature off, move it to the top, or keep it at the bottom.

Now stop reading this tutorial and start typing it. Feel the rhythm of the words beneath your fingers. This is TypeRead, where every word counts because you typed it yourself.`;

const TUTORIAL_TITLE = "Welcome to TypeRead";

const HEBREW_TUTORIAL_TEXT = `ברוכים הבאים למשחק המרדף של טייפריד. כאן הקריאה הופכת להרפתקה מותחת עם מפלצת שרודפת אחריכם תוך כדי הקלדה.

ככה זה עובד. אתם מתחילים להקליד את הטקסט מילה אחרי מילה. אחרי שלוש מילים המפלצת מתעוררת ומתחילה לרדוף אחריכם. היא נעה במהירות שמתאימה לקצב ההקלדה שלכם ותמיד מנסה להיות קצת יותר מהירה.

עכשיו תפסיקו לקרוא ותתחילו להקליד. המפלצת כבר מחכה לכם. בהצלחה.`;

const HEBREW_TUTORIAL_TITLE = "מדריך משחק המרדף";

// Clean text for easier typing - remove markdown, lists, etc.
function cleanTextForTyping(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^[\s]*[-*•]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/^[-*_]{3,}\s*$/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

export default function Home() {
  const [text, setText] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"url" | "text">("url");
  const [savedTexts, setSavedTexts] = useState<SavedText[]>([]);
  const [activeSaved, setActiveSaved] = useState<SavedText | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [showStories, setShowStories] = useState(false);
  const [storyLanguage, setStoryLanguage] = useState<'en' | 'he'>('en');

  useEffect(() => {
    setSavedTexts(getSavedTexts());
  }, []);

  const isUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!inputValue.trim()) {
      setError("Please enter a URL or some text");
      return;
    }

    if (inputMode === "url") {
      if (!isUrl(inputValue)) {
        setError("Please enter a valid URL");
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: inputValue }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to extract content");
        }

        setText(cleanTextForTyping(data.content));
        setTitle(data.title || "Article");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch article"
        );
      } finally {
        setLoading(false);
      }
    } else {
      setText(cleanTextForTyping(inputValue));
      setTitle(customTitle.trim());
    }
  };

  const handleReset = () => {
    setText(null);
    setTitle("");
    setInputValue("");
    setCustomTitle("");
    setError(null);
    setActiveSaved(null);
    setSavedTexts(getSavedTexts());
  };

  const handleResume = (saved: SavedText) => {
    setText(saved.text);
    setTitle(saved.title);
    setActiveSaved(saved);
  };

  const handleStartTutorial = () => {
    setText(TUTORIAL_TEXT);
    setTitle(TUTORIAL_TITLE);
    setActiveSaved(null);
  };

  const handleStartHebrewTutorial = () => {
    setText(HEBREW_TUTORIAL_TEXT);
    setTitle(HEBREW_TUTORIAL_TITLE);
    setActiveSaved(null);
  };

  const handleStartStory = (story: Story) => {
    setText(story.text);
    setTitle(story.title);
    setActiveSaved(null);
    setShowStories(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteText(id);
    setSavedTexts(getSavedTexts());
  };

  const formatProgress = (saved: SavedText) => {
    const words = saved.text.split(/\s+/).filter((w) => w.length > 0);
    const percent = Math.round(
      (saved.progress.currentWordIndex / words.length) * 100
    );
    return percent;
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const lastPlayed = savedTexts.length > 0 ? savedTexts[0] : null;

  if (text) {
    return (
      <TypingView
        text={text}
        title={title}
        onReset={handleReset}
        savedData={activeSaved || undefined}
      />
    );
  }

  const stories = storyLanguage === 'en' ? ENGLISH_STORIES : HEBREW_STORIES;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-green-400 font-mono">
      {/* Pixel art header */}
      <header className="border-b-4 border-green-500 bg-[#111] py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👾</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-green-400" style={{ textShadow: '2px 2px 0 #065f46' }}>
                TYPEREAD
              </h1>
              <p className="text-xs text-green-600">LEVEL UP YOUR TYPING</p>
            </div>
          </div>
          <div className="text-right text-xs text-green-600">
            <div>GAMES</div>
            <div className="text-green-400 text-lg">
              {savedTexts.length}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">

          {/* Continue Game - Most prominent if there's a saved game */}
          {lastPlayed && (
            <div className="mb-8 animate-pulse">
              <button
                onClick={() => handleResume(lastPlayed)}
                className="w-full p-6 bg-green-900/30 border-4 border-green-500 rounded-lg hover:bg-green-900/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl group-hover:animate-bounce">▶</span>
                    <div className="text-left">
                      <div className="text-xs text-green-600 mb-1">CONTINUE GAME</div>
                      <div className="text-xl text-green-400 truncate max-w-[200px] sm:max-w-[300px]">
                        {lastPlayed.title || "Untitled"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl text-yellow-400">{formatProgress(lastPlayed)}%</div>
                    <div className="text-xs text-green-600">{formatTime(lastPlayed.progress.totalTime)}</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4 h-3 bg-[#0a0a0a] border-2 border-green-700 rounded">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${formatProgress(lastPlayed)}%` }}
                  />
                </div>
              </button>
            </div>
          )}

          {/* Main Menu Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* New Game */}
            <button
              onClick={() => setShowStories(true)}
              className="p-6 bg-[#111] border-4 border-purple-500 rounded-lg hover:bg-purple-900/20 hover:border-purple-400 transition-all group"
            >
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">📚</span>
              <div className="text-purple-400 font-bold">NEW GAME</div>
              <div className="text-xs text-purple-600">Classic Stories</div>
            </button>

            {/* Custom Text */}
            <button
              onClick={() => {
                setInputMode("text");
                const el = document.getElementById("custom-input");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="p-6 bg-[#111] border-4 border-cyan-500 rounded-lg hover:bg-cyan-900/20 hover:border-cyan-400 transition-all group"
            >
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">✏️</span>
              <div className="text-cyan-400 font-bold">CUSTOM</div>
              <div className="text-xs text-cyan-600">Paste Your Text</div>
            </button>

            {/* URL Mode */}
            <button
              onClick={() => {
                setInputMode("url");
                const el = document.getElementById("custom-input");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="p-6 bg-[#111] border-4 border-orange-500 rounded-lg hover:bg-orange-900/20 hover:border-orange-400 transition-all group"
            >
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">🔗</span>
              <div className="text-orange-400 font-bold">URL</div>
              <div className="text-xs text-orange-600">Import Article</div>
            </button>

            {/* Tutorial */}
            <button
              onClick={handleStartTutorial}
              className="p-6 bg-[#111] border-4 border-yellow-500 rounded-lg hover:bg-yellow-900/20 hover:border-yellow-400 transition-all group"
            >
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">🎮</span>
              <div className="text-yellow-400 font-bold">TUTORIAL</div>
              <div className="text-xs text-yellow-600">Learn to Play</div>
            </button>
          </div>

          {/* Stories Panel */}
          {showStories && (
            <div className="mb-8 bg-[#111] border-4 border-purple-500 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg text-purple-400 font-bold">SELECT STORY</h2>
                <button
                  onClick={() => setShowStories(false)}
                  className="text-purple-600 hover:text-purple-400"
                >
                  ✕
                </button>
              </div>

              {/* Language Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setStoryLanguage('en')}
                  className={`px-4 py-2 rounded border-2 transition-all ${
                    storyLanguage === 'en'
                      ? 'border-purple-400 bg-purple-900/30 text-purple-400'
                      : 'border-purple-800 text-purple-600 hover:border-purple-600'
                  }`}
                >
                  🇬🇧 English
                </button>
                <button
                  onClick={() => setStoryLanguage('he')}
                  className={`px-4 py-2 rounded border-2 transition-all ${
                    storyLanguage === 'he'
                      ? 'border-purple-400 bg-purple-900/30 text-purple-400'
                      : 'border-purple-800 text-purple-600 hover:border-purple-600'
                  }`}
                >
                  🇮🇱 עברית
                </button>
              </div>

              {/* Story List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {stories.map((story) => (
                  <button
                    key={story.id}
                    onClick={() => handleStartStory(story)}
                    className="w-full text-left p-3 bg-[#0a0a0a] border-2 border-purple-800 rounded hover:border-purple-500 hover:bg-purple-900/20 transition-all"
                    dir={story.language === 'he' ? 'rtl' : 'ltr'}
                  >
                    <div className="text-purple-400 font-bold truncate">{story.title}</div>
                    <div className="text-xs text-purple-600">{story.author}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Input Section */}
          <div id="custom-input" className="bg-[#111] border-4 border-green-700 rounded-lg p-4 mb-8">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputMode("url")}
                className={`px-4 py-2 rounded border-2 transition-all ${
                  inputMode === "url"
                    ? 'border-green-400 bg-green-900/30 text-green-400'
                    : 'border-green-800 text-green-600 hover:border-green-600'
                }`}
              >
                🔗 URL
              </button>
              <button
                onClick={() => setInputMode("text")}
                className={`px-4 py-2 rounded border-2 transition-all ${
                  inputMode === "text"
                    ? 'border-green-400 bg-green-900/30 text-green-400'
                    : 'border-green-800 text-green-600 hover:border-green-600'
                }`}
              >
                ✏️ TEXT
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {inputMode === "url" ? (
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="PASTE URL HERE..."
                  className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-green-700 rounded text-green-400 placeholder-green-800 focus:border-green-500 focus:outline-none"
                  disabled={loading}
                />
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="TITLE (OPTIONAL)"
                    className="w-full px-4 py-2 bg-[#0a0a0a] border-2 border-green-700 rounded text-green-400 placeholder-green-800 focus:border-green-500 focus:outline-none text-sm"
                    disabled={loading}
                  />
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="PASTE YOUR TEXT HERE..."
                    rows={4}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-green-700 rounded text-green-400 placeholder-green-800 focus:border-green-500 focus:outline-none resize-none"
                    disabled={loading}
                  />
                </div>
              )}

              {error && (
                <p className="text-red-500 text-sm border border-red-800 bg-red-900/20 rounded p-2">
                  ERROR: {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="w-full py-3 bg-green-600 text-[#0a0a0a] font-bold rounded border-2 border-green-400 hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "LOADING..." : "START GAME ▶"}
              </button>
            </form>
          </div>

          {/* Saved Games */}
          {savedTexts.length > 1 && (
            <div className="bg-[#111] border-4 border-blue-700 rounded-lg p-4">
              <h2 className="text-lg text-blue-400 font-bold mb-4">SAVED GAMES</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedTexts.slice(1).map((saved) => (
                  <button
                    key={saved.id}
                    onClick={() => handleResume(saved)}
                    className="w-full text-left p-3 bg-[#0a0a0a] border-2 border-blue-800 rounded hover:border-blue-500 hover:bg-blue-900/20 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-blue-400 truncate">{saved.title || "Untitled"}</div>
                        <div className="text-xs text-blue-600">
                          {formatProgress(saved)}% • {formatTime(saved.progress.totalTime)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(saved.id, e)}
                        className="ml-2 text-blue-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hebrew Tutorial Link */}
          <div className="mt-8 text-center">
            <button
              onClick={handleStartHebrewTutorial}
              className="text-sm text-green-700 hover:text-green-500 transition-colors"
              dir="rtl"
            >
              👾 מדריך בעברית
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-green-800 bg-[#111] py-4 px-4 text-center text-xs text-green-700">
        <p>TYPE EACH WORD TO ADVANCE • ESCAPE THE MONSTER • LEVEL UP</p>
        <p className="mt-1 text-green-800">INSERT COIN TO CONTINUE...</p>
      </footer>
    </div>
  );
}
