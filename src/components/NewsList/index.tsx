import { useState } from 'react';
import { NewsItem } from '@/types';
import { Button } from '../ui/Button';
import { NewsCard } from './NewsCard';

interface NewsListProps {
  news: NewsItem[];
  keywords: string[];
}

export const NewsList = ({ news, keywords }: NewsListProps) => {
  const [copied, setCopied] = useState(false);

  const generateReport = () => {
    const date = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    const keywordText = keywords.join('、');
    
    const newsText = news.map(item => (
      `${item.title}\n${item.summary}\n来源：${item.source} ${item.date}\n原文链接：${item.url}\n`
    )).join('\n');

    return `${date} 新闻日报\n\n关键词：${keywordText}\n\n${newsText}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (news.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">今日新闻</h2>
        <Button
          variant="secondary"
          onClick={handleCopy}
          className="min-w-[100px]"
        >
          {copied ? '已复制' : '复制全文'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-100 rounded-md text-sm text-gray-600"
          >
            {keyword}
          </span>
        ))}
      </div>

      <div className="space-y-4">
        {news.map((item, index) => (
          <NewsCard key={index} news={item} />
        ))}
      </div>
    </div>
  );
}; 