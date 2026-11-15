import React, { useState } from 'react';
import type { VoiceOption } from '../../services/speech/speechController';
import {
  BookmarkPlus,
  Palette,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipBack,
  SkipForward,
  Sparkles,
  Square,
  Type,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface AudioControlBarProps {
  isPlaying: boolean;
  isPaused: boolean;
  currentIndex: number;
  totalSentences: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (index: number) => void;
  repeatMode: 'none' | 'sentence';
  onToggleRepeat: () => void;
  rate: number;
  onRateChange: (rate: number) => void;
  pitch: number;
  onPitchChange: (pitch: number) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  voices: VoiceOption[];
  selectedVoiceURI: string;
  onVoiceChange: (voiceURI: string) => void;
  forcedLang: string;
  onForcedLangChange: (lang: string) => void;
  fontFamily: 'serif' | 'sans' | 'mono';
  onFontFamilyChange: (font: 'serif' | 'sans' | 'mono') => void;
  highlightColor: 'amber' | 'green' | 'blue' | 'purple' | 'pink';
  onHighlightColorChange: (color: 'amber' | 'green' | 'blue' | 'purple' | 'pink') => void;
  onAddBookmark: () => void;
  expressiveMode?: boolean;
  onToggleExpressiveMode?: (mode: boolean) => void;
  onPreviewVoice?: (voiceURI?: string) => void;
}

export const AudioControlBar: React.FC<AudioControlBarProps> = ({
  isPlaying,
  isPaused,
  currentIndex,
  totalSentences,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrev,
  onSeek,
  repeatMode,
  onToggleRepeat,
  rate,
  onRateChange,
  pitch,
  onPitchChange,
  volume,
  onVolumeChange,
  voices,
  selectedVoiceURI,
  onVoiceChange,
  forcedLang,
  onForcedLangChange,
  fontFamily,
  onFontFamilyChange,
  highlightColor,
  onHighlightColorChange,
  onAddBookmark,
  expressiveMode = true,
  onToggleExpressiveMode,
  onPreviewVoice,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  // 音声一覧を高音質（Natural, Google, Online）優先かつ言語順にソート
  const sortedVoices = [...voices].sort((a, b) => {
    if (a.isHighQuality !== b.isHighQuality) {
      return a.isHighQuality ? -1 : 1;
    }
    return a.lang.localeCompare(b.lang);
  });

  const selectedVoiceObj = sortedVoices.find((v) => v.voiceURI === selectedVoiceURI);

  const highlightOptions: { id: 'amber' | 'green' | 'blue' | 'purple' | 'pink'; name: string; bgClass: string }[] = [
    { id: 'amber', name: '琥珀', bgClass: 'bg-amber-400' },
    { id: 'green', name: '若草', bgClass: 'bg-emerald-400' },
    { id: 'blue', name: '空青', bgClass: 'bg-sky-400' },
    { id: 'purple', name: '紫苑', bgClass: 'bg-purple-400' },
    { id: 'pink', name: '桜桃', bgClass: 'bg-rose-400' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
      {/* シークバー（プログレスバー） */}
      <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 cursor-pointer group">
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSentences - 1)}
          value={currentIndex}
          onChange={(e) => onSeek(parseInt(e.target.value, 10))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="読み上げ位置シークバー"
        />
        <div
          className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-100 group-hover:h-2"
          style={{
            width: `${totalSentences > 0 ? ((currentIndex + 1) / totalSentences) * 100 : 0}%`,
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3">
        {/* 左側：文番号＆ステータス表示 */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-[90px] sm:min-w-[120px] text-xs font-mono text-slate-500 dark:text-slate-400">
          <Volume2 size={16} className={isPlaying ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : 'text-slate-400'} />
          <span className="text-[11px] sm:text-xs">
            {totalSentences > 0 ? `${currentIndex + 1}/${totalSentences}` : '0/0'}
          </span>
        </div>

        {/* 中央：メイン再生コントロール */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* しおり追加ボタン */}
          <button
            onClick={onAddBookmark}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="しおりを挟む"
            title="現在の文にしおりを挟む (Bookmark)"
          >
            <BookmarkPlus size={18} />
          </button>

          {/* 一文リピート */}
          <button
            onClick={onToggleRepeat}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${
              repeatMode === 'sentence'
                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-bold ring-1 ring-amber-400/50'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            aria-label="一文リピート"
            title={repeatMode === 'sentence' ? '一文リピート中（クリックで解除）' : '一文リピートをオン'}
          >
            <RotateCcw size={17} />
          </button>

          {/* 前の文 */}
          <button
            onClick={onPrev}
            disabled={currentIndex <= 0}
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
            aria-label="前の文へ"
            title="前の文 (←)"
          >
            <SkipBack size={18} />
          </button>

          {/* 再生 / 一時停止（メインボタン） */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer shrink-0"
            aria-label={isPlaying ? '一時停止' : '再生'}
            title={isPlaying ? '一時停止 (Space)' : '再生 (Space)'}
          >
            {isPlaying ? <Pause size={19} /> : <Play size={19} className="ml-0.5" />}
          </button>

          {/* 停止 */}
          <button
            onClick={onStop}
            disabled={!isPlaying && !isPaused}
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
            aria-label="停止"
            title="停止"
          >
            <Square size={16} />
          </button>

          {/* 次の文 */}
          <button
            onClick={onNext}
            disabled={currentIndex >= totalSentences - 1}
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
            aria-label="次の文へ"
            title="次の文 (→)"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* 右側：速度バッジ＆詳細設定トグル */}
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-[90px] sm:min-w-[120px] justify-end relative">
          <button
            onClick={() => onRateChange(rate >= 2.0 ? 0.75 : parseFloat((rate + 0.25).toFixed(2)))}
            className="px-1.5 sm:px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-[11px] sm:text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="クリックで速度切り替え"
          >
            {rate.toFixed(2)}x
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${
              showSettings
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            aria-label="音声・表示設定"
            title="音声・言語・音量・ハイライト色の詳細設定"
          >
            <Settings2 size={18} />
          </button>

          {/* 音声・表示設定ポップオーバー */}
          {showSettings && (
            <div
              className="absolute right-0 bottom-full mb-3 w-80 sm:w-88 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3.5 text-xs z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Settings2 size={14} className="text-indigo-500" />
                  <span>音声 ＆ リーダー設定</span>
                </span>
                <span className="text-[10px] text-slate-400">Web Speech API</span>
              </div>

              {/* 1. 言語強制指定 (Language) */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>🌐 読み上げ言語指定</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {forcedLang ? '手動固定' : '自動判定'}
                  </span>
                </label>
                <select
                  value={forcedLang}
                  onChange={(e) => onForcedLangChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                >
                  <option value="">自動判別 (本文から英語/日本語/仏語等を推定)</option>
                  <option value="en-US">英語 (English - US)</option>
                  <option value="en-GB">英語 (English - UK)</option>
                  <option value="ja-JP">日本語 (Japanese)</option>
                  <option value="fr-FR">フランス語 (Français)</option>
                  <option value="de-DE">ドイツ語 (Deutsch)</option>
                  <option value="es-ES">スペイン語 (Español)</option>
                  <option value="zh-CN">中国語 (Chinese - 簡体字)</option>
                  <option value="ko-KR">韓国語 (Korean)</option>
                </select>
              </div>

              {/* 2. 話者 / 音声選択 (Voice) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>🎙️ 話者 / 音声 (Voice)</span>
                  </label>
                  {onPreviewVoice && (
                    <button
                      type="button"
                      onClick={() => onPreviewVoice(selectedVoiceURI)}
                      className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-[10.5px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title="選択中の音声を今すぐテスト再生"
                    >
                      <Volume2 size={12} />
                      <span>🔊 試し聞き</span>
                    </button>
                  )}
                </div>

                {sortedVoices.length > 0 ? (
                  <select
                    value={selectedVoiceURI}
                    onChange={(e) => onVoiceChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs truncate"
                  >
                    <option value="">✨ 自動選択 (最高品質な自然音声を優先)</option>
                    {sortedVoices.map((v) => {
                      let tag = '';
                      if (v.qualityLabel === 'natural') tag = '🌟[Natural] ';
                      else if (v.qualityLabel === 'google') tag = '🌟[Google] ';
                      else if (v.qualityLabel === 'premium') tag = '✨[Premium] ';
                      else if (v.qualityLabel === 'legacy') tag = '🤖[機械音] ';
                      return (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {tag}[{v.lang}] {v.name} {v.default ? '★' : ''}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    ブラウザ標準の音声を利用しています。
                  </p>
                )}

                {/* 音声品質インジケーター */}
                {selectedVoiceObj && selectedVoiceObj.qualityLabel === 'legacy' && (
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-[10px] text-amber-900 dark:text-amber-200 leading-tight">
                    ⚠️ <b>旧型の機械音声</b> が選ばれています。生声アナウンサー級で聴くには、<b>Microsoft Edge</b> で開くか、リストから「🌟[Natural]」または「🌟[Google]」をお選びください。
                  </div>
                )}
                {selectedVoiceObj && (selectedVoiceObj.qualityLabel === 'natural' || selectedVoiceObj.qualityLabel === 'google') && (
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-[10.5px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
                    <Sparkles size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>AI高品質・自然音声が適用中</span>
                  </div>
                )}
              </div>

              {/* 抑揚・自然な呼吸感ブースト (Expressive Mode) */}
              {onToggleExpressiveMode && (
                <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 text-[11px]">
                      <span>🎭 抑揚・イントネーション強化</span>
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      疑問文で語尾を上げ、句読点で自然な息継ぎポーズを入れます
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={expressiveMode}
                      onChange={(e) => onToggleExpressiveMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:width-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              )}

              {/* 3. 音量スライダー (Volume) */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold">
                    {volume === 0 ? <VolumeX size={13} className="text-rose-500" /> : <Volume2 size={13} className="text-indigo-500" />}
                    <span>音量 (Volume)</span>
                  </label>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.05"
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* 4. 再生速度スライダー (Rate) */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">再生速度 (Rate)</label>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {rate.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={rate}
                  onChange={(e) => onRateChange(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0.5x (ゆっくり)</span>
                  <span>1.0x (標準)</span>
                  <span>2.0x (速い)</span>
                </div>
              </div>

              {/* 5. 声の高さスライダー (Pitch) */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">声の高さ (Pitch)</label>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {pitch.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={pitch}
                  onChange={(e) => onPitchChange(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* 6. 文字フォント切り替え */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Type size={13} className="text-indigo-500" />
                  <span>🔤 本文フォント</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onFontFamilyChange('serif')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-serif text-xs transition-colors cursor-pointer ${
                      fontFamily === 'serif'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    明朝 / Serif
                  </button>
                  <button
                    type="button"
                    onClick={() => onFontFamilyChange('sans')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-sans text-xs transition-colors cursor-pointer ${
                      fontFamily === 'sans'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    ゴシック / Sans
                  </button>
                  <button
                    type="button"
                    onClick={() => onFontFamilyChange('mono')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-mono text-xs transition-colors cursor-pointer ${
                      fontFamily === 'mono'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    等幅 / Mono
                  </button>
                </div>
              </div>

              {/* 7. ハイライト色選択 */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Palette size={13} className="text-indigo-500" />
                  <span>🎨 再生ハイライト色</span>
                </label>
                <div className="flex items-center gap-2">
                  {highlightOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onHighlightColorChange(opt.id)}
                      className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center gap-1 text-[11px] transition-all cursor-pointer ${
                        highlightColor === opt.id
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 font-bold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                      title={opt.name}
                    >
                      <span className={`w-3 h-3 rounded-full ${opt.bgClass} shadow-xs shrink-0`} />
                      <span className="hidden sm:inline">{opt.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 生声・自然音声のワンポイントアドバイス */}
              <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-[10.5px] text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-800 dark:text-amber-300">
                  <span>💡 最高の生声・自然音声で聴くヒント</span>
                </div>
                <p className="leading-relaxed">
                  Windows環境では、<b>Microsoft Edge ブラウザ</b> で本アプリを開くと、Microsoft Jenny / Guy などの「人間そのもののアナウンサー生声（Natural音声）」が追加料金なしで自動利用できます！
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
