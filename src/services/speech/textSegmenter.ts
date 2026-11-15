import type { Sentence } from '../../types';

// 英語等の一般的な略語リスト（文末と誤認させないための保護 - 小文字で統一）
const COMMON_ABBREVIATIONS = [
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr',
  'vs', 'etc', 'e.g', 'i.e', 'approx', 'app', 'dept',
  'fig', 'no', 'vol', 'jan', 'feb', 'mar', 'apr', 'aug', 'sept', 'oct', 'nov', 'dec'
];

/**
 * PDFのテキストを事前クリーニングする
 * - 行末ハイフンの連結 (e.g. "com- \nplete" -> "complete")
 * - 不必要な単一改行のスペース化（段落境界の2連続改行は保持）
 * - 連続空白の正規化
 */
export function cleanRawPdfText(raw: string): string {
  if (!raw) return '';
  return raw
    // ハイフンで行末が切れている場合の結合
    .replace(/(\b\w+)-[ \t]*\r?\n[ \t]*(\w+\b)/g, '$1$2')
    // 段落ごとに正規化して再結合
    .split(/\r?\n\s*\r?\n/)
    .map(paragraph =>
      paragraph
        .replace(/\r?\n/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim()
    )
    .filter(Boolean)
    .join('\n\n');
}

/**
 * 指定したテキストを多言語対応で文単位に分割する
 */
export function segmentTextIntoSentences(
  text: string,
  pageNumber: number,
  startIndexOffset: number = 0,
  lang: string = 'en'
): Sentence[] {
  const cleaned = cleanRawPdfText(text);
  if (!cleaned) return [];

  let rawSentences: string[] = [];

  // 1. Intl.Segmenter がサポートされている場合（Chrome, Edge, Safari, Node等）
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const IntlAny = Intl as any;
      const segmenter = new IntlAny.Segmenter(lang, { granularity: 'sentence' });
      const segments = segmenter.segment(cleaned);
      for (const seg of segments) {
        const s = seg.segment.trim();
        if (s) rawSentences.push(s);
      }
    } catch (e) {
      console.warn('Intl.Segmenter failed, falling back to regex:', e);
      rawSentences = regexSentenceSplit(cleaned);
    }
  } else {
    rawSentences = regexSentenceSplit(cleaned);
  }

  // 2. 略語（Mr., Dr., etc.）の誤分割を修復・マージ
  const mergedSentences = repairAbbreviationSplits(rawSentences);

  // 3. 非常に長い文（長文や改行のない段落）を自然な句読点または適切な長さで分割
  const normalizedSentences: string[] = [];
  for (const s of mergedSentences) {
    if (s.length > 250) {
      normalizedSentences.push(...splitLongSentence(s));
    } else {
      normalizedSentences.push(s);
    }
  }

  // 4. Sentence オブジェクトの配列を作成
  return normalizedSentences
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map((text, idx) => ({
      index: startIndexOffset + idx,
      pageNumber,
      text,
      speechText: prepareSpeechText(text),
    }));
}

/**
 * 正規表現による文分割フォールバック
 * 句点（. ! ? 。 ！？）や改行で分割
 */
function regexSentenceSplit(text: string): string[] {
  // ピリオド、感嘆符、疑問符、日本語句点などの後に空白または改行が続く位置で分割
  // 小数点（例: 3.14）を誤分割しないよう考慮
  const parts = text.split(/(?<=[.!?。！？])\s+(?=[^\d])/g);
  return parts.map(p => p.trim()).filter(Boolean);
}

/**
 * 略語による誤分割（例: "Dr." と "Smith arrived."）を結合する
 */
function repairAbbreviationSplits(sentences: string[]): string[] {
  if (sentences.length <= 1) return sentences;

  const result: string[] = [];
  let current = '';

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i].trim();
    if (!current) {
      current = s;
      continue;
    }

    // current の末尾の単語を取得
    const match = current.match(/\b([A-Za-z]+)[.,]?$/);
    const lastWord = match ? match[1].toLowerCase() : '';

    const isAbbrev = COMMON_ABBREVIATIONS.includes(lastWord);
    const isSingleLetter = /^[A-Za-z][.,]?$/.test(current.trim().split(/\s+/).pop() || '');
    const nextStartsWithLower = /^[a-z]/.test(s);

    if (
      ((isAbbrev || isSingleLetter) && (current.endsWith('.') || current.endsWith(','))) ||
      nextStartsWithLower
    ) {
      current = `${current} ${s}`;
    } else {
      result.push(current);
      current = s;
    }
  }

  if (current) {
    result.push(current);
  }

  return result;
}

/**
 * 250文字を超える長文を、コンマやコロン、セミコロン、接続詞で安全に分割
 */
function splitLongSentence(sentence: string): string[] {
  const parts = sentence.split(/(?<=[,;:\n—])\s+/);
  const chunks: string[] = [];
  let cur = '';

  for (const part of parts) {
    if ((cur + ' ' + part).length > 200 && cur.length > 0) {
      chunks.push(cur.trim());
      cur = part;
    } else {
      cur = cur ? `${cur} ${part}` : part;
    }
  }
  if (cur) chunks.push(cur.trim());

  return chunks.length > 0 ? chunks : [sentence];
}

/**
 * 読み上げ用に記号などを整音する
 */
function prepareSpeechText(text: string): string {
  return text
    // URLや複雑な記号の簡略化
    .replace(/https?:\/\/\S+/gi, 'link')
    // 括弧や引用符の余分な発話を防ぐ
    .replace(/[「」『』""'']/g, ' ')
    // 連続空白をスペースに
    .replace(/\s+/g, ' ')
    .trim();
}
