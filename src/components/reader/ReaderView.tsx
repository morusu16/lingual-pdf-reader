import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Book, BookContent, Bookmark, NoteItem, ReadingProgress, Sentence } from '../../types';
import { dbStorage } from '../../services/storage/indexedDB';
import {
  addBookmark,
  addNote,
  deleteBookmark,
  deleteNote,
  getBookmarks,
  getNotes,
  getProgress,
  getSettings,
  saveProgress,
  saveSettings,
} from '../../services/storage/localStorage';
import { ReaderHeader } from './ReaderHeader';
import { TextDisplayArea } from './TextDisplayArea';
import { AudioControlBar } from './AudioControlBar';
import { TableOfContents } from './TableOfContents';
import { BookmarkPanel } from './BookmarkPanel';
import { ScratchpadPanel } from './ScratchpadPanel';
import { DictionaryPopup } from './DictionaryPopup';
import { useSpeech } from '../../hooks/useSpeech';
import { Loader2 } from 'lucide-react';

interface ReaderViewProps {
  bookId: string;
  onBack: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  theme: 'light' | 'dark' | 'sepia';
  onToggleTheme: () => void;
  onShowToast?: (type: 'info' | 'success' | 'warning' | 'error', text: string) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  bookId,
  onBack,
  fontSize,
  onFontSizeChange,
  theme,
  onToggleTheme,
  onShowToast,
}) => {
  const [book, setBook] = useState<Book | null>(null);
  const [content, setContent] = useState<BookContent | null>(null);
  const [loading, setLoading] = useState(true);

  // モーダル・パネルの開閉ステート
  const [isTOCOpen, setIsTOCOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);

  // しおりとメモのリスト
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);

  // 表示設定ステート
  const initialSettings = useMemo(() => getSettings(), []);
  const [fontFamily, setFontFamilyState] = useState<'serif' | 'sans' | 'mono'>(
    initialSettings.fontFamily || 'serif'
  );
  const [highlightColor, setHighlightColorState] = useState<'amber' | 'green' | 'blue' | 'purple' | 'pink'>(
    initialSettings.highlightColor || 'amber'
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const [currentProgress, setCurrentProgress] = useState<ReadingProgress>({
    bookId,
    currentPage: 1,
    currentSentenceIndex: 0,
    percentage: 0,
    lastReadAt: Date.now(),
  });

  // しおりとメモの読み込み
  const reloadBookmarksAndNotes = () => {
    setBookmarks(getBookmarks(bookId));
    setNotes(getNotes().filter((n) => n.bookId === bookId));
  };

  useEffect(() => {
    reloadBookmarksAndNotes();
  }, [bookId]);

  // 全文フラット配列
  const allSentences = useMemo(() => {
    if (!content) return [];
    const list: Sentence[] = [];
    for (const page of content.pages) {
      list.push(...page.sentences);
    }
    return list;
  }, [content]);

  // 音声読み上げフック
  const {
    speechState,
    voices,
    activeSentenceIndex,
    rate,
    pitch,
    volume,
    selectedVoiceURI,
    repeatMode,
    forcedLang,
    expressiveMode,
    playFrom,
    resume,
    pause,
    stop,
    next,
    prev,
    setRate,
    setPitch,
    setVolume,
    setVoiceURI,
    setForcedLang,
    setExpressiveMode,
    toggleRepeat,
    previewVoice,
    speakWord,
  } = useSpeech({
    sentences: allSentences,
    initialRate: initialSettings.rate,
    initialPitch: initialSettings.pitch,
    initialVolume: initialSettings.volume ?? 1.0,
    initialVoiceURI: initialSettings.voiceURI,
    initialVoiceLang: initialSettings.voiceLang,
    initialRepeatMode: initialSettings.repeatMode,
    initialForcedLang: initialSettings.forcedLang || '',
    initialExpressiveMode: initialSettings.expressiveMode !== false,
    onSentenceChange: (newIndex) => {
      if (!content) return;
      const targetSentence = allSentences.find((s) => s.index === newIndex);
      const total = content.totalSentences || 1;
      const percentage = Math.min(100, Math.round(((newIndex + 1) / total) * 100));

      const updated: ReadingProgress = {
        bookId,
        currentPage: targetSentence ? targetSentence.pageNumber : 1,
        currentSentenceIndex: newIndex,
        percentage,
        lastReadAt: Date.now(),
      };
      setCurrentProgress(updated);
      saveProgress(updated);
    },
    onError: (err) => {
      console.warn('Speech error:', err);
    },
  });

  // 表示する現在のアクティブ文インデックス
  const highlightedIndex = speechState === 'playing' ? activeSentenceIndex : currentProgress.currentSentenceIndex;

  // 設定変更ハンドラーと永続化
  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    const curr = getSettings();
    saveSettings({ ...curr, rate: newRate });
  };

  const handlePitchChange = (newPitch: number) => {
    setPitch(newPitch);
    const curr = getSettings();
    saveSettings({ ...curr, pitch: newPitch });
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    const curr = getSettings();
    saveSettings({ ...curr, volume: newVolume });
  };

  const handleVoiceChange = (newVoiceURI: string) => {
    setVoiceURI(newVoiceURI);
    const voice = voices.find((v) => v.voiceURI === newVoiceURI);
    const curr = getSettings();
    saveSettings({
      ...curr,
      voiceURI: newVoiceURI,
      voiceLang: voice ? voice.lang : curr.voiceLang,
    });
  };

  const handleForcedLangChange = (lang: string) => {
    setForcedLang(lang);
    const curr = getSettings();
    saveSettings({ ...curr, forcedLang: lang });
    if (onShowToast) {
      onShowToast('info', lang ? `読み上げ言語を「${lang}」に固定しました` : '読み上げ言語を自動判定に戻しました');
    }
  };

  const handleFontFamilyChange = (font: 'serif' | 'sans' | 'mono') => {
    setFontFamilyState(font);
    const curr = getSettings();
    saveSettings({ ...curr, fontFamily: font });
  };

  const handleHighlightColorChange = (color: 'amber' | 'green' | 'blue' | 'purple' | 'pink') => {
    setHighlightColorState(color);
    const curr = getSettings();
    saveSettings({ ...curr, highlightColor: color });
  };

  const handleToggleExpressiveMode = (mode: boolean) => {
    setExpressiveMode(mode);
    const curr = getSettings();
    saveSettings({ ...curr, expressiveMode: mode });
    if (onShowToast) {
      onShowToast('info', mode ? '🎭 抑揚・呼吸感ブーストをONにしました' : '抑揚ブーストをOFFにしました');
    }
  };

  // 本とコンテンツの読み込み
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [fetchedBook, fetchedContent] = await Promise.all([
          dbStorage.getBook(bookId),
          dbStorage.getBookContent(bookId),
        ]);

        if (isMounted) {
          if (!fetchedBook || !fetchedContent) {
            alert('本のデータが見つかりませんでした。');
            onBack();
            return;
          }
          setBook(fetchedBook);
          setContent(fetchedContent);

          // 保存された読書進捗を復元
          const savedProgress = getProgress(bookId);
          setCurrentProgress(savedProgress);
        }
      } catch (err) {
        console.error('Failed to load book data:', err);
        alert('本の読み込み中にエラーが発生しました。');
        onBack();
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [bookId, onBack]);

  // 文クリック時：その文から即座に音声再生を開始
  const handleSentenceClick = (sentence: Sentence) => {
    playFrom(sentence.index);
  };

  // シークバー移動時
  const handleSeek = (index: number) => {
    playFrom(index);
  };

  // 再生ボタン
  const handlePlay = () => {
    if (speechState === 'paused') {
      resume();
    } else {
      playFrom(highlightedIndex);
    }
  };

  // しおりの追加
  const handleAddBookmark = () => {
    if (!content) return;
    const currentSent = allSentences.find((s) => s.index === highlightedIndex);
    const textPreview = currentSent ? currentSent.text.slice(0, 40) + '...' : `文 #${highlightedIndex + 1}`;

    addBookmark({
      bookId,
      sentenceIndex: highlightedIndex,
      pageNumber: currentSent ? currentSent.pageNumber : currentProgress.currentPage,
      text: textPreview,
    });
    reloadBookmarksAndNotes();
    if (onShowToast) {
      onShowToast('success', '🔖 しおりを挟みました！');
    }
  };

  // しおりの削除
  const handleDeleteBookmark = (id: string) => {
    deleteBookmark(id);
    reloadBookmarksAndNotes();
  };

  // メモの削除
  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    reloadBookmarksAndNotes();
  };

  // 目次やしおりから指定文へジャンプ
  const handleJumpToSentence = (sentenceIndex: number) => {
    playFrom(sentenceIndex);
    setIsTOCOpen(false);
    setIsBookmarksOpen(false);
  };

  // スペースキーで再生/一時停止、矢印キーで前後の文
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (speechState === 'playing') {
          pause();
        } else {
          handlePlay();
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [speechState, highlightedIndex]);

  // 画面離脱時に音声を停止
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  if (loading || !book || !content) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">本を読み込んでいます...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* リーダーヘッダー */}
      <ReaderHeader
        book={book}
        progress={currentProgress}
        onBack={() => {
          stop();
          onBack();
        }}
        fontSize={fontSize}
        onFontSizeChange={onFontSizeChange}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenTOC={() => setIsTOCOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenScratchpad={() => setIsScratchpadOpen(true)}
        bookmarkCount={bookmarks.length}
        noteCount={notes.length}
      />

      {/* 本文表示エリア */}
      <main className="flex-1 overflow-y-auto pb-28">
        <TextDisplayArea
          content={content}
          currentSentenceIndex={highlightedIndex}
          onSentenceClick={handleSentenceClick}
          fontSize={fontSize}
          fontFamily={fontFamily}
          highlightColor={highlightColor}
          containerRef={containerRef}
        />
      </main>

      {/* 辞書ポップアップ（単語選択で起動） */}
      <DictionaryPopup
        bookId={bookId}
        currentSentenceIndex={highlightedIndex}
        currentPageNumber={currentProgress.currentPage}
        onNoteAdded={() => {
          reloadBookmarksAndNotes();
          if (onShowToast) onShowToast('success', 'メモ帳に単語を追加しました！');
        }}
        containerRef={containerRef}
        onSpeakWord={speakWord}
      />

      {/* 下部固定の音声コントローラー */}
      <AudioControlBar
        isPlaying={speechState === 'playing'}
        isPaused={speechState === 'paused'}
        currentIndex={highlightedIndex}
        totalSentences={content.totalSentences}
        onPlay={handlePlay}
        onPause={pause}
        onStop={stop}
        onNext={next}
        onPrev={prev}
        onSeek={handleSeek}
        repeatMode={repeatMode}
        onToggleRepeat={toggleRepeat}
        rate={rate}
        onRateChange={handleRateChange}
        pitch={pitch}
        onPitchChange={handlePitchChange}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        voices={voices}
        selectedVoiceURI={selectedVoiceURI}
        onVoiceChange={handleVoiceChange}
        forcedLang={forcedLang}
        onForcedLangChange={handleForcedLangChange}
        fontFamily={fontFamily}
        onFontFamilyChange={handleFontFamilyChange}
        highlightColor={highlightColor}
        onHighlightColorChange={handleHighlightColorChange}
        onAddBookmark={handleAddBookmark}
        expressiveMode={expressiveMode}
        onToggleExpressiveMode={handleToggleExpressiveMode}
        onPreviewVoice={previewVoice}
      />

      {/* 目次 / ページジャンプモーダル */}
      {isTOCOpen && (
        <TableOfContents
          content={content}
          currentPage={currentProgress.currentPage}
          onJumpToPage={handleJumpToSentence}
          onClose={() => setIsTOCOpen(false)}
        />
      )}

      {/* しおり一覧パネル */}
      {isBookmarksOpen && (
        <BookmarkPanel
          bookmarks={bookmarks}
          onClose={() => setIsBookmarksOpen(false)}
          onJump={handleJumpToSentence}
          onDelete={handleDeleteBookmark}
        />
      )}

      {/* 一時メモ帳 (Scratchpad) パネル */}
      {isScratchpadOpen && (
        <ScratchpadPanel
          notes={notes}
          onClose={() => setIsScratchpadOpen(false)}
          onDelete={handleDeleteNote}
          onAddNote={() => {
            // 現在の文をメモとして新規登録するダイアログを起動
            const currentSent = allSentences.find((s) => s.index === highlightedIndex);
            const userComment = prompt('メモを入力してください:');
            if (userComment && userComment.trim()) {
              addNote({
                bookId,
                pageNumber: currentSent ? currentSent.pageNumber : currentProgress.currentPage,
                sentenceIndex: highlightedIndex,
                selectedText: currentSent ? currentSent.text.slice(0, 30) : '',
                definition: '',
                userComment: userComment.trim(),
              });
              reloadBookmarksAndNotes();
              if (onShowToast) onShowToast('success', 'メモを保存しました！');
            }
          }}
          onNoteUpdated={reloadBookmarksAndNotes}
        />
      )}
    </div>
  );
};
