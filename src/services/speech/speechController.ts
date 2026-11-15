import type { Sentence } from '../../types';

export type SpeechState = 'idle' | 'playing' | 'paused';

export interface VoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
  default: boolean;
  localService: boolean;
  isHighQuality: boolean; // Natural, Neural, Online, Google 等の高品質音声フラグ
  qualityLabel: 'natural' | 'google' | 'premium' | 'standard' | 'legacy';
}

export interface SpeechControllerCallbacks {
  onSentenceStart?: (index: number) => void;
  onSentenceEnd?: (index: number) => void;
  onStateChange?: (state: SpeechState) => void;
  onError?: (error: string) => void;
  onVoicesLoaded?: (voices: VoiceOption[]) => void;
}

/**
 * テキストから言語コード（en-US, ja-JP, fr-FR, de-DE等）を自動判定
 */
export function detectLanguage(text: string): string {
  if (!text) return 'en-US';

  // 日本語（ひらがな・カタカナ・漢字）の判定
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
    return 'ja-JP';
  }

  // ドイツ語（ä, ö, ü, ß 等）
  if (/[äöüßÄÖÜ]/.test(text)) {
    return 'de-DE';
  }

  // フランス語（é, è, ê, ë, à, â, ô, û, ç, œ, æ 等）
  if (/[éèêëàâôûçœæÉÈÊÀÂÔÛÇ]/i.test(text)) {
    return 'fr-FR';
  }

  // スペイン語（ñ, ¿, ¡, á, é, í, ó, ú 等）
  if (/[ñáéíóú¿¡]/i.test(text)) {
    return 'es-ES';
  }

  // デフォルトは英語
  return 'en-US';
}

/**
 * 音声の品質カテゴリとスコアを計算（高いほど自然で人間らしい声）
 */
export function evaluateVoiceQuality(voice: SpeechSynthesisVoice): { score: number; qualityLabel: VoiceOption['qualityLabel'] } {
  const name = voice.name.toLowerCase();

  // 1. Microsoft Edge / Azure Neural/Natural 音声（最高峰・人間同等）
  if (name.includes('natural') || name.includes('online') || name.includes('neural')) {
    return { score: 200, qualityLabel: 'natural' };
  }

  // 2. Google Chrome の高品質オンライン音声
  if (name.includes('google')) {
    return { score: 150, qualityLabel: 'google' };
  }

  // 3. Apple (macOS / iOS) Premium / Enhanced / Siri 音声
  if (name.includes('premium') || name.includes('enhanced') || name.includes('siri')) {
    return { score: 130, qualityLabel: 'premium' };
  }

  // 4. Windows SAPI5 などの古いデスクトップ音声（David, Zira, Haruka Desktop 等）
  if (name.includes('desktop') || name.includes('legacy') || name.includes('sapi')) {
    return { score: 10, qualityLabel: 'legacy' };
  }

  return { score: voice.default ? 70 : 60, qualityLabel: 'standard' };
}

/**
 * 読み上げ用テキストの整形（PDF抽出特有の欠落や記号連結を自然な発音に最適化）
 */
export function sanitizeTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    // カンマやコロンの直後に空白がない場合、空白を補正して音声エンジンが息継ぎできるようにする
    .replace(/([,;:、])([^\s\d\p{P}])/gu, '$1 $2')
    // 長いハイフンやダッシュを自然なポーズ記号に
    .replace(/[-—–]{2,}/g, ' — ')
    // 連続する空白・改行を1つの空白に
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 抑揚・呼吸（プロソディ）の動的計算
 * - 疑問文: 語尾ピッチを上げて自然な上昇調イントネーション（英語/日本語両対応）
 * - 会話文（引用符内）: 生き生きとした暖かみのあるピッチとテンポ
 * - 括弧内補足（補足・ささやき）: やや落ち着いた控えめなトーン
 * - 見出し・章タイトル: 落ち着いた深みのあるトーンと次の文への長めのポーズ
 * - 段落の変わり目・ページ遷移: 人間が息を吸うような心地よいポーズ
 * - マイクロ・プロソディ: 文ごとに微小なピッチ揺らぎを与えて一本調子な機械音感を払拭
 */
