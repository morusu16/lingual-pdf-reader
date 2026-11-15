import React from 'react';
import type { Book, ReadingProgress } from '../../types';
import {
  ArrowLeft,
  Bookmark as BookmarkIcon,
  FileText,
  List,
  Minus,
  Moon,
  Plus,
  Scroll,
  Sun,
} from 'lucide-react';

interface ReaderHeaderProps {
  book: Book;
  progress: ReadingProgress;
  onBack: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  theme: 'light' | 'dark' | 'sepia';
  onToggleTheme: () => void;
  onOpenTOC: () => void;
  onOpenBookmarks: () => void;
  onOpenScratchpad: () => void;
  bookmarkCount?: number;
  noteCount?: number;
}

export const ReaderHeader: React.FC<ReaderHeaderProps> = ({
  book,
  progress,
  onBack,
  fontSize,
  onFontSizeChange,
  theme,
  onToggleTheme,
  onOpenTOC,
  onOpenBookmarks,
  onOpenScratchpad,
  bookmarkCount = 0,
  noteCount = 0,
}) => {
  const getThemeIcon = () => {
    switch (theme) {
      case 'sepia':
        return <Scroll size={16} className="text-amber-700 dark:text-amber-300" />;
      case 'dark':
        return <Moon size={16} className="text-indigo-400" />;
      case 'light':
      default:
        return <Sun size={16} className="text-amber-500" />;
    }
  };

  const getThemeTitle = () => {
    switch (theme) {
      case 'light':
        return 'セピアモードへ切り替え';
      case 'sepia':
        return 'ダークモードへ切り替え';
      case 'dark':
      default:
        return 'ライトモードへ切り替え';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 transition-colors">
      {/* 戻るボタンとタイトル */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          aria-label="本棚へ戻る"
          title="本棚へ戻る"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <h1
            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate"
            title={book.title}
          >
            {book.title}
          </h1>
          <p className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
            <span>ページ {progress.currentPage} / {book.totalPages}</span>
            <span>•</span>
            <span>進捗 {Math.round(progress.percentage || 0)}%</span>
          </p>
        </div>
      </div>

      {/* ツールバー：目次・しおり・メモ・文字サイズ・テーマ */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* 目次 / ページジャンプ */}
        <button
          onClick={onOpenTOC}
          className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs"
          aria-label="目次・ページジャンプ"
          title="目次 / ページジャンプ"
        >
          <List size={16} />
          <span className="hidden md:inline">目次</span>
        </button>

        {/* しおり一覧 */}
        <button
          onClick={onOpenBookmarks}
          className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer relative flex items-center gap-1 text-xs"
          aria-label="しおり一覧"
          title="挟んだしおり一覧"
        >
          <BookmarkIcon size={16} />
          <span className="hidden md:inline">しおり</span>
          {bookmarkCount > 0 && (
            <span className="px-1 py-0.2 text-[9px] font-bold rounded-full bg-indigo-600 text-white leading-none">
              {bookmarkCount}
            </span>
          )}
        </button>

        {/* メモ帳 (Scratchpad) */}
        <button
          onClick={onOpenScratchpad}
          className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer relative flex items-center gap-1 text-xs"
          aria-label="メモ帳"
          title="一時メモ帳 (Scratchpad)"
        >
          <FileText size={16} />
          <span className="hidden md:inline">メモ</span>
          {noteCount > 0 && (
            <span className="px-1 py-0.2 text-[9px] font-bold rounded-full bg-emerald-600 text-white leading-none">
              {noteCount}
            </span>
          )}
        </button>

        {/* 文字サイズ調整（スマホでも使いやすいコンパクト設計） */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onFontSizeChange(Math.max(14, fontSize - 2))}
            disabled={fontSize <= 14}
            className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 cursor-pointer"
            aria-label="文字を小さく"
            title="文字サイズ縮小"
          >
            <Minus size={13} />
          </button>
          <span className="text-[10px] sm:text-[11px] font-mono px-1 sm:px-1.5 text-slate-700 dark:text-slate-300 font-semibold select-none">
            {fontSize}
          </span>
          <button
            onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))}
            disabled={fontSize >= 32}
            className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 cursor-pointer"
            aria-label="文字を大きく"
            title="文字サイズ拡大"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* テーマ切り替え（ライト ⇄ セピア ⇄ ダーク） */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="テーマ切り替え"
          title={getThemeTitle()}
        >
          {getThemeIcon()}
        </button>
      </div>
    </header>
  );
};
