"use client";

import { useState, useEffect } from "react";
import TypingView from "@/components/TypingView";
import { SavedText, getSavedTexts, deleteText } from "@/lib/storage";

const TUTORIAL_TEXT = `Welcome to TypeRead, the app that transforms reading into an active adventure. Instead of passively scrolling through articles, you will type every single word, engaging both your mind and your fingers in a dance of comprehension and muscle memory.

Here is how it works. You paste a URL or some text, and then you start typing. Each word you type correctly advances you through the content. Make a mistake and you will see it highlighted in red, exactly as you typed it. Just backspace and try again. No pressure, no judgment, just practice.

The finger hints at the bottom of the screen show you which finger should press each key and in which direction to move from the home row. This is perfect for learning touch typing or refining your technique. You can toggle this feature off, move it to the top, or keep it at the bottom.

Forgiving mode is your friend when you are just starting out. It ignores capitalization and punctuation, letting you focus on the flow of typing rather than perfect accuracy. Toggle it off when you are ready for a challenge.

Your progress saves automatically every ten seconds, so you can close the browser and come back later. Pick up right where you left off, whether it is a quick news article or a lengthy essay.

You can also highlight passages and add notes as you read. Click on a word to start selecting, click another to extend, and then write your thoughts. These annotations stay with your saved text, perfect for studying or collecting favorite quotes.

The statistics page shows your words per minute over time, tracks your pauses, and gives you a detailed breakdown of your typing session. Watch yourself improve with every article you complete.

Now stop reading this tutorial and start typing it. Feel the rhythm of the words beneath your fingers. Notice how your brain processes each sentence differently when you have to actively reproduce it. This is TypeRead, where every word counts because you typed it yourself.`;

const TUTORIAL_TITLE = "Welcome to TypeRead";

export default function Home() {
  const [text, setText] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"url" | "text">("url");
  const [savedTexts, setSavedTexts] = useState<SavedText[]>([]);
  const [activeSaved, setActiveSaved] = useState<SavedText | null>(null);

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

        setText(data.content);
        setTitle(data.title || "Article");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch article"
        );
      } finally {
        setLoading(false);
      }
    } else {
      setText(inputValue);
      setTitle("Your Text");
    }
  };

  const handleReset = () => {
    setText(null);
    setTitle("");
    setInputValue("");
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
    return `${percent}%`;
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">TypeRead</h1>
          <p className="text-[var(--muted)] text-lg">
            Read articles by typing them. Word by word.
          </p>
        </header>

        <div className="flex gap-1 mb-6 p-1 bg-[var(--foreground)]/5 rounded-lg w-fit mx-auto">
          <button
            type="button"
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
            type="button"
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {inputMode === "url" ? (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste article URL..."
              className="w-full px-4 py-4 text-lg border border-[var(--foreground)]/10 rounded-xl bg-transparent focus:border-[var(--foreground)]/30 transition-colors"
              disabled={loading}
              autoFocus
            />
          ) : (
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste your text here..."
              rows={8}
              className="w-full px-4 py-4 text-lg border border-[var(--foreground)]/10 rounded-xl bg-transparent focus:border-[var(--foreground)]/30 transition-colors resize-none"
              disabled={loading}
              autoFocus
            />
          )}

          {error && (
            <p className="text-[var(--error)] text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="w-full py-4 text-lg font-medium bg-[var(--foreground)] text-[var(--background)] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Extracting...
              </span>
            ) : (
              "Start Typing"
            )}
          </button>
        </form>

        {/* Tutorial / Try it out */}
        <div className="mt-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--foreground)]/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--background)] text-[var(--muted)]">or</span>
            </div>
          </div>
          <button
            onClick={handleStartTutorial}
            className="mt-6 px-6 py-3 text-sm font-medium border border-[var(--foreground)]/20 rounded-xl hover:border-[var(--foreground)]/40 hover:bg-[var(--foreground)]/5 transition-all"
          >
            Try the tutorial
          </button>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Learn how TypeRead works by typing through a quick introduction
          </p>
        </div>

        {/* Saved Texts */}
        {savedTexts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-sm font-medium text-[var(--muted)] mb-4">
              Continue Reading
            </h2>
            <div className="space-y-2">
              {savedTexts.map((saved) => (
                <button
                  key={saved.id}
                  onClick={() => handleResume(saved)}
                  className="w-full text-left p-4 border border-[var(--foreground)]/10 rounded-xl hover:border-[var(--foreground)]/30 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{saved.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-[var(--muted)]">
                        <span>{formatProgress(saved)} complete</span>
                        <span>·</span>
                        <span>{formatTime(saved.progress.totalTime)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-[var(--foreground)]/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--foreground)] rounded-full"
                          style={{
                            width: formatProgress(saved),
                          }}
                        />
                      </div>
                      <button
                        onClick={(e) => handleDelete(saved.id, e)}
                        className="p-1 text-[var(--muted)] hover:text-[var(--error)] opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-16 text-center text-sm text-[var(--muted)]">
          <p>Type each word to advance. Improve your speed while you read.</p>
        </footer>
      </div>
    </div>
  );
}
