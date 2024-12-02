import { useState, useCallback } from 'react';
import { Keyword } from '@/types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { KeywordTag } from './KeywordTag';

interface KeywordInputProps {
  onGenerate: (keywords: Keyword[]) => void;
  isGenerating?: boolean;
}

export const KeywordInput = ({ onGenerate, isGenerating = false }: KeywordInputProps) => {
  const [input, setInput] = useState('');
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setError('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addKeyword();
    }
  };

  const addKeyword = useCallback(() => {
    const trimmedInput = input.trim().replace(/,+$/, '');
    if (!trimmedInput) return;

    if (keywords.length >= 10) {
      setError('最多只能添加10个关键词');
      return;
    }

    if (keywords.some(k => k.text.toLowerCase() === trimmedInput.toLowerCase())) {
      setError('该关键词已存在');
      return;
    }

    const newKeyword: Keyword = {
      id: Date.now().toString(),
      text: trimmedInput,
      selected: true
    };

    setKeywords(prev => [...prev, newKeyword]);
    setInput('');
    setError('');
  }, [input, keywords]);

  const toggleKeyword = (id: string) => {
    setKeywords(prev =>
      prev.map(k =>
        k.id === id ? { ...k, selected: !k.selected } : k
      )
    );
  };

  const removeKeyword = (id: string) => {
    setKeywords(prev => prev.filter(k => k.id !== id));
  };

  const handleGenerate = () => {
    const selectedKeywords = keywords.filter(k => k.selected);
    if (selectedKeywords.length === 0) {
      setError('请至少选择一个关键词');
      return;
    }
    onGenerate(selectedKeywords);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="relative">
        <Input
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={addKeyword}
          placeholder="输入关键词后按回车、空格或逗号添加（最多10个）"
          error={error}
          disabled={isGenerating}
        />
      </div>

      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map(keyword => (
            <KeywordTag
              key={keyword.id}
              keyword={keyword}
              onToggle={toggleKeyword}
              onRemove={removeKeyword}
            />
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={keywords.length === 0 || !keywords.some(k => k.selected)}
          loading={isGenerating}
          size="lg"
        >
          生成日报
        </Button>
      </div>
    </div>
  );
}; 