const fs = require('fs');
const path = require('path');

function hexToRgb(hex) {
  const h = hex.replace('#','').trim();
  if (h.length === 3) {
    return [parseInt(h[0]+h[0],16), parseInt(h[1]+h[1],16), parseInt(h[2]+h[2],16)];
  }
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function distance(a,b) {
  return Math.sqrt(
    Math.pow(a[0]-b[0],2) + Math.pow(a[1]-b[1],2) + Math.pow(a[2]-b[2],2)
  );
}

try {
  const root = path.resolve(__dirname, '..');
  const cssPath = path.join(root, 'mockup', 'css', 'style.css');
  if (!fs.existsSync(cssPath)) {
    console.error('style.css not found at', cssPath);
    process.exit(2);
  }
  const css = fs.readFileSync(cssPath, 'utf8');
  const rootBlockMatch = css.match(/:root\s*{([\s\S]*?)^}/m);
  const block = rootBlockMatch ? rootBlockMatch[1] : css;

  const tokenRegex = /--([a-z0-9\-]+)\s*:\s*(#[0-9A-Fa-f]{3,6})/g;
  const tokens = [];
  let m;
  while ((m = tokenRegex.exec(block)) !== null) {
    tokens.push({name: '--' + m[1], hex: m[2]});
  }

  if (!tokens.length) {
    console.error('No hex tokens found in :root');
    process.exit(2);
  }

  // compute pairwise distances
  const pairs = [];
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i+1; j < tokens.length; j++) {
      try {
        const a = hexToRgb(tokens[i].hex);
        const b = hexToRgb(tokens[j].hex);
        const d = distance(a,b);
        pairs.push({a: tokens[i], b: tokens[j], d});
      } catch (err) {
        // ignore parse errors
      }
    }
  }

  pairs.sort((x,y) => x.d - y.d);

  const threshold = parseFloat(process.argv[2] || '12');
  console.log('Found', tokens.length, 'tokens. Showing pairs with distance <=', threshold);
  console.log('Top similar pairs:');
  pairs.slice(0, 60).forEach(p => {
    if (p.d <= threshold) {
      console.log(p.a.name, p.a.hex, '---', p.b.name, p.b.hex, ':', p.d.toFixed(2));
    }
  });

  console.log('\n(If output is empty, try increasing the threshold, e.g. `node tools/find-similar-color-tokens.js 20`)');
} catch (err) {
  console.error('ERROR:', err && err.message || err);
  process.exit(3);
}
