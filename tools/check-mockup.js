const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error('FAIL:', message);
  process.exitCode = 2;
}

function pass(message) {
  console.log('OK:', message);
}

try {
  const root = path.resolve(__dirname, '..');
  const cssPath = path.join(root, 'mockup', 'css', 'style.css');
  const jsPath = path.join(root, 'mockup', 'js', 'main.js');

  if (!fs.existsSync(cssPath)) {
    fail(`CSS not found at ${cssPath}`);
    process.exit();
  }
  if (!fs.existsSync(jsPath)) {
    fail(`JS not found at ${jsPath}`);
    process.exit();
  }

  const css = fs.readFileSync(cssPath, 'utf8');
  const js = fs.readFileSync(jsPath, 'utf8');

  // Checks for CSS tokens
  const requiredTokens = ['--color-primary', '--color-white'];
  let ok = true;
  requiredTokens.forEach(t => {
    if (css.indexOf(t) === -1) {
      fail(`Missing CSS token: ${t}`);
      ok = false;
    } else {
      pass(`Found CSS token: ${t}`);
    }
  });

  // Ensure no remaining linear-gradient(white, white)
  if (css.indexOf('linear-gradient(white, white)') !== -1) {
    fail('Found forbidden literal: linear-gradient(white, white)');
    ok = false;
  } else {
    pass('No linear-gradient(white, white) occurrences found');
  }

  // JS checks
  if (js.indexOf('handleHeartLevelClick') !== -1) {
    pass('Found handleHeartLevelClick in JS');
  } else if (js.indexOf('.is-hearted') !== -1 || js.indexOf('is-hearted') !== -1) {
    pass('Found is-hearted token in JS');
  } else {
    fail('Heart handler/class not found in JS (handleHeartLevelClick or is-hearted)');
    ok = false;
  }

  if (!ok) {
    console.error('\nOne or more checks failed.');
    process.exitCode = 2;
  } else {
    console.log('\nAll checks passed.');
    process.exitCode = 0;
  }
} catch (err) {
  console.error('ERROR:', err && err.message || err);
  process.exitCode = 3;
}
