'use client';

import { useState, useRef, useEffect } from 'react';
import { KeywordTag } from './KeywordTag';
import { Keyword } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  onGenerate: (keywords: Keyword[]) => void;
  isGenerating: boolean;
}

export function KeywordInput({ onGenerate, isGenerating }: Props) {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing) return;

    if ((e.key === 'Enter' || e.key === ',' || e.key === ' ') && inputValue.trim()) {
      e.preventDefault();
      const text = inputValue.trim().replace(/,$/, '');
      if (text) {
        addKeyword(text);
      }
    } else if (e.key === 'Backspace' && !inputValue) {
      e.preventDefault();
      removeLastKeyword();
    }
  };

  const addKeyword = (text: string) => {
    if (keywords.length >= 10) {
      return;
    }
    if (!keywords.find(k => k.text === text)) {
      setKeywords([...keywords, { id: Date.now().toString(), text, selected: true }]);
    }
    setInputValue('');
  };

  const removeKeyword = (text: string) => {
    setKeywords(keywords.filter(k => k.text !== text));
  };

  const removeLastKeyword = () => {
    if (keywords.length > 0) {
      setKeywords(keywords.slice(0, -1));
    }
  };

  const toggleKeyword = (text: string) => {
    setKeywords(
      keywords.map(k =>
        k.text === text ? { ...k, selected: !k.selected } : k
      )
    );
  };

  const handleGenerate = () => {
    if (keywords.some(k => k.selected)) {
      onGenerate(keywords);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {/* 输入框 */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="输入关键词后按回车、空格或逗号添加（最多10个）"
            className="input w-full"
            disabled={keywords.length >= 10 || isGenerating}
          />
        </div>

        {/* 关键词列表 */}
        {keywords.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex flex-wrap gap-2">
              {keywords.map(({ text, selected }) => (
                <KeywordTag
                  key={text}
                  text={text}
                  selected={selected}
                  onRemove={() => removeKeyword(text)}
                  onToggle={() => toggleKeyword(text)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={!keywords.some(k => k.selected) || isGenerating}
          className={cn(
            "button button-primary",
            isGenerating && "opacity-50 cursor-not-allowed"
          )}
        >
          {isGenerating ? '生成中...' : '生成日报'}
        </button>
      </div>
    </div>
  );
} 