#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/styles/main.css'), 'utf8');
let fail = 0;
const bad = (m) => { console.error('✗', m); fail++; };
const ok = (m) => console.log('✓', m);

if (/transition:\s*all\b/.test(css)) bad('transition: all still present');
else ok('no transition: all');

if (!/#book[\s\S]{0,200}scroll-margin-top/.test(css) && !/scroll-margin-top:[^;]+;\s*(?:\/\*[^*]*\*\/\s*)?(?:#[\w-]+|,)/.test(css)) {
  // Prefer a shared rule covering anchors:
  if (!/\.section\[id\],\s*#top|#book,\s*#reviews/.test(css) && !/scroll-margin-top:\s*\d+px/.test(css)) {
    bad('scroll-margin-top missing for in-page targets');
  } else ok('scroll-margin-top present');
} else ok('scroll-margin-top present');

if (!/h1,\s*h2[^{]*\{[^}]*text-wrap:\s*balance/.test(css) && !/h1,\s*h2\s*\{[^}]*text-wrap:\s*balance/.test(css)) {
  if (!/text-wrap:\s*balance/.test(css)) bad('text-wrap: balance missing on headings');
  else ok('text-wrap: balance present');
} else ok('text-wrap: balance on headings');

if (fail) process.exit(1);
console.log('phase0 css gate ok');
