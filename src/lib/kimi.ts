import { NewsItem } from '@/types';

const KIMI_API_KEY = process.env.NEXT_PUBLIC_KIMI_API_KEY;
const KIMI_API_URL = 'https://api.moonshot.cn/v1';
const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2';

type ParsedNewsResponse = {
  news: NewsItem[];
};

// 添加在文件顶部的类型定义部分
interface NewsAPIArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

// 添加 URL 验证和修复函数
function validateAndFixUrl(url: string): string {
  if (!url) return '';
  
  try {
    // 如果 URL 不包含协议，添加 https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // 验证 URL 格式
    new URL(url);
    return url;
  } catch {
    console.error('Invalid URL:', url);
    return '';
  }
}

function extractJSONFromText(text: string): ParsedNewsResponse {
  try {
    console.log('Raw text:', text);

    // 清理文本，移除可能的前缀和后缀
    const cleanText = text.replace(/```json\s*|\s*```/g, '').trim();

    // 尝试直接解析清理后的文本
    try {
      const directParsed = JSON.parse(cleanText);
      if (directParsed.news && Array.isArray(directParsed.news)) {
        const processedNews = directParsed.news.map((item: NewsItem) => ({
          title: item.title || '',
          summary: item.summary || '',
          url: validateAndFixUrl(item.url),
          date: item.date || new Date().toISOString(),
          source: item.source || ''
        }));
        return { news: processedNews };
      }
    } catch {
      console.log('Direct parsing failed, trying to extract JSON');
    }

    // 如果直接解析失败，尝试提取 JSON 部分
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonText = jsonMatch[0];
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed.news && Array.isArray(parsed.news)) {
          const processedNews = parsed.news.map((item: NewsItem) => ({
            title: item.title || '',
            summary: item.summary || '',
            url: validateAndFixUrl(item.url),
            date: item.date || new Date().toISOString(),
            source: item.source || ''
          }));
          return { news: processedNews };
        }
      } catch (parseError) {
        console.error('Error parsing extracted JSON:', parseError);
      }
    }

    // 如果所有解析尝试都失败，返回默认响应
    console.log('All parsing attempts failed');
    return {
      news: [{
        title: "数据解析错误",
        summary: "无法解析返回的数据，请稍后重试",
        url: "",
        date: new Date().toISOString(),
        source: "System"
      }]
    };
  } catch (error) {
    console.error('Error in extractJSONFromText:', error);
    return {
      news: [{
        title: "处理错误",
        summary: error instanceof Error ? error.message : "未知错误",
        url: "",
        date: new Date().toISOString(),
        source: "System"
      }]
    };
  }
}

async function fetchNewsFromAPI(keyword: string, language: 'zh' | 'en'): Promise<NewsItem[]> {
  try {
    // 使用 everything 端点，放宽搜索条件
    const params = {
      q: keyword,
      language: language === 'zh' ? 'zh' : 'en',
      // 使用可靠的新闻源
      domains: language === 'zh' ? 
        'thepaper.cn,163.com,sina.com.cn,qq.com' : 
        'bbc.com,reuters.com,apnews.com,theguardian.com,nytimes.com',
      sortBy: 'publishedAt',
      pageSize: '100',
      apiKey: NEWS_API_KEY || ''
    };

    console.log('Searching news with params:', { ...params, apiKey: '***' });

    const response = await fetch(
      `${NEWS_API_URL}/everything?` + new URLSearchParams(params)
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('News API error:', errorData);
      
      // 如果 API 调用失败，回退到 kimi 搜索
      return fetchNewsFromKimi(keyword, language);
    }

    const data = await response.json();
    console.log('News API response:', data);
    
    if (!data.articles || !Array.isArray(data.articles) || data.articles.length === 0) {
      // 如果没有找到新闻，回退到 kimi 搜索
      return fetchNewsFromKimi(keyword, language);
    }

    return data.articles
      .filter((article: NewsAPIArticle) => 
        article.title && 
        article.description && 
        article.url && 
        !article.title.includes('[Removed]')
      )
      .map((article: NewsAPIArticle) => ({
        title: article.title || '',
        summary: article.description || '',
        url: validateAndFixUrl(article.url),
        date: article.publishedAt || new Date().toISOString(),
        source: article.source?.name || ''
      }));
  } catch (error) {
    console.error('Error fetching news from API:', error);
    // 出错时回退到 kimi 搜索
    return fetchNewsFromKimi(keyword, language);
  }
}

// 添加 kimi 搜索作为备选方案
async function fetchNewsFromKimi(keyword: string, language: 'zh' | 'en'): Promise<NewsItem[]> {
  if (!KIMI_API_KEY) {
    throw new Error('KIMI API key is not configured');
  }

  const today = new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  try {
    const response = await fetch(`${KIMI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: "moonshot-v1-32k",
        messages: [
          {
            role: "system",
            content: "你是一个专业的新闻搜索助手。请使用 websearch 工具搜索最新新闻，并以JSON格式返回结果。新闻必须包含完整的URL。"
          },
          {
            role: "user",
            content: `请搜索${today}关于"${keyword}"的新闻，要求：
1. 使用搜索工具搜索最新新闻
2. 语言：${language === 'zh' ? '中文' : 'English'}
3. 新闻内容要求：
   - 完整保留新闻的主要内容
   - 突出新闻的关键信息和重要细节
   - URL必须是完整的、可访问的原始新闻链接
4. 返回格式必须是JSON:{"news": [{"title": "新闻标题", "summary": "新闻内容", "url": "新闻链接", "date": "发布日期", "source": "新闻来源"}]}`
          }
        ],
        plugins: ["websearch"],
        stream: false,
        temperature: 0.1
      })
    });

    const data = await response.json();
    const parsedData = extractJSONFromText(data.choices[0].message.content);
    return parsedData.news;
  } catch (error) {
    console.error('Error fetching news from Kimi:', error);
    return [];
  }
}

export async function searchNews(keyword: string, language: 'zh' | 'en'): Promise<NewsItem[]> {
  if (!NEWS_API_KEY) {
    throw new Error('News API key is not configured');
  }

  // 首先将中文关键词翻译成英文
  let englishKeyword = keyword;
  if (language === 'zh') {
    try {
      const translateResponse = await fetch(`${KIMI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KIMI_API_KEY}`
        },
        body: JSON.stringify({
          model: "moonshot-v1-32k",
          messages: [
            {
              role: "system",
              content: "You are a translation assistant. Please translate the Chinese keywords into English, only return the translation result, and do not add any additional explanations."
            },
            {
              role: "user",
              content: keyword
            }
          ],
          stream: false,
          temperature: 0.1
        })
      });

      const data = await translateResponse.json();
      englishKeyword = data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error translating keyword:', error);
    }
  }

  try {
    // 分别获取中文和英文新闻
    const [chineseNews, englishNews] = await Promise.all([
      fetchNewsFromAPI(keyword, 'zh'),
      fetchNewsFromAPI(englishKeyword, 'en')
    ]);

    // 如果是中文界面，翻译英文新闻
    let processedEnglishNews = englishNews;
    if (language === 'zh' && englishNews.length > 0) {
      processedEnglishNews = await translateNewsToZh(englishNews);
    }

    // 合并新闻，保持平衡
    const combinedNews = balanceNews(chineseNews, processedEnglishNews);
    return combinedNews;
  } catch (error) {
    console.error('Error searching news:', error);
    return [{
      title: "Error",
      summary: error instanceof Error ? error.message : "Unknown error occurred",
      url: "",
      date: new Date().toISOString(),
      source: "System"
    }];
  }
}

async function translateNewsToZh(news: NewsItem[]): Promise<NewsItem[]> {
  try {
    const response = await fetch(`${KIMI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: "moonshot-v1-32k",
        messages: [
          {
            role: "system",
            content: `你是一个翻译助手。请将英文新闻翻译成中文。要求：
1. 必须翻译 title 和 summary 字段为中文
2. 保持 url、date、source 字段完全不变
3. 返回格式必须是 JSON 数组，不要有任何其他内容
4. 翻译要准确、通顺、符合中文表达习惯`
          },
          {
            role: "user",
            content: `请将以下英文新闻翻译成中文（保持数组格式）：${JSON.stringify(news, null, 2)}`
          }
        ],
        stream: false,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      console.error('Translation API request failed:', response.statusText);
      return news;
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    try {
      // 清理可能的前缀和后缀
      const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
      const translated = JSON.parse(cleanContent);
      
      if (Array.isArray(translated)) {
        // 确保每个翻译后的新闻都保留了原始的 url、date 和 source
        const validTranslation = translated.map((item, index) => ({
          ...item,
          url: news[index].url,
          date: news[index].date,
          source: news[index].source
        }));
        
        return validTranslation;
      }
      
      console.error('Invalid translation format');
      return news;
    } catch (parseError) {
      console.error('Error parsing translation:', parseError);
      return news;
    }
  } catch (error) {
    console.error('Translation error:', error);
    return news;
  }
}

function balanceNews(chineseNews: NewsItem[], englishNews: NewsItem[]): NewsItem[] {
  // 获取3天前的日期
  const today = new Date();
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);

  // 过滤新闻，保留3天内的
  const filterByDate = (news: NewsItem[]) => 
    news.filter(item => {
      try {
        const itemDate = new Date(item.date);
        return itemDate >= threeDaysAgo && itemDate <= today;
      } catch {
        return false;
      }
    });

  const validChineseNews = filterByDate(chineseNews);
  const validEnglishNews = filterByDate(englishNews);

  const targetLength = 10;
  const halfLength = Math.floor(targetLength / 2);

  // 如果某一种语言的新闻不足，使用另一种补充
  if (validChineseNews.length < halfLength && validEnglishNews.length > halfLength) {
    return [...validChineseNews, ...validEnglishNews.slice(0, targetLength - validChineseNews.length)];
  } else if (validEnglishNews.length < halfLength && validChineseNews.length > halfLength) {
    return [...validChineseNews.slice(0, targetLength - validEnglishNews.length), ...validEnglishNews];
  }

  // 正常情况下各取一半
  return [
    ...validChineseNews.slice(0, halfLength),
    ...validEnglishNews.slice(0, targetLength - halfLength)
  ];
}

export async function formatNewsToReport(news: NewsItem[], keywords: string[], language: 'zh' | 'en'): Promise<string> {
  const date = new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const keywordText = keywords.join('、');

  let report = '';
  
  // 添加日期标题
  report += `# ${date}新闻日报\n\n`;
  
  // 添加今日要闻
  report += `## 今日要闻\n\n`;
  report += `今日新闻聚焦于${keywordText}相关领域的最新进展。\n\n`;
  
  // 添加新闻详情
  report += `## 新闻详情\n\n`;
  
  // 格式化每条新闻，使用编号列表
  news.forEach((item, index) => {
    report += `${index + 1}. **${item.title}** | 来源：${item.source || '未知来源'} | [阅读原文](${item.url})\n\n`;
    report += `   ${item.summary}\n\n`;
  });

  return report;
} 