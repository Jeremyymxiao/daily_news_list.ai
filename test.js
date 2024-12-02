const { searchNews, formatNewsToReport } = require('./src/lib/kimi');

async function test() {
  try {
    const news = await searchNews('AI', 'zh');
    const report = await formatNewsToReport(news, ['AI'], 'zh');
    console.log(report);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test(); 