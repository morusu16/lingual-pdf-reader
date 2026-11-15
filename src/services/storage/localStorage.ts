import type { AppSettings, Bookmark, NoteItem, ReadingProgress } from '../../types';

const PROGRESS_PREFIX = 'polyglot_progress_';
const SETTINGS_KEY = 'polyglot_settings_v1';
const NOTES_KEY = 'polyglot_notes_v1';
const BOOKMARKS_KEY = 'polyglot_bookmarks_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  theme: 'light',
  fontSize: 18,
  autoScroll: true,
  voiceURI: '',
  voiceLang: 'en-US',
  rate: 1.0,
  pitch: 1.0,
  repeatMode: 'none',
  fontFamily: 'serif',
  volume: 1.0,
  highlightColor: 'amber',
  forcedLang: '',
  expressiveMode: true,
};

// ==========================================
// 読書進捗
// ==========================================

export function getProgress(bookId: string): ReadingProgress {
  try {
    const raw = localStorage.getItem(`${PROGRESS_PREFIX}${bookId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.currentPage === 'number' && typeof parsed.currentSentenceIndex === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn(`Failed to read progress for ${bookId}:`, e);
  }
  return {
    bookId,
    currentPage: 1,
    currentSentenceIndex: 0,
    percentage: 0,
    lastReadAt: Date.now(),
  };
}

export function saveProgress(progress: ReadingProgress): void {
  try {
    localStorage.setItem(`${PROGRESS_PREFIX}${progress.bookId}`, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress to localStorage:', e);
  }
}

export function deleteProgress(bookId: string): void {
  try {
    localStorage.removeItem(`${PROGRESS_PREFIX}${bookId}`);
  } catch (e) {
    console.warn(`Failed to delete progress for ${bookId}:`, e);
  }
}

// ==========================================
// アプリ設定
// ==========================================

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse settings, using defaults:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
}

// ==========================================
// メモ・単語帳
// ==========================================

export function getNotes(): NoteItem[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse notes:', e);
  }
  return [];
}

export function saveNotes(notes: NoteItem[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save notes:', e);
  }
}

export function addNote(note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>): NoteItem {
  const notes = getNotes();
  const newNote: NoteItem = {
    ...note,
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  notes.unshift(newNote);
  saveNotes(notes);
  return newNote;
}

export function updateNote(id: string, updates: Partial<Pick<NoteItem, 'definition' | 'userComment'>>): void {
  const notes = getNotes();
  const idx = notes.findIndex(n => n.id === id);
  if (idx !== -1) {
    notes[idx] = {
      ...notes[idx],
      ...updates,
      updatedAt: Date.now(),
    };
    saveNotes(notes);
  }
}

export function deleteNote(id: string): void {
  const notes = getNotes();
  const filtered = notes.filter(n => n.id !== id);
  saveNotes(filtered);
}

export function deleteNotesForBook(bookId: string): void {
  const notes = getNotes();
  const filtered = notes.filter(n => n.bookId !== bookId);
  saveNotes(filtered);
}

// ==========================================
// しおり (Bookmark)
// ==========================================

export function getBookmarks(bookId?: string): Bookmark[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return bookId ? parsed.filter((b: Bookmark) => b.bookId === bookId) : parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse bookmarks:', e);
  }
  return [];
}

export function addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Bookmark {
  const all = getBookmarks();
  const newBm: Bookmark = {
    ...bookmark,
    id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: Date.now(),
  };
  all.unshift(newBm);
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save bookmarks:', e);
  }
  return newBm;
}

export function deleteBookmark(id: string): void {
  const all = getBookmarks();
  const filtered = all.filter(b => b.id !== id);
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete bookmark:', e);
  }
}

export function deleteBookmarksForBook(bookId: string): void {
  const all = getBookmarks();
  const filtered = all.filter(b => b.bookId !== bookId);
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete bookmarks for book:', e);
  }
}
