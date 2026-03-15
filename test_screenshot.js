const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport: {width: 1200, height: 1000}});
  await page.goto('http://localhost:8080/test_symbols.html');
  // Wait for TradingView iframes to load
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'test_symbols.png' });
  await browser.close();
})();
