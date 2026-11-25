#!/usr/bin/env node
// Builds the website version of the study guides.
//
//   node tools/build-guide.mjs
//
// Reads study-guide/*.md (Foundations) and professional/study-guide/*.md
// (Professional) and writes static, SEO-friendly HTML pages to guide/, plus
// guide/index.html and an updated sitemap.xml. Re-run it whenever a study-guide
// Markdown file changes. The Markdown files remain the source of truth.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from './vendor/marked.esm.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CFG = JSON.parse(readFileSync(join(ROOT, 'tools/site.config.json'), 'utf8'));
const LINKEDIN = CFG.linkedin;
const AUTHOR = CFG.author;
const HDR_EXTRA = () => `\n      <a class="hdr-icon" href="${LINKEDIN}" target="_blank" rel="noopener" aria-label="Follow ${AUTHOR} on LinkedIn" title="Follow on LinkedIn">${LI_ICON.replace('width="16" height="16"', 'width="20" height="20"')}</a>` +
  ((CFG.upi || CFG.coffee) ? '\n      <a class="hdr-coffee" href="#support" data-support title="Buy me a coffee">☕<span> Buy me a coffee</span></a>' : '');
const LI_ICON = '<svg class="li-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path fill="#fff" d="M7.1 9.6h2.6V18H7.1zM8.4 5.6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM11.3 9.6h2.5v1.2h.04c.35-.66 1.2-1.36 2.47-1.36 2.64 0 3.13 1.74 3.13 4V18h-2.6v-4.06c0-.97-.02-2.22-1.35-2.22-1.36 0-1.57 1.06-1.57 2.15V18h-2.6z"/></svg>';
const COFFEE = (CFG.upi || CFG.coffee) ? ' · <a href="#support" data-support>☕ Buy me a coffee</a>' : '';
const SITE = 'https://utkarsh1agarwal.github.io/claude-architect-exam-guide/';
const REPO = 'https://github.com/utkarsh1agarwal/claude-architect-exam-guide';
const OG_IMAGE = `${SITE}assets/social-preview.png`;

const TRACKS = {
  foundations: {
    label: 'Foundations',
    code: 'CCAR-F',
    long: 'Claude Certified Architect – Foundations (CCAR-F)',
    srcDir: 'study-guide',
    playerHash: '',
    pages: [
      ['about-the-exam', 'About the exam'],
      ['study-plan', 'Study plan'],
      ['domain-1-agentic-architecture', 'D1 · Agentic Architecture'],
      ['domain-2-tool-design-mcp', 'D2 · Tool Design & MCP'],
      ['domain-3-claude-code-workflows', 'D3 · Claude Code Workflows'],
      ['domain-4-prompt-engineering', 'D4 · Prompt Engineering'],
      ['domain-5-context-reliability', 'D5 · Context & Reliability'],
      ['scenarios', 'Exam scenarios'],
      ['cheat-sheet', 'Cheat sheet'],
      ['resources', 'Resources'],
      ['faq', 'FAQ'],
    ],
  },
  professional: {
    label: 'Professional',
    code: 'CCAR-P',
    long: 'Claude Certified Architect – Professional (CCAR-P, exam guide v1.1)',
    srcDir: 'professional/study-guide',
    playerHash: '#professional',
    pages: [
      ['about-the-exam', 'About the exam'],
      ['study-plan', 'Study plan'],
      ['domain-1-solution-design', 'D1 · Solution Design'],
      ['domain-2-models-prompting-context', 'D2 · Models, Prompting & Context'],
      ['domain-3-integration', 'D3 · Integration'],
      ['domain-4-evaluation-testing', 'D4 · Evaluation & Testing'],
      ['domain-5-governance-safety', 'D5 · Governance & Safety'],
      ['domain-6-stakeholder-lifecycle', 'D6 · Stakeholder & Lifecycle'],
      ['domain-7-dev-productivity', 'D7 · Dev Productivity'],
      ['cheat-sheet', 'Cheat sheet'],
      ['resources', 'Resources'],
      ['faq', 'FAQ'],
    ],
  },
};

// --- helpers ---------------------------------------------------------------

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

// GitHub-compatible heading slugs, so existing #anchors keep working.
function makeSlugger() {
  const seen = new Map();
  return (text) => {
    let base = stripTags(text).toLowerCase().trim()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/\s/g, '-');
    const n = seen.get(base) || 0;
    seen.set(base, n + 1);
    return n ? `${base}-${n}` : base;
  };
}

