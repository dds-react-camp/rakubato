const fs = require('fs');
const path = require('path');

function normalizeClassList(s) {
  if (!s) return s;
  // split on whitespace, remove empties
  const parts = s.split(/\s+/).filter(Boolean);
  const unique = Array.from(new Set(parts));
  unique.sort();
  return unique.join(' ');
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let updated = content;
  let changed = false;

  // Normalize HTML class="..." and class='...' and class=`...`
  updated = updated.replace(/class\s*=\s*(["'`])([\s\S]*?)\1/g, (m, quote, inner) => {
    const normalized = normalizeClassList(inner);
    if (normalized !== inner) {
      changed = true;
      return `class=${quote}${normalized}${quote}`;
    }
    return m;
  });

  // Normalize occurrences inside JS where templates contain class="..." etc (already handled above),
  // but also normalize className = '...' patterns and className = "..."
  updated = updated.replace(/className\s*=\s*(["'`])([\s\S]*?)\1/g, (m, quote, inner) => {
    const normalized = normalizeClassList(inner);
    if (normalized !== inner) {
      changed = true;
      return `className=${quote}${normalized}${quote}`;
    }
    return m;
  });

  if (changed) {
    const bakPath = `${filePath}.bak.${Date.now()}`;
    fs.copyFileSync(filePath, bakPath);
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`UPDATED: ${filePath} (backup: ${path.basename(bakPath)})`);
  } else {
    console.log(`UNCHANGED: ${filePath}`);
  }
}

function walk(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

const target = process.argv[2] || 'mockup';
if (!fs.existsSync(target)) {
  console.error('Target not found:', target);
  process.exit(2);
}

const exts = ['.html', '.js'];
const modified = [];
walk(target, (file) => {
  if (exts.includes(path.extname(file))) {
    try {
      processFile(file);
      modified.push(file);
    } catch (err) {
      console.error('ERROR processing', file, err);
    }
  }
});

console.log('Done. Files processed:', modified.length);
