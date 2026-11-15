import React, { useState, useRef } from 'react';
import { X, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import {
  getSettings,
  getProgress,
  getNotes,
  getBookmarks,
  saveSettings,
  saveNotes,
  saveProgress,
} from '../../services/storage/localStorage';
import type { NoteItem, Bookmark, AppSettings, ReadingProgress } from '../../types';

interface BackupModalProps {
  bookIds: string[];
  onClose: () => void;
}

interface BackupData {
  version: number;
  exportedAt: string;
  settings: AppSettings;
  progress: Record<string, ReadingProgress>;
  notes: NoteItem[];
  bookmarks: Bookmark[];
}

function isValidBackup(obj: unknown): obj is BackupData {
  if (typeof obj !== 'object' || obj === null) return false;
  const data = obj as Record<string, unknown>;
  return typeof data.version === 'number' && data.version >= 1;
}

export const BackupModal: React.FC<BackupModalProps> = ({ bookIds, onClose }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importStatus, setImportStatus] = useState<'idle' | 'preview' | 'done' | 'error'>('idle');
  const [importData, setImportData] = useState<BackupData | null>(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const progressMap: Record<string, ReadingProgress> = {};
    for (const id of bookIds) {
      progressMap[id] = getProgress(id);
    }

    const backup: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: getSettings(),
      progress: progressMap,
      notes: getNotes(),
      bookmarks: getBookmarks(),
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `polyglot_backup_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!isValidBackup(parsed)) {
          setImportError('無効なバックアップファイルです（version フィールドが必要です）');
          setImportStatus('error');
          return;
        }
        setImportData(parsed);
        setImportStatus('preview');
        setImportError('');
      } catch {
        setImportError('JSONの解析に失敗しました。正しいバックアップファイルを選択してください。');
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = (mode: 'merge' | 'replace') => {
    if (!importData) return;

    if (mode === 'replace') {
      saveSettings(importData.settings);
      const notes = importData.notes || [];
      saveNotes(notes);
      // Replace bookmarks (stored separately)
      try {
        localStorage.setItem('polyglot_bookmarks_v1', JSON.stringify(importData.bookmarks || []));
      } catch {}
      for (const [, progress] of Object.entries(importData.progress || {})) {
        saveProgress(progress);
      }
    } else {
      // Merge: don't overwrite settings, just add notes/bookmarks/progress
      const existingNotes = getNotes();
      const importedNotes = importData.notes || [];
      const existingIds = new Set(existingNotes.map((n) => n.id));
      const newNotes = importedNotes.filter((n) => !existingIds.has(n.id));
      saveNotes([...existingNotes, ...newNotes]);

      try {
        const existingBm: Bookmark[] = getBookmarks();
        const importedBm: Bookmark[] = importData.bookmarks || [];
        const existingBmIds = new Set(existingBm.map((b) => b.id));
        const newBm = importedBm.filter((b) => !existingBmIds.has(b.id));
        localStorage.setItem('polyglot_bookmarks_v1', JSON.stringify([...existingBm, ...newBm]));
      } catch {}

      for (const [, progress] of Object.entries(importData.progress || {})) {
        saveProgress(progress);
      }
    }
    setImportStatus('done');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">📦 バックアップ</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'export'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            エクスポート
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'import'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            インポート
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                設定・進捗・メモ・しおりをJSONファイルとしてダウンロードします。
                PDFコンテンツ自体は含まれません。
              </p>
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                <p>✔ アプリ設定（テーマ、フォントサイズ等）</p>
                <p>✔ 読書進捗（{bookIds.length} 冊分）</p>
                <p>✔ メモ・単語帳</p>
                <p>✔ しおり</p>
              </div>
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors cursor-pointer"
              >
                <Download size={16} />
                JSONファイルをダウンロード
              </button>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              {importStatus === 'done' ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle size={36} className="mx-auto text-emerald-500" />
                  <p className="font-semibold text-slate-900 dark:text-slate-100">インポート完了！</p>
                  <p className="text-sm text-slate-500">データが正常にインポートされました。</p>
                  <button
                    onClick={onClose}
                    className="mt-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    閉じる
                  </button>
                </div>
              ) : importStatus === 'preview' && importData ? (
                <div className="space-y-3">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">プレビュー</p>
                    <p>バージョン: {importData.version}</p>
                    <p>エクスポート日時: {new Date(importData.exportedAt).toLocaleString('ja-JP')}</p>
                    <p>メモ数: {(importData.notes || []).length} 件</p>
                    <p>しおり数: {(importData.bookmarks || []).length} 件</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleImport('merge')}
                      className="py-2 px-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
                    >
                      マージ（追加のみ）
                    </button>
                    <button
                      onClick={() => handleImport('replace')}
                      className="py-2 px-3 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors cursor-pointer"
                    >
                      上書き（全置換）
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    以前にエクスポートしたJSONバックアップファイルを選択してください。
                  </p>
                  {importStatus === 'error' && (
                    <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg p-3 text-xs">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <p>{importError}</p>
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                  >
                    <Upload size={16} />
                    JSONファイルを選択
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
