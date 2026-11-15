// ==========================================
// 書籍・コンテンツデータモデル (IndexedDB)
// ==========================================

export interface Book {
  id: string;                 // 一意のUUID
  title: string;              // 抽出タイトルまたはファイル名
  fileName: string;           // 元ファイル名
  fileSize: number;           // ファイルサイズ (bytes)
  totalPages: number;         // 総ページ数
  createdAt: number;          // 登録日時 (timestamp)
  updatedAt: number;          // 更新日時 (timestamp)
  sourceType: 'pdf' | 'text'; // PDFファイル由来 or 直接入力テキスト
  pdfBlob?: Blob;             // PDFファイル本体
}

export interface Sentence {
  index: number;              // 全体を通じた文インデックス (0始まり)
  pageNumber: number;         // 所属ページ番号 (1始まり)
  text: string;               // 画面表示用テキスト
  speechText: string;         // 読み上げ用テキスト（略語展開や記号補正）
}

export interface PageContent {
  pageNumber: number;         // 1始まり
  rawText: string;
  sentences: Sentence[];
}

export interface BookContent {
  bookId: string;
  pages: PageContent[];
  totalSentences: number;
}

// ==========================================
// 読書進捗・設定・メモ (localStorage)
// ==========================================

export interface ReadingProgress {
  bookId: string;
  currentPage: number;
  currentSentenceIndex: number;
  percentage: number;         // 0 - 100
  lastReadAt: number;
}

export interface AppSettings {
  version: number;
  theme: 'light' | 'dark' | 'sepia';
  fontSize: number;           // px (14 - 32)
  autoScroll: boolean;
  voiceURI: string;
  voiceLang: string;
  rate: number;               // 0.5 - 2.0
  pitch: number;              // 0.5 - 1.5
  repeatMode: 'none' | 'sentence';
  fontFamily: 'serif' | 'sans' | 'mono';
  volume: number;             // 0.0 - 1.0
  highlightColor: 'amber' | 'green' | 'blue' | 'purple' | 'pink';
  forcedLang: string;         // '' = 自動, 'en-US', 'ja-JP', 'fr-FR', 'de-DE', 'es-ES'
  expressiveMode?: boolean;   // 抑揚・自然な呼吸とイントネーション強化モード
}

export interface Bookmark {
  id: string;
  bookId: string;
  sentenceIndex: number;
  pageNumber: number;
  text: string;               // 先頭30文字
  createdAt: number;
}

export interface NoteItem {
  id: string;
  bookId: string;
  pageNumber: number;
  sentenceIndex: number;
  selectedText: string;
  definition: string;
  userComment: string;
  createdAt: number;
  updatedAt: number;
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  text: string;
}

export interface ExtractionProgress {
  stage: 'idle' | 'parsing' | 'extracting' | 'segmenting' | 'saving' | 'complete' | 'error';
  currentPage: number;
  totalPages: number;
  percentage: number;
  message: string;
}
