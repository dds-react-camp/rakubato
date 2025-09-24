const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');
const cssPath = path.join(workspaceRoot, 'mockup', 'css', 'style.css');

// Candidate selectors observed from previous analysis (conservative list)
let candidates = [
  '.card-flip-container',
  '.card-flip-inner',
  '.rarity-common',
  '.rarity-uncommon',
  '.rarity-rare',
  '.rarity-epic',
  '.collection-number',
  '.choice-item__collection-number',
  '.choice-item__rarity-star',
  '.card-flip-container',
  '.card-flip-inner',
  '.state-glow',
  '.text-display',
  '.text-h1',
  '.text-h2',
  '.text-h3',
  '.text-body',
  '.text-small',
  '.text-caption'
];

// Allow overriding candidates via --selectors=<comma-separated-list> or --selectors <value>
// PowerShell may split args differently, so accept both forms and also handle quoted comma-separated lists.
function parseSelectorArg(argv) {
  // look for --selectors=val
  let idx = argv.findIndex(a => a.startsWith('--selectors='));
  if (idx !== -1) {
    return argv[idx].split('=')[1] || '';
  }
  // look for --selectors val
  idx = argv.findIndex(a => a === '--selectors');
  if (idx !== -1 && idx + 1 < argv.length) {
    return argv[idx+1];
  }
  return null;
}

const selectorRaw = parseSelectorArg(process.argv);
if (selectorRaw) {
  // On PowerShell, users may pass "'.a,.b'" or '.a,.b' — normalize
  const cleaned = selectorRaw.replace(/^['"]|['"]$/g, '');
  const split = cleaned.split(',').map(s => s.trim()).filter(Boolean);
  if (split.length) candidates = split;
}

function escapeRegex(s){ return s.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&'); }

function findRules(css, selector){
  // naive: find occurrences of selector followed by { and match until the balanced closing }
  const re = new RegExp('(' + escapeRegex(selector) + '\\s*\\{)', 'g');
  const matches = [];
  let m;
  while ((m = re.exec(css)) !== null) {
    const start = m.index;
    // find the { position
    const bracePos = css.indexOf('{', start);
    if (bracePos === -1) break;
    // find matching closing brace
    let depth = 0;
    let end = -1;
    for (let i = bracePos; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') {
        depth--;
        if (depth === 0) { end = i+1; break; }
      }
    }
    if (end === -1) continue;
    const block = css.slice(start, end);
    matches.push({start, end, block});
    re.lastIndex = end;
  }
  return matches;
}

try{
  if (!fs.existsSync(cssPath)) { console.error('CSS not found:', cssPath); process.exit(2); }
  const css = fs.readFileSync(cssPath,'utf8');

  const results = [];
  candidates.forEach(sel => {
    const found = findRules(css, sel);
    if (found.length) results.push({selector: sel, count: found.length, blocks: found});
  });

  if (!results.length) {
    console.log('No candidate selector blocks found for given list.');
    process.exit(0);
  }

  console.log('Found candidate selector blocks (dry-run):');
  results.forEach(r => {
    console.log('\n---', r.selector, ' (', r.count, 'block(s)) ---');
    r.blocks.forEach((b, idx) => {
      const snippet = b.block.trim().split('\n').slice(0,6).join('\n');
      console.log('\n[block', idx+1, ']\n', snippet.replace(/\t/g,'  '), '\n...');
    });
  });

  if (process.argv.includes('--apply')) {
    const backup = cssPath + '.bak';
    fs.copyFileSync(cssPath, backup);
    let newCss = css;
    // iterate in reverse order to preserve indices
    const allBlocks = results.flatMap(r => r.blocks.map(b => ({sel: r.selector, start: b.start, end: b.end, block: b.block}))).sort((a,b)=>b.start-a.start);
    allBlocks.forEach(item => {
      const commented = `/* UNUSED_CANDIDATE: ${item.sel} START */\n/*\n${item.block}\n*/\n/* UNUSED_CANDIDATE: ${item.sel} END */\n`;
      newCss = newCss.slice(0,item.start) + commented + newCss.slice(item.end);
    });
    fs.writeFileSync(cssPath, newCss, 'utf8');
    console.log('\nApplied comments and backed up original to', backup);
  } else {
    console.log('\nRun with --apply to actually comment out these blocks (a .bak backup will be created).');
  }

} catch(err){ console.error('ERROR:', err && err.message || err); process.exit(3); }