export function calculateProsody(
  text: string,
  baseRate: number,
  basePitch: number,
  expressive: boolean,
  sentenceIndex: number = 0,
  isPageBreak: boolean = false
): { rate: number; pitch: number; pauseAfterMs: number; speechText: string } {
  const speechText = sanitizeTextForSpeech(text);
  if (!expressive) {
    return { rate: baseRate, pitch: basePitch, pauseAfterMs: 150, speechText };
  }

  const trimmed = speechText.trim();
  let tunedPitch = basePitch;
  let tunedRate = baseRate;
  let pauseAfterMs = 340; // オーディオブック標準の自然な息継ぎ時間（340ms）

  // 会話文・台詞（「...」, 『...』, “...”, "..."）
  const isDialogue = /^([「『“"]|[—–]\s*)/.test(trimmed) || /([」』”"])$/.test(trimmed);

  // 括弧内（（...）, (...)）
  const isParenthetical = /^([（(]).*([）)])$/.test(trimmed);

  // 見出し・章タイトル（短文で句読点なし、または「Chapter」「第◯章」）
  const isHeading =
    (trimmed.length < 25 && !/[.!?。！？]$/.test(trimmed)) ||
    /^(chapter|section|act|scene|part|第[0-9一二三四五六七八九十]+[章節])/i.test(trimmed);

  // 疑問文（英語: ? または疑問詞 / 日本語: ？ または「〜ですか」「〜ますか」「〜でしょうか」「〜なのか」「〜だろうか」）
  const isQuestion =
    /[?？]$/.test(trimmed) ||
    /^(what|why|where|when|who|how|is|are|do|does|did|can|could|would|should)\b/i.test(trimmed) ||
    /(ですか|ますか|でしょうか|のか|だろうか|かな|かい)[。]?$/i.test(trimmed);

  // 感嘆文（! または ！）
  const isExclamation = /[!！]$/.test(trimmed);

  if (isHeading) {
    // 見出し：重厚感・落ち着き、長めの余白
    tunedPitch = Math.max(0.6, basePitch - 0.05);
    tunedRate = Math.max(0.6, baseRate * 0.92);
    pauseAfterMs = 580;
  } else if (isQuestion) {
    // 疑問文：語尾を自然に上げて問いかけの抑揚
    tunedPitch = Math.min(1.5, basePitch + 0.14);
    tunedRate = Math.max(0.6, baseRate * 0.95);
    pauseAfterMs = 420;
  } else if (isExclamation) {
    // 感嘆文：メリハリとエネルギー
    tunedPitch = Math.min(1.5, basePitch + 0.08);
    tunedRate = Math.min(1.8, baseRate * 1.03);
    pauseAfterMs = 380;
  } else if (isDialogue) {
    // 台詞：生きた会話表現（わずかに高め＆表情豊か）
    tunedPitch = Math.min(1.5, basePitch + 0.04);
    tunedRate = baseRate * 1.01;
    pauseAfterMs = 320;
  } else if (isParenthetical) {
    // 括弧内：補足トーン
    tunedPitch = Math.max(0.6, basePitch - 0.04);
    pauseAfterMs = 280;
  }

  // ページ跨ぎの場合、ゆったりとした読書の間を追加
  if (isPageBreak) {
    pauseAfterMs = Math.max(pauseAfterMs, 560);
  }

  // マイクロ・プロソディ：文ごとにわずかな自然な周波数揺らぎ（±0.02）を付与し、
  // ロボット特有の「毎回全く同じ周波数で発音を開始する単調さ（Monotone）」を解消
  const microJitter = Math.sin(sentenceIndex * 1.7) * 0.02;
  tunedPitch = Math.min(1.5, Math.max(0.6, tunedPitch + microJitter));

  return {
    rate: parseFloat(tunedRate.toFixed(2)),
    pitch: parseFloat(tunedPitch.toFixed(2)),
    pauseAfterMs,
    speechText,
  };
}

export class SpeechController {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private state: SpeechState = 'idle';
  private sentences: Sentence[] = [];
  private currentIndex: number = 0;
  private repeatMode: 'none' | 'sentence' = 'none';

  private rate: number = 1.0;
  private pitch: number = 1.0;
  private volume: number = 1.0;
  private voiceURI: string = '';
  private voiceLang: string = '';
  private forcedLang: string = '';
  private expressiveMode: boolean = true;

  private callbacks: SpeechControllerCallbacks = {};
  private isExplicitlyStopped: boolean = false;
  private transitionTimeout: number | null = null;

