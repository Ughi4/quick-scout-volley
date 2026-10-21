const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const iconPath = path.resolve(__dirname, 'assets', 'images', 'app_icon.png');
  const iconBase64 = fs.readFileSync(iconPath).toString('base64');
  const dataUrl = `data:image/png;base64,${iconBase64}`;

  // Generate 192x192
  await page.setViewportSize({ width: 192, height: 192 });
  await page.setContent(`
    <style>body { margin: 0; padding: 0; overflow: hidden; background: transparent; }</style>
    <img id="icon" src="${dataUrl}" style="width: 192px; height: 192px; display: block;" />
  `);
  await page.locator('#icon').screenshot({
    path: path.resolve(__dirname, 'assets', 'images', 'app_icon_192.png')
  });
  console.log('Created app_icon_192.png');

  // Generate 512x512
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`
    <style>body { margin: 0; padding: 0; overflow: hidden; background: transparent; }</style>
    <img id="icon" src="${dataUrl}" style="width: 512px; height: 512px; display: block;" />
  `);
  await page.locator('#icon').screenshot({
    path: path.resolve(__dirname, 'assets', 'images', 'app_icon_512.png')
  });
  console.log('Created app_icon_512.png');

  await browser.close();
}

main().catch(console.error);
