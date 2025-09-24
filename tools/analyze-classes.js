const fs = require('fs');
const path = require('path');

const roots = process.argv.slice(2);
if (roots.length === 0) {
  roots.push('mockup', 'mockup-pre', 'frontend');
}

const exts = new Set(['.html', '.htm', '.js', '.jsx', '.ts', '.tsx']);

function walk(dir, files) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full, files);
    } else if (e.isFile()) {
      if (exts.has(path.extname(e.name))) files.push(full);
    }
  }
}

const classCounts = Object.create(null);
const comboCounts = Object.create(null);
const filesScanned = [];

for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  const files = [];
  walk(root, files);
  for (const f of files) {
    filesScanned.push(f);
    const text = fs.readFileSync(f, 'utf8');
    // match class="..." or class='...' or className="..." or className='...'
    const regex = /(?:class|className)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let m;
    while ((m = regex.exec(text)) !== null) {
      const s = m[2] || m[3] || '';
      if (s.trim() === '') continue;
      // split by whitespace
      const parts = s.split(/\s+/).filter(Boolean);
      // count singles
      for (const p of parts) {
        classCounts[p] = (classCounts[p] || 0) + 1;
      }
      // normalized combo: sort unique parts to detect logically same combos
      const uniq = Array.from(new Set(parts));
      uniq.sort();
      const key = uniq.join(' ');
      comboCounts[key] = (comboCounts[key] || 0) + 1;
    }
  }
}

function top(obj, n=40) {
  return Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n);
}

const out = {
  scannedRoots: roots,
  filesScannedCount: filesScanned.length,
  filesScanned: filesScanned.slice(0,200),
  uniqueClasses: Object.keys(classCounts).length,
  classCountsTop: top(classCounts, 100),
  comboCountsTop: top(comboCounts, 100),
};

console.log(JSON.stringify(out, null, 2));
