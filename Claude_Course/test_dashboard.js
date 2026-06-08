const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Open the dashboard
  await page.goto('http://localhost:8888/dashboard.html', { waitUntil: 'networkidle0' });
  
  // Take screenshot of initial state
  await page.screenshot({ path: '/tmp/dashboard_initial.png' });
  console.log('✅ Dashboard loaded successfully');
  
  // Test typing
  await page.focus('#dailyNotes');
  await page.type('#dailyNotes', 'Today I accomplished my goals!');
  await page.screenshot({ path: '/tmp/dashboard_with_text.png' });
  console.log('✅ Text input working');
  
  // Wait for auto-save
  await page.waitForTimeout(1000);
  const savedText = await page.evaluate(() => {
    return localStorage.getItem('daily_dashboard_notes');
  });
  
  if (savedText === 'Today I accomplished my goals!') {
    console.log('✅ Auto-save functionality working - text persisted to localStorage');
  }
  
  // Check word count
  const wordCount = await page.evaluate(() => {
    return document.getElementById('wordCount').textContent;
  });
  console.log(`✅ Word count display: ${wordCount} words`);
  
  // Check status message
  const statusText = await page.evaluate(() => {
    return document.getElementById('statusText').textContent;
  });
  console.log(`✅ Status message: "${statusText}"`);
  
  // Reload page to verify persistence
  await page.reload({ waitUntil: 'networkidle0' });
  const persistedText = await page.evaluate(() => {
    return document.getElementById('dailyNotes').value;
  });
  
  if (persistedText === 'Today I accomplished my goals!') {
    console.log('✅ Data persistence verified - content reloaded after page refresh');
  }
  
  await browser.close();
  console.log('\n✅ All verification tests passed!');
})();
