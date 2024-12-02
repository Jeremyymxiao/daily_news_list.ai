import { NewsItem } from '@/types';

const KIMI_API_KEY = process.env.NEXT_PUBLIC_KIMI_API_KEY;
const KIMI_API_URL = 'https://api.moonshot.cn/v1';

interface SearchNewsResponse {
  news: NewsItem[];
}

function extractJSONFromText(text: string): any {
  try {
    // 尝试找到文本中的 JSON 部分
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // 如果没有找到 JSON，尝试构造一个合理的响应
    return {
      news: [{
        title: "API Response Error",
        summary: text.slice(0, 150) + "...",
        url: "",
        date: new Date().toISOString(),
        source: "System"
      }]
    };
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error('Failed to parse API response');
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
            content: "你是一个专业的新闻搜索助手,擅长搜索和整理最新新闻。请始终以JSON格式返回结果,并且只返回当天的新闻。新闻摘要应该简洁明了，突出重点。"
          },
          {
            role: "user",
            content: `请搜索${today}关于"${keyword}"的新闻，要求：
1. 使用搜索工具搜索最新新闻，必须是${today}发布的
2. 语言：${language === 'zh' ? '中文' : 'English'}
3. 新闻摘要要求：
   - 字数控制在100-150字之间
   - 突出新闻的关键信息和重要细节
   - 保持客观专业的语气
4. 返回格式必须是JSON:{"news": [{"title": "新闻标题", "summary": "新闻摘要", "url": "新闻链接", "date": "发布日期", "source": "新闻来源"}]}
5. 如果找不到今天的新闻，返回空数组：{"news": []}`
          }
        ],
        plugins: ["websearch"],
        stream: false,
        temperature: 0.1,
        top_p: 0.8,
        presence_penalty: 0,
        frequency_penalty: 0
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response format');
    }

    const content = data.choices[0].message.content;
    const parsedData = extractJSONFromText(content);

    if (!Array.isArray(parsedData.news)) {
      throw new Error('Invalid news data format');
    }

    return parsedData.news;
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

export async function formatNewsToReport(news: NewsItem[], keywords: string[], language: 'zh' | 'en'): Promise<string> {
  if (!KIMI_API_KEY) {
    throw new Error('KIMI API key is not configured');
  }

  const today = new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
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
            content: language === 'zh' 
              ? `作为新闻编辑，请严格按照以下格式输出新闻：

# [日期]新闻日报

## 概要
[2-3句话总结今日要闻]

## 关键词
[关键词列表]

## 新闻详情

1. **[第一条新闻标题]**
> [新闻内容]
来源：[来源] | [链接]

2. **[第二条新闻标题]**
> [新闻内容]
来源：[来源] | [链接]

[继续用相同格式列出剩余新闻，保持编号连续]

格式要求：
1. 新闻标题必须用粗体（**标题**）
2. 新闻内容必须用引用格式（>）
3. 编号必须从1开始连续
4. 每条新闻必须包含标题、内容、来源和链接
5. 内容要简洁专业`
              : `As a news editor, please strictly follow this format:

# Daily News Report - [Date]

## Summary
[2-3 sentences summarizing today's news]

## Keywords
[List of keywords]

## News Details

1. **[First News Title]**
> [News content]
Source: [Source] | [Link]

2. **[Second News Title]**
> [News content]
Source: [Source] | [Link]

[Continue with the same format for remaining news, keeping numbers sequential]

Format requirements:
1. News titles must be in bold (**title**)
2. News content must be in quote format (>)
3. Numbers must be sequential starting from 1
4. Each news must include title, content, source and link
5. Content should be concise and professional`
          },
          {
            role: "user",
            content: language === 'zh'
              ? `请将以下新闻整理成日报：

日期：${today}
关键词：${keywords.join('、')}
新闻内容：${JSON.stringify(news)}

注意：
1. 严格按照示例格式
2. 保持编号连续
3. 内容简洁专业`
              : `Please format these news into a report:

Date: ${today}
Keywords: ${keywords.join(', ')}
News content: ${JSON.stringify(news)}

Note:
1. Strictly follow the example format
2. Keep numbering sequential
3. Content should be concise and professional`
          }
        ],
        stream: false,
        temperature: 0.1,
        top_p: 0.8,
        frequency_penalty: 0.5,
        presence_penalty: 0.5
      })
    });

    if (!response.ok) {
      throw new Error('Failed to format report');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error formatting report:', error);
    return language === 'zh' 
      ? '生成日报格式时发生错误，请稍后重试。'
      : 'An error occurred while formatting the report. Please try again later.';
  }
} 