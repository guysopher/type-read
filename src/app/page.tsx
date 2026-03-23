"use client";

import { useState, useEffect } from "react";
import TypingView from "@/components/TypingView";
import PaperBackground from "@/components/PaperBackground";
import { SavedText, getSavedTexts, deleteText } from "@/lib/storage";
import { ENGLISH_STORIES, HEBREW_STORIES, Story } from "@/lib/stories";
import { colors } from "@/styles/designTokens";

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
    <PaperBackground>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl">
          {/* Header */}
          <header className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-4xl">👾</span>
              <h1
                className="text-4xl font-bold heading-text"
                style={{ color: colors.ink }}
              >
                TypeRead
              </h1>
            </div>
            <p className="text-sm" style={{ color: colors.pencil }}>
              Read by typing · Escape the monster
            </p>
          </header>

          {/* Continue Button */}
          {lastPlayed && (
            <button
              onClick={() => handleResume(lastPlayed)}
              className="w-full mb-6 p-4 bg-white rounded-lg text-left transition-all group"
              style={{
                border: `2px solid ${colors.accent}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">▶</span>
                  <div>
                    <div className="text-xs uppercase tracking-wide" style={{ color: colors.pencil }}>
                      Continue
                    </div>
                    <div className="font-medium" style={{ color: colors.ink }}>
                      {lastPlayed.title || "Untitled"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold" style={{ color: colors.accent }}>
                    {formatProgress(lastPlayed)}%
                  </div>
                  <div className="text-xs" style={{ color: colors.pencil }}>
                    {formatTime(lastPlayed.progress.totalTime)}
                  </div>
                </div>
              </div>
              <div
                className="h-2 rounded-full mt-3 overflow-hidden"
                style={{ backgroundColor: colors.paperDark }}
              >
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${formatProgress(lastPlayed)}%`,
                    backgroundColor: colors.accent
                  }}
                />
              </div>
            </button>
          )}

          {/* Spacer */}
          <div className="my-6" />

          {/* Navigation Links */}
          <nav className="space-y-2 mb-8">
            <button
              onClick={() => setShowStories(true)}
              className="w-full text-left py-3 px-2 rounded transition-all"
              style={{ color: colors.ink }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.accentFaded;
                e.currentTarget.style.paddingLeft = '12px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.paddingLeft = '8px';
              }}
            >
              Stories
            </button>
            <button
              onClick={() => setShowAddText(true)}
              className="w-full text-left py-3 px-2 rounded transition-all"
              style={{ color: colors.ink }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.accentFaded;
                e.currentTarget.style.paddingLeft = '12px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.paddingLeft = '8px';
              }}
            >
              Your Texts
            </button>
            <button
              onClick={handleStartTutorial}
              className="w-full text-left py-3 px-2 rounded transition-all"
              style={{ color: colors.ink }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.accentFaded;
                e.currentTarget.style.paddingLeft = '12px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.paddingLeft = '8px';
              }}
            >
              Tutorial
            </button>
            <button
              onClick={handleStartHebrewTutorial}
              className="w-full text-left py-3 px-2 rounded transition-all"
              style={{ color: colors.ink }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.accentFaded;
                e.currentTarget.style.paddingLeft = '12px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.paddingLeft = '8px';
              }}
            >
              מדריך עברית
            </button>
          </nav>

          {/* Saved Texts Preview */}
          {savedTexts.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xs uppercase tracking-wide mb-3" style={{ color: colors.pencil }}>
                Recent Texts
              </h2>
              <div className="space-y-2">
                {savedTexts.slice(lastPlayed ? 1 : 0, lastPlayed ? 4 : 3).map((saved) => (
                  <button
                    key={saved.id}
                    onClick={() => handleResume(saved)}
                    className="w-full text-left p-3 rounded border transition-all group flex items-center justify-between"
                    style={{
                      borderColor: colors.pencilLight,
                      borderWidth: '1px'
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm" style={{ color: colors.ink }}>
                        {saved.title || "Untitled"}
                      </div>
                      <div className="text-xs" style={{ color: colors.pencil }}>
                        {formatProgress(saved)}% · {formatTime(saved.progress.totalTime)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(saved.id, e)}
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: colors.error }}
                    >
                      ✕
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stories Modal */}
        {showStories && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div
              className="w-full max-w-lg bg-white rounded-lg overflow-hidden"
              style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)' }}
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.pencilLight, opacity: 0.3 }}>
                <h2 className="text-lg font-medium heading-text" style={{ color: colors.ink }}>
                  Stories
                </h2>
                <button
                  onClick={() => setShowStories(false)}
                  className="p-1 rounded transition-colors"
                  style={{ color: colors.pencil }}
                >
                  ✕
                </button>
              </div>

              {/* Language Toggle */}
              <div className="flex gap-2 p-4 border-b" style={{ borderColor: colors.pencilLight, opacity: 0.2 }}>
                <button
                  onClick={() => setStoryLanguage('en')}
                  className={`flex-1 py-2 px-4 rounded text-sm transition-all ${
                    storyLanguage === 'en' ? 'font-bold' : ''
                  }`}
                  style={{
                    backgroundColor: storyLanguage === 'en' ? colors.accent : 'transparent',
                    color: storyLanguage === 'en' ? '#fff' : colors.ink,
                    border: `1px solid ${storyLanguage === 'en' ? colors.accent : colors.pencilLight}`
                  }}
                >
                  English
                </button>
                <button
                  onClick={() => setStoryLanguage('he')}
                  className={`flex-1 py-2 px-4 rounded text-sm transition-all ${
                    storyLanguage === 'he' ? 'font-bold' : ''
                  }`}
                  style={{
                    backgroundColor: storyLanguage === 'he' ? colors.accent : 'transparent',
                    color: storyLanguage === 'he' ? '#fff' : colors.ink,
                    border: `1px solid ${storyLanguage === 'he' ? colors.accent : colors.pencilLight}`
                  }}
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
                    className="w-full text-left p-3 rounded transition-colors"
                    dir={story.language === 'he' ? 'rtl' : 'ltr'}
                    style={{
                      borderLeft: `2px solid transparent`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.accentFaded;
                      e.currentTarget.style.borderLeftColor = colors.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderLeftColor = 'transparent';
                    }}
                  >
                    <div className="font-medium" style={{ color: colors.ink }}>{story.title}</div>
                    <div className="text-sm" style={{ color: colors.pencil }}>{story.author}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Text Modal */}
        {showAddText && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div
              className="w-full max-w-lg bg-white rounded-lg overflow-hidden"
              style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)' }}
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.pencilLight, opacity: 0.3 }}>
                <h2 className="text-lg font-medium heading-text" style={{ color: colors.ink }}>
                  Add New Text
                </h2>
                <button
                  onClick={() => setShowAddText(false)}
                  className="p-1 rounded transition-colors"
                  style={{ color: colors.pencil }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddText} className="p-4 space-y-4">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Title (optional)"
                  className="w-full px-4 py-2 text-sm border rounded transition-colors"
                  style={{
                    borderColor: colors.pencilLight,
                    color: colors.ink
                  }}
                  autoFocus
                />
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Paste your text here..."
                  rows={6}
                  className="w-full px-4 py-3 text-base border rounded resize-none transition-colors"
                  style={{
                    borderColor: colors.pencilLight,
                    color: colors.ink
                  }}
                />

                {error && (
                  <p className="text-sm text-center" style={{ color: colors.error }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="ink-button w-full"
                >
                  Start Typing
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </PaperBackground>
  );
}
