'use client';

import { cn } from '@/lib/utils';

interface Props {
  language: 'zh' | 'en';
  onLanguageChange: (language: 'zh' | 'en') => void;
}

export function Settings({ language, onLanguageChange }: Props) {
  return (
    <div className="fixed top-4 right-4 flex gap-2">
      <button
        onClick={() => onLanguageChange('zh')}
        className={cn(
          "button button-secondary h-8 px-3",
          language === 'zh' && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        中文
      </button>
      <button
        onClick={() => onLanguageChange('en')}
        className={cn(
          "button button-secondary h-8 px-3",
          language === 'en' && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        English
      </button>
    </div>
  );
} 