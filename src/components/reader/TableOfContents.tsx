import React, { useState, useMemo } from 'react';
import type { BookContent } from '../../types';
import { X, List, Search } from 'lucide-react';

interface TableOfContentsProps {
  content: BookContent;
  currentPage: number;
  onJumpToPage: (sentenceIndex: number) => void;
  onClose: () => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  content,
  currentPage,
  onJumpToPage,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  const filteredPages = useMemo(() => {
    if (!query.trim()) return content.pages;
    const q = query.toLowerCase();
    return content.pages.filter(
      (p) =>
        `ページ ${p.pageNumber}`.includes(q) ||
        p.sentences.some((s) => s.text.toLowerCase().includes(q))
    );
  }, [content.pages, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
            <List size={16} className="text-indigo-500" />
            目次 / ページジャンプ
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 検索 */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="ページ番号またはテキストで絞り込み..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
            {query && (
              <button
                onClick={(e) => { e.stopPropagation(); setQuery(''); }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ページ一覧 */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredPages.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">該当するページが見つかりませんでした</p>
          ) : (
            filteredPages.map((page) => {
              const firstSentence = page.sentences[0];
              const isCurrentPage = page.pageNumber === currentPage;
              return (
                <button
                  key={page.pageNumber}
                  onClick={() => {
                    if (firstSentence) {
                      onJumpToPage(firstSentence.index);
                    }
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors cursor-pointer mb-1 ${
                    isCurrentPage
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${isCurrentPage ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                      ページ {page.pageNumber}
                      {isCurrentPage && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full">
                          現在地
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {page.sentences.length} 文
                    </span>
                  </div>
                  {firstSentence && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {firstSentence.text.slice(0, 60)}...
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
