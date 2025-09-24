const fs = require('fs');
const path = require('path');

function normalizeHex(v) {
  return v.trim().toLowerCase();
}

try {
  const root = path.resolve(__dirname, '..');
  const cssPath = path.join(root, 'mockup', 'css', 'style.css');
  if (!fs.existsSync(cssPath)) {
    console.error('style.css not found at', cssPath);
    process.exit(2);
  }
  const css = fs.readFileSync(cssPath, 'utf8');

  // parse :root block
  const rootMatch = css.match(/:root\s*{([\s\S]*?)^}/m);
  const block = rootMatch ? rootMatch[1] : css;

  const tokenRegex = /(--[a-z0-9\-]+)\s*:\s*([^;\n]+)/gi;
  const tokens = [];
  let m;
  while ((m = tokenRegex.exec(block)) !== null) {
    tokens.push({name: m[1], value: m[2].trim(), index: m.index});
  }

  const valueMap = {};
  tokens.forEach(t => {
    const v = normalizeHex(t.value.replace(/var\([^\)]+\)|linear-gradient\([^\)]+\)/g,'') );
    // only consider simple hex or rgb-ish literals
    if (!v) return;
    (valueMap[v] = valueMap[v] || []).push(t);
  });

  const changes = [];
  Object.keys(valueMap).forEach(val => {
    const group = valueMap[val];
    if (group.length > 1) {
      // pick first as canonical, others to be aliased
      const canonical = group[0].name;
      group.slice(1).forEach(t => {
        // if t.value already uses var(), skip
        if (/var\(/.test(t.value)) return;
        changes.push({from: t.name, to: canonical, original: t.value});
      });
    }
  });

  if (!changes.length) {
    console.log('No identical-token aliases needed.');
    process.exit(0);
  }

  console.log('Applying aliases for', changes.length, 'tokens');

  let newCss = css;
  // apply simple replacement in the :root block only (replace full lines)
  changes.forEach(ch => {
    const re = new RegExp('(' + ch.from.replace(/[-]/g,'\\-') + '\\s*:\\s*)' + ch.original.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&') + '(;?)','m');
    newCss = newCss.replace(re, '$1var(' + ch.to + ')$3');
  });

  fs.writeFileSync(cssPath, newCss, 'utf8');

  console.log('Applied aliases:');
  changes.forEach(c => console.log('  ', c.from, '->', c.to));

} catch (err) {
  console.error('ERROR:', err && err.message || err);
  process.exit(3);
}
