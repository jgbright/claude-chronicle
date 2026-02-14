/**
 * Capture showcase screenshots of exported session HTML for the landing page.
 *
 * Reads export HTML paths from environment variables:
 *   SHOWCASE_CLAUDE_HTML  — path to Claude-theme export HTML
 *   SHOWCASE_COPILOT_HTML — path to Copilot-theme export HTML
 *
 * Outputs JPEG screenshots to web/showcase/screenshots/:
 *   claude-hero.jpg, copilot-hero.jpg   — 1280×800 viewport clips
 *   claude-full.jpg, copilot-full.jpg   — full-page captures
 *
 * Usage:
 *   SHOWCASE_CLAUDE_HTML=path/to/claude.html SHOWCASE_COPILOT_HTML=path/to/copilot.html \
 *     node scripts/capture-showcase-screenshots.mjs
 */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const showcaseDir = path.join(__dirname, '..', 'showcase');
const screenshotsDir = path.join(showcaseDir, 'screenshots');

// ---------------------------------------------------------------------------
// Minimal static file server (same pattern as capture-screenshots.mjs)
// ---------------------------------------------------------------------------

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function startStaticServer(root) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      let filePath = path.join(root, decodeURIComponent(url.pathname));

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
  const claudeHtml = process.env.SHOWCASE_CLAUDE_HTML;
  const copilotHtml = process.env.SHOWCASE_COPILOT_HTML;

  if (!claudeHtml || !copilotHtml) {
    console.error('Error: SHOWCASE_CLAUDE_HTML and SHOWCASE_COPILOT_HTML env vars are required.');
    process.exit(1);
  }

  for (const [label, filePath] of [['Claude', claudeHtml], ['Copilot', copilotHtml]]) {
    if (!existsSync(filePath)) {
      console.error(`Error: ${label} export not found at ${filePath}`);
      process.exit(1);
    }
  }

  // Serve from the directory containing the HTML files
  const serveDir = path.dirname(path.resolve(claudeHtml));
  const { server, port } = await startStaticServer(serveDir);
  console.log(`Static server listening on http://127.0.0.1:${port}`);

  mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  const themes = [
    { name: 'claude', file: path.resolve(claudeHtml) },
    { name: 'copilot', file: path.resolve(copilotHtml) },
  ];

  for (const theme of themes) {
    const filename = path.basename(theme.file);
    const url = `http://127.0.0.1:${port}/${filename}`;

    console.log(`Capturing ${theme.name} theme from ${url}...`);

    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });

    // Wait for content to render
    await page.waitForTimeout(1000);

    // Hero screenshot — viewport clip (1280×800)
    const heroPath = path.join(screenshotsDir, `${theme.name}-hero.jpg`);
    await page.screenshot({ path: heroPath, type: 'jpeg', quality: 85 });
    console.log(`  Saved ${theme.name}-hero.jpg`);

    // Full-page screenshot
    const fullPath = path.join(screenshotsDir, `${theme.name}-full.jpg`);
    await page.screenshot({ path: fullPath, type: 'jpeg', quality: 85, fullPage: true });
    console.log(`  Saved ${theme.name}-full.jpg`);

    await page.close();
  }

  await browser.close();
  server.close();

  console.log(`\nDone. Screenshots saved to ${screenshotsDir}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
