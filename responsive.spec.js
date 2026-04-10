const { test, expect } = require('playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const pages = [
  'index.html',
  'about.html',
  'services.html',
  'doctors.html',
  'neurological-disorders.html',
  'psychological-emotional-health.html',
  'hair-loss-treatment.html',
  'skin-diseases.html',
  'womens-health.html',
  'respiratory-lung-diseases.html',
  'contact.html'
];

const viewports = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-412', width: 412, height: 915 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-834', width: 834, height: 1112 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 }
];

const root = process.cwd();

function fileUrl(file) {
  return pathToFileURL(path.join(root, file)).toString();
}

async function collectOverflow(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const rootOverflow = document.documentElement.scrollWidth - vw;
    const bodyOverflow = document.body.scrollWidth - vw;

    const offenders = [];
    const all = Array.from(document.querySelectorAll('body *'));

    for (const el of all) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (style.position === 'fixed' || style.position === 'sticky') continue;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      const tooWide = rect.width - vw > 1;
      const rightOff = rect.right - vw > 1;
      const leftOff = rect.left < -1;

      if (tooWide || rightOff || leftOff) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          className: (el.className || '').toString().slice(0, 80),
          id: el.id || '',
          left: Number(rect.left.toFixed(1)),
          right: Number(rect.right.toFixed(1)),
          width: Number(rect.width.toFixed(1))
        });
      }
      if (offenders.length >= 8) break;
    }

    return {
      rootOverflow: Number(rootOverflow.toFixed(2)),
      bodyOverflow: Number(bodyOverflow.toFixed(2)),
      offenders
    };
  });
}

for (const file of pages) {
  for (const vp of viewports) {
    test(`${file} :: ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(fileUrl(file), { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(120);

      const firstScan = await collectOverflow(page);

      expect.soft(firstScan.rootOverflow, `${file} ${vp.name} root overflow`).toBeLessThanOrEqual(1);
      expect.soft(firstScan.bodyOverflow, `${file} ${vp.name} body overflow`).toBeLessThanOrEqual(1);
      expect.soft(firstScan.offenders.length, `${file} ${vp.name} offscreen elements`).toBe(0);

      if (vp.width <= 860) {
        const menuBtn = page.locator('#menuBtn');
        const navMenu = page.locator('#navMenu');
        await expect(menuBtn).toBeVisible();
        await menuBtn.click();
        await expect(navMenu).toHaveClass(/open/);

        const navRect = await navMenu.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right, width: r.width, vw: window.innerWidth };
        });

        expect.soft(navRect.left, `${file} ${vp.name} mobile nav left`).toBeGreaterThanOrEqual(-1);
        expect.soft(navRect.right - navRect.vw, `${file} ${vp.name} mobile nav right overflow`).toBeLessThanOrEqual(1);

        const dropdownToggle = page.locator('.nav-dropdown-toggle').first();
        if (await dropdownToggle.count()) {
          await dropdownToggle.click();
          const dropdownMenu = page.locator('.nav-dropdown-menu').first();
          await expect(dropdownMenu).toBeVisible();
        }

        await menuBtn.click();
      }
    });
  }
}
