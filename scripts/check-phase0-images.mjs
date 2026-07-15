#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
const html = readFileSync(join(root, 'dist/index.html'), 'utf8');
let fail = 0;
// Gallery imgs should carry width+height attributes
const galleryImgs = html.match(/class="pg-item"[\s\S]*?<img[^>]+>/g) || [];
for (const tag of galleryImgs.slice(0, 3)) {
  if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) {
    console.error('✗ gallery img missing width/height', tag.slice(0, 120));
    fail++;
  }
}
// Avatar imgs in first reviews: width="44" height="44"
if (!/rc-avatar[\s\S]{0,200}<img[^>]*width="44"[^>]*height="44"/.test(html) &&
    !/<img[^>]*width="44"[^>]*height="44"[^>]*loading="lazy"/.test(html)) {
  console.error('✗ avatar imgs missing 44x44 dimensions in dist HTML');
  fail++;
}
if (fail) process.exit(1);
console.log('✓ image dimensions present');
