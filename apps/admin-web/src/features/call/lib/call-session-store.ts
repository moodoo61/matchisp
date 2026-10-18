const STORAGE_KEY = 'match.call.line';

export type SavedCallLine = {
  extension: string;
  password: string;
};

export function loadSavedCallLine(): SavedCallLine | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedCallLine;
    if (!parsed?.extension || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCallLine(line: SavedCallLine): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(line));
}

export function clearSavedCallLine(): void {
  localStorage.removeItem(STORAGE_KEY);
}
