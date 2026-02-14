/**
 * Generate a self-contained showcase landing page for Claude Chronicle.
 *
 * Reads screenshots from web/showcase/screenshots/, embeds as base64 data URIs,
 * and writes web/showcase/index.html.
 *
 * Usage:
 *   node scripts/generate-showcase.mjs
 *
 * Environment:
 *   GITHUB_SHA — commit SHA for build metadata (defaults to "local")
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const showcaseDir = path.join(__dirname, '..', 'showcase');
const screenshotsDir = path.join(showcaseDir, 'screenshots');

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

function embedImage(filename) {
  const filePath = path.join(screenshotsDir, filename);
  if (!existsSync(filePath)) {
    console.warn(`Warning: ${filename} not found, using placeholder`);
    return '';
  }
  const data = readFileSync(filePath);
  return `data:image/jpeg;base64,${data.toString('base64')}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  if (!existsSync(screenshotsDir)) {
    console.error(`Error: ${screenshotsDir} does not exist. Run capture-showcase-screenshots.mjs first.`);
    process.exit(1);
  }

  const files = readdirSync(screenshotsDir).filter((f) => f.endsWith('.jpg'));
  if (files.length === 0) {
    console.error('No screenshots found in showcase/screenshots/.');
    process.exit(1);
  }

  console.log(`Found ${files.length} screenshots.`);

  const claudeHero = embedImage('claude-hero.jpg');
  const copilotHero = embedImage('copilot-hero.jpg');

  const commitSha = process.env.GITHUB_SHA || 'local';
  const shortSha = commitSha.substring(0, 7);
  const buildDate = new Date().toISOString().split('T')[0];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Claude Chronicle — Curate &amp; Share Claude Code Sessions</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #0d1117;
      color: #c9d1d9;
      line-height: 1.6;
    }

    a { color: #58a6ff; text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* ---------- Hero ---------- */

    .hero {
      text-align: center;
      padding: 4rem 2rem 3rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .hero h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #f0f6fc;
      margin-bottom: 0.75rem;
      letter-spacing: -0.02em;
    }

    .hero .tagline {
      font-size: 1.25rem;
      color: #8b949e;
      margin-bottom: 2rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .hero-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      text-decoration: none;
      transition: opacity 0.15s;
    }

    .btn:hover { text-decoration: none; opacity: 0.9; }

    .btn-primary {
      background: #238636;
      color: #fff;
    }

    .btn-secondary {
      background: #21262d;
      color: #c9d1d9;
      border: 1px solid #30363d;
    }

    /* ---------- Screenshots ---------- */

    .screenshots {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .screenshots h2 {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 600;
      color: #f0f6fc;
      margin-bottom: 2rem;
    }

    .theme-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    @media (max-width: 768px) {
      .theme-grid { grid-template-columns: 1fr; }
    }

    .browser-frame {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 10px;
      overflow: hidden;
    }

    .browser-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      background: #21262d;
      border-bottom: 1px solid #30363d;
    }

    .browser-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #30363d;
    }

    .browser-bar .url {
      flex: 1;
      font-size: 0.75rem;
      color: #8b949e;
      font-family: monospace;
      margin-left: 0.5rem;
    }

    .browser-frame img {
      display: block;
      width: 100%;
      height: auto;
    }

    .theme-label {
      text-align: center;
      font-size: 0.9rem;
      color: #8b949e;
      margin-top: 0.75rem;
      font-weight: 500;
    }

    /* ---------- Features ---------- */

    .features {
      max-width: 1000px;
      margin: 0 auto;
      padding: 3rem 2rem;
    }

    .features h2 {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 600;
      color: #f0f6fc;
      margin-bottom: 2rem;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    @media (max-width: 768px) {
      .feature-grid { grid-template-columns: 1fr; }
    }

    .feature-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 1.25rem;
    }

    .feature-card .icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .feature-card h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #f0f6fc;
      margin-bottom: 0.4rem;
    }

    .feature-card p {
      font-size: 0.875rem;
      color: #8b949e;
    }

    /* ---------- How it works ---------- */

    .how-it-works {
      max-width: 900px;
      margin: 0 auto;
      padding: 3rem 2rem;
    }

    .how-it-works h2 {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 600;
      color: #f0f6fc;
      margin-bottom: 2rem;
    }

    .steps {
      display: flex;
      gap: 2rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .step {
      flex: 1;
      min-width: 200px;
      max-width: 280px;
      text-align: center;
    }

    .step-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #238636;
      color: #fff;
      font-weight: 700;
      font-size: 1.1rem;
      margin-bottom: 0.75rem;
    }

    .step h3 {
      font-size: 1rem;
      color: #f0f6fc;
      margin-bottom: 0.4rem;
    }

    .step p {
      font-size: 0.875rem;
      color: #8b949e;
    }

    /* ---------- Quick Start ---------- */

    .quickstart {
      max-width: 700px;
      margin: 0 auto;
      padding: 3rem 2rem;
    }

    .quickstart h2 {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 600;
      color: #f0f6fc;
      margin-bottom: 1.5rem;
    }

    .code-block {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 1.25rem 1.5rem;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 0.875rem;
      color: #c9d1d9;
      overflow-x: auto;
      line-height: 1.8;
    }

    .code-block .comment { color: #8b949e; }
    .code-block .cmd { color: #79c0ff; }

    /* ---------- Footer ---------- */

    footer {
      text-align: center;
      padding: 3rem 2rem;
      border-top: 1px solid #21262d;
      margin-top: 2rem;
    }

    footer p {
      font-size: 0.85rem;
      color: #8b949e;
    }

    footer p + p { margin-top: 0.4rem; }

    footer code {
      background: #161b22;
      padding: 0.15em 0.4em;
      border-radius: 4px;
      font-size: 0.85em;
    }
  </style>
</head>
<body>

  <!-- Hero -->
  <section class="hero">
    <h1>Claude Chronicle</h1>
    <p class="tagline">
      Curate and share your Claude Code sessions as polished, single-file HTML pages.
    </p>
    <div class="hero-buttons">
      <a href="demo.html" class="btn btn-primary">Live Demo</a>
      <a href="https://github.com/jgbright/claude-chronicle" class="btn btn-secondary">GitHub</a>
      <a href="https://github.com/jgbright/claude-chronicle/releases/latest" class="btn btn-secondary">Download</a>
    </div>
  </section>

  <!-- Screenshots -->
  <section class="screenshots">
    <h2>Two Themes, One Tool</h2>
    <div class="theme-grid">
      <div>
        <div class="browser-frame">
          <div class="browser-bar">
            <span class="browser-dot"></span>
            <span class="browser-dot"></span>
            <span class="browser-dot"></span>
            <span class="url">claude-chronicle serve</span>
          </div>
          ${claudeHero ? `<img src="${claudeHero}" alt="Claude theme screenshot" />` : '<div style="height:400px;display:flex;align-items:center;justify-content:center;color:#8b949e">Screenshot unavailable</div>'}
        </div>
        <p class="theme-label">Claude Theme</p>
      </div>
      <div>
        <div class="browser-frame">
          <div class="browser-bar">
            <span class="browser-dot"></span>
            <span class="browser-dot"></span>
            <span class="browser-dot"></span>
            <span class="url">claude-chronicle serve</span>
          </div>
          ${copilotHero ? `<img src="${copilotHero}" alt="Copilot theme screenshot" />` : '<div style="height:400px;display:flex;align-items:center;justify-content:center;color:#8b949e">Screenshot unavailable</div>'}
        </div>
        <p class="theme-label">Copilot Theme</p>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="features">
    <h2>Features</h2>
    <div class="feature-grid">
      <div class="feature-card">
        <div class="icon">${escapeHtml('\u{1F50D}')}</div>
        <h3>Session Discovery</h3>
        <p>Automatically finds Claude Code sessions from <code>~/.claude/projects/</code>.</p>
      </div>
      <div class="feature-card">
        <div class="icon">${escapeHtml('\u{1F3A8}')}</div>
        <h3>Rich Rendering</h3>
        <p>Markdown, syntax-highlighted code, tool calls, and thinking blocks.</p>
      </div>
      <div class="feature-card">
        <div class="icon">${escapeHtml('\u{2702}\u{FE0F}')}</div>
        <h3>Non-Destructive Editing</h3>
        <p>Delete, collapse, annotate, and reorder blocks without touching originals.</p>
      </div>
      <div class="feature-card">
        <div class="icon">${escapeHtml('\u{1F3AD}')}</div>
        <h3>Dual Themes</h3>
        <p>Claude and Copilot themes with full dark-mode support.</p>
      </div>
      <div class="feature-card">
        <div class="icon">${escapeHtml('\u{1F4E6}')}</div>
        <h3>Single-File Export</h3>
        <p>Export to a self-contained HTML file you can share anywhere.</p>
      </div>
      <div class="feature-card">
        <div class="icon">${escapeHtml('\u{26A1}')}</div>
        <h3>Single Binary</h3>
        <p>One Go binary with the React SPA embedded. No dependencies.</p>
      </div>
    </div>
  </section>

  <!-- How It Works -->
  <section class="how-it-works">
    <h2>How It Works</h2>
    <div class="steps">
      <div class="step">
        <div class="step-number">1</div>
        <h3>Serve</h3>
        <p>Run <code>claude-chronicle serve</code> to browse all your sessions in a local web UI.</p>
      </div>
      <div class="step">
        <div class="step-number">2</div>
        <h3>Curate</h3>
        <p>Delete noise, collapse verbose tool output, and add annotations to tell the story.</p>
      </div>
      <div class="step">
        <div class="step-number">3</div>
        <h3>Export</h3>
        <p>Export as a single HTML file with all assets inlined. Share it anywhere.</p>
      </div>
    </div>
  </section>

  <!-- Quick Start -->
  <section class="quickstart">
    <h2>Quick Start</h2>
    <div class="code-block">
      <span class="comment"># Download the latest release</span><br />
      <span class="cmd">curl -L</span> https://github.com/jgbright/claude-chronicle/releases/latest/download/claude-chronicle_linux_amd64.tar.gz <span class="cmd">| tar xz</span><br />
      <br />
      <span class="comment"># Browse your sessions</span><br />
      <span class="cmd">./claude-chronicle serve</span><br />
      <br />
      <span class="comment"># Export a session</span><br />
      <span class="cmd">./claude-chronicle export</span> -session &lt;id&gt; -o session.html
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <p>
      <a href="https://github.com/jgbright/claude-chronicle">Claude Chronicle</a> — MIT License
    </p>
    <p>
      Commit <code>${escapeHtml(shortSha)}</code> &middot; Built ${escapeHtml(buildDate)}
    </p>
  </footer>

</body>
</html>`;

  mkdirSync(showcaseDir, { recursive: true });
  writeFileSync(path.join(showcaseDir, 'index.html'), html, 'utf-8');

  console.log(`Showcase landing page written to ${path.join(showcaseDir, 'index.html')}`);
}

main();
