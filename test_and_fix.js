const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:8080/index.html...');
  await page.goto('http://localhost:8080/index.html');
  await page.waitForTimeout(600);

  const artifactsDir = 'C:\\Users\\ugofe\\.gemini\\antigravity\\brain\\d25cddfc-4cb5-4627-ab3f-99182b193833';

  // 1. Screenshot Schermata Principale Fissata
  await page.screenshot({ path: path.join(artifactsDir, 'playwright_main_screen_fixed.png') });
  console.log('1. Main screen fixed captured.');

  // 2. Click su Attacco fondamentale
  await page.click('button[data-fond="attacco"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(artifactsDir, 'playwright_attacco_selected_fixed.png') });
  console.log('2. Attacco selected captured.');

  // 3. Apri Ruota Scout toccando il giocatore in Zona 3
  await page.click('#zona-3');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactsDir, 'playwright_ruota_open_fixed.png') });
  console.log('3. Ruota open fixed captured.');

  // 4. Hover su anello ++ del settore Attacco (-30 deg, r = 196px esatti)
  const canvasBox = await page.locator('#canvas-ruota-interactive').boundingBox();
  if (canvasBox) {
    const scale = canvasBox.width / 520;
    const hoverX = canvasBox.x + (260 + 196 * Math.cos(-Math.PI / 6)) * scale;
    const hoverY = canvasBox.y + (260 + 196 * Math.sin(-Math.PI / 6)) * scale;
    console.log(`Hovering over Attacco sector ++ at (${hoverX}, ${hoverY})...`);
    await page.mouse.move(hoverX, hoverY);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactsDir, 'playwright_ruota_hover_fixed.png') });
    console.log('4. Ruota hover fixed captured.');

    // 5. Click per registrare Attacco ++
    await page.mouse.click(hoverX, hoverY);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactsDir, 'playwright_after_attacco_pp.png') });
    console.log('5. After Attacco ++ click captured.');
  }

  // 6. Test riapertura ruota e click Mani Out
  await page.click('#zona-4');
  await page.waitForTimeout(500);
  await page.click('.btn-speciale-card.btn-maniout');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactsDir, 'playwright_after_maniout.png') });
  console.log('6. After Mani Out click captured.');

  await browser.close();
  console.log('All tests completed successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
