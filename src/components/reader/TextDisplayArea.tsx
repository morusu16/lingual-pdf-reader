import React, { useEffect, useRef } from 'react';
import type { BookContent, Sentence } from '../../types';

interface TextDisplayAreaProps {
  content: BookContent;
  currentSentenceIndex: number;
  onSentenceClick: (sentence: Sentence) => void;
  fontSize: number;
  fontFamily?: 'serif' | 'sans' | 'mono';
  highlightColor?: 'amber' | 'green' | 'blue' | 'purple' | 'pink';
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const TextDisplayArea: React.FC<TextDisplayAreaProps> = ({
  content,
  currentSentenceIndex,
  onSentenceClick,
  fontSize,
  fontFamily = 'serif',
  highlightColor = 'amber',
  containerRef,
}) => {
  const activeSentenceRef = useRef<HTMLSpanElement>(null);

  // 現在の文が変わった時、画面外にあればスムーズにスクロール
  useEffect(() => {
    if (activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentSentenceIndex]);

  // ハイライト色スタイル定義
  const getHighlightClass = () => {
    switch (highlightColor) {
      case 'green':
        return 'bg-emerald-200/90 dark:bg-emerald-950/70 text-slate-950 dark:text-emerald-100 ring-1 ring-emerald-400 dark:ring-emerald-600 shadow-xs';
      case 'blue':
        return 'bg-sky-200/90 dark:bg-sky-950/70 text-slate-950 dark:text-sky-100 ring-1 ring-sky-400 dark:ring-sky-600 shadow-xs';
      case 'purple':
        return 'bg-purple-200/90 dark:bg-purple-950/70 text-slate-950 dark:text-purple-100 ring-1 ring-purple-400 dark:ring-purple-600 shadow-xs';
      case 'pink':
        return 'bg-rose-200/90 dark:bg-rose-950/70 text-slate-950 dark:text-rose-100 ring-1 ring-rose-400 dark:ring-rose-600 shadow-xs';
      case 'amber':
      default:
        return 'bg-amber-200/90 dark:bg-amber-900/50 text-slate-950 dark:text-amber-100 ring-1 ring-amber-300 dark:ring-amber-700/60 shadow-xs';
    }
  };

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'sans':
        return 'font-sans';
      case 'mono':
        return 'font-mono';
      case 'serif':
      default:
        return 'font-serif';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`max-w-3xl w-full mx-auto px-5 py-8 space-y-10 selection:bg-indigo-100 dark:selection:bg-indigo-900/60 selection:text-indigo-900 dark:selection:text-indigo-200 ${getFontFamilyClass()}`}
      style={{ fontSize: `${fontSize}px`, lineHeight: 1.85 }}
    >
      {content.pages.map((page) => (
        <article
          key={`page-${page.pageNumber}`}
          className="space-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800 first:border-t-0"
        >
          {/* ページ番号バッジ */}
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-mono py-1 select-none">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              ページ {page.pageNumber}
            </span>
          </div>

          {/* ページ本文（文単位のレンダリング） */}
          <div className="text-slate-800 dark:text-slate-100 transition-colors">
            {page.sentences.length > 0 ? (
              page.sentences.map((sentence) => {
                const isActive = sentence.index === currentSentenceIndex;
                return (
                  <span
                    key={`sent-${sentence.index}`}
                    ref={isActive ? activeSentenceRef : null}
                    onClick={() => onSentenceClick(sentence)}
                    className={`inline cursor-pointer rounded-xs transition-colors duration-150 mr-1.5 ${
                      isActive
                        ? `${getHighlightClass()} px-1 py-0.5 font-medium`
                        : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-indigo-700 dark:hover:text-indigo-300'
                    }`}
                    title="クリックしてこの文を選択"
                  >
                    {sentence.text}
                  </span>
                );
              })
            ) : (
              <p className="italic text-slate-400 text-sm">
                （このページにはテキストがありません）
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};
