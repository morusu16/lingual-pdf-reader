import React from 'react';
import type { Bookmark } from '../../types';
import { X, Trash2, BookmarkIcon } from 'lucide-react';

interface BookmarkPanelProps {
  bookmarks: Bookmark[];
  onClose: () => void;
  onJump: (sentenceIndex: number) => void;
  onDelete: (id: string) => void;
}

export const BookmarkPanel: React.FC<BookmarkPanelProps> = ({
  bookmarks,
  onClose,
  onJump,
  onDelete,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* パネル本体 */}
      <div
        className="relative w-80 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
            <BookmarkIcon size={16} className="text-indigo-500" />
            しおり一覧
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>

        {/* ブックマークリスト */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {bookmarks.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
              <BookmarkIcon size={32} className="mx-auto mb-3 opacity-30" />
              <p>しおりはまだありません</p>
              <p className="text-xs mt-1">コントロールバーの🔖ボタンで追加できます</p>
            </div>
          ) : (
            bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 space-y-2 border border-slate-200/60 dark:border-slate-700/60"
              >
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  「{bm.text}」
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    ページ {bm.pageNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onJump(bm.sentenceIndex)}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer font-medium"
                    >
                      ジャンプ
                    </button>
                    <button
                      onClick={() => onDelete(bm.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      aria-label="削除"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
