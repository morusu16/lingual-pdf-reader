import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { BookOpen, Sparkles } from 'lucide-react';

interface DirectInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, text: string) => void;
}

const SAMPLE_TEXT = `The Journey of Learning Languages.

Learning a foreign language is not just about memorizing words and grammar rules. It is an adventurous voyage that opens doors to new ways of thinking, diverse cultures, and profound human connections.

When you read a story in another language, every sentence is an invitation to explore. Even if you encounter unfamiliar vocabulary, listening to the natural rhythm of speech helps your brain absorb the melody of the language.

Take your time. Repeat difficult sentences, listen carefully to each word, and let your curiosity guide you forward. Enjoy the magic of words!`;

export const DirectInputModal: React.FC<DirectInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('本文を入力してください。');
      return;
    }
    onSubmit(title.trim(), text.trim());
    setTitle('');
    setText('');
    onClose();
  };

  const handleInsertSample = () => {
    setTitle('The Journey of Learning Languages');
    setText(SAMPLE_TEXT);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="テキスト直接入力で本を作成" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Web上の外国語ニュース記事や教材テキストを貼り付けて、自分専用の音声リーディング本を作成できます。
        </p>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            タイトル（任意）
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: English Short Story Chapter 1"
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              本文テキスト <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleInsertSample}
              className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              <Sparkles size={11} />
              <span>サンプル文章を挿入</span>
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="ここに学習したい英文や記事、小説などのテキストを貼り付けてください（段落ごとに自動でページが分かれます）..."
            className="w-full px-3 py-2 text-sm font-sans bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 leading-relaxed resize-y"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" variant="primary" size="sm" icon={<BookOpen size={14} />}>
            本棚に追加する
          </Button>
        </div>
      </form>
    </Modal>
  );
};