// Count practice questions per domain across a track's mock exams (for CTAs).
function domainQuestionCounts(track) {
  const dir = track === 'professional' ? 'professional/mock-exam' : 'mock-exam';
  const counts = {};
  for (let n = 1; n <= 9; n++) {
    const f = join(ROOT, dir, `exam-${n}-answers.md`);
    if (!existsSync(f)) continue;
    for (const m of readFileSync(f, 'utf8').matchAll(/\*\(([^)]+)\)\*\s*[—–-]/g)) {
      for (const d of m[1].split(/[,/]/).map((x) => x.trim())) counts[d] = (counts[d] || 0) + 1;
    }
  }
  return counts;
}

// Resolve a Markdown link found in `srcFile` to a URL valid from guide/<track>/<page>.html
function rewriteHref(href, srcFile, track) {
  if (!href || /^(https?:|mailto:|#)/.test(href)) return href;
  const [pathPart, hash = ''] = href.split('#');
  const anchor = hash ? `#${hash}` : '';
  const target = posix.normalize(posix.join(posix.dirname(srcFile), pathPart));

  for (const [t, cfg] of Object.entries(TRACKS)) {
    if (target === cfg.srcDir || target === `${cfg.srcDir}/`) {
      return `${t === track ? '' : `../${t}/`}about-the-exam.html${anchor}`;
    }
    const m = target.match(new RegExp(`^${cfg.srcDir.replace('/', '\\/')}/(.+)\\.md$`));
    if (m && cfg.pages.some(([slug]) => slug === m[1])) {
      return `${t === track ? '' : `../${t}/`}${m[1]}.html${anchor}`;
    }
  }
  // Mock exam files and folders → the interactive player for that track
  if (/^professional\/mock-exam(\/|$)/.test(target)) return '../../mock-exam/interactive/#professional';
  if (/^mock-exam(\/exam-|\/?$)/.test(target)) return '../../mock-exam/interactive/';
  // Anything else (README, CONTRIBUTING, LICENSE, templates) → GitHub
  const isDir = !/\.[a-z0-9]+$/i.test(target);
  return `${REPO}/${isDir ? 'tree' : 'blob'}/main/${target}${anchor}`;
}

function renderPage(track, slug) {
  const cfg = TRACKS[track];
  const srcFile = `${cfg.srcDir}/${slug}.md`;
  // The Markdown support footer is for GitHub readers; the web page has its own footer.
  const md = readFileSync(join(ROOT, srcFile), 'utf8').split('<!-- support-footer -->')[0];
  const slugify = makeSlugger();
  const toc = [];
  let title = '';

  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading(text, level) {
        const id = slugify(text);
        if (level === 1 && !title) title = stripTags(text);
        if (level === 2) toc.push({ level, id, text: stripTags(text) });
        return `<h${level} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${text}</h${level}>\n`;
      },
      link(href, linkTitle, text) {
        const url = rewriteHref(href, srcFile, track);
        const external = /^https?:/.test(url);
        return `<a href="${esc(url)}"${linkTitle ? ` title="${esc(linkTitle)}"` : ''}${external ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
      },
    },
  });

  let html = marked.parse(md);

  // Tables scroll on small screens
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');

  // Answer options (A) … D)) as a clean, bullet-less list
  html = html.replace(/<ul>\n(<li>[A-E]\) [\s\S]*?)<\/ul>/g, (m, items) =>
    /^<li>[A-E]\) /.test(items) ? `<ul class="options">\n${items}</ul>` : m);

  // Practice answers: hide behind a "Show answer" toggle
  html = html.replace(/<p><strong>Answer([^<]*)<\/strong>([\s\S]*?)<\/p>/g,
    (_, head, rest) => `<details class="answer"><summary>Show answer</summary><p><strong>Answer${head}</strong>${rest}</p></details>`);

  // Domain pages: "practice this domain" call to action under the H1
  const dm = slug.match(/^domain-(\d)/);
  if (dm) {
    const tag = `D${dm[1]}`;
    const n = domainQuestionCounts(track)[tag] || 0;
    const href = `../../mock-exam/interactive/#${track}/practice/${tag}`;
    const cta = `<div class="practice-cta"><div><strong>Practice ${tag} in the exam player</strong>` +
      `<span>${n} ${cfg.code} mock-exam questions on this domain, in study mode with instant explanations.</span></div>` +
      `<a class="btn btn-primary" href="${href}">Practice ${tag} →</a></div>`;
    html = html.replace(/<\/h1>\n/, `</h1>\n${cta}\n`);
  }
  html = html.replace(/<\/h1>\n/, `</h1>\n<p class="article-byline">By <a href="${LINKEDIN}" target="_blank" rel="noopener">${AUTHOR}</a> · certified Claude Certified Architect (Foundations &amp; Professional)</p>\n`);

  const firstPara = (html.match(/<p>([\s\S]*?)<\/p>/) || [, ''])[1];
  let description = stripTags(firstPara).replace(/\s+/g, ' ').trim();
  if (description.length > 158) description = `${description.slice(0, 155).replace(/\s+\S*$/, '')}…`;
  return { html, toc, title: title || slug, description };
}

function sidebar(track, active) {
  const tabs = Object.entries(TRACKS).map(([t, c]) =>
    `<a class="guide-track${t === track ? ' guide-track-active' : ''}" href="../${t}/about-the-exam.html">${c.label} <span>${c.code}</span></a>`).join('');
  const items = TRACKS[track].pages.map(([slug, label]) =>
    `<li><a href="${slug}.html" class="${[slug === active && 'active', slug === 'cheat-sheet' && 'nav-cheat'].filter(Boolean).join(' ')}"${slug === active ? ' aria-current="page"' : ''}>${slug === 'cheat-sheet' ? '⚡ ' : ''}${esc(label)}</a></li>`).join('\n');
  return `<nav class="guide-tracks" aria-label="Certification">${tabs}</nav>
      <ul class="guide-pages">
${items}
      </ul>
      <a class="btn btn-primary guide-sidebar-cta" href="../../mock-exam/interactive/${TRACKS[track].playerHash}">▶ Take a ${TRACKS[track].code} mock exam</a>`;
}

function tocHtml(toc) {
  if (toc.length < 3) return '';
  return `<aside class="guide-toc" aria-label="On this page"><div class="guide-toc-inner"><p>On this page</p><ul>
${toc.map((h) => `<li class="toc-l${h.level}"><a href="#${h.id}">${esc(h.text)}</a></li>`).join('\n')}
</ul></div></aside>`;
}

function layout({ track, slug, title, description, body, toc, prevNext }) {
  const cfg = TRACKS[track];
  const pageTitle = `${title} — ${cfg.code} Study Guide`;
  const canonical = `${SITE}guide/${track}/${slug}.html`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: title,
    description,
    url: canonical,
    inLanguage: 'en',
    isAccessibleForFree: true,
    educationalUse: 'exam preparation',
    teaches: cfg.long,
    author: { '@type': 'Person', name: 'Utkarsh Agarwal', url: 'https://github.com/utkarsh1agarwal', sameAs: [LINKEDIN] },
    isPartOf: { '@type': 'WebSite', name: 'Claude Certified Architect Exam Guide', url: SITE },
  };
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(pageTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${OG_IMAGE}">
  <link rel="stylesheet" href="../../mock-exam/interactive/styles.css">
  <link rel="stylesheet" href="../guide.css">
  <script src="../../mock-exam/interactive/theme.js"></script>
  <script src="../../mock-exam/interactive/support.js" defer></script>
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body class="guide">
  <!-- Generated by tools/build-guide.mjs from ${cfg.srcDir}/${slug}.md — edit the Markdown, then re-run the script. -->
  <header class="guide-top">
    <button type="button" class="guide-menu-btn" aria-controls="guideSidebar" aria-expanded="false">☰</button>
    <a class="guide-brand" href="../../">Claude Certified Architect <span>Exam Guide</span></a>
    <nav class="guide-top-links">
      <a href="../../">Home</a>
      <a href="../" aria-current="true">Study guide</a>
      <a href="../../mock-exam/interactive/${cfg.playerHash}">Mock exams</a>
      <a href="${REPO}" target="_blank" rel="noopener">⭐ GitHub</a>${HDR_EXTRA()}
    </nav>
  </header>
  <div class="guide-layout">
    <aside class="guide-sidebar" id="guideSidebar">
      ${sidebar(track, slug)}
    </aside>
    <main class="guide-main">
      <article class="prose">
${body}
      </article>
      <nav class="guide-pager">${prevNext}</nav>
      <p class="guide-edit"><a href="${REPO}/blob/main/${cfg.srcDir}/${slug}.md" target="_blank" rel="noopener">✎ Suggest an edit on GitHub</a></p>
    </main>
    ${toc}
  </div>
  <footer class="site-footer">
    Created by <strong>${AUTHOR}</strong> · Claude Certified Architect – Foundations &amp; Professional certified ·
    <a href="${REPO}" target="_blank" rel="noopener">⭐ Star on GitHub</a> ·
    <a href="${LINKEDIN}" target="_blank" rel="noopener">${LI_ICON} Follow on LinkedIn</a>${COFFEE}<br>
    Unofficial — not affiliated with Anthropic. "Claude" and "Claude Certified Architect" are trademarks of Anthropic, PBC.
  </footer>
  <script src="../guide.js"></script>
</body>
</html>
`;
}

// --- build -----------------------------------------------------------------

const written = [];
for (const [track, cfg] of Object.entries(TRACKS)) {
  mkdirSync(join(ROOT, 'guide', track), { recursive: true });
  cfg.pages.forEach(([slug, label], i) => {
    const { html, toc, title, description } = renderPage(track, slug);
    const prev = cfg.pages[i - 1];
    const next = cfg.pages[i + 1];
    const prevNext =
      (prev ? `<a class="pager-prev" href="${prev[0]}.html"><span>← Previous</span>${esc(prev[1])}</a>` : '<span></span>') +
      (next ? `<a class="pager-next" href="${next[0]}.html"><span>Next →</span>${esc(next[1])}</a>`
        : `<a class="pager-next" href="../../mock-exam/interactive/${cfg.playerHash}"><span>Next →</span>Take a mock exam</a>`);
    const out = layout({ track, slug, title, description, body: html, toc: tocHtml(toc), prevNext });
    writeFileSync(join(ROOT, 'guide', track, `${slug}.html`), out);
    written.push(`guide/${track}/${slug}.html`);
  });
}

// guide/index.html — choose a certification
const card = (track) => {
  const c = TRACKS[track];
  const list = c.pages.map(([slug, label]) => `<li><a href="${track}/${slug}.html">${esc(label)}</a></li>`).join('');
  return `<article class="card guide-index-card"><h2>${c.label} — ${c.code}</h2><ul>${list}</ul>
    <div class="actions"><a class="btn btn-primary" href="${track}/about-the-exam.html">Start reading</a>
    <a class="btn" href="../mock-exam/interactive/${c.playerHash}">Start mock exam</a></div></article>`;
};
writeFileSync(join(ROOT, 'guide', 'index.html'), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Study Guide — Claude Certified Architect Foundations (CCAR-F) &amp; Professional (CCAR-P)</title>
  <meta name="description" content="Free study guide for the Claude Certified Architect exams: every CCAR-F domain and all 39 CCAR-P v1.1 skills, with worked examples, decision tables, practice questions and cheat sheets.">
  <link rel="canonical" href="${SITE}guide/">
  <meta property="og:title" content="Claude Certified Architect Study Guide — CCAR-F &amp; CCAR-P">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="../mock-exam/interactive/styles.css">
  <link rel="stylesheet" href="guide.css">
  <script src="../mock-exam/interactive/theme.js"></script>
  <script src="../mock-exam/interactive/support.js" defer></script>
</head>
<body class="guide">
  <header class="guide-top">
    <a class="guide-brand" href="../">Claude Certified Architect <span>Exam Guide</span></a>
    <nav class="guide-top-links">
      <a href="../">Home</a>
      <a href="./" aria-current="true">Study guide</a>
      <a href="../mock-exam/interactive/">Mock exams</a>
      <a href="${REPO}" target="_blank" rel="noopener">⭐ GitHub</a>${HDR_EXTRA()}
    </nav>
  </header>
  <main id="app">
    <h1>Study guide</h1>
    <p class="subtitle">Read the notes for either certification right here. Every domain page has worked examples, decision tables and practice questions with hidden answers, plus a one-click link to practise that domain in the exam player.</p>
    <div class="guide-index-grid">${card('foundations')}${card('professional')}</div>
  </main>
  <footer class="site-footer">
    Created by <strong>${AUTHOR}</strong> ·
    <a href="${REPO}" target="_blank" rel="noopener">⭐ Star on GitHub</a> ·
    <a href="${LINKEDIN}" target="_blank" rel="noopener">${LI_ICON} Follow on LinkedIn</a>${COFFEE}
  </footer>
</body>
</html>
`);
written.push('guide/index.html');

// sitemap.xml — landing, player, guide index and every guide page
const today = new Date().toISOString().slice(0, 10);
const urls = ['', 'mock-exam/interactive/', 'guide/', ...written.filter((p) => p !== 'guide/index.html')];
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);

console.log(`Built ${written.length} pages into guide/ and updated sitemap.xml (${urls.length} URLs).`);
