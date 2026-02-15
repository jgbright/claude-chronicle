import { gzipSync } from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distAssetsDir = path.join(rootDir, 'dist', 'assets');
const exportHtmlPath = path.join(rootDir, 'dist-export', 'export.html');
const budgetConfigPath = path.join(rootDir, 'bundle-budgets.json');

const KB = 1024;

function formatKB(bytes) {
  return `${(bytes / KB).toFixed(2)} kB`;
}

function ensureFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Expected file to exist: ${filePath}`);
  }
}

function readBudgetConfig(configPath) {
  ensureFileExists(configPath);
  const raw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(raw);
  const requiredKeys = [
    'spaJsRawKB',
    'spaJsGzipKB',
    'spaCssRawKB',
    'spaCssGzipKB',
    'exportHtmlRawKB',
    'exportHtmlGzipKB',
  ];

  for (const key of requiredKeys) {
    if (typeof config[key] !== 'number' || config[key] <= 0) {
      throw new Error(`Invalid or missing "${key}" in ${configPath}`);
    }
  }

  return {
    spaJsRaw: config.spaJsRawKB * KB,
    spaJsGzip: config.spaJsGzipKB * KB,
    spaCssRaw: config.spaCssRawKB * KB,
    spaCssGzip: config.spaCssGzipKB * KB,
    exportHtmlRaw: config.exportHtmlRawKB * KB,
    exportHtmlGzip: config.exportHtmlGzipKB * KB,
  };
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
const budgets = readBudgetConfig(budgetConfigPath);

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
