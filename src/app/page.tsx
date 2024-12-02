'use client';

import { useState, useEffect } from 'react';
import { Keyword, NewsItem } from '@/types';
import { KeywordInput } from '@/components/KeywordInput';
import { NewsList } from '@/components/NewsList';
import { Settings } from '@/components/Settings';
import { searchNews, formatNewsToReport } from '@/lib/kimi';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

export default function Home() {
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [isGenerating, setIsGenerating] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [report, setReport] = useState<string>('');
  const [activeKeywords, setActiveKeywords] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);

  // 模拟进度更新
  useEffect(() => {
    if (isGenerating) {
      setProgress(0);
      const timer = setInterval(() => {
        setProgress(prev => {
          // 根据当前进度调整增长速度
          if (prev < 30) {
            // 初始阶段，较快速度
            return prev + Math.random() * 8;
          } else if (prev < 60) {
            // 中期阶段，中等速度
            return prev + Math.random() * 5;
          } else if (prev < 75) {
            // 后期阶段，较慢速度
            return prev + Math.random() * 3;
          } else if (prev >= 75) {
            clearInterval(timer);
            return 75; // 最大进度限制在75%
          }
          return prev;
        });
      }, 800); // 增加间隔时间

      return () => {
        clearInterval(timer);
        setProgress(0);
      };
    }
  }, [isGenerating]);

  const handleGenerate = async (keywords: Keyword[]) => {
    setIsGenerating(true);
    setNews([]);
    setReport('');
    setError('');
    
    try {
      const selectedKeywords = keywords.filter(k => k.selected).map(k => k.text);
      setActiveKeywords(selectedKeywords);

      // 设置目标新闻总数和每个关键词的新闻数量
      const TARGET_NEWS_COUNT = 10;
      const newsPerKeyword = Math.max(2, Math.ceil(TARGET_NEWS_COUNT / selectedKeywords.length));
      
      // 并行获取所有关键词的新闻
      const allNewsPromises = selectedKeywords.map(keyword =>
        searchNews(keyword, language)
          .then(items => items.slice(0, newsPerKeyword))
      );

      const newsResults = await Promise.all(allNewsPromises);
      
      // 合并所有新闻并按日期排序
      const allNews = newsResults.flat().sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      if (allNews.length === 0) {
        setError(language === 'zh' ? '未找到相关新闻' : 'No news found');
        return;
      }

      // 如果新闻数量不足，显示提示
      if (allNews.length < TARGET_NEWS_COUNT) {
        setError(
          language === 'zh'
            ? `当前仅找到 ${allNews.length} 条新闻，建议添加更多关键词以获取更多相关新闻`
            : `Only ${allNews.length} news found. Consider adding more keywords for more relevant news`
        );
      } else {
        setError(''); // 清除错误提示
      }

      setNews(allNews);
      setProgress(85);

      // 生成日报格式
      const formattedReport = await formatNewsToReport(allNews, selectedKeywords, language);
      setReport(formattedReport);
      setProgress(100);
    } catch (error) {
      console.error('Error generating news:', error);
      setError(
        language === 'zh'
          ? '获取新闻时发生错误，请稍后重试'
          : 'Error fetching news, please try again later'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Settings language={language} onLanguageChange={setLanguage} />
      
      <main className="container py-6 sm:py-12 space-y-8 sm:space-y-12">
        <div className="text-center space-y-4 sm:space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            {language === 'zh' ? '每日新闻助手' : 'Daily News Assistant'}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === 'zh' 
              ? '输入关键词，获取今日相关新闻' 
              : 'Enter keywords to get relevant news of the day'}
          </p>
        </div>

        <div className="card">
          <KeywordInput
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm sm:text-base font-medium text-center">
            {error}
          </div>
        )}

        {isGenerating && (
          <div className="card space-y-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">
                  {language === 'zh' ? '正在生成新闻日报' : 'Generating News Report'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'zh' 
                    ? '正在搜索和整理相关新闻，请稍候...' 
                    : 'Searching and organizing relevant news, please wait...'}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{Math.round(progress)}%</span>
                  <span>{language === 'zh' ? '预计需要15-30秒' : 'ETA: 15-30 seconds'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {report && !isGenerating && (
          <div className="card overflow-hidden">
            <div className="border-b p-4 sm:p-6 bg-muted">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold">
                  {language === 'zh' ? '今日新闻日报' : 'Daily News Report'}
                </h2>
                <button
                  onClick={handleCopy}
                  className={cn(
                    "button button-primary w-full sm:w-auto",
                    copied && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4 mr-2" />
                      {language === 'zh' ? '已复制' : 'Copied'}
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-4 h-4 mr-2" />
                      {language === 'zh' ? '复制全文' : 'Copy'}
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-8">
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {news.length > 0 && !report && !isGenerating && (
          <NewsList
            news={news}
            keywords={activeKeywords}
          />
        )}
      </main>
    </div>
  );
}

const CheckIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CopyIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
