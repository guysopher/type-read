export interface SavedText {
  id: string;
  title: string;
  text: string;
  progress: {
    currentWordIndex: number;
    wordsTyped: number;
    correctKeystrokes: number;
    totalKeystrokes: number;
    totalTime: number; // accumulated time in ms
  };
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "typeread_saved_texts";

export function getSavedTexts(): SavedText[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveText(saved: SavedText): void {
  const texts = getSavedTexts();
  const existingIndex = texts.findIndex((t) => t.id === saved.id);

  if (existingIndex >= 0) {
    texts[existingIndex] = saved;
  } else {
    texts.unshift(saved);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(texts));
}

export function deleteText(id: string): void {
  const texts = getSavedTexts().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(texts));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
