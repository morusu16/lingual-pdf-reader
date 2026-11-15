import React, { useState } from 'react';
import type { NoteItem } from '../../types';
import { X, Trash2, Plus, FileText } from 'lucide-react';
import { updateNote } from '../../services/storage/localStorage';

interface ScratchpadPanelProps {
  notes: NoteItem[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onAddNote: () => void;
  onNoteUpdated: () => void;
}

export const ScratchpadPanel: React.FC<ScratchpadPanelProps> = ({
  notes,
  onClose,
  onDelete,
  onAddNote,
  onNoteUpdated,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const startEdit = (note: NoteItem) => {
    setEditingId(note.id);
    setEditText(note.userComment);
  };

  const saveEdit = (id: string) => {
    updateNote(id, { userComment: editText });
    setEditingId(null);
    onNoteUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-80 sm:w-96 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
            <FileText size={16} className="text-emerald-500" />
            メモ帳
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onAddNote(); }}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer font-medium"
            >
              <Plus size={12} />
              新規メモ追加
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* メモ一覧 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notes.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
              <FileText size={32} className="mx-auto mb-3 opacity-30" />
              <p>メモはまだありません</p>
              <p className="text-xs mt-1">「新規メモ追加」からメモを作成できます</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 space-y-2 border border-slate-200/60 dark:border-slate-700/60"
              >
                {note.selectedText && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 italic border-l-2 border-indigo-400 pl-2 leading-relaxed line-clamp-2">
                    "{note.selectedText}"
                  </p>
                )}
                {editingId === note.id ? (
                  <div className="space-y-1.5">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={4}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); saveEdit(note.id); }}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                      >
                        保存
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed cursor-pointer hover:text-indigo-700 dark:hover:text-indigo-300 whitespace-pre-wrap"
                    onClick={(e) => { e.stopPropagation(); startEdit(note); }}
                  >
                    {note.userComment || <span className="italic text-slate-400">（クリックしてメモを入力）</span>}
                  </p>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(note.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                    className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    aria-label="削除"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
