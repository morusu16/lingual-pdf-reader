import React, { useRef, useState } from 'react';
import type { ExtractionProgress } from '../../types';
import { FileUp, Loader2, Sparkles } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  progress: ExtractionProgress | null;
  isProcessing: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelect,
  progress,
  isProcessing,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isProcessing) return;

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      onFileSelect(files[0]);
    } else if (files.length > 0) {
      alert('PDFファイル（.pdf）を選択してください。');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
      // 次回同じファイルを再度選択できるようにリセット
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isProcessing && fileInputRef.current?.click()}
      className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer p-6 sm:p-8 text-center ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30 scale-[1.01]'
          : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
      } ${isProcessing ? 'pointer-events-none' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={isProcessing}
      />

      {isProcessing && progress ? (
        <div className="flex flex-col items-center justify-center space-y-3 py-2">
          <Loader2 className="h-9 w-9 text-indigo-600 animate-spin" />
          <div className="space-y-1 w-full max-w-xs mx-auto">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {progress.message}
            </p>
            {progress.totalPages > 0 && (
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            )}
            <p className="text-xs text-slate-400">
              {progress.totalPages > 0
                ? `${progress.currentPage} / ${progress.totalPages} ページ (${progress.percentage}%)`
                : '準備中...'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-xs border border-slate-200/80 dark:border-slate-700/80 text-indigo-600 dark:text-indigo-400">
            <FileUp size={24} />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">
              ここにPDFファイルをドラッグ＆ドロップ
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              またはクリックしてローカルのPDFを選択
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <Sparkles size={12} className="text-amber-500" />
            <span>ブラウザ内のみで高速解析（サーバーへ送信されません）</span>
          </div>
        </div>
      )}
    </div>
  );
};
