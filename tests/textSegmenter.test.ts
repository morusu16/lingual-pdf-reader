import { describe, it, expect } from 'vitest';
import { cleanRawPdfText, segmentTextIntoSentences } from '../src/services/speech/textSegmenter';

describe('textSegmenter', () => {
  describe('cleanRawPdfText', () => {
    it('行末ハイフンで分割された単語を正しく連結する', () => {
      const input = 'This is an incom-\nplete sentence that should be joined.';
      const output = cleanRawPdfText(input);
      expect(output).toContain('incomplete');
    });

    it('単一改行はスペースに変換し、段落（2連続改行）は保持する', () => {
      const input = 'First line.\nSecond line.\n\nNew paragraph.';
      const output = cleanRawPdfText(input);
      expect(output).toBe('First line. Second line.\n\nNew paragraph.');
    });
  });

  describe('segmentTextIntoSentences', () => {
    it('英文を標準的な文境界で正しく分割する', () => {
      const input = 'Hello world! How are you today? I am learning French.';
      const sentences = segmentTextIntoSentences(input, 1, 0, 'en');

      expect(sentences).toHaveLength(3);
      expect(sentences[0].text).toBe('Hello world!');
      expect(sentences[1].text).toBe('How are you today?');
      expect(sentences[2].text).toBe('I am learning French.');
    });

    it('英語の略語（Dr., Mr., etc.）で誤って分割しない', () => {
      const input = 'Dr. Smith met Mr. Brown at the clinic. They discussed medicine, etc. and went home.';
      const sentences = segmentTextIntoSentences(input, 1, 0, 'en');

      expect(sentences).toHaveLength(2);
      expect(sentences[0].text).toContain('Dr. Smith met Mr. Brown at the clinic.');
      expect(sentences[1].text).toContain('They discussed medicine, etc. and went home.');
    });

    it('小数点が文末として誤認されない', () => {
      const input = 'The value of Pi is approximately 3.14 in mathematics. That is very useful.';
      const sentences = segmentTextIntoSentences(input, 1, 0, 'en');

      expect(sentences).toHaveLength(2);
      expect(sentences[0].text).toContain('3.14');
    });

    it('日本語の文章を正しく句点で分割する', () => {
      const input = '日本語の学習はとても楽しいです。毎日少しずつ読むと上達します！頑張りましょう。';
      const sentences = segmentTextIntoSentences(input, 1, 0, 'ja');

      expect(sentences).toHaveLength(3);
      expect(sentences[0].text).toBe('日本語の学習はとても楽しいです。');
      expect(sentences[1].text).toBe('毎日少しずつ読むと上達します！');
      expect(sentences[2].text).toBe('頑張りましょう。');
    });

    it('インデックスとページ番号が正しく付与される', () => {
      const input = 'One sentence. Two sentence.';
      const sentences = segmentTextIntoSentences(input, 5, 10, 'en');

      expect(sentences[0].index).toBe(10);
      expect(sentences[0].pageNumber).toBe(5);
      expect(sentences[1].index).toBe(11);
      expect(sentences[1].pageNumber).toBe(5);
    });
  });
});
