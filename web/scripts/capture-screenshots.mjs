/**
 * Capture screenshots of all Storybook stories using Playwright.
 *
 * Prerequisites:
 *   npm run build-storybook   (produces storybook-static/)
 *   npx playwright install chromium
 *
 * Usage:
 *   node scripts/capture-screenshots.mjs
 */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import {
  readFileSync,
  existsSync,
  mkdirSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storybookDir = path.join(__dirname, '..', 'storybook-static');
const galleryDir = path.join(__dirname, '..', 'gallery');
const screenshotsDir = path.join(galleryDir, 'screenshots');

// ---------------------------------------------------------------------------
// Minimal static file server
// ---------------------------------------------------------------------------

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

function startStaticServer(root) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      let filePath = path.join(root, decodeURIComponent(url.pathname));

      // Default to index.html for directory requests
      if (existsSync(filePath) && statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      try {
        const data = readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      } catch {
        res.writeHead(500);
        res.end('Internal server error');
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });

    server.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Validate storybook-static exists
  if (!existsSync(storybookDir)) {
    console.error(
      `Error: ${storybookDir} does not exist. Run "npm run build-storybook" first.`,
    );
    process.exit(1);
  }

  // Discover stories from index.json
  const indexPath = path.join(storybookDir, 'index.json');
  if (!existsSync(indexPath)) {
    console.error(`Error: ${indexPath} not found. Is the Storybook build complete?`);
    process.exit(1);
  }

  const index = JSON.parse(readFileSync(indexPath, 'utf-8'));
  const stories = Object.values(index.entries).filter(
    (entry) => entry.type === 'story',
  );

  if (stories.length === 0) {
    console.error('No stories found in index.json.');
    process.exit(1);
  }

  console.log(`Found ${stories.length} stories.`);

  // Ensure output directory exists
  mkdirSync(screenshotsDir, { recursive: true });

  // Start static file server
  const { server, port } = await startStaticServer(storybookDir);
  console.log(`Static server listening on http://127.0.0.1:${port}`);

  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });

  let captured = 0;
  let failed = 0;

  for (const story of stories) {
    const storyId = story.id;
    const safeName = storyId.replace(/[./]/g, '-');
    const outFile = path.join(screenshotsDir, `${safeName}.png`);

    try {
      const page = await context.newPage();
      const url = `http://127.0.0.1:${port}/iframe.html?id=${encodeURIComponent(storyId)}&viewMode=story`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });

      // Wait for the story root to have children (rendered content)
      try {
        await page.waitForFunction(
          () => {
            const root = document.getElementById('storybook-root');
            return root && root.children.length > 0;
          },
          { timeout: 10_000 },
        );
      } catch {
        // Timeout waiting for content — take screenshot anyway
        console.warn(`  Warning: ${storyId} — timed out waiting for content, capturing as-is.`);
      }

      // Small delay for CSS transitions / animations to settle
      await page.waitForTimeout(300);

      await page.screenshot({ path: outFile, fullPage: true });
      await page.close();

      captured++;
      console.log(`  [${captured + failed}/${stories.length}] Captured: ${storyId}`);
    } catch (err) {
      failed++;
      console.error(`  [${captured + failed}/${stories.length}] Failed:  ${storyId} — ${err.message}`);
    }
  }

  // Clean up
  await browser.close();
  server.close();

  console.log(`\nDone. ${captured} captured, ${failed} failed.`);
  console.log(`Screenshots saved to ${screenshotsDir}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
