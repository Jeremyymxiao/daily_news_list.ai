'use client';

import { useState } from 'react';
import { Keyword, NewsItem } from '@/types';
import { KeywordInput } from '@/components/KeywordInput';
import { NewsList } from '@/components/NewsList';
import { Settings } from '@/components/Settings';
import { searchNews, formatNewsToReport } from '@/lib/kimi';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [isGenerating, setIsGenerating] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [report, setReport] = useState<string>('');
  const [activeKeywords, setActiveKeywords] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (keywords: Keyword[]) => {
    setIsGenerating(true);
    setNews([]);
    setReport('');
    setError('');
    
    try {
      const selectedKeywords = keywords.filter(k => k.selected).map(k => k.text);
      setActiveKeywords(selectedKeywords);

      // 计算每个关键词应该获取的新闻数量
      const newsPerKeyword = Math.max(1, Math.floor(5 / selectedKeywords.length));
      
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

      setNews(allNews);

      // 生成日报格式
      const formattedReport = await formatNewsToReport(allNews, selectedKeywords, language);
      setReport(formattedReport);
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Settings language={language} onLanguageChange={setLanguage} />
      
      <main className="container mx-auto px-4 py-12 space-y-12 max-w-5xl">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-black tracking-tight">
            {language === 'zh' ? '每日新闻助手' : 'Daily News Assistant'}
          </h1>
          <p className="text-xl text-black max-w-2xl mx-auto">
            {language === 'zh' 
              ? '输入关键词，获取今日相关新闻' 
              : 'Enter keywords to get relevant news of the day'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-8">
          <KeywordInput
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

        {error && (
          <div className="text-center text-red-600 bg-red-50 rounded-lg p-4 font-medium">
            {error}
          </div>
        )}

        {report && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
            <div className="border-b border-gray-200 p-6 bg-gray-50">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-black">
                  {language === 'zh' ? '今日新闻日报' : 'Daily News Report'}
                </h2>
                <button
                  onClick={handleCopy}
                  className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      {language === 'zh' ? '已复制' : 'Copied'}
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-4 h-4" />
                      {language === 'zh' ? '复制全文' : 'Copy'}
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-8">
              <div className="prose prose-lg max-w-none 
                prose-headings:text-black prose-headings:font-bold 
                prose-h1:text-3xl prose-h1:mb-8
                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                prose-p:text-black prose-p:leading-relaxed prose-p:my-4
                prose-strong:text-black prose-strong:font-bold
                prose-a:text-blue-700 prose-a:no-underline hover:prose-a:underline
                prose-ul:text-black prose-ol:text-black
                prose-li:text-black prose-li:my-1
                prose-blockquote:text-black prose-blockquote:border-l-4 prose-blockquote:border-black/20 prose-blockquote:pl-4 prose-blockquote:py-1
                prose-hr:border-gray-300
                [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                [&_p]:text-black [&_li]:text-black [&_strong]:text-black
                text-black"
              >
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {news.length > 0 && !report && (
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
