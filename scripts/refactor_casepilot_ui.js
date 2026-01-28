#!/usr/bin/env node
/**
 * Refactor casepilot-ui HTML files:
 * - Move tailwind.config to external assets/tailwind-config.js (loaded before tailwind CDN)
 * - Add shared assets/styles.css
 * - Switch api.js path
 * - Remove duplicated <style> blocks (common ones)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const UI_DIR = path.join(ROOT, 'casepilot-ui');

function replaceAll(str, pairs) {
  let out = str;
  for (const [a, b] of pairs) out = out.split(a).join(b);
  return out;
}

function stripTailwindConfig(html) {
  // Remove the <script>...</script> block containing `tailwind.config =`.
  return html.replace(/\s*<script>\s*\n?\s*tailwind\.config\s*=([\s\S]*?)<\/script>\s*/m, '\n');
}

function stripCommonStyleBlock(html) {
  // Remove the first <style>...</style> if it contains common markers.
  return html.replace(/\s*<style>\s*([\s\S]*?)<\/style>\s*/m, (m, css) => {
    const markers = ['.sidebar-transition', '.card-hover-effect', '.nav-link-active', '.gradient-text'];
    const hit = markers.filter(k => css.includes(k)).length >= 2;
    return hit ? '\n' : m; // keep if not common
  });
}

function ensureHeadAssets(html) {
  // Ensure tailwind config is loaded BEFORE tailwind CDN.
  // Replace the tailwind CDN line with config+CDN.
  html = html.replace(
    /<script\s+src="https:\/\/unpkg\.byted-static\.com\/coze\/space_ppt_lib\/1\.0\.3-alpha\.12\/lib\/tailwindcss\.js"\s*><\/script>/,
    [
      '<script src="assets/tailwind-config.js"></script>',
      '<script src="https://unpkg.byted-static.com/coze/space_ppt_lib/1.0.3-alpha.12/lib/tailwindcss.js"></script>',
      '<link rel="stylesheet" href="assets/styles.css">'
    ].join('\n    ')
  );

  // If not found (future versions), just inject near </title>.
  if (!html.includes('assets/tailwind-config.js')) {
    html = html.replace(/<\/title>/, '</title>\n    <script src="assets/tailwind-config.js"></script>\n    <link rel="stylesheet" href="assets/styles.css">');
  }

  return html;
}

function updateApiPath(html) {
  return replaceAll(html, [
    ['src="js/api.js"', 'src="assets/api.js"'],
    ['src=\"js/api.js\"', 'src=\"assets/api.js\"']
  ]);
}

function addGridBg(html) {
  // Add blueprint grid background by appending `cp-grid-bg` to body class if body has class attr.
  return html.replace(/<body\s+class="([^"]*)"/m, (m, cls) => {
    if (cls.includes('cp-grid-bg')) return m;
    return `<body class="${cls} cp-grid-bg"`;
  });
}

function run() {
  const files = fs.readdirSync(UI_DIR).filter(f => f.endsWith('.html'));
  for (const f of files) {
    const p = path.join(UI_DIR, f);
    let html = fs.readFileSync(p, 'utf8');
    html = stripTailwindConfig(html);
    html = stripCommonStyleBlock(html);
    html = ensureHeadAssets(html);
    html = updateApiPath(html);
    html = addGridBg(html);

    // Cleanup multiple blank lines
    html = html.replace(/\n{4,}/g, '\n\n\n');

    fs.writeFileSync(p, html);
  }

  // Move api.js if some pages still use it via js/api.js
  const apiOld = path.join(UI_DIR, 'js', 'api.js');
  const apiNew = path.join(UI_DIR, 'assets', 'api.js');
  if (fs.existsSync(apiOld) && !fs.existsSync(apiNew)) {
    fs.mkdirSync(path.dirname(apiNew), { recursive: true });
    fs.copyFileSync(apiOld, apiNew);
  }

  console.log(`Refactored ${files.length} HTML files in ${UI_DIR}`);
}

run();
