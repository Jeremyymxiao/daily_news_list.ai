import { NextResponse } from 'next/server';
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();
const NEWS_API_KEY = serverRuntimeConfig.NEWS_API_KEY || process.env.NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2';

export async function GET() {
  console.log('Environment variables:', {
    NEWS_API_KEY: NEWS_API_KEY ? '***' : 'not configured',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    SERVER_CONFIG: !!serverRuntimeConfig.NEWS_API_KEY,
  });

  try {
    console.log('Testing News API with key:', NEWS_API_KEY ? '***' : 'not configured');

    if (!NEWS_API_KEY) {
      return NextResponse.json({
        status: 'error',
        error: 'News API key is not configured',
        apiKeyConfigured: false,
        env: process.env.NODE_ENV,
      }, { status: 400 });
    }

    // 构建一个简单的测试请求
    const params = {
      q: 'technology',
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: '5',
      apiKey: NEWS_API_KEY
    };

    const url = `${NEWS_API_URL}/everything?` + new URLSearchParams(params);
    console.log('Requesting URL:', url.replace(NEWS_API_KEY, '***'));

    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API Response status:', response.status);
    console.log('API Response:', data.status === 'error' ? data : 'Success');

    return NextResponse.json({
      status: response.ok ? 'success' : 'error',
      statusCode: response.status,
      data: data,
      apiKeyConfigured: true
    });
  } catch (error) {
    console.error('Error in test-news route:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKeyConfigured: !!NEWS_API_KEY
    }, { status: 500 });
  }
} 