  constructor(callbacks: SpeechControllerCallbacks = {}) {
    this.callbacks = callbacks;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
    } else {
      console.warn('Web Speech API is not supported in this browser.');
    }
  }

  private initVoices(): void {
    if (!this.synth) return;

    const notify = () => {
      const voices = this.getVoices();
      if (voices.length > 0 && this.callbacks.onVoicesLoaded) {
        this.callbacks.onVoicesLoaded(voices);
      }
    };

    notify();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = notify;
    }
  }

  public getVoices(): VoiceOption[] {
    if (!this.synth) return [];
    const raw = this.synth.getVoices();

    return raw.map((v) => {
      const { score, qualityLabel } = evaluateVoiceQuality(v);
      return {
        voiceURI: v.voiceURI,
        name: v.name,
        lang: v.lang,
        default: v.default,
        localService: v.localService,
        isHighQuality: score >= 100,
        qualityLabel,
      };
    });
  }

  public setSentences(sentences: Sentence[]): void {
    this.sentences = sentences;

    if (!this.voiceLang && sentences.length > 0) {
      const sample = sentences.slice(0, 5).map((s) => s.text).join(' ');
      this.voiceLang = detectLanguage(sample);
    }
  }

  public setConfig(config: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voiceURI?: string;
    voiceLang?: string;
    forcedLang?: string;
    repeatMode?: 'none' | 'sentence';
    expressiveMode?: boolean;
  }): void {
    if (config.rate !== undefined) this.rate = config.rate;
    if (config.pitch !== undefined) this.pitch = config.pitch;
    if (config.volume !== undefined) this.volume = config.volume;
    if (config.voiceURI !== undefined) this.voiceURI = config.voiceURI;
    if (config.voiceLang !== undefined) this.voiceLang = config.voiceLang;
    if (config.forcedLang !== undefined) this.forcedLang = config.forcedLang;
    if (config.repeatMode !== undefined) this.repeatMode = config.repeatMode;
    if (config.expressiveMode !== undefined) this.expressiveMode = config.expressiveMode;

    if (this.state === 'playing') {
      this.speakCurrentSentence();
    }
  }

  public playFrom(index: number): void {
    this.isExplicitlyStopped = false;
    this.clearTransition();
    this.currentIndex = Math.max(0, Math.min(this.sentences.length - 1, index));
    this.speakCurrentSentence();
  }

  public resume(): void {
    if (!this.synth) return;

    if (this.state === 'paused') {
      this.synth.resume();
      this.setState('playing');
    } else if (this.state === 'idle') {
      this.playFrom(this.currentIndex);
    }
  }

  public pause(): void {
    if (!this.synth) return;
    this.clearTransition();
    if (this.state === 'playing') {
      this.synth.pause();
      this.setState('paused');
    }
  }

  public stop(): void {
    this.isExplicitlyStopped = true;
    this.clearTransition();
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
    this.setState('idle');
  }

  public next(): void {
    this.clearTransition();
    if (this.currentIndex < this.sentences.length - 1) {
      this.playFrom(this.currentIndex + 1);
    } else {
      this.stop();
    }
  }

  public prev(): void {
    this.clearTransition();
    if (this.currentIndex > 0) {
      this.playFrom(this.currentIndex - 1);
    }
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  public getState(): SpeechState {
    return this.state;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * 現在の文に最も適した最高音質な音声を自動選定
   */
  private selectBestVoice(targetLang: string): SpeechSynthesisVoice | undefined {
    if (!this.synth) return undefined;
    const all = this.synth.getVoices();
    if (all.length === 0) return undefined;

    // ユーザーが手動で明示的に音声を選んでいる場合
    if (this.voiceURI) {
      const userSelected = all.find((v) => v.voiceURI === this.voiceURI);
      if (userSelected) return userSelected;
    }

    const prefix = targetLang.split('-')[0].toLowerCase();
    const targetFull = targetLang.toLowerCase();

    // 対象言語と一致する音声をフィルタリング
    const matchingVoices = all.filter(
      (v) => v.lang.toLowerCase() === targetFull || v.lang.toLowerCase().startsWith(prefix)
    );

    if (matchingVoices.length === 0) {
      return all.find((v) => v.default) || all[0];
    }

    // 品質スコア順（Natural, Google, Neural 高得点順）にソートして最高品質のものを選択
    matchingVoices.sort((a, b) => {
      const scoreA = evaluateVoiceQuality(a).score;
      const scoreB = evaluateVoiceQuality(b).score;
      return scoreB - scoreA;
    });

    return matchingVoices[0];
  }

  private speakCurrentSentence(): void {
    if (!this.synth || this.sentences.length === 0) return;

    this.clearTransition();
    this.synth.cancel();

    const sentence = this.sentences[this.currentIndex];
    if (!sentence) {
      this.stop();
      return;
    }

    const textToSpeak = sentence.speechText || sentence.text;
    if (!textToSpeak.trim()) {
      this.moveToNextSentence();
      return;
    }

    // 文の言語を判定（指定がなければ自動検出）
    const detectedLang = detectLanguage(textToSpeak);
    const targetLang = this.forcedLang || this.voiceLang || detectedLang;

    // 次の文へのページ跨ぎがあるかを判定
    const isPageBreak =
      this.currentIndex < this.sentences.length - 1 &&
      this.sentences[this.currentIndex].pageNumber !== this.sentences[this.currentIndex + 1].pageNumber;

    // 抑揚・イントネーション・自然な息継ぎポーズの計算
    const prosody = calculateProsody(
      textToSpeak,
      this.rate,
      this.pitch,
      this.expressiveMode,
      this.currentIndex,
      isPageBreak
    );

    const utterance = new SpeechSynthesisUtterance(prosody.speechText);
    utterance.rate = prosody.rate;
    utterance.pitch = prosody.pitch;
    utterance.volume = this.volume;

    // 最高品質音声を割り当て
    const bestVoice = this.selectBestVoice(targetLang);
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = this.forcedLang || bestVoice.lang;
    } else {
      utterance.lang = targetLang;
    }

    utterance.onstart = () => {
      if (this.isExplicitlyStopped) return;
      this.setState('playing');
      if (this.callbacks.onSentenceStart) {
        this.callbacks.onSentenceStart(sentence.index);
      }
    };

    utterance.onend = () => {
      if (this.isExplicitlyStopped) return;

      if (this.callbacks.onSentenceEnd) {
        this.callbacks.onSentenceEnd(sentence.index);
      }

      if (this.repeatMode === 'sentence') {
        this.transitionTimeout = window.setTimeout(() => {
          if (!this.isExplicitlyStopped && this.state === 'playing') {
            this.speakCurrentSentence();
          }
        }, prosody.pauseAfterMs + 50);
      } else {
        // 計算された人間らしい息継ぎポーズ（320〜580ms）を置いて次の文へ
        this.transitionTimeout = window.setTimeout(() => {
          if (!this.isExplicitlyStopped && this.state === 'playing') {
            this.moveToNextSentence();
          }
        }, prosody.pauseAfterMs);
      }
    };

    utterance.onerror = (event) => {
      if (event.error === 'canceled' || event.error === 'interrupted') {
        return;
      }
      console.warn('Speech error:', event.error);
      if (this.callbacks.onError) {
        this.callbacks.onError(`音声エラー: ${event.error}`);
      }
      this.setState('idle');
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  /**
   * 音声の試し聞き再生（設定画面用）
   */
  public previewVoice(voiceURI?: string): void {
    if (!this.synth) return;
    this.synth.cancel();

    const uri = voiceURI || this.voiceURI;
    const all = this.synth.getVoices();
    const voice = uri
      ? all.find((v) => v.voiceURI === uri)
      : this.selectBestVoice(this.forcedLang || this.voiceLang || 'en-US');
    if (!voice) return;

    const lang = voice.lang.toLowerCase();
    let sampleText = 'Hello! Welcome to the Polyglot Reader. Listening with a natural voice makes learning enjoyable.';
    if (lang.startsWith('ja')) {
      sampleText = 'こんにちは！自然な抑揚と豊かなイントネーションで本を読み上げます。';
    } else if (lang.startsWith('fr')) {
      sampleText = 'Bonjour! Ceci est un aperçu de la voix naturelle et expressive.';
    } else if (lang.startsWith('de')) {
      sampleText = 'Hallo! Dies ist eine Vorschau der natürlichen und ausdrucksstarken Stimme.';
    } else if (lang.startsWith('es')) {
      sampleText = '¡Hola! Esta es una vista previa de la voz natural y expresiva.';
    }

    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = this.volume;
    this.synth.speak(utterance);
  }

  /**
   * 辞書ポップアップなどから単語単体を発音再生
   */
  public speakWord(word: string, lang?: string): void {
    if (!this.synth || !word.trim()) return;
    const targetLang = lang || this.forcedLang || this.voiceLang || detectLanguage(word);
    const bestVoice = this.selectBestVoice(targetLang);
    const utterance = new SpeechSynthesisUtterance(word.trim());
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
    } else {
      utterance.lang = targetLang;
    }
    utterance.rate = Math.min(1.0, this.rate);
    utterance.pitch = this.pitch;
    utterance.volume = this.volume;
    this.synth.speak(utterance);
  }

  private moveToNextSentence(): void {
    if (this.currentIndex < this.sentences.length - 1) {
      this.currentIndex++;
      this.speakCurrentSentence();
    } else {
      this.stop();
    }
  }

  private clearTransition(): void {
    if (this.transitionTimeout !== null) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
  }

  private setState(newState: SpeechState): void {
    if (this.state !== newState) {
      this.state = newState;
      if (this.callbacks.onStateChange) {
        this.callbacks.onStateChange(newState);
      }
    }
  }

  public destroy(): void {
    this.stop();
    this.clearTransition();
    if (this.synth) {
      this.synth.onvoiceschanged = null;
    }
    this.callbacks = {};
  }
}
