#!/usr/bin/env node
// Writes the author byline and support links on every page from tools/site.config.json.
//
//   node tools/update-footers.mjs
//
// Markdown pages: everything after <!-- support-footer --> is regenerated.
// HTML/README:    content between <!-- NAME:start --> and <!-- NAME:end --> markers is
//                 regenerated, for NAME = support | buttons | author | byline.
// Support: "upi" shows the UPI pop-up (mock-exam/interactive/support.js); "coffee" is an
// optional international link (Buy Me a Coffee / GitHub Sponsors) shown inside the pop-up.
// Remove both to hide every Support button.
// The web study guide (tools/build-guide.mjs) reads the same config.

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(ROOT, 'tools/site.config.json'), 'utf8'));
const MARK = '<!-- support-footer -->';
const CREDENTIAL = 'Claude Certified Architect – Foundations &amp; Professional';
const SUPPORT_ON = Boolean(cfg.upi || cfg.coffee);
const LI_ICON = '<svg class="li-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path fill="#fff" d="M7.1 9.6h2.6V18H7.1zM8.4 5.6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM11.3 9.6h2.5v1.2h.04c.35-.66 1.2-1.36 2.47-1.36 2.64 0 3.13 1.74 3.13 4V18h-2.6v-4.06c0-.97-.02-2.22-1.35-2.22-1.36 0-1.57 1.06-1.57 2.15V18h-2.6z"/></svg>';

// ---- Markdown ----
const mdLinks = [
  `[⭐ Star the repo on GitHub](${cfg.repo})`,
  `[💼 Follow me on LinkedIn](${cfg.linkedin})`,
  SUPPORT_ON && `[☕ Buy me a coffee](${cfg.site}#support)`,
].filter(Boolean).join(' · ');
const mdFooter = `${MARK}
---

> Created by **${cfg.author}** — certified Claude Certified Architect (Foundations & Professional).
> Found this useful? ${mdLinks}
`;
const mdByline = `<p align="center"><b>Created by ${cfg.author}</b> — certified in both Claude Certified Architect exams<br>` +
  [`<a href="${cfg.repo}">⭐ Star the repo</a>`, `<a href="${cfg.linkedin}">💼 Follow on LinkedIn</a>`, SUPPORT_ON && `<a href="${cfg.site}#support">☕ Buy me a coffee</a>`]
    .filter(Boolean).join(' · ') + '</p>';

