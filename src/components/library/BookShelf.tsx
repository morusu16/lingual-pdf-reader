import React, { useEffect, useState } from 'react';
import type { Book, ExtractionProgress, ReadingProgress } from '../../types';
import { BookCard } from './BookCard';
import { UploadZone } from './UploadZone';
import { DirectInputModal } from './DirectInputModal';
import { BackupModal } from './BackupModal';
import { PhoneSyncModal } from './PhoneSyncModal';
import { Button } from '../common/Button';
import { BookOpen, Database, Download, Edit3, Library, Moon, Scroll, Smartphone, Sparkles, Sun } from 'lucide-react';

interface BookShelfProps {
  books: Book[];
  progressMap: Record<string, ReadingProgress>;
  isProcessing: boolean;
  progress: ExtractionProgress | null;
  onFileSelect: (file: File) => void;
  onDirectTextSubmit: (title: string, text: string) => void;
  onOpenBook: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
  theme: 'light' | 'dark' | 'sepia';
  onToggleTheme: () => void;
  onRefreshData?: () => void;
}

export const BookShelf: React.FC<BookShelfProps> = ({
  books,
  progressMap,
  isProcessing,
  progress,
  onFileSelect,
  onDirectTextSubmit,
  onOpenBook,
  onDeleteBook,
  theme,
  onToggleTheme,
  onRefreshData,
}) => {
  const [isDirectInputOpen, setIsDirectInputOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isPhoneSyncOpen, setIsPhoneSyncOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 既にPWAアプリとして起動しているか確認
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert(
        '【アプリのインストール (PWA)】\n\n' +
        '・PC (Chrome / Edge): ブラウザのアドレスバー右端にある「インストール」アイコン、またはブラウザメニュー「アプリをインストール」をクリックしてください。\n\n' +
        '・iPhone (Safari): 画面下の共有ボタン（四角から上矢印）をタップし、「ホーム画面に追加」を選択してください。\n\n' +
        '・Android (Chrome): 右上のメニュー「︙」から「アプリをインストール」または「ホーム画面に追加」をタップしてください。'
      );
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'sepia':
        return <Scroll size={17} className="text-amber-700 dark:text-amber-300" />;
      case 'dark':
        return <Moon size={17} className="text-indigo-400" />;
      case 'light':
      default:
        return <Sun size={17} className="text-amber-500" />;
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* トップナビゲーションバー */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-xl shadow-xs">
            <Library size={20} />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 dark:from-white dark:via-slate-200 dark:to-indigo-300 bg-clip-text text-transparent">
              Polyglot Reader
            </h1>
            <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
              多言語対応・学習用PDFリーダー＆音声プレイヤー
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* スマホ連携（QRコード / URL） */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPhoneSyncOpen(true)}
            icon={<Smartphone size={14} className="text-emerald-500" />}
            title="スマホで開く（QRコード・Gmail送信）"
          >
            <span className="hidden sm:inline">スマホ連携</span>
            <span className="sm:hidden">スマホ</span>
          </Button>

          {/* PWA インストールボタン（未インストール時のみ表示） */}
          {!isStandalone && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleInstallClick}
              icon={<Download size={14} className="text-indigo-500 animate-pulse" />}
              title="端末にWebアプリとしてインストール (PWA)"
            >
              <span className="hidden sm:inline">アプリ保存</span>
              <span className="sm:hidden">インストール</span>
            </Button>
          )}

          {/* バックアップ（エクスポート / インポート） */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsBackupOpen(true)}
            icon={<Database size={14} />}
            title="読書進捗・メモ・しおりのバックアップ"
          >
            <span className="hidden sm:inline">バックアップ</span>
          </Button>

          {/* テキスト直接入力 */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsDirectInputOpen(true)}
            icon={<Edit3 size={14} />}
          >
            <span className="hidden sm:inline">テキスト直接入力</span>
            <span className="sm:hidden">テキスト</span>
          </Button>

          {/* テーマ切り替え（ライト ⇄ セピア ⇄ ダーク） */}
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="テーマ切り替え"
            title={getThemeTitle()}
          >
            {getThemeIcon()}
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* PDF追加ゾーン */}
        <section aria-label="PDFアップロード">
          <UploadZone
            onFileSelect={onFileSelect}
            progress={progress}
            isProcessing={isProcessing}
          />
        </section>

        {/* 本棚セクション */}
        <section aria-label="本棚一覧" className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>📚 私の本棚</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                  {books.length} 冊
                </span>
              </h2>
            </div>
          </div>

          {books.length === 0 ? (
            /* 空状態の案内UI */
            <div className="py-14 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/30 p-8 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BookOpen size={28} />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">
                  まだ本棚に本がありません
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  上のエリアに外国語のPDFファイルをドラッグ＆ドロップするか、「テキスト直接入力」から記事を貼り付けて、最初の学習本を追加しましょう。
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsDirectInputOpen(true)}
                  icon={<Sparkles size={14} />}
                >
                  サンプル英文で試してみる
                </Button>
              </div>
            </div>
          ) : (
            /* 本棚グリッド表示 */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  progress={
                    progressMap[book.id] || {
                      bookId: book.id,
                      currentPage: 1,
                      currentSentenceIndex: 0,
                      percentage: 0,
                      lastReadAt: book.createdAt,
                    }
                  }
                  onOpen={onOpenBook}
                  onDelete={onDeleteBook}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* フッター */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        <p>Polyglot PDF Reader — 100% ブラウザ完結・完全プライベート動作</p>
      </footer>

      {/* テキスト直接入力モーダル */}
      <DirectInputModal
        isOpen={isDirectInputOpen}
        onClose={() => setIsDirectInputOpen(false)}
        onSubmit={onDirectTextSubmit}
      />

      {/* バックアップ（エクスポート / インポート）モーダル */}
      {isBackupOpen && (
        <BackupModal
          bookIds={books.map((b) => b.id)}
          onClose={() => {
            setIsBackupOpen(false);
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* スマホ連携モーダル */}
      {isPhoneSyncOpen && (
        <PhoneSyncModal onClose={() => setIsPhoneSyncOpen(false)} />
      )}
    </div>
  );
};
