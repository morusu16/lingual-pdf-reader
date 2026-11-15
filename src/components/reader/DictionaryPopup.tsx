import React, { useEffect, useRef, useState } from 'react';
import { X, BookmarkPlus, Volume2 } from 'lucide-react';
import { miniDict } from '../../services/dictionary/miniDict';
import { addNote } from '../../services/storage/localStorage';

interface DictionaryPopupProps {
  bookId: string;
  currentSentenceIndex: number;
  currentPageNumber: number;
  onNoteAdded: () => void;
  containerRef: React.RefObject<HTMLElement | null>;
  onSpeakWord?: (word: string) => void;
}

interface PopupState {
  word: string;
  definition: string;
  x: number;
  y: number;
}

export const DictionaryPopup: React.FC<DictionaryPopupProps> = ({
  bookId,
  currentSentenceIndex,
  currentPageNumber,
  onNoteAdded,
  containerRef,
  onSpeakWord,
}) => {
  const [popup, setPopup] = useState<PopupState | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionEnd = () => {
      const selection = window.getSelection();
      if (!selection) return;
      const raw = selection.toString().trim();
      if (!raw) {
        setPopup(null);
        return;
      }
      const wordCount = raw.split(/\s+/).length;
      if (wordCount < 1 || wordCount > 5) {
        setPopup(null);
        return;
      }

      // Get position from selection range
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Lookup: try exact match, then lowercase
      const key = raw.toLowerCase().replace(/[^a-z]/g, '');
      const definition = miniDict[key] || miniDict[raw.toLowerCase()] || null;

      setPopup({
        word: raw,
        definition: definition ?? '定義が見つかりません',
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + window.scrollY - 8,
      });
    };

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleSelectionEnd);
    container.addEventListener('touchend', handleSelectionEnd);

    return () => {
      container.removeEventListener('mouseup', handleSelectionEnd);
      container.removeEventListener('touchend', handleSelectionEnd);
    };
  }, [containerRef]);

  // Close on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopup(null);
      }
    };
    if (popup) {
      document.addEventListener('mousedown', handleMouseDown);
    }
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [popup]);

  if (!popup) return null;

  const handleAddNote = () => {
    addNote({
      bookId,
      pageNumber: currentPageNumber,
      sentenceIndex: currentSentenceIndex,
      selectedText: popup.word,
      definition: popup.definition,
      userComment: '',
    });
    onNoteAdded();
    setPopup(null);
  };

  return (
    <div
      ref={popupRef}
      className="fixed z-[60] transform -translate-x-1/2 -translate-y-full"
      style={{ left: popup.x, top: popup.y }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-3 w-56 text-xs">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{popup.word}</span>
            {onSpeakWord && (
              <button
                type="button"
                onClick={() => onSpeakWord(popup.word)}
                className="p-1 rounded-md text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                title="単語を発音"
                aria-label="発音を再生"
              >
                <Volume2 size={13} />
              </button>
            )}
          </div>
          <button
            onClick={() => setPopup(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0 p-0.5"
          >
            <X size={13} />
          </button>
        </div>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
          {popup.definition}
        </p>
        <button
          onClick={handleAddNote}
          className="flex items-center gap-1.5 w-full text-[11px] px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer font-medium"
        >
          <BookmarkPlus size={12} />
          メモに追加
        </button>
      </div>
      {/* 吹き出しの三角 */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white dark:border-t-slate-900" />
    </div>
  );
};
