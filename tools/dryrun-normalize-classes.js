const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const root = process.argv[2] || 'mockup';

function walk(dir, files) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, files);
    else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (['.html', '.htm', '.js'].includes(ext)) files.push(full);
    }
  }
}

function normalizeClassString(s) {
  const parts = s.split(/\s+/).filter(Boolean);
  // remove duplicates while preserving unique set
  const uniq = Array.from(new Set(parts));
  uniq.sort();
  return uniq.join(' ');
}

const files = [];
if (!fs.existsSync(root)) {
  console.error('Root not found:', root);
  process.exit(2);
}
walk(root, files);

const diffs = [];
for (const f of files) {
  const orig = fs.readFileSync(f, 'utf8');
  let modified = orig;
  // replace class="..." and class='...'
  modified = modified.replace(/(class|className)\s*=\s*("([^"]*)"|'([^']*)')/g, (m, attr, quoteGroup, dquote, squote) => {
    const content = dquote || squote || '';
    if (!content.trim()) return m;
    const norm = normalizeClassString(content);
    const quote = quoteGroup[0];
    return `${attr}=${quote}${norm}${quote}`;
  });

  if (modified !== orig) {
    // write temp files and run git diff --no-index for nice unified diff
    const a = path.join(__dirname, 'tmp_a');
    const b = path.join(__dirname, 'tmp_b');
    if (!fs.existsSync(a)) fs.mkdirSync(a);
    if (!fs.existsSync(b)) fs.mkdirSync(b);
    const rel = path.relative(process.cwd(), f).replace(/\\/g, '/');
    const aFile = path.join(a, path.basename(f));
    const bFile = path.join(b, path.basename(f));
    fs.writeFileSync(aFile, orig, 'utf8');
    fs.writeFileSync(bFile, modified, 'utf8');
    try {
      const out = child_process.execSync(`git --no-pager diff --no-index -- ${aFile} ${bFile}`, { encoding: 'utf8' });
      diffs.push({file: f, diff: out});
    } catch (e) {
      if (e.stdout) diffs.push({file: f, diff: e.stdout});
      else diffs.push({file: f, diff: 'diff failed'});
    }
  }
}

console.log(JSON.stringify({filesScanned: files.length, diffsCount: diffs.length, diffs}, null, 2));
