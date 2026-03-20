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
    return Math.round((saved.progress.currentWordIndex / words.length) * 100);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-xl">
        {/* Header */}
        <header className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span
              className="text-4xl"
              style={{
                animation: 'bounce 1s ease-in-out infinite',
                display: 'inline-block'
              }}
            >
              👾
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">TypeRead</h1>
          </div>
          <p className="text-[var(--muted)] text-base sm:text-lg">
            Read by typing. Escape the monster.
          </p>
        </header>

        {/* Continue Button - if there's a saved game */}
        {lastPlayed && (
          <button
            onClick={() => handleResume(lastPlayed)}
            className="w-full mb-6 p-4 bg-[var(--foreground)] text-[var(--background)] rounded-xl hover:opacity-90 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl group-hover:scale-110 transition-transform">▶</span>
                <div className="text-left">
                  <div className="text-xs opacity-70">Continue</div>
                  <div className="font-medium truncate max-w-[180px] sm:max-w-[280px]">
                    {lastPlayed.title || "Untitled"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatProgress(lastPlayed)}%</div>
                <div className="text-xs opacity-70">{formatTime(lastPlayed.progress.totalTime)}</div>
              </div>
            </div>
          </button>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowStories(true)}
            className="flex-1 py-3 px-4 text-sm font-medium border border-[var(--foreground)]/20 rounded-xl hover:border-[var(--foreground)]/40 hover:bg-[var(--foreground)]/5 transition-all"
          >
            📚 Stories
          </button>
          <button
            onClick={handleStartTutorial}
            className="flex-1 py-3 px-4 text-sm font-medium border border-[var(--foreground)]/20 rounded-xl hover:border-[var(--foreground)]/40 hover:bg-[var(--foreground)]/5 transition-all"
          >
            🎮 Tutorial
          </button>
          <button
            onClick={handleStartHebrewTutorial}
            className="py-3 px-4 text-sm font-medium border border-[var(--foreground)]/20 rounded-xl hover:border-[var(--foreground)]/40 hover:bg-[var(--foreground)]/5 transition-all"
            title="Hebrew Tutorial"
          >
            🇮🇱
          </button>
        </div>

        {/* Stories Modal */}
        {showStories && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[var(--background)] rounded-2xl shadow-2xl border border-[var(--foreground)]/10 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[var(--foreground)]/10">
                <h2 className="text-lg font-semibold">Choose a Story</h2>
                <button
                  onClick={() => setShowStories(false)}
                  className="p-1 hover:bg-[var(--foreground)]/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Language Toggle */}
              <div className="flex gap-2 p-4 border-b border-[var(--foreground)]/5">
                <button
                  onClick={() => setStoryLanguage('en')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    storyLanguage === 'en'
                      ? 'bg-[var(--foreground)] text-[var(--background)]'
                      : 'bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setStoryLanguage('he')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    storyLanguage === 'he'
                      ? 'bg-[var(--foreground)] text-[var(--background)]'
                      : 'bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10'
                  }`}
                >
                  עברית
                </button>
              </div>

              {/* Story List */}
              <div className="max-h-80 overflow-y-auto p-2">
                {stories.map((story) => (
                  <button
                    key={story.id}
                    onClick={() => handleStartStory(story)}
                    className="w-full text-left p-3 rounded-lg hover:bg-[var(--foreground)]/5 transition-colors"
                    dir={story.language === 'he' ? 'rtl' : 'ltr'}
                  >
                    <div className="font-medium">{story.title}</div>
                    <div className="text-sm text-[var(--muted)]">{story.author}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--foreground)]/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[var(--background)] text-[var(--muted)]">or paste your own</span>
          </div>
        </div>

        {/* Input Mode Toggle */}
        <div className="flex gap-1 mb-4 p-1 bg-[var(--foreground)]/5 rounded-lg w-fit mx-auto">
          <button
            onClick={() => setInputMode("url")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              inputMode === "url"
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            URL
          </button>
          <button
            onClick={() => setInputMode("text")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              inputMode === "text"
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Text
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {inputMode === "url" ? (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste article URL..."
              className="w-full px-4 py-3 text-base border border-[var(--foreground)]/10 rounded-xl bg-transparent focus:border-[var(--foreground)]/30 transition-colors"
              disabled={loading}
              autoFocus
            />
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full px-4 py-2 text-sm border border-[var(--foreground)]/10 rounded-lg bg-transparent focus:border-[var(--foreground)]/30 transition-colors"
                disabled={loading}
              />
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Paste your text here..."
                rows={4}
                className="w-full px-4 py-3 text-base border border-[var(--foreground)]/10 rounded-xl bg-transparent focus:border-[var(--foreground)]/30 transition-colors resize-none"
                disabled={loading}
                autoFocus
              />
            </div>
          )}

          {error && (
            <p className="text-[var(--error)] text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="w-full py-3 text-base font-medium bg-[var(--foreground)] text-[var(--background)] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Start Typing"}
          </button>
        </form>

        {/* Saved Texts */}
        {savedTexts.length > 1 && (
          <div className="mt-8">
            <h2 className="text-sm font-medium text-[var(--muted)] mb-3">
              Previous Sessions
            </h2>
            <div className="space-y-2">
              {savedTexts.slice(1, 4).map((saved) => (
                <button
                  key={saved.id}
                  onClick={() => handleResume(saved)}
                  className="w-full text-left p-3 border border-[var(--foreground)]/10 rounded-xl hover:border-[var(--foreground)]/20 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">{saved.title || "Untitled"}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {formatProgress(saved)}% · {formatTime(saved.progress.totalTime)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(saved.id, e)}
                      className="p-1 text-[var(--muted)] hover:text-[var(--error)] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-[var(--muted)]">
          <p>Type each word to advance. The monster is always watching.</p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
