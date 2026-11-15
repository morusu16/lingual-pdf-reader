import { describe, it, expect, beforeEach } from 'vitest';
import {
  getProgress,
  saveProgress,
  deleteProgress,
  getSettings,
  saveSettings,
  addNote,
  getNotes,
  deleteNote,
  DEFAULT_SETTINGS,
} from '../src/services/storage/localStorage';

describe('localStorage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('ReadingProgress', () => {
    it('保存されていない本の場合はデフォルトの進捗を返す', () => {
      const progress = getProgress('non_existent_book');
      expect(progress.bookId).toBe('non_existent_book');
      expect(progress.currentPage).toBe(1);
      expect(progress.currentSentenceIndex).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it('進捗を保存して正しく復元できる', () => {
      const data = {
        bookId: 'book_123',
        currentPage: 3,
        currentSentenceIndex: 15,
        percentage: 45,
        lastReadAt: 123456789,
      };
      saveProgress(data);
      const retrieved = getProgress('book_123');
      expect(retrieved).toEqual(data);
    });

    it('進捗を削除できる', () => {
      saveProgress({
        bookId: 'book_del',
        currentPage: 2,
        currentSentenceIndex: 5,
        percentage: 20,
        lastReadAt: Date.now(),
      });
      deleteProgress('book_del');
      const retrieved = getProgress('book_del');
      expect(retrieved.currentPage).toBe(1);
    });
  });

  describe('Settings', () => {
    it('初期状態ではデフォルト設定を返す', () => {
      const settings = getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('設定の更新と保存が反映される', () => {
      const updated = {
        ...DEFAULT_SETTINGS,
        theme: 'dark' as const,
        fontSize: 24,
      };
      saveSettings(updated);
      const retrieved = getSettings();
      expect(retrieved.theme).toBe('dark');
      expect(retrieved.fontSize).toBe(24);
    });
  });

  describe('Notes', () => {
    it('メモの追加・取得・削除が正しく動作する', () => {
      expect(getNotes()).toHaveLength(0);

      const note = addNote({
        bookId: 'book_abc',
        pageNumber: 2,
        sentenceIndex: 4,
        selectedText: 'adventurous',
        definition: '冒険的な、大胆な',
        userComment: 'お気に入りの単語',
      });

      expect(note.id).toBeDefined();
      expect(note.selectedText).toBe('adventurous');

      const all = getNotes();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(note.id);

      deleteNote(note.id);
      expect(getNotes()).toHaveLength(0);
    });
  });
});
