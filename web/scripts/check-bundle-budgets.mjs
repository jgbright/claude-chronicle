import { gzipSync } from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distAssetsDir = path.join(rootDir, 'dist', 'assets');
const exportHtmlPath = path.join(rootDir, 'dist-export', 'export.html');

const KB = 1024;
const budgets = {
  spaJsRaw: 530 * KB,
  spaJsGzip: 170 * KB,
  spaCssRaw: 65 * KB,
  spaCssGzip: 12 * KB,
  exportHtmlRaw: 560 * KB,
  exportHtmlGzip: 170 * KB,
};

function formatKB(bytes) {
  return `${(bytes / KB).toFixed(2)} kB`;
}

function ensureFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Expected file to exist: ${filePath}`);
  }
}

function getAssetTotals(assetsDir) {
  const entries = fs.readdirSync(assetsDir, { withFileTypes: true });
  const jsFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.js'));
  const cssFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.css'));

  let jsRaw = 0;
  let jsGzip = 0;
  for (const file of jsFiles) {
    const content = fs.readFileSync(path.join(assetsDir, file.name));
    jsRaw += content.length;
    jsGzip += gzipSync(content).length;
  }

  let cssRaw = 0;
  let cssGzip = 0;
  for (const file of cssFiles) {
    const content = fs.readFileSync(path.join(assetsDir, file.name));
    cssRaw += content.length;
    cssGzip += gzipSync(content).length;
  }

  return { jsRaw, jsGzip, cssRaw, cssGzip };
}

function checkBudget(measurements) {
  const failures = [];
  for (const [name, { actual, limit }] of Object.entries(measurements)) {
    if (actual > limit) {
      failures.push(`${name}: ${formatKB(actual)} > ${formatKB(limit)}`);
    }
  }
  return failures;
}

ensureFileExists(distAssetsDir);
ensureFileExists(exportHtmlPath);

const spa = getAssetTotals(distAssetsDir);
const exportHtml = fs.readFileSync(exportHtmlPath);
const exportHtmlRaw = exportHtml.length;
const exportHtmlGzip = gzipSync(exportHtml).length;

const measurements = {
  spaJsRaw: { actual: spa.jsRaw, limit: budgets.spaJsRaw },
  spaJsGzip: { actual: spa.jsGzip, limit: budgets.spaJsGzip },
  spaCssRaw: { actual: spa.cssRaw, limit: budgets.spaCssRaw },
  spaCssGzip: { actual: spa.cssGzip, limit: budgets.spaCssGzip },
  exportHtmlRaw: { actual: exportHtmlRaw, limit: budgets.exportHtmlRaw },
  exportHtmlGzip: { actual: exportHtmlGzip, limit: budgets.exportHtmlGzip },
};

const failures = checkBudget(measurements);

console.log('Bundle budget report:');
for (const [name, { actual, limit }] of Object.entries(measurements)) {
  console.log(`- ${name}: ${formatKB(actual)} / ${formatKB(limit)}`);
}

if (failures.length > 0) {
  console.error('\nBundle budgets exceeded:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}