// ---- HTML ----
const link = (href, text, cls) => `<a${cls ? ` class="${cls}"` : ''} href="${href}" target="_blank" rel="noopener">${text}</a>`;
const supportLinks = (cls) => [
  link(cfg.repo, '⭐ Star on GitHub', cls),
  link(cfg.linkedin, `${LI_ICON} Follow on LinkedIn`, cls),
  SUPPORT_ON && `<a${cls ? ` class="${cls} btn-support"` : ''} href="#support" data-support>☕ Buy me a coffee</a>`,
].filter(Boolean);
const initials = cfg.author.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const blocks = {
  support: `    Created by <strong>${cfg.author}</strong> · ${CREDENTIAL} certified ·
    ${supportLinks().join(' · ')}`,
  buttons: `        ${supportLinks('btn').join('\n        ')}`,
  header: `      <a class="hdr-icon" href="${cfg.linkedin}" target="_blank" rel="noopener" aria-label="Follow ${cfg.author} on LinkedIn" title="Follow on LinkedIn">${LI_ICON.replace('width="16" height="16"', 'width="20" height="20"')}</a>${SUPPORT_ON ? `
      <a class="hdr-coffee" href="#support" data-support title="Buy me a coffee">☕<span> Buy me a coffee</span></a>` : ''}`,
  byline: `      <p class="byline">Created by <strong>${cfg.author}</strong> · certified in both exams ·
        ${link(cfg.linkedin, `${LI_ICON} LinkedIn`)} · ${link(cfg.repo, '⭐ Star on GitHub')}${SUPPORT_ON ? ' · <a href="#support" data-support>☕ Buy me a coffee</a>' : ''}</p>`,
  author: `      <aside class="author-card" aria-label="About the author">
        <a class="author-avatar" href="${cfg.repo.replace(/\/[^/]+$/, '')}" target="_blank" rel="noopener" title="${cfg.author} on GitHub">${cfg.avatar
          ? `<img src="${cfg.avatar}" width="64" height="64" alt="${cfg.author}" loading="lazy" onerror="this.replaceWith(document.createTextNode('${initials}'))">`
          : initials}</a>
        <div class="author-text">
          <p class="author-label">Author</p>
          <p class="author-name"><span class="signature">${cfg.author}</span></p>
          <p class="author-title">Claude Certified Architect · Foundations &amp; Professional</p>
          <p class="author-cred">
            <svg class="shield" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 2.5 4.5 5.5v6c0 4.6 3.1 8.6 7.5 10 4.4-1.4 7.5-5.4 7.5-10v-6z" fill="currentColor" opacity=".16"/><path d="M12 2.5 4.5 5.5v6c0 4.6 3.1 8.6 7.5 10 4.4-1.4 7.5-5.4 7.5-10v-6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m8.6 12.2 2.4 2.4 4.5-4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Verified on Credly:
            <a href="https://www.credly.com/badges/bb47f185-1f01-4c2f-adbb-c5401f3c8ce4/public_url" target="_blank" rel="noopener">Foundations ↗</a> ·
            <a href="https://www.credly.com/badges/612c2efc-0487-49f5-ab45-3991e8bf2cdc/public_url" target="_blank" rel="noopener">Professional ↗</a>
          </p>
        </div>
        <div class="author-actions">
          <p class="author-ask">If this helped you, star the repo${SUPPORT_ON ? ' and buy me a coffee' : ''} 🙏</p>
          <div class="author-buttons">
            <a class="chip" href="${cfg.repo}" target="_blank" rel="noopener">⭐ Star the repo</a>${SUPPORT_ON ? `
            <a class="chip chip-coffee" href="#support" data-support>☕ Buy me a coffee</a>` : ''}
            <a class="chip" href="${cfg.linkedin}" target="_blank" rel="noopener">${LI_ICON} Follow on LinkedIn</a>
          </div>
        </div>
      </aside>`,
};

function fillMarkers(file, isMarkdown = false) {
  const p = join(ROOT, file);
  let s = readFileSync(p, 'utf8');
  let hits = 0;
  s = s.replace(/<!-- (support|buttons|author|byline|header):start -->[\s\S]*?<!-- \1:end -->/g, (_, name) => {
    hits++;
    const body = isMarkdown && name === 'byline' ? mdByline : blocks[name];
    return `<!-- ${name}:start -->\n${body}\n${isMarkdown ? '' : '    '}<!-- ${name}:end -->`;
  });
  writeFileSync(p, s);
  return hits;
}

// Markdown footers on every page
let md = 0;
for (const f of execSync('git ls-files "*.md"', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)) {
  const p = join(ROOT, f);
  const s = readFileSync(p, 'utf8');
  const i = s.indexOf(MARK);
  if (i === -1) continue;
  const next = s.slice(0, i) + mdFooter;
  if (next !== s) writeFileSync(p, next);
  md++;
}

const htmlHits = fillMarkers('index.html') + fillMarkers('mock-exam/interactive/index.html');

// Keep the pop-up's settings in sync with the config
const supportJs = join(ROOT, 'mock-exam/interactive/support.js');
const supportCfg = {
  upiId: cfg.upi ? cfg.upi.id : '', payee: cfg.upi ? cfg.upi.payee : cfg.author, qr: cfg.upi ? cfg.upi.qr : '',
  international: cfg.coffee || '', repo: cfg.repo, linkedin: cfg.linkedin,
};
writeFileSync(supportJs, readFileSync(supportJs, 'utf8')
  .replace(/\/\*support-config\*\/[\s\S]*?\/\*end-support-config\*\//, `/*support-config*/${JSON.stringify(supportCfg)}/*end-support-config*/`));
const readmeHits = fillMarkers('README.md', true);

console.log(`Updated ${md} Markdown footers, ${htmlHits} HTML blocks and ${readmeHits} README byline.` +
  (SUPPORT_ON ? ` Support: ${cfg.upi ? 'UPI' : ''}${cfg.upi && cfg.coffee ? ' + ' : ''}${cfg.coffee ? 'international link' : ''}.` : ' Support buttons hidden (no "upi" or "coffee" in the config).'));
