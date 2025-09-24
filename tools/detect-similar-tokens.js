// detect-similar-tokens.js
// Usage: node detect-similar-tokens.js <css-folder-or-file> [threshold]
// Scans :root tokens in the given CSS file (or mockup path) and reports near-duplicate color tokens by CIEDE2000.

const fs = require('fs');
const path = require('path');

function readCss(fileOrDir){
  const p = path.resolve(fileOrDir);
  if(fs.existsSync(p) && fs.statSync(p).isDirectory()){
    // look for mockup/css/style.css
    const candidate = path.join(p, 'css', 'style.css');
    if(fs.existsSync(candidate)) return fs.readFileSync(candidate,'utf8');
    const flat = path.join(p, 'style.css'); if(fs.existsSync(flat)) return fs.readFileSync(flat,'utf8');
    throw new Error('No CSS file found in ' + p);
  }
  if(fs.existsSync(p)) return fs.readFileSync(p,'utf8');
  throw new Error('Path not found: ' + p);
}

function parseRoot(css){
  const m = css.match(/:root\s*\{([\s\S]*?)\n\}/);
  if(!m) return null;
  return m[1];
}

function extractTokens(rootBody){
  const lines = rootBody.split(/\n/).map(l=>l.trim()).filter(l=>l.startsWith('--'));
  const tokens = lines.map(l=>{
    const idx = l.indexOf(':');
    const key = l.slice(0, idx).trim();
    const val = l.slice(idx+1).replace(/;$/,'').trim();
    return {k:key, v: val};
  });
  return tokens;
}

function toRgb(value){
  if(!value) return null;
  const v = value.trim().toLowerCase();
  if(v.startsWith('#')){
    let h = v.slice(1);
    if(h.length===3) h = h.split('').map(c=>c+c).join('');
    if(h.length!==6) return null;
    return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
  }
  if(v.startsWith('rgb')){
    const nums = v.replace(/rgba?\(|\)/g,'').split(',').map(x=>parseFloat(x));
    if(nums.length<3) return null; return [nums[0], nums[1], nums[2]];
  }
  return null; // skip gradients and var() tokens
}

function srgbToXyz([r,g,b]){
  r/=255; g/=255; b/=255;
  [r,g,b] = [r,g,b].map(v=> v<=0.04045? v/12.92: Math.pow((v+0.055)/1.055,2.4));
  const x = r*0.4124564 + g*0.3575761 + b*0.1804375;
  const y = r*0.2126729 + g*0.7151522 + b*0.0721750;
  const z = r*0.0193339 + g*0.1191920 + b*0.9503041;
  return [x,y,z];
}
function xyzToLab([x,y,z]){
  const xr=0.95047, yr=1.00000, zr=1.08883;
  x/=xr; y/=yr; z/=zr;
  const f = v => v>0.008856? Math.cbrt(v): (7.787*v + 16/116);
  const L = 116*f(y)-16;
  const a = 500*(f(x)-f(y));
  const b = 200*(f(y)-f(z));
  return [L,a,b];
}
function deltaE(lab1, lab2){
  const [L1,a1,b1]=lab1; const [L2,a2,b2]=lab2;
  const avgLp=(L1+L2)/2;
  const C1=Math.sqrt(a1*a1+b1*b1); const C2=Math.sqrt(a2*a2+b2*b2);
  const avgC=(C1+C2)/2;
  const G=0.5*(1-Math.sqrt(Math.pow(avgC,7)/(Math.pow(avgC,7)+Math.pow(25,7))));
  const a1p=a1*(1+G); const a2p=a2*(1+G);
  const C1p=Math.sqrt(a1p*a1p+b1*b1); const C2p=Math.sqrt(a2p*a2p+b2*b2);
  const avgCp=(C1p+C2p)/2;
  const h1p=Math.atan2(b1,a1p)*180/Math.PI; const h2p=Math.atan2(b2,a2p)*180/Math.PI;
  let dhp = h2p - h1p;
  if(Math.abs(dhp)>180){ dhp = dhp>0? dhp-360: dhp+360; }
  const dLp = L2-L1; const dCp = C2p-C1p; const dHp = 2*Math.sqrt(C1p*C2p)*Math.sin((dhp*Math.PI/180)/2);
  const avgHp = Math.abs(h1p-h2p)>180? (h1p+h2p+360)/2 : (h1p+h2p)/2;
  const T = 1 - 0.17*Math.cos((avgHp-30)*Math.PI/180) + 0.24*Math.cos((2*avgHp)*Math.PI/180) + 0.32*Math.cos((3*avgHp+6)*Math.PI/180) - 0.20*Math.cos((4*avgHp-63)*Math.PI/180);
  const SL = 1 + ((0.015*Math.pow(avgLp-50,2))/Math.sqrt(20+Math.pow(avgLp-50,2)));
  const SC = 1 + 0.045*avgCp;
  const SH = 1 + 0.015*avgCp*T;
  const RT = -2*Math.sqrt(Math.pow(avgCp,7)/(Math.pow(avgCp,7)+Math.pow(25,7))) * Math.sin((60*Math.exp(-Math.pow((avgHp-275)/25,2)))*Math.PI/180);
  const KL=1, KC=1, KH=1;
  const dE = Math.sqrt(Math.pow(dLp/(KL*SL),2) + Math.pow(dCp/(KC*SC),2) + Math.pow(dHp/(KH*SH),2) + RT*(dCp/(KC*SC))*(dHp/(KH*SH)));
  return dE;
}

// Main
const args = process.argv.slice(2);
if(args.length<1){ console.log('Usage: node detect-similar-tokens.js <css-file-or-dir> [thresholdDeltaE]'); process.exit(1); }
const fileOrDir = args[0];
const threshold = args[1]? parseFloat(args[1]) : 3;
try{
  const css = readCss(fileOrDir);
  const root = parseRoot(css);
  if(!root){ console.log('No :root block found'); process.exit(0); }
  const tokens = extractTokens(root);
  const colorTokens = tokens.map(t=>({k:t.k, v:t.v, rgb: toRgb(t.v)})).filter(t=>t.rgb);
  const entries = colorTokens.map(t=>({k:t.k,v:t.v,lab: xyzToLab(srgbToXyz(t.rgb))}));
  const pairs = [];
  for(let i=0;i<entries.length;i++){
    for(let j=i+1;j<entries.length;j++){
      const d = deltaE(entries[i].lab, entries[j].lab);
      if(d<=threshold) pairs.push({a:entries[i].k,b:entries[j].k,d: Math.round(d*100)/100, va:entries[i].v, vb:entries[j].v});
    }
  }
  if(pairs.length===0){ console.log('No near-duplicate color tokens found with ΔE <= '+threshold+'. Scanned tokens:', entries.length); process.exit(0); }
  console.log('Near-duplicate token pairs (ΔE <= '+threshold+'):');
  pairs.forEach(p=> console.log(`${p.a} ~ ${p.b} (ΔE ${p.d})  [${p.va}] [${p.vb}]`));
}catch(err){ console.error(err.message); process.exit(1); }
