import React, { useState } from 'react';
import type { Book, ReadingProgress } from '../../types';
import { BookOpen, FileText, MoreVertical, Trash2 } from 'lucide-react';

interface BookCardProps {
  book: Book;
  progress: ReadingProgress;
  onOpen: (bookId: string) => void;
  onDelete: (bookId: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  progress,
  onOpen,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formattedDate = new Date(book.createdAt).toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  });

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setConfirmDelete(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(book.id);
    setConfirmDelete(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };

  return (
    <>
      <div
        onClick={() => onOpen(book.id)}
        className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden hover:-translate-y-0.5 select-none"
      >
        {/* 上部：本の表紙プレビュー風エリア */}
        <div className="h-32 sm:h-36 bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-900/90 p-4 flex flex-col justify-between border-b border-slate-100 dark:border-slate-800 relative">
          <div className="flex items-start justify-between">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                book.sourceType === 'pdf'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              {book.sourceType === 'pdf' ? (
                <>
                  <FileText size={10} /> PDF
                </>
              ) : (
                <>
                  <BookOpen size={10} /> TEXT
                </>
              )}
            </span>

            {/* 操作メニュー */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-colors"
                aria-label="メニュー"
              >
                <MoreVertical size={16} />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 py-1 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleDeleteClick}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left font-medium"
                  >
                    <Trash2 size={13} />
                    <span>本を削除</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 表紙のアイコンと背表紙風シャドウ */}
          <div className="flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:scale-105 transition-transform duration-200">
            {book.sourceType === 'pdf' ? <FileText size={42} strokeWidth={1.5} /> : <BookOpen size={42} strokeWidth={1.5} />}
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            {book.totalPages} {book.sourceType === 'pdf' ? 'ページ' : '段落'}
          </div>
        </div>

        {/* 下部：メタデータと進捗バー */}
        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
          <div>
            <h3
              className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
              title={book.title}
            >
              {book.title}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">追加: {formattedDate}</p>
          </div>

          {/* 進捗バー */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">進捗</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {Math.round(progress.percentage || 0)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 削除確認モーダル */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={handleCancelDelete}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-lg">
                <Trash2 size={20} />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                本を削除しますか？
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              「<b>{book.title}</b>」と、これに関連する抽出テキスト、読書位置、保存メモをすべて削除します。この操作は取り消せません。
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleCancelDelete}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-medium text-white shadow-sm cursor-pointer"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
