'use client';

import { NewsItem } from '@/types';

interface Props {
  news: NewsItem[];
  keywords: string[];
}

export function NewsList({ news, keywords }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium"
          >
            {keyword}
          </span>
        ))}
      </div>

      <div className="space-y-4">
        {news.map((item) => (
          <article key={item.url} className="card hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-2">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link hover:underline"
              >
                {item.title}
              </a>
            </h3>
            <div className="text-sm text-muted-foreground">
              <time dateTime={item.date}>
                {new Date(item.date).toLocaleDateString()}
              </time>
              {item.source && (
                <>
                  <span className="mx-2">·</span>
                  <span>{item.source}</span>
                </>
              )}
            </div>
            {item.summary && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {item.summary}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
} 