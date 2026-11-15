import * as pdfjsLib from 'pdfjs-dist';
// Vite の ?url インポートでローカルworkerを安全に取得
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { Book, BookContent, ExtractionProgress, PageContent } from '../../types';
import { segmentTextIntoSentences } from '../speech/textSegmenter';

// Worker のソースを設定
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ParsePdfResult {
  book: Book;
  content: BookContent;
}

/**
 * PDFファイルをブラウザ内で段階的に解析し、テキストと文章構造を抽出する
 */
export async function parsePdfFile(
  file: File,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<ParsePdfResult> {
  const updateProgress = (
    stage: ExtractionProgress['stage'],
    currentPage: number,
    totalPages: number,
    message: string
  ) => {
    if (onProgress) {
      const percentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
      onProgress({ stage, currentPage, totalPages, percentage, message });
    }
  };

  updateProgress('parsing', 0, 0, 'PDFファイルを読み込んでいます...');

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch (err) {
    throw new Error(`ファイルの読み込みに失敗しました: ${(err as Error).message}`);
  }

  // PDF.js ドキュメントのロード
  let loadingTask: pdfjsLib.PDFDocumentLoadingTask;
  try {
    loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
  } catch (err) {
    throw new Error(`PDF初期化エラー: ${(err as Error).message}`);
  }

  let pdfDoc: pdfjsLib.PDFDocumentProxy;
  try {
    pdfDoc = await loadingTask.promise;
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string };
    if (error.name === 'PasswordException') {
      throw new Error('パスワードで保護されたPDFファイルです。パスワード保護を解除してから追加してください。');
    }
    if (error.name === 'InvalidPDFException') {
      throw new Error('破損したPDFファイル、または無効なPDF形式です。');
    }
    throw new Error(`PDFの解析に失敗しました: ${error.message || '不明なエラー'}`);
  }

  const totalPages = pdfDoc.numPages;
  if (totalPages === 0) {
    throw new Error('PDFにページが含まれていません。');
  }

  // メタデータ（タイトル等）の取得試行
  let title = file.name.replace(/\.[^/.]+$/, ''); // デフォルトは拡張子なしファイル名
  try {
    const metadata = await pdfDoc.getMetadata();
    const info = metadata?.info as { Title?: string } | undefined;
    if (info?.Title && info.Title.trim().length > 0) {
      title = info.Title.trim();
    }
  } catch (e) {
    console.warn('Metadata extraction skipped:', e);
  }

  updateProgress('extracting', 0, totalPages, `全 ${totalPages} ページの解析を開始します...`);

  const pages: PageContent[] = [];
  let totalSentenceCount = 0;
  let totalCharacterCount = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    updateProgress(
      'extracting',
      pageNum,
      totalPages,
      `ページ ${pageNum} / ${totalPages} のテキストを抽出中...`
    );

    // UIフリーズ防止のための微小ウェイト
    await new Promise(r => setTimeout(r, 10));

    try {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // 各アイテムのテキストを結合（改行や位置を考慮）
      const textItems: string[] = [];
      let lastY: number | null = null;

      for (const item of textContent.items) {
        if ('str' in item) {
          const str = item.str;
          // transform[5] は Y座標
          const y = item.transform ? item.transform[5] : null;

          if (lastY !== null && y !== null && Math.abs(y - lastY) > 8) {
            // Y座標が離れていれば改行とみなす
            textItems.push('\n');
          }
          textItems.push(str);
          lastY = y;
        }
      }

      const rawText = textItems.join(' ');
      totalCharacterCount += rawText.trim().length;

      // 文分割
      const sentences = segmentTextIntoSentences(rawText, pageNum, totalSentenceCount);
      totalSentenceCount += sentences.length;

      pages.push({
        pageNumber: pageNum,
        rawText,
        sentences,
      });
    } catch (pageErr) {
      console.warn(`Page ${pageNum} extraction failed:`, pageErr);
      pages.push({
        pageNumber: pageNum,
        rawText: `[ページ ${pageNum} の読み込みに失敗しました]`,
        sentences: [],
      });
    }
  }

  // スキャン画像のみのPDF判定（全ページの文字数が極端に少ない場合）
  if (totalCharacterCount < 20) {
    throw new Error(
      'このPDFからテキストを抽出できませんでした（スキャン画像または図形のみで構成されている可能性があります）。\n' +
      '※本アプリは現在OCR（画像文字認識）には対応していません。画面右上の「テキスト直接入力」をご利用ください。'
    );
  }

  updateProgress('saving', totalPages, totalPages, 'データを保存しています...');

  const bookId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const book: Book = {
    id: bookId,
    title,
    fileName: file.name,
    fileSize: file.size,
    totalPages,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sourceType: 'pdf',
    pdfBlob: file,
  };

  const content: BookContent = {
    bookId,
    pages,
    totalSentences: totalSentenceCount,
  };

  updateProgress('complete', totalPages, totalPages, '完了しました！');

  return { book, content };
}

/**
 * 直接貼り付けられたテキストから本・コンテンツを作成する
 */
export function createBookFromDirectText(title: string, text: string): ParsePdfResult {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error('テキストが空です。文章を入力してください。');
  }

  // 段落（2連続改行）を仮想ページとして分割
  const paragraphs = trimmedText
    .split(/\r?\n\s*\r?\n/)
    .map(p => p.trim())
    .filter(Boolean);

  const pages: PageContent[] = [];
  let totalSentenceCount = 0;

  paragraphs.forEach((paragraph, idx) => {
    const pageNum = idx + 1;
    const sentences = segmentTextIntoSentences(paragraph, pageNum, totalSentenceCount);
    totalSentenceCount += sentences.length;

    pages.push({
      pageNumber: pageNum,
      rawText: paragraph,
      sentences,
    });
  });

  const bookId = `book_text_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const finalTitle = title.trim() || `テキスト (${new Date().toLocaleDateString('ja-JP')})`;

  const book: Book = {
    id: bookId,
    title: finalTitle,
    fileName: `${finalTitle}.txt`,
    fileSize: new Blob([text]).size,
    totalPages: pages.length,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sourceType: 'text',
  };

  const content: BookContent = {
    bookId,
    pages,
    totalSentences: totalSentenceCount,
  };

  return { book, content };
}
