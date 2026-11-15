import { useEffect, useRef, useState, useCallback } from 'react';
import type { Sentence } from '../types';
import { SpeechController, type SpeechState, type VoiceOption } from '../services/speech/speechController';

interface UseSpeechProps {
  sentences: Sentence[];
  initialRate?: number;
  initialPitch?: number;
  initialVolume?: number;
  initialVoiceURI?: string;
  initialVoiceLang?: string;
  initialRepeatMode?: 'none' | 'sentence';
  initialForcedLang?: string;
  initialExpressiveMode?: boolean;
  onSentenceChange?: (index: number) => void;
  onError?: (error: string) => void;
}

export function useSpeech({
  sentences,
  initialRate = 1.0,
  initialPitch = 1.0,
  initialVolume = 1.0,
  initialVoiceURI = '',
  initialVoiceLang = 'en-US',
  initialRepeatMode = 'none',
  initialForcedLang = '',
  initialExpressiveMode = true,
  onSentenceChange,
  onError,
}: UseSpeechProps) {
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(0);
  const [rate, setRateState] = useState<number>(initialRate);
  const [pitch, setPitchState] = useState<number>(initialPitch);
  const [volume, setVolumeState] = useState<number>(initialVolume);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(initialVoiceURI);
  const [repeatMode, setRepeatMode] = useState<'none' | 'sentence'>(initialRepeatMode);
  const [forcedLang, setForcedLangState] = useState<string>(initialForcedLang);
  const [expressiveMode, setExpressiveModeState] = useState<boolean>(initialExpressiveMode);

  const controllerRef = useRef<SpeechController | null>(null);

  // コントローラーの初期化
  useEffect(() => {
    const controller = new SpeechController({
      onSentenceStart: (idx) => {
        setActiveSentenceIndex(idx);
        if (onSentenceChange) onSentenceChange(idx);
      },
      onStateChange: (state) => {
        setSpeechState(state);
      },
      onVoicesLoaded: (loadedVoices) => {
        setVoices(loadedVoices);
      },
      onError: (err) => {
        if (onError) onError(err);
      },
    });

    // 既に利用可能な音声をロード
    const currentVoices = controller.getVoices();
    if (currentVoices.length > 0) {
      setVoices(currentVoices);
    }

    controller.setConfig({
      rate: initialRate,
      pitch: initialPitch,
      volume: initialVolume,
      voiceURI: initialVoiceURI,
      voiceLang: initialVoiceLang,
      repeatMode: initialRepeatMode,
      forcedLang: initialForcedLang,
      expressiveMode: initialExpressiveMode,
    });

    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  // 文リストが更新されたらコントローラーへ反映
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setSentences(sentences);
    }
  }, [sentences]);

  // 再生操作コールバック
  const playFrom = useCallback((index: number) => {
    setActiveSentenceIndex(index);
    controllerRef.current?.playFrom(index);
  }, []);

  const resume = useCallback(() => {
    controllerRef.current?.resume();
  }, []);

  const pause = useCallback(() => {
    controllerRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    // 停止時は currentIndex をコントローラーから取得してactiveSentenceIndexを保持
    const currentIdx = controllerRef.current?.getCurrentIndex() ?? activeSentenceIndex;
    controllerRef.current?.stop();
    // activeSentenceIndex はそのまま保持（先頭に戻さない）
    setActiveSentenceIndex(currentIdx);
  }, [activeSentenceIndex]);

  const next = useCallback(() => {
    controllerRef.current?.next();
  }, []);

  const prev = useCallback(() => {
    controllerRef.current?.prev();
  }, []);

  const setRate = useCallback((newRate: number) => {
    setRateState(newRate);
    controllerRef.current?.setConfig({ rate: newRate });
  }, []);

  const setPitch = useCallback((newPitch: number) => {
    setPitchState(newPitch);
    controllerRef.current?.setConfig({ pitch: newPitch });
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    controllerRef.current?.setConfig({ volume: newVolume });
  }, []);

  const setForcedLang = useCallback((lang: string) => {
    setForcedLangState(lang);
    controllerRef.current?.setConfig({ forcedLang: lang });
  }, []);

  const setVoiceURI = useCallback((uri: string) => {
    setSelectedVoiceURI(uri);
    controllerRef.current?.setConfig({ voiceURI: uri });
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      const nextMode = prev === 'none' ? 'sentence' : 'none';
      controllerRef.current?.setConfig({ repeatMode: nextMode });
      return nextMode;
    });
  }, []);

  const setExpressiveMode = useCallback((mode: boolean) => {
    setExpressiveModeState(mode);
    controllerRef.current?.setConfig({ expressiveMode: mode });
  }, []);

  const previewVoice = useCallback((voiceURI?: string) => {
    controllerRef.current?.previewVoice(voiceURI);
  }, []);

  const speakWord = useCallback((word: string, lang?: string) => {
    controllerRef.current?.speakWord(word, lang);
  }, []);

  return {
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
    toggleRepeat,
    setForcedLang,
    setExpressiveMode,
    previewVoice,
    speakWord,
  };
}
