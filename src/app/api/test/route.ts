import { searchNews, formatNewsToReport } from '@/lib/kimi';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const news = await searchNews('AI', 'zh');
    const report = await formatNewsToReport(news, ['AI'], 'zh');
    return NextResponse.json({ report });
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
} 