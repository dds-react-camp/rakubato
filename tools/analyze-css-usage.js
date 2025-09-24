const fs = require('fs');
const path = require('path');

function readFileSafe(p) {
  try { return fs.readFileSync(p,'utf8'); } catch(e) { return null; }
}

function walk(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fp = path.join(dir, file);
    const stat = fs.statSync(fp);
    if (stat && stat.isDirectory()) {
      if (file === 'node_modules' || file.startsWith('.git')) return;
      results = results.concat(walk(fp, exts));
    } else {
      if (!exts || exts.includes(path.extname(fp))) results.push(fp);
    }
  });
  return results;
}

try {
  const workspaceRoot = path.resolve(__dirname, '..');
  // optional first arg: relative path under workspaceRoot to target (default: 'mockup')
  const targetDir = process.argv[2] ? path.join(workspaceRoot, process.argv[2]) : path.join(workspaceRoot, 'mockup');
  if (!fs.existsSync(targetDir)) {
    console.error('Target directory not found:', targetDir);
    process.exit(2);
  }
  const cssPath = path.join(targetDir, 'css', 'style.css');
  if (!fs.existsSync(cssPath)) {
    console.error('style.css not found at', cssPath);
    process.exit(2);
  }
  const css = fs.readFileSync(cssPath,'utf8');

  // tokens in :root
  const tokenRegex = /--([a-z0-9\-]+)\s*:\s*([^;\n]+)/gi;
  const tokens = {};
  let m;
  while ((m = tokenRegex.exec(css)) !== null) {
    tokens['--'+m[1]] = (tokens['--'+m[1]] || []).concat(m[2].trim());
  }

  // extract selectors (class and id selectors in css)
  const selectorRegex = /(^|\n)\s*([.#][a-zA-Z0-9_\-]+)\b/g;
  const selectors = new Set();
  while ((m = selectorRegex.exec(css)) !== null) {
    selectors.add(m[2]);
  }

  // files to search
  // only search inside the chosen target directory to avoid scanning unrelated files
  const searchFiles = walk(targetDir, ['.html','.htm','.js','.jsx','.ts','.tsx','.css']);

  // search for token usage
  const tokenUsage = {};
  Object.keys(tokens).forEach(t => tokenUsage[t] = 0);

  searchFiles.forEach(f => {
    const content = readFileSafe(f);
    if (!content) return;
    Object.keys(tokens).forEach(t => {
      const v1 = new RegExp('var\\(\\s*' + t.replace(/[-]/g,'\\-') + '\\s*\\)','g');
      const v2 = new RegExp(t.replace(/[-]/g,'\\-'),'g');
      // count var(--token) occurrences higher weight
      const c1 = (content.match(v1) || []).length;
      const c2 = (content.match(v2) || []).length;
      tokenUsage[t] += c1*3 + c2; // prefer var() matches
    });
  });

  // selector usage
  const selectorUsage = {};
  Array.from(selectors).forEach(s => selectorUsage[s] = 0);
  searchFiles.forEach(f => {
    const content = readFileSafe(f);
    if (!content) return;
    Array.from(selectors).forEach(s => {
      const name = s.slice(1);
      const re = s.startsWith('.') ? new RegExp('class\\s*=\\s*"[^"]*\\b'+name+'\\b','g') : new RegExp('id\\s*=\\s*"'+name+'"','g');
      const c = (content.match(re) || []).length;
      selectorUsage[s] += c;
    });
  });

  // duplicates: tokens with same hex/value
  const valueMap = {};
  Object.keys(tokens).forEach(t => {
    tokens[t].forEach(val => {
      const key = val.toLowerCase();
      (valueMap[key] = valueMap[key] || []).push(t);
    });
  });

  console.log('TOKENS found in :root:', Object.keys(tokens).length);
  console.log('\nUnused tokens (usage score == 0):');
  Object.keys(tokenUsage).forEach(t => { if (tokenUsage[t] === 0) console.log('  ', t); });

  console.log('\nToken usage scores (top 30):');
  Object.keys(tokenUsage).sort((a,b)=>tokenUsage[b]-tokenUsage[a]).slice(0,30).forEach(t=>{
    console.log('  ', t, tokenUsage[t]);
  });

  console.log('\nPotential duplicate token values:');
  Object.keys(valueMap).forEach(val=>{
    if (valueMap[val].length > 1) {
      console.log('  ', val, ':', valueMap[val].join(', '));
    }
  });

  console.log('\nSelectors found in CSS but not referenced in HTML/JS (count==0):');
  Object.keys(selectorUsage).forEach(s => { if (selectorUsage[s] === 0) console.log('  ', s); });

  console.log('\nSearch scope files scanned:', searchFiles.length);

} catch (err) {
  console.error('ERROR:', err && err.message || err);
  process.exit(3);
}
