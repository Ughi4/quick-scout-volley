const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:8080...');
  await page.goto('http://localhost:8080/index.html');
  await page.waitForTimeout(1000);

  const artifactsDir = 'C:\\Users\\ugofe\\.gemini\\antigravity\\brain\\d25cddfc-4cb5-4627-ab3f-99182b193833';
  
  // Screenshot main screen
  await page.screenshot({ path: path.join(artifactsDir, 'playwright_main_screen.png') });
  console.log('Main screen captured.');

  // Click on player in zona 4 to open wheel
  await page.click('#zona-4');
  await page.waitForTimeout(500);

  // Screenshot wheel overlay
  await page.screenshot({ path: path.join(artifactsDir, 'playwright_wheel_overlay.png') });
  console.log('Wheel overlay captured.');

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
