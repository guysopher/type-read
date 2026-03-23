import { useState, useEffect } from 'react';
import { saveText, type SavedText, type DetailedStats, type Highlight } from '@/lib/storage';

const AUTO_SAVE_INTERVAL = 10000; // Auto-save every 10 seconds

export interface UseAutoSaveProps {
  enabled: boolean;
  isComplete: boolean;
  hasStarted: boolean;
  saveId: string;
  title: string;
  text: string;
  currentWordIndex: number;
  wordsTyped: number;
  correctKeystrokes: number;
  totalKeystrokes: number;
  totalTime: number;
  detailedStats: DetailedStats;
  highlights: Highlight[];
  createdAt?: number;
}

export function useAutoSave({
  enabled,
  isComplete,
  hasStarted,
  saveId,
  title,
  text,
  currentWordIndex,
  wordsTyped,
  correctKeystrokes,
  totalKeystrokes,
  totalTime,
  detailedStats,
  highlights,
  createdAt,
}: UseAutoSaveProps) {
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (isComplete || !hasStarted || !enabled) return;

    const autoSave = setInterval(() => {
      const savedText: SavedText = {
        id: saveId,
        title,
        text,
        progress: {
          currentWordIndex,
          wordsTyped,
          correctKeystrokes,
          totalKeystrokes,
          totalTime,
        },
        detailedStats,
        highlights,
        createdAt: createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      saveText(savedText);
      setLastSavedTime(Date.now());
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(autoSave);
  }, [
    isComplete,
    hasStarted,
    enabled,
    saveId,
    title,
    text,
    currentWordIndex,
    wordsTyped,
    correctKeystrokes,
    totalKeystrokes,
    totalTime,
    detailedStats,
    highlights,
    createdAt,
  ]);

  /**
   * Manually trigger a save
   */
  const manualSave = () => {
    const savedText: SavedText = {
      id: saveId,
      title,
      text,
      progress: {
        currentWordIndex,
        wordsTyped,
        correctKeystrokes,
        totalKeystrokes,
        totalTime,
      },
      detailedStats,
      highlights,
      createdAt: createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    saveText(savedText);
    setLastSavedTime(Date.now());
    return true;
  };

  return {
    lastSavedTime,
    justSaved,
    manualSave,
  };
}
