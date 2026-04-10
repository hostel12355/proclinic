import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

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

function startServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('npx', ['http-server', '.', '-p', '4173', '-c-1'], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let settled = false;
    const onData = (buf) => {
      const text = String(buf);
      if (!settled && (text.includes('Available on') || text.includes('Hit CTRL-C'))) {
        settled = true;
        resolve(server);
      }
    };

    server.stdout.on('data', onData);
    server.stderr.on('data', onData);

    setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Server did not start in time.'));
      }
    }, 15000);
  });
}

const browser = await chromium.launch({ headless: true });
let server;
const report = [];

try {
  server = await startServer();
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const file of pages) {
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const url = `http://127.0.0.1:4173/${file}`;
      const consoleErrors = [];
      const onConsole = (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      };

      page.on('console', onConsole);
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(120);

      const scan = await page.evaluate(async () => {
        const vw = window.innerWidth;
        const root = document.documentElement;
        const body = document.body;

        const rootOverflow = root.scrollWidth - vw;
        const bodyOverflow = body.scrollWidth - vw;

        const offenders = [];
        const all = Array.from(document.querySelectorAll('body *'));

        for (const el of all) {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);

          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.position === 'fixed' ||
            style.position === 'sticky' ||
            style.transform !== 'none'
          ) {
            continue;
          }

          const tooWide = rect.width - vw > 1;
          const leftOff = rect.left < -1;
          const rightOff = rect.right - vw > 1;

          if (tooWide || leftOff || rightOff) {
            offenders.push({
              tag: el.tagName.toLowerCase(),
              className: (el.className || '').toString().trim().slice(0, 80),
              id: el.id || '',
              left: Number(rect.left.toFixed(1)),
              right: Number(rect.right.toFixed(1)),
              width: Number(rect.width.toFixed(1))
            });
          }
          if (offenders.length >= 8) break;
        }

        let mobileMenuCheck = null;
        const menuBtn = document.getElementById('menuBtn');
        const navMenu = document.getElementById('navMenu');

        if (menuBtn && navMenu && vw <= 860) {
          menuBtn.click();
          await new Promise((r) => setTimeout(r, 80));
          const navRect = navMenu.getBoundingClientRect();
          mobileMenuCheck = {
            opened: navMenu.classList.contains('open'),
            navRight: Number(navRect.right.toFixed(1)),
            navLeft: Number(navRect.left.toFixed(1)),
            navWidth: Number(navRect.width.toFixed(1)),
            viewport: vw
          };
          menuBtn.click();
        }

        return {
          rootOverflow: Number(rootOverflow.toFixed(1)),
          bodyOverflow: Number(bodyOverflow.toFixed(1)),
          offenders,
          mobileMenuCheck
        };
      });

      page.off('console', onConsole);

      report.push({
        file,
        viewport: vp.name,
        ...scan,
        consoleErrors
      });
    }
  }

  await context.close();
} finally {
  await browser.close();
  if (server && !server.killed) {
    server.kill('SIGTERM');
  }
}

const issues = report.filter((r) =>
  r.rootOverflow > 1 ||
  r.bodyOverflow > 1 ||
  r.offenders.length > 0 ||
  (r.mobileMenuCheck && !r.mobileMenuCheck.opened) ||
  r.consoleErrors.length > 0
);

console.log(JSON.stringify({ totalChecks: report.length, issueCount: issues.length, issues }, null, 2));
