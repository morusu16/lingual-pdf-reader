import { useEffect, useState } from 'react';
import type { Book, ExtractionProgress, ReadingProgress, ToastMessage } from './types';
import { dbStorage } from './services/storage/indexedDB';
import {
  deleteBookmarksForBook,
  deleteNotesForBook,
  deleteProgress,
  getProgress,
  getSettings,
  saveSettings,
} from './services/storage/localStorage';
import { createBookFromDirectText, parsePdfFile } from './services/pdf/pdfParser';
import { BookShelf } from './components/library/BookShelf';
import { ReaderView } from './components/reader/ReaderView';
import { ToastContainer } from './components/common/Toast';

export function App() {
  const [currentView, setCurrentView] = useState<'shelf' | 'reader'>('shelf');
  const [activeBookId, setActiveBookId] = useState<string | null>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ReadingProgress>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null);

  const [settings, setAppSettings] = useState(getSettings());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // トースト表示ヘルパー
  const addToast = (type: ToastMessage['type'], text: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 本一覧と各進捗の取得
  const loadBooksAndProgress = async () => {
    try {
      const allBooks = await dbStorage.getAllBooks();
      setBooks(allBooks);

      const pMap: Record<string, ReadingProgress> = {};
      for (const book of allBooks) {
        pMap[book.id] = getProgress(book.id);
      }
      setProgressMap(pMap);
    } catch (err) {
      console.error('Failed to load books:', err);
      addToast('error', '書籍データの読み込みに失敗しました。');
    }
  };

  useEffect(() => {
    loadBooksAndProgress();
  }, []);

  // テーマ適用（htmlタグのclass: light / sepia / dark）
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'sepia');
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'sepia') {
      root.classList.add('sepia');
    }
  }, [settings.theme]);

  // テーマ3段階切り替え（ライト ⇄ セピア ⇄ ダーク）
  const handleToggleTheme = () => {
    let nextTheme: 'light' | 'dark' | 'sepia' = 'light';
    let toastLabel = '☀️ ライトモードに切り替えました';

    if (settings.theme === 'light') {
      nextTheme = 'sepia';
      toastLabel = '📜 セピアモードに切り替えました（目に優しい読書）';
    } else if (settings.theme === 'sepia') {
      nextTheme = 'dark';
      toastLabel = '🌙 ダークモードに切り替えました';
    } else {
      nextTheme = 'light';
      toastLabel = '☀️ ライトモードに切り替えました';
    }

    const updated = { ...settings, theme: nextTheme };
    setAppSettings(updated);
    saveSettings(updated);
    addToast('info', toastLabel);
  };

  // 文字サイズ変更
  const handleFontSizeChange = (size: number) => {
    const updated = { ...settings, fontSize: size };
    setAppSettings(updated);
    saveSettings(updated);
  };

  // PDFファイル選択・パース処理
  const handleFileSelect = async (file: File) => {
    if (isProcessing) return;

    try {
      // 1. 重複チェック
      const existing = await dbStorage.checkDuplicate(file.name, file.size);
      if (existing) {
        const proceed = confirm(
          `「${file.name}」は既に本棚に登録されています。\nもう一度新しく追加しますか？`
        );
        if (!proceed) return;
      }

      setIsProcessing(true);
      setExtractionProgress({
        stage: 'parsing',
        currentPage: 0,
        totalPages: 0,
        percentage: 0,
        message: 'PDFファイルを解析中...',
      });

      // 2. パース実行
      const { book, content } = await parsePdfFile(file, (p) => {
        setExtractionProgress(p);
      });

      // 3. IndexedDB に保存
      await dbStorage.saveBook(book, content);

      // 4. 一覧リロード
      await loadBooksAndProgress();
      addToast('success', `「${book.title}」を本棚に追加しました！`);
    } catch (err) {
      console.error('PDF parsing error:', err);
      addToast('error', (err as Error).message || 'PDFの解析に失敗しました。');
    } finally {
      setIsProcessing(false);
      setExtractionProgress(null);
    }
  };

  // テキスト直接入力による本作成
  const handleDirectTextSubmit = async (title: string, text: string) => {
    try {
      const { book, content } = createBookFromDirectText(title, text);
      await dbStorage.saveBook(book, content);
      await loadBooksAndProgress();
      addToast('success', `テキスト本「${book.title}」を追加しました！`);
    } catch (err) {
      console.error('Direct text error:', err);
      addToast('error', (err as Error).message || 'テキストの保存に失敗しました。');
    }
  };

  // 本を開く
  const handleOpenBook = (bookId: string) => {
    setActiveBookId(bookId);
    setCurrentView('reader');
  };

  // 本棚へ戻る（進捗バーを最新に更新）
  const handleBackToShelf = () => {
    setCurrentView('shelf');
    setActiveBookId(null);
    loadBooksAndProgress();
  };

  // 本の削除
  const handleDeleteBook = async (bookId: string) => {
    try {
      await dbStorage.deleteBook(bookId);
      deleteProgress(bookId);
      deleteNotesForBook(bookId);
      deleteBookmarksForBook(bookId);
      await loadBooksAndProgress();
      addToast('info', '本と関連データを削除しました。');
    } catch (err) {
      console.error('Delete book error:', err);
      addToast('error', '本の削除に失敗しました。');
    }
  };

  return (
    <>
      {currentView === 'shelf' ? (
        <BookShelf
          books={books}
          progressMap={progressMap}
          isProcessing={isProcessing}
          progress={extractionProgress}
          onFileSelect={handleFileSelect}
          onDirectTextSubmit={handleDirectTextSubmit}
          onOpenBook={handleOpenBook}
          onDeleteBook={handleDeleteBook}
          theme={settings.theme}
          onToggleTheme={handleToggleTheme}
          onRefreshData={loadBooksAndProgress}
        />
      ) : activeBookId ? (
        <ReaderView
          bookId={activeBookId}
          onBack={handleBackToShelf}
          fontSize={settings.fontSize}
          onFontSizeChange={handleFontSizeChange}
          theme={settings.theme}
          onToggleTheme={handleToggleTheme}
          onShowToast={addToast}
        />
      ) : null}

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </>
  );
}

export default App;
