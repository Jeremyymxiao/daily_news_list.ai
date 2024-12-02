import { NewsItem } from '@/types';

interface NewsCardProps {
  news: NewsItem;
}

export const NewsCard = ({ news }: NewsCardProps) => {
  return (
    <div className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors duration-200">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold leading-tight">
            {news.title}
          </h3>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {news.date}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm leading-relaxed">
          {news.summary}
        </p>
        
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-gray-500">
            来源：{news.source}
          </span>
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-black hover:underline underline-offset-4"
          >
            阅读原文 →
          </a>
        </div>
      </div>
    </div>
  );
}; 