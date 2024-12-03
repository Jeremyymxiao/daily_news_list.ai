import { NewsItem } from '@/types';

const KIMI_API_KEY = process.env.NEXT_PUBLIC_KIMI_API_KEY;
const KIMI_API_URL = 'https://api.moonshot.cn/v1';

type ParsedNewsResponse = {
  news: NewsItem[];
};

function validateAndFixUrl(url: string): string {
  if (!url) return '';
  
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    new URL(url);
    return url;
  } catch {
    console.error('Invalid URL:', url);
    return '';
  }
}

export async function searchNews(keyword: string, language: 'zh' | 'en'): Promise<NewsItem[]> {
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
    const content = data.choices[0].message.content;
    const parsedData = extractJSONFromText(content);
    return parsedData.news;
  } catch (error) {
    console.error('Error searching news:', error);
    return [{
      title: "获取新闻失败",
      summary: error instanceof Error ? error.message : "未知错误",
      url: "",
      date: new Date().toISOString(),
      source: "System"
    }];
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