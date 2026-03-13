"use client";

import { useState } from "react";
import TypingView from "@/components/TypingView";

export default function Home() {
  const [text, setText] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"url" | "text">("url");

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
        setError(err instanceof Error ? err.message : "Failed to fetch article");
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
  };

  if (text) {
    return <TypingView text={text} title={title} onReset={handleReset} />;
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

        <footer className="mt-16 text-center text-sm text-[var(--muted)]">
          <p>Type each word to advance. Improve your speed while you read.</p>
        </footer>
      </div>
    </div>
  );
}
