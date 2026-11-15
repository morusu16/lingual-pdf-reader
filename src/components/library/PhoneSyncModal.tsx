import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Mail, QrCode, Smartphone, X } from 'lucide-react';

interface PhoneSyncModalProps {
  onClose: () => void;
}

export const PhoneSyncModal: React.FC<PhoneSyncModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const targetUrl = 'https://morusu16.github.io/lingual-pdf-reader/';
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent('Polyglot PDF Reader スマホ用URL')}&body=${encodeURIComponent(
    '■ Polyglot PDF Reader 公式URL\n' +
    'https://morusu16.github.io/lingual-pdf-reader/\n\n' +
    '※スマホのChromeまたはSafariで開いて「アプリをインストール」または「ホーム画面に追加」をすると、永続的にPWAアプリとして使えます！'
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                スマホ・別端末で開く
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                同一Wi-Fi内のスマホからアクセスできます
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* QRコード表示 */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="p-3 bg-white rounded-xl shadow-md border border-slate-100">
            <img
              src="/phone-qr.png"
              alt="スマホ用QRコード"
              className="w-48 h-48 rounded-lg object-contain"
            />
          </div>
          <div className="text-center space-y-0.5">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1">
              <QrCode size={13} className="text-indigo-500" />
              <span>スマホのカメラでスキャン</span>
            </p>
            <p className="text-[11px] text-slate-400">
              iPhoneやAndroidの標準カメラを向けるとワンタップで開けます
            </p>
          </div>
        </div>

        {/* アクションボタン群 */}
        <div className="space-y-2.5">
          {/* Gmailで送るボタン */}
          <a
            href={gmailComposeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Mail size={15} />
            <span>Gmail作成画面を開いて自分に送る</span>
            <ExternalLink size={12} className="opacity-80" />
          </a>

          {/* URLコピー */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <input
              type="text"
              readOnly
              value={targetUrl}
              className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg border border-slate-200 dark:border-slate-600 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copied ? 'コピー完了' : 'コピー'}</span>
            </button>
          </div>
        </div>

        {/* スマホ接続時のTips */}
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-[11px] text-emerald-900 dark:text-emerald-200 space-y-1">
          <p className="font-bold flex items-center gap-1 text-emerald-800 dark:text-emerald-300">
            <span>✨ 公式HTTPS・PWA完全対応</span>
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[10.5px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
            <li>パスワード不要・警告なしでそのまま安全に開きます。</li>
            <li>ブラウザメニュー（︙）の<b>「アプリをインストール」</b>からネイティブアプリとしてインストール可能です。</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
