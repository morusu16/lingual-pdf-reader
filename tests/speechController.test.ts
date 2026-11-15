import { describe, it, expect } from 'vitest';
import {
  detectLanguage,
  sanitizeTextForSpeech,
  calculateProsody,
  evaluateVoiceQuality,
} from '../src/services/speech/speechController';

describe('SpeechController - Prosody and Intonation', () => {
  describe('detectLanguage', () => {
    it('detects Japanese text', () => {
      expect(detectLanguage('これはテストです。')).toBe('ja-JP');
      expect(detectLanguage('吾輩は猫である。')).toBe('ja-JP');
    });

    it('detects French text', () => {
      expect(detectLanguage('Bonjour le monde! Ça va bien?')).toBe('fr-FR');
    });

    it('detects German text', () => {
      expect(detectLanguage('Guten Tag, wie geht es Ihnen? Überraschung!')).toBe('de-DE');
    });

    it('defaults to en-US for plain English', () => {
      expect(detectLanguage('The quick brown fox jumps over the lazy dog.')).toBe('en-US');
    });
  });

  describe('sanitizeTextForSpeech', () => {
    it('adds breath spacing after punctuation when missing from PDF extraction', () => {
      const input = 'Hello,world;this:that';
      const output = sanitizeTextForSpeech(input);
      expect(output).toBe('Hello, world; this: that');
    });

    it('normalizes multiple spaces and newlines', () => {
      const input = 'This   is   a   \n test  sentence.';
      const output = sanitizeTextForSpeech(input);
      expect(output).toBe('This is a test sentence.');
    });
  });

  describe('calculateProsody', () => {
    it('raises pitch and adjusts pause for question sentences (English)', () => {
      const flat = calculateProsody('This is a statement.', 1.0, 1.0, true, 0);
      const question = calculateProsody('Is this a question?', 1.0, 1.0, true, 0);

      expect(question.pitch).toBeGreaterThan(flat.pitch);
      expect(question.pauseAfterMs).toBeGreaterThanOrEqual(400);
    });

    it('raises pitch for Japanese question endings like ですか', () => {
      const flat = calculateProsody('今日は良い天気です。', 1.0, 1.0, true, 0);
      const question = calculateProsody('これは本当ですか？', 1.0, 1.0, true, 0);

      expect(question.pitch).toBeGreaterThan(flat.pitch);
      expect(question.pauseAfterMs).toBeGreaterThan(flat.pauseAfterMs);
    });

    it('adds significant pause for headings / chapter titles', () => {
      const heading = calculateProsody('Chapter 1', 1.0, 1.0, true, 0);
      expect(heading.pauseAfterMs).toBeGreaterThanOrEqual(500);
      expect(heading.rate).toBeLessThan(1.0);
    });

    it('adds extra pause for page transitions', () => {
      const normal = calculateProsody('Normal sentence.', 1.0, 1.0, true, 0, false);
      const pageBreak = calculateProsody('Normal sentence.', 1.0, 1.0, true, 0, true);

      expect(pageBreak.pauseAfterMs).toBeGreaterThan(normal.pauseAfterMs);
    });

    it('respects expressiveMode false (returns flat parameters)', () => {
      const result = calculateProsody('Are you ready?', 1.0, 1.0, false, 0);
      expect(result.pitch).toBe(1.0);
      expect(result.rate).toBe(1.0);
      expect(result.pauseAfterMs).toBe(150);
    });
  });

  describe('evaluateVoiceQuality', () => {
    it('ranks Natural/Neural/Online voices as highest quality', () => {
      const naturalVoice = {
        name: 'Microsoft Jenny Online (Natural) - English (United States)',
        default: false,
      } as SpeechSynthesisVoice;

      const evalResult = evaluateVoiceQuality(naturalVoice);
      expect(evalResult.qualityLabel).toBe('natural');
      expect(evalResult.score).toBeGreaterThanOrEqual(200);
    });

    it('flags legacy Desktop/SAPI5 voices', () => {
      const legacyVoice = {
        name: 'Microsoft David Desktop - English (United States)',
        default: true,
      } as SpeechSynthesisVoice;

      const evalResult = evaluateVoiceQuality(legacyVoice);
      expect(evalResult.qualityLabel).toBe('legacy');
      expect(evalResult.score).toBeLessThanOrEqual(20);
    });
  });
});
