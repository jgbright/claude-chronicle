/**
 * Generate a single-page HTML gallery from captured Storybook screenshots.
 *
 * Usage:
 *   node scripts/generate-gallery.mjs
 *
 * Reads screenshots from gallery/screenshots/ and writes gallery/index.html.
 * Images are embedded as base64 data URIs so the gallery is self-contained.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const galleryDir = path.join(__dirname, '..', 'gallery');
const screenshotsDir = path.join(galleryDir, 'screenshots');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatStoryName(namePart) {
  return namePart.replace(/-/g, ' ');
}

function formatGroupName(prefix) {
  // e.g. "shared-codeblock" -> "Shared / Codeblock"
  return prefix
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' / ');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  if (!existsSync(screenshotsDir)) {
    console.error(`Error: ${screenshotsDir} does not exist. Run capture-screenshots.mjs first.`);
    process.exit(1);
  }

  const files = readdirSync(screenshotsDir)
    .filter((f) => f.endsWith('.png'))
    .sort();

  if (files.length === 0) {
    console.error('No screenshots found in gallery/screenshots/.');
    process.exit(1);
  }

  console.log(`Found ${files.length} screenshots.`);

  // Group by component prefix (everything before --)
  const groups = new Map();

  for (const file of files) {
    const storyId = file.replace(/\.png$/, '');
    const separatorIdx = storyId.indexOf('--');
    let groupKey, storyName;

    if (separatorIdx !== -1) {
      groupKey = storyId.substring(0, separatorIdx);
      storyName = storyId.substring(separatorIdx + 2);
    } else {
      groupKey = storyId;
      storyName = storyId;
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }

    const imgData = readFileSync(path.join(screenshotsDir, file));
    const base64 = imgData.toString('base64');

    groups.get(groupKey).push({
      file,
      storyName,
      dataUri: `data:image/png;base64,${base64}`,
    });
  }

  // Build info
  const commitSha = process.env.GITHUB_SHA || 'local';
  const shortSha = commitSha.substring(0, 8);
  const buildDate = new Date().toISOString().split('T')[0];

  // Generate HTML
  let sectionsHtml = '';

  for (const [groupKey, items] of groups) {
    const groupTitle = formatGroupName(groupKey);

    let figuresHtml = '';
    for (const item of items) {
      const label = formatStoryName(item.storyName);
      figuresHtml += `
      <figure class="screenshot">
        <img src="${item.dataUri}" alt="${escapeHtml(label)}" />
        <figcaption>${escapeHtml(label)}</figcaption>
      </figure>`;
    }

    sectionsHtml += `
    <section class="component-group">
      <h2>${escapeHtml(groupTitle)}</h2>
      <div class="screenshots">${figuresHtml}
      </div>
    </section>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Claude Chronicle — Component Gallery</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #0d1117;
      color: #c9d1d9;
      line-height: 1.5;
      padding: 2rem;
    }

    header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #21262d;
    }

    header h1 {
      font-size: 1.75rem;
      font-weight: 600;
      color: #f0f6fc;
      margin-bottom: 0.5rem;
    }

    header .build-info {
      font-size: 0.85rem;
      color: #8b949e;
    }

    header .build-info code {
      background: #161b22;
      padding: 0.15em 0.4em;
      border-radius: 4px;
      font-size: 0.85em;
    }

    .component-group {
      margin-bottom: 3rem;
    }

    .component-group h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #f0f6fc;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #21262d;
    }

    .screenshots {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .screenshot {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      overflow: hidden;
      max-width: 100%;
    }

    .screenshot img {
      display: block;
      max-width: 100%;
      height: auto;
    }

    .screenshot figcaption {
      padding: 0.5rem 0.75rem;
      font-size: 0.85rem;
      color: #8b949e;
      border-top: 1px solid #21262d;
    }
  </style>
</head>
<body>
  <header>
    <h1>Claude Chronicle — Component Gallery</h1>
    <p class="build-info">
      Commit <code>${escapeHtml(shortSha)}</code> — Built ${escapeHtml(buildDate)} — ${files.length} screenshots
    </p>
  </header>
  <main>${sectionsHtml}
  </main>
</body>
</html>`;

  mkdirSync(galleryDir, { recursive: true });
  writeFileSync(path.join(galleryDir, 'index.html'), html, 'utf-8');

  console.log(`Gallery written to ${path.join(galleryDir, 'index.html')}`);
  console.log(`${groups.size} component groups, ${files.length} total screenshots.`);
}

main();
