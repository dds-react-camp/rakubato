const fs = require('fs');
const path = require('path');

const root = process.argv[2] || 'mockup';
const exts = ['.html', '.htm', '.js'];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else {
      if (exts.includes(path.extname(full).toLowerCase())) results.push(full);
    }
  });
  return results;
}

function extractClassesFromText(text) {
  const combos = [];
  // match class= "..." or class='...' or class=`...`
  const reClass = /class(Name)?\s*=\s*["'`]([^"'`]+)["'`]/g;
  let m;
  while ((m = reClass.exec(text)) !== null) {
    const raw = m[2].trim();
    if (!raw) continue;
    const parts = raw.split(/\s+/).filter(Boolean);
    combos.push(parts);
  }
  // match classList.add('a','b') or add("a b")
  const reCL = /classList\.add\s*\(([^)]+)\)/g;
  while ((m = reCL.exec(text)) !== null) {
    const args = m[1];
    // remove quotes and split by comma/space
    const parts = args.split(',').map(s => s.trim().replace(/^['"`]|['"`]$/g, '')).join(' ').split(/\s+/).filter(Boolean);
    if (parts.length) combos.push(parts);
  }
  // match strings that look like "... classList: 'a b'" (template strings already covered by class= regex above)
  return combos;
}

function normalizeCombo(arr) {
  const set = Array.from(new Set(arr));
  set.sort();
  return set.join(' ');
}

const files = walk(root);
const comboCounts = new Map();
const singleCounts = new Map();
files.forEach(file => {
  const txt = fs.readFileSync(file, 'utf8');
  const combos = extractClassesFromText(txt);
  combos.forEach(arr => {
    const norm = normalizeCombo(arr);
    if (!norm) return;
    comboCounts.set(norm, (comboCounts.get(norm) || 0) + 1);
    arr.forEach(cls => singleCounts.set(cls, (singleCounts.get(cls) || 0) + 1));
  });
});

// convert map to sorted array
const comboArray = Array.from(comboCounts.entries()).map(([combo, count]) => ({combo, count})).sort((a,b) => b.count - a.count || b.combo.length - a.combo.length);
const singleArray = Array.from(singleCounts.entries()).map(([cls, count]) => ({cls, count})).sort((a,b) => b.count - a.count);

const topCombos = comboArray.slice(0, 20);

// propose .c1.. based on top 10 combos
const proposals = topCombos.slice(0, 10).map((item, idx) => ({short: `.c${idx+1}`, combo: item.combo, count: item.count}));

console.log(JSON.stringify({filesScanned: files.length, totalCombos: comboArray.length, topSingles: singleArray.slice(0,20), proposals}, null, 2));
