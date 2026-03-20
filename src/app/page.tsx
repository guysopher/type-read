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
  const [error, setError] = useState<string | null>(null);
  const [savedTexts, setSavedTexts] = useState<SavedText[]>([]);
  const [activeSaved, setActiveSaved] = useState<SavedText | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [showStories, setShowStories] = useState(false);
  const [storyLanguage, setStoryLanguage] = useState<'en' | 'he'>('en');
  const [showAddText, setShowAddText] = useState(false);

  useEffect(() => {
    setSavedTexts(getSavedTexts());
  }, []);

  const handleAddText = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!inputValue.trim()) {
      setError("Please enter some text");
      return;
    }

    setText(cleanTextForTyping(inputValue));
    setTitle(customTitle.trim() || "Custom Text");
    setShowAddText(false);
    setInputValue("");
    setCustomTitle("");
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-gradient-to-b from-[var(--background)] via-[var(--background)] to-purple-950/20">
      {/* CRT scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.04]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)',
        }}
      />

      {/* Subtle vignette effect */}
      <div
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      <div className="w-full max-w-xl relative z-10">
        {/* Header */}
        <header className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span
              className="text-5xl"
              style={{
                animation: 'float 2s ease-in-out infinite',
                display: 'inline-block',
                filter: 'drop-shadow(0 0 12px rgba(168, 85, 247, 0.7)) drop-shadow(0 0 24px rgba(168, 85, 247, 0.4))',
              }}
            >
              👾
            </span>
            <h1
              className="text-3xl sm:text-4xl font-bold"
              style={{
                fontFamily: 'var(--font-press-start), system-ui, monospace',
                fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
                textShadow: '2px 2px 0 rgba(0, 0, 0, 0.3)',
                letterSpacing: '0.1em',
              }}
            >
              TypeRead
            </h1>
          </div>
          <p className="text-sm sm:text-base font-mono tracking-widest uppercase text-[var(--muted)]">
            ▸ Read by typing ▸ Escape the monster ▸
          </p>
        </header>

        {/* Continue Button - if there's a saved game */}
        {lastPlayed && (
          <button
            onClick={() => handleResume(lastPlayed)}
            className="w-full mb-6 p-4 text-white group relative overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #7c3aed 0%, #5b21b6 100%)',
              boxShadow: '0 0 30px rgba(168, 85, 247, 0.5), inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.3)',
              border: '3px solid #a855f7',
              imageRendering: 'pixelated',
            }}
          >
            {/* Pixel corner decorations */}
            <div className="absolute top-0 left-0 w-2 h-2 bg-purple-300" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-purple-300" />
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-purple-900" />
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-purple-900" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <span
                  className="text-2xl"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))',
                    animation: 'blink 1s step-end infinite',
                  }}
                >
                  ▶
                </span>
                <div className="text-left">
                  <div className="text-xs opacity-80 font-mono uppercase tracking-widest" style={{ fontFamily: 'var(--font-press-start)', fontSize: '8px' }}>Continue</div>
                  <div className="font-medium truncate max-w-[180px] sm:max-w-[280px]">
                    {lastPlayed.title || "Untitled"}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-xl font-bold" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.3)' }}>{formatProgress(lastPlayed)}%</div>
                <div className="text-xs opacity-70">{formatTime(lastPlayed.progress.totalTime)}</div>
              </div>
            </div>
          </button>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowStories(true)}
            className="flex-1 py-3 px-4 text-sm font-mono uppercase tracking-wider transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(180deg, rgba(168,85,247,0.2) 0%, rgba(168,85,247,0.1) 100%)',
              border: '2px solid rgba(168,85,247,0.4)',
              boxShadow: '0 0 15px rgba(168,85,247,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
              textShadow: '0 0 10px rgba(168,85,247,0.5)',
            }}
          >
            📚 Stories
          </button>
          <button
            onClick={handleStartTutorial}
            className="flex-1 py-3 px-4 text-sm font-mono uppercase tracking-wider transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(180deg, rgba(168,85,247,0.2) 0%, rgba(168,85,247,0.1) 100%)',
              border: '2px solid rgba(168,85,247,0.4)',
              boxShadow: '0 0 15px rgba(168,85,247,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
              textShadow: '0 0 10px rgba(168,85,247,0.5)',
            }}
          >
            🎮 Tutorial
          </button>
          <button
            onClick={handleStartHebrewTutorial}
            className="py-3 px-4 text-sm font-mono transition-all hover:scale-105"
            title="Hebrew Tutorial"
            style={{
              background: 'linear-gradient(180deg, rgba(168,85,247,0.2) 0%, rgba(168,85,247,0.1) 100%)',
              border: '2px solid rgba(168,85,247,0.4)',
              boxShadow: '0 0 15px rgba(168,85,247,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            🇮🇱
          </button>
        </div>

        {/* Stories Modal */}
        {showStories && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
              className="w-full max-w-lg bg-[var(--background)] rounded-lg shadow-2xl border-2 border-purple-500/30 overflow-hidden"
              style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.15)' }}
            >
              <div className="flex items-center justify-between p-4 border-b-2 border-purple-500/20 bg-purple-500/5">
                <h2 className="text-lg font-semibold font-mono flex items-center gap-2">
                  <span>📚</span> Choose a Story
                </h2>
                <button
                  onClick={() => setShowStories(false)}
                  className="p-1 hover:bg-purple-500/20 rounded-lg transition-colors text-purple-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Language Toggle */}
              <div className="flex gap-2 p-4 border-b-2 border-purple-500/10">
                <button
                  onClick={() => setStoryLanguage('en')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium font-mono transition-all border-2 ${
                    storyLanguage === 'en'
                      ? 'bg-purple-500 text-white border-purple-400'
                      : 'border-[var(--foreground)]/10 hover:border-purple-400/50'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setStoryLanguage('he')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium font-mono transition-all border-2 ${
                    storyLanguage === 'he'
                      ? 'bg-purple-500 text-white border-purple-400'
                      : 'border-[var(--foreground)]/10 hover:border-purple-400/50'
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
                    className="w-full text-left p-3 rounded-lg hover:bg-purple-500/10 transition-colors border-l-2 border-transparent hover:border-purple-400"
                    dir={story.language === 'he' ? 'rtl' : 'ltr'}
                  >
                    <div className="font-medium">{story.title}</div>
                    <div className="text-sm text-[var(--muted)] font-mono">{story.author}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add New Text Modal */}
        {showAddText && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
              className="w-full max-w-lg bg-[var(--background)] rounded-lg shadow-2xl border-2 border-purple-500/30 overflow-hidden"
              style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.15)' }}
            >
              <div className="flex items-center justify-between p-4 border-b-2 border-purple-500/20 bg-purple-500/5">
                <h2 className="text-lg font-semibold font-mono flex items-center gap-2">
                  <span>✏️</span> Add New Text
                </h2>
                <button
                  onClick={() => setShowAddText(false)}
                  className="p-1 hover:bg-purple-500/20 rounded-lg transition-colors text-purple-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddText} className="p-4 space-y-4">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Title (optional)"
                  className="w-full px-4 py-2 text-sm border-2 border-purple-500/20 rounded-lg bg-transparent focus:border-purple-500/50 transition-colors"
                  autoFocus
                />
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Paste your text here..."
                  rows={6}
                  className="w-full px-4 py-3 text-base border-2 border-purple-500/20 rounded-lg bg-transparent focus:border-purple-500/50 transition-colors resize-none"
                />

                {error && (
                  <p className="text-[var(--error)] text-sm text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="w-full py-3 text-base font-mono uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)',
                    border: '3px solid #c084fc',
                    boxShadow: '0 0 30px rgba(168, 85, 247, 0.4), inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.3)',
                    color: '#fff',
                    textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
                  }}
                >
                  ▶ Start Typing
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Your Texts Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[var(--muted)]">
              Your Texts
            </h2>
            <button
              onClick={() => setShowAddText(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors text-purple-400"
            >
              <span>+</span> Add New
            </button>
          </div>
          <div className="space-y-2">
            {savedTexts.length === 0 ? (
              <p className="text-sm text-[var(--muted)] text-center py-4">
                No saved texts yet. Try a story or add your own!
              </p>
            ) : (
              savedTexts.slice(lastPlayed ? 1 : 0, lastPlayed ? 5 : 4).map((saved) => (
                <button
                  key={saved.id}
                  onClick={() => handleResume(saved)}
                  className="w-full text-left p-3 border border-[var(--foreground)]/10 rounded-lg hover:border-purple-500/30 transition-colors group"
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
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center font-mono">
          <p
            className="text-xs uppercase tracking-widest mb-2"
            style={{
              color: '#a855f7',
              textShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
            }}
          >
            ━━━ Insert Text to Begin ━━━
          </p>
          <p
            className="text-xs text-purple-300/50"
            style={{ animation: 'flicker 4s linear infinite' }}
          >
            👾 The monster is always watching... 👾
          </p>
          <p className="mt-4 text-[10px] text-[var(--muted)]/30 tracking-widest">
            © 2024 TYPEREAD ARCADE
          </p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.5; }
          92% { opacity: 0.5; }
          93% { opacity: 0.2; }
          94% { opacity: 0.5; }
          96% { opacity: 0.3; }
          97% { opacity: 0.5; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
