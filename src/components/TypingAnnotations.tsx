"use client";

import { useRef, useEffect } from 'react';
import type { Highlight } from '@/lib/storage';

interface TypingAnnotationsProps {
  words: string[];
  highlights: Highlight[];
  activeHighlight: string | null;
  selectedRange: { start: number; end: number } | null;
  showNoteInput: boolean;
  noteText: string;
  onSetActiveHighlight: (id: string | null) => void;
  onDeleteHighlight: (id: string) => void;
  onSetNoteText: (text: string) => void;
  onAddHighlight: () => void;
  onCancelHighlight: () => void;
}

/**
 * Annotations UI: side panel, bottom sheet, and note input modal
 * Handles highlight display and note management
 */
export default function TypingAnnotations({
  words,
  highlights,
  activeHighlight,
  selectedRange,
  showNoteInput,
  noteText,
  onSetActiveHighlight,
  onDeleteHighlight,
  onSetNoteText,
  onAddHighlight,
  onCancelHighlight,
}: TypingAnnotationsProps) {
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus note input when modal opens
  useEffect(() => {
    if (showNoteInput && noteInputRef.current) {
      setTimeout(() => noteInputRef.current?.focus(), 100);
    }
  }, [showNoteInput]);

  return (
    <>
      {/* Side notes panel (desktop only) */}
      <div className="hidden lg:block w-64 flex-shrink-0 overflow-y-auto py-8 pr-6">
        <div className="space-y-4">
          {highlights.map((highlight, index) => (
            <div
              key={highlight.id}
              className={`p-3 rounded-lg border-l-2 transition-all cursor-pointer ${
                activeHighlight === highlight.id
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-[var(--foreground)]/10 hover:border-yellow-400/50 hover:bg-[var(--foreground)]/5'
              }`}
              onClick={() =>
                onSetActiveHighlight(activeHighlight === highlight.id ? null : highlight.id)
              }
            >
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mt-0.5">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--muted)] mb-1 truncate italic">
                    &ldquo;
                    {words
                      .slice(highlight.startWordIndex, highlight.endWordIndex + 1)
                      .slice(0, 5)
                      .join(' ')}
                    {highlight.endWordIndex - highlight.startWordIndex > 4 ? '...' : ''}
                    &rdquo;
                  </p>
                  <p className="text-sm">{highlight.note}</p>
                  {activeHighlight === highlight.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHighlight(highlight.id);
                      }}
                      className="mt-2 text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Bottom sheet for active note */}
      {activeHighlight && (() => {
        const highlight = highlights.find(h => h.id === activeHighlight);
        if (!highlight) return null;

        return (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--background)] border-t border-[var(--foreground)]/10 p-4 z-30 shadow-lg">
            <p className="text-xs text-[var(--muted)] mb-1 italic">
              &ldquo;
              {words
                .slice(highlight.startWordIndex, highlight.endWordIndex + 1)
                .slice(0, 8)
                .join(' ')}
              {highlight.endWordIndex - highlight.startWordIndex > 7 ? '...' : ''}
              &rdquo;
            </p>
            <p className="text-sm mb-2">{highlight.note}</p>
            <div className="flex gap-2">
              <button
                onClick={() => onSetActiveHighlight(null)}
                className="flex-1 py-2 text-sm bg-[var(--foreground)]/10 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => onDeleteHighlight(highlight.id)}
                className="px-4 py-2 text-sm text-red-500 border border-red-500/30 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })()}

      {/* Note input modal */}
      {showNoteInput && selectedRange && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={onCancelHighlight} />

          {/* Modal */}
          <div
            className="fixed z-40 bg-[var(--background)] rounded-xl shadow-2xl border border-[var(--foreground)]/10 p-4 w-72"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-yellow-400 rounded-full" />
              <p className="text-xs text-[var(--muted)] truncate flex-1">
                {words
                  .slice(selectedRange.start, selectedRange.end + 1)
                  .slice(0, 4)
                  .join(' ')}
                {selectedRange.end - selectedRange.start > 3 ? '...' : ''}
              </p>
            </div>
            <textarea
              ref={noteInputRef}
              value={noteText}
              onChange={(e) => onSetNoteText(e.target.value)}
              placeholder="Add a note..."
              className="w-full p-2 text-sm border border-[var(--foreground)]/10 rounded-lg bg-transparent resize-none focus:outline-none focus:border-yellow-400/50"
              rows={2}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={onAddHighlight}
                disabled={!noteText.trim()}
                className="flex-1 py-1.5 text-sm bg-yellow-400 text-black rounded-lg font-medium disabled:opacity-50 hover:bg-yellow-500 transition-colors"
              >
                Save
              </button>
              <button
                onClick={onCancelHighlight}
                className="px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
