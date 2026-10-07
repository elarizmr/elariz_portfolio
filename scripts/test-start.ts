import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import postcss from 'postcss';

const page = readFileSync(new URL('../src/app/start/page.tsx', import.meta.url), 'utf8');
const enhancement = readFileSync(
  new URL('../src/components/start/StartEnhancement.tsx', import.meta.url),
  'utf8',
);
const styles = postcss.parse(
  readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8'),
);

test('the /start page keeps its destinations and uses app-owned styles and behavior', () => {
  assert.equal((page.match(/className="work-link/g) ?? []).length, 2);
  assert.match(page, /href="\/" aria-label="Interactive Portfolio"/);
  assert.match(page, /href="https:\/\/github\.com\/elarizrecebov"/);
  assert.match(page, /href="https:\/\/linkedin\.com\/in\/elarizrecebov"/);
  assert.doesNotMatch(page, /\/start\/(?:script\.js|style\.css)/);
  assert.match(page, /<StartEnhancement \/>/);
});

test('the client enhancement preserves pointer and accessibility interactions', () => {
  for (const interaction of [
    'pointerenter',
    'pointermove',
    'pointerleave',
    'pointercancel',
    'pointerdown',
    'pointerup',
    'prefers-reduced-motion',
    'visibilitychange',
    'data-pending',
    'Escape',
  ]) {
    assert.ok(enhancement.includes(interaction), `Missing /start interaction: ${interaction}`);
  }
  assert.match(enhancement, /controller\.abort\(\)/);
});

test('the /start styles remain scoped and use the retained local font', () => {
  let startScopeFound = false;
  let startFontFound = false;
  styles.walkAtRules('scope', (scope) => {
    if (scope.params === '(.start-page)') startScopeFound = true;
  });
  styles.walkAtRules('font-face', (fontFace) => {
    if (fontFace.toString().includes('/start/fonts/barlow-condensed-700-latin.woff2')) {
      startFontFound = true;
    }
  });
  assert.ok(startScopeFound);
  assert.ok(startFontFound);
  assert.ok(
    statSync(new URL('../public/start/fonts/barlow-condensed-700-latin.woff2', import.meta.url)).size
      < 25000,
  );
});
