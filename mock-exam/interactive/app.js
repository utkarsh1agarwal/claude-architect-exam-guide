'use strict';

// ---------------------------------------------------------------------------
// Config — mirrors the tables in the repo README. Each track is one
// certification. Add a line to a track's `exams` array if a new exam-N pair is
// added later; nothing else in this app needs to change.
// ---------------------------------------------------------------------------
const TRACKS = {
  foundations: {
    label: 'Foundations',
    code: 'CCAR-F',
    blurb: 'Claude Certified Architect – Foundations · 60 questions · 120 minutes · 4 of 6 scenarios',
    basePath: '../',
    groupLabel: 'Scenario',
    exams: [
      { id: 1, difficulty: 'Medium', coverage: 'All 6 scenarios' },
      { id: 2, difficulty: 'Medium', coverage: '4-of-6 draw (leans D1/D5)' },
      { id: 3, difficulty: 'Medium', coverage: '4-of-6 draw (leans D3/D4)' },
      { id: 4, difficulty: 'Hard', coverage: 'All 6 scenarios' },
      { id: 5, difficulty: 'Hard', coverage: 'All 6 scenarios' },
      { id: 6, difficulty: 'Hard', coverage: 'All 6 scenarios' },
    ],
  },
  professional: {
    label: 'Professional',
    code: 'CCAR-P',
    blurb: 'Claude Certified Architect – Professional · exam guide v1.1 · 70 questions · 120 minutes · 7 domains',
    basePath: '../../professional/mock-exam/',
    groupLabel: 'Part',
    exams: [
      { id: 1, difficulty: 'Medium', coverage: 'v1.1 blueprint · all 7 domains' },
      { id: 2, difficulty: 'Hard', coverage: 'v1.1 blueprint · all 7 domains' },
      { id: 3, difficulty: 'Hard', coverage: 'v1.1 blueprint · all 7 domains' },
    ],
  },
};

const DOMAIN_NAMES = {
  foundations: {
    D1: 'Agentic Architecture & Orchestration',
    D2: 'Tool Design & MCP Integration',
    D3: 'Claude Code Configuration & Workflows',
    D4: 'Prompt Engineering & Structured Output',
    D5: 'Context Management & Reliability',
  },
  professional: {
    D1: 'Solution Design and Architecture',
    D2: 'Models, Prompting, and Context Engineering',
    D3: 'Integration',
    D4: 'Evaluation, Testing, and Optimization',
    D5: 'Governance, Safety, and Risk Management',
    D6: 'Stakeholder Communication and Lifecycle',
    D7: 'Developer Productivity and Operational Enablement',
  },
};

const DEFAULT_DURATION_MIN = 120;

const qs = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// Markdown parsing — the mock-exam files come in two formats:
//   exam-1/4/5/6: "**Q<n>.**" questions, prose answer key with rationale
//   exam-2/3:     "**<n>.**" questions, compact table answer key, no rationale
// Both are parsed into the same in-memory shape.
// ---------------------------------------------------------------------------

const SELECT_WORD_TO_COUNT = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4 };

function parseQuestions(md) {
  const lines = md.split(/\r?\n/);
  const scenarioRe = /^##\s*(?:Scenario|Part)\s+(\d+)\s*:\s*(.+)$/i;
  const qStartRe = /^\*\*Q?(\d+)\.(?:\s*\(Select\s+(\w+)\))?\*\*\s?(.*)$/;
  const choiceRe = /^-\s*([A-D])\)\s*(.*)$/;

  const scenarios = [];
  let currentScenario = null;
  let current = null;

  const flush = () => {
    if (current && ['A', 'B', 'C', 'D'].every((k) => k in current.choices)) {
      currentScenario.questions.push(current);
    }
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trim();

    const scenarioMatch = line.match(scenarioRe);
    if (scenarioMatch) {
      flush();
      const title = scenarioMatch[2].replace(/\(Items[^)]*\)/i, '').trim();
      currentScenario = { id: Number(scenarioMatch[1]), title, questions: [] };
      scenarios.push(currentScenario);
      continue;
    }

    const qMatch = line.match(qStartRe);
    if (qMatch && currentScenario) {
      flush();
      const selectWord = qMatch[2];
      current = {
        number: Number(qMatch[1]),
        selectCount: selectWord ? (SELECT_WORD_TO_COUNT[selectWord.toUpperCase()] || 2) : 1,
        stem: qMatch[3] || '',
        choices: {},
      };
      continue;
    }

    const choiceMatch = line.match(choiceRe);
    if (choiceMatch && current) {
      current.choices[choiceMatch[1]] = choiceMatch[2].trim();
      continue;
    }

    if (current && Object.keys(current.choices).length < 4 && line) {
      current.stem = current.stem ? `${current.stem} ${line}` : line;
    }
  }
  flush();

  return scenarios;
}

function parseAnswers(md) {
  const map = new Map();
  if (/\|\s*#\s*\|\s*Answer\s*\|\s*Domain\s*\|/i.test(md)) {
    parseAnswerTable(md, map);
  } else {
    parseAnswerProse(md, map);
  }
  return map;
}

function parseAnswerTable(md, map) {
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.startsWith('|')) continue;
    if (/^\|\s*-+\s*\|/.test(line)) continue; // header separator row

    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter((c, i, arr) => !(i === 0 && c === '') && !(i === arr.length - 1 && c === ''));

    for (let i = 0; i + 3 <= cells.length; i += 3) {
      const [num, ans, dom] = [cells[i], cells[i + 1], cells[i + 2]];
      if (!/^\d+$/.test(num)) continue; // skips the "# | Answer | Domain" header cells
      map.set(Number(num), {
        letters: ans.split(/[,/]/).map((s) => s.trim().toUpperCase()).filter(Boolean),
        domain: dom,
        rationale: null,
      });
    }
  }
}

function parseAnswerProse(md, map) {
  const re = /^\*\*Q?(\d+)\.\s*Answer:\s*([^*]+?)\*\*\s*\*\(([^)]+)\)\*\s*[—–-]\s*(.*)$/;
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    const m = line.match(re);
    if (!m) continue;
    map.set(Number(m[1]), {
      letters: m[2].split(/[,/]/).map((s) => s.trim().toUpperCase()).filter(Boolean),
      domain: m[3].trim(),
      rationale: m[4].trim(),
    });
  }
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderInline(s) {
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return out;
}

// ---------------------------------------------------------------------------
// State
//
// Every question carries its own answer key (`q.key`) and a unique id
// (`q.uid`). In a full mock exam the uid is the question number as a string,
// which keeps answers saved before this refactor resumable. In domain
// practice, questions come from several exams, so the uid is "<exam>-<number>".
// ---------------------------------------------------------------------------

const SITE_URL = 'https://utkarsh1agarwal.github.io/claude-architect-exam-guide/mock-exam/interactive/';

const state = {
  track: 'foundations',
  examId: null,
  session: 'mock', // 'mock' (one full exam) | 'practice' (domain drill)
  mode: 'exam', // 'exam' (timed, graded at the end) | 'study' (instant feedback)
  practiceDomain: null,
  practiceCount: '20',
  flatQuestions: [], // [{uid, number, examId, key, stem, choices, selectCount, scenarioTitle}]
  answers: {}, // uid -> string[] of selected letters
  checked: {}, // uid -> true once revealed in study mode
  flagged: {}, // uid -> true when the candidate flags a question for review
  reviewFilter: 'all',
  currentIndex: 0,
  timerSecondsRemaining: 0,
  timerHandle: null,
  durationMinutes: DEFAULT_DURATION_MIN,
  pendingLoadExamId: null,
  lastResult: null,
  poolCache: {}, // track -> flat questions from every exam
};

function storageKey(examId) {
  // Foundations keeps its original key so in-progress attempts saved before
  // the Professional track existed can still be resumed.
  return state.track === 'foundations'
    ? `mockExamPlayer:v1:exam${examId}`
    : `mockExamPlayer:v1:${state.track}:exam${examId}`;
}

function currentTrack() {
  return TRACKS[state.track];
}

function domainLabel(tag) {
  const name = DOMAIN_NAMES[state.track][tag];
  return name ? `${tag} · ${name}` : tag;
}

function domainsOf(key) {
  return key ? key.domain.split(/[,/]/).map((d) => d.trim()).filter(Boolean) : [];
}

function isAutosaved() {
  return state.session === 'mock' && state.mode === 'exam';
}

function saveProgress() {
  if (state.examId == null || !isAutosaved()) return;
  const payload = {
    answers: state.answers,
    flagged: state.flagged,
    currentIndex: state.currentIndex,
    timerSecondsRemaining: state.timerSecondsRemaining,
    durationMinutes: state.durationMinutes,
    total: state.flatQuestions.length,
  };
  try {
    localStorage.setItem(storageKey(state.examId), JSON.stringify(payload));
  } catch (e) {
    // storage full/unavailable — non-fatal, just skip autosave
  }
}

function loadSavedProgress(examId) {
  try {
    const raw = localStorage.getItem(storageKey(examId));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function clearSavedProgress(examId) {
  try {
    localStorage.removeItem(storageKey(examId));
  } catch (e) {
    // ignore
  }
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// View switching
// ---------------------------------------------------------------------------

function showView(id) {
  for (const el of document.querySelectorAll('.view')) {
    el.hidden = el.id !== id;
  }
  qs('examTopbar').hidden = id !== 'view-exam';
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------------------
// Start screen — tracks, exam grid, domain practice
// ---------------------------------------------------------------------------

function renderTrackTabs() {
  for (const btn of document.querySelectorAll('.track-tab')) {
    const active = btn.dataset.track === state.track;
    btn.classList.toggle('track-tab-active', active);
    btn.setAttribute('aria-selected', String(active));
  }
  qs('trackBlurb').textContent = currentTrack().blurb;
}

function selectTrack(track, { updateHash = true } = {}) {
  if (!TRACKS[track]) return;
  state.track = track;
  state.practiceDomain = null;
  if (updateHash) {
    try {
      history.replaceState(null, '', track === 'foundations' ? location.pathname : `#${track}`);
    } catch (e) {
      // file:// or sandboxed — hash sync is a convenience only
    }
  }
  renderTrackTabs();
  renderExamGrid();
  renderDomainChips();
  qs('loadStatus').hidden = true;
  qs('filePickerPanel').hidden = true;
}

function renderExamGrid() {
  const grid = qs('examGrid');
  grid.innerHTML = '';
  for (const meta of currentTrack().exams) {
    const card = document.createElement('button');
    card.className = 'exam-card';
    card.type = 'button';
    card.innerHTML = `
      <span class="exam-card-title">${escapeHtml(currentTrack().code)} · Exam ${meta.id}</span>
      <span class="exam-card-badge badge-${escapeHtml(meta.difficulty.toLowerCase())}">${escapeHtml(meta.difficulty)}</span>
      <span class="exam-card-coverage">${escapeHtml(meta.coverage)}</span>
    `;
    card.addEventListener('click', () => startLoadExam(meta.id));
    grid.appendChild(card);
  }
}

function renderDomainChips() {
  const wrap = qs('domainChips');
  wrap.innerHTML = '';
  const entries = [['ALL', 'All domains (mixed)'], ...Object.entries(DOMAIN_NAMES[state.track])];
  for (const [tag, name] of entries) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'domain-chip';
    chip.dataset.domain = tag;
    chip.setAttribute('aria-pressed', 'false');
    chip.innerHTML = tag === 'ALL' ? escapeHtml(name) : `<strong>${tag}</strong> ${escapeHtml(name)}`;
    chip.addEventListener('click', () => {
      state.practiceDomain = tag;
      for (const c of wrap.querySelectorAll('.domain-chip')) {
        const on = c.dataset.domain === tag;
        c.classList.toggle('domain-chip-active', on);
        c.setAttribute('aria-pressed', String(on));
      }
      qs('startPracticeBtn').disabled = false;
    });
    wrap.appendChild(chip);
  }
  qs('startPracticeBtn').disabled = true;
}

function fetchText(url) {
  return fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))));
}

function fetchExamFiles(examId) {
  const base = `${currentTrack().basePath}exam-${examId}`;
  return Promise.all([fetchText(`${base}-questions.md`), fetchText(`${base}-answers.md`)]);
}

function buildFlatQuestions(examId, questionsMd, answersMd, { uidPrefix = '' } = {}) {
  const scenarios = parseQuestions(questionsMd);
  const answerKey = parseAnswers(answersMd);
  const flat = [];
  for (const scenario of scenarios) {
    for (const q of scenario.questions) {
      flat.push({
        ...q,
        examId,
        uid: `${uidPrefix}${q.number}`,
        key: answerKey.get(q.number) || null,
        scenarioTitle: scenario.title,
        scenarioId: scenario.id,
      });
    }
  }
  flat.sort((a, b) => a.number - b.number);
  return { scenarios, flat };
}

function startLoadExam(examId) {
  state.pendingLoadExamId = examId;
  qs('loadStatus').textContent = `Loading Exam ${examId}…`;
  qs('loadStatus').hidden = false;
  qs('filePickerPanel').hidden = true;

  fetchExamFiles(examId)
    .then(([qMd, aMd]) => {
      qs('loadStatus').hidden = true;
      onExamContentLoaded(examId, qMd, aMd);
    })
    .catch(() => {
      qs('loadStatus').hidden = true;
      showFilePicker(examId);
    });
}

function showFilePicker(examId) {
  qs('filePickerPanel').hidden = false;
  qs('filePickerLabel').textContent =
    `Couldn't load ${currentTrack().code} Exam ${examId} automatically — this usually happens when the page ` +
    `was opened directly as a file rather than served over http. Select the two files ` +
    `below from the mock-exam folder instead:`;
  qs('filePickerFilenames').textContent = `exam-${examId}-questions.md   +   exam-${examId}-answers.md`;
  qs('questionsFileInput').value = '';
  qs('answersFileInput').value = '';
  qs('loadFilesBtn').disabled = true;
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function checkFilePickerReady() {
  const ready = qs('questionsFileInput').files.length > 0 && qs('answersFileInput').files.length > 0;
  qs('loadFilesBtn').disabled = !ready;
}

async function loadFromFilePicker() {
  const examId = state.pendingLoadExamId;
  const qFile = qs('questionsFileInput').files[0];
  const aFile = qs('answersFileInput').files[0];
  if (!qFile || !aFile) return;
  const [qMd, aMd] = await Promise.all([readFileAsText(qFile), readFileAsText(aFile)]);
  qs('filePickerPanel').hidden = true;
  onExamContentLoaded(examId, qMd, aMd);
}

function onExamContentLoaded(examId, questionsMd, answersMd) {
  const { scenarios, flat } = buildFlatQuestions(examId, questionsMd, answersMd);

  if (flat.length === 0) {
    qs('loadStatus').hidden = false;
    qs('loadStatus').textContent =
      `Parsed Exam ${examId} but found 0 questions — the file format may have changed.`;
    return;
  }

  state.session = 'mock';
  state.examId = examId;
  state.flatQuestions = flat;
  enterReady(examId, scenarios);
}

// --- Domain practice --------------------------------------------------------

function loadTrackPool() {
  if (state.poolCache[state.track]) return Promise.resolve(state.poolCache[state.track]);
  const exams = currentTrack().exams;
  return Promise.all(exams.map((m) => fetchExamFiles(m.id))).then((files) => {
    const pool = [];
    files.forEach(([qMd, aMd], i) => {
      const examId = exams[i].id;
      pool.push(...buildFlatQuestions(examId, qMd, aMd, { uidPrefix: `${examId}-` }).flat.filter((q) => q.key));
    });
    state.poolCache[state.track] = pool;
    return pool;
  });
}

function startPractice() {
  const domain = state.practiceDomain;
  if (!domain) return;
  state.practiceCount = qs('practiceCount').value;
  qs('loadStatus').textContent = 'Building your practice set…';
  qs('loadStatus').hidden = false;

  loadTrackPool()
    .then((pool) => {
      const matching = domain === 'ALL' ? pool : pool.filter((q) => domainsOf(q.key).includes(domain));
      if (matching.length === 0) throw new Error('no questions');
      const n = state.practiceCount === 'all' ? matching.length : Math.min(Number(state.practiceCount), matching.length);
      qs('loadStatus').hidden = true;
      state.session = 'practice';
      state.examId = null;
      state.flatQuestions = shuffle(matching).slice(0, n);
      beginSession('study');
    })
    .catch(() => {
      qs('loadStatus').hidden = false;
      qs('loadStatus').textContent =
        'Practice by domain needs the page to be served over http (it works on the website, or run ' +
        '`python3 -m http.server` from the repo root). Full exams still work via the file picker.';
    });
}

// ---------------------------------------------------------------------------
// Ready panel
// ---------------------------------------------------------------------------

function enterReady(examId, scenarios) {
  showView('view-ready');
  qs('readyTitle').textContent = `${currentTrack().code} Exam ${examId} — ready`;

  const total = state.flatQuestions.length;
  const scenarioList = scenarios.map((s) => `${s.title} (${s.questions.length})`).join(' · ');
  qs('readyMeta').textContent =
    currentTrack().groupLabel === 'Scenario'
      ? `${total} questions · ${scenarioList}`
      : `${total} questions · ${currentTrack().blurb.split(' · ').slice(1).join(' · ')}`;

  qs('durationInput').value = DEFAULT_DURATION_MIN;

  const saved = loadSavedProgress(examId);
  const resumeBox = qs('resumeBox');
  if (saved && saved.total === total) {
    const answeredCount = Object.keys(saved.answers || {}).length;
    const flaggedCount = Object.keys(saved.flagged || {}).length;
    const mm = Math.floor(saved.timerSecondsRemaining / 60);
    const ss = String(saved.timerSecondsRemaining % 60).padStart(2, '0');
    resumeBox.hidden = false;
    qs('resumeInfo').textContent =
      `In-progress attempt found — question ${saved.currentIndex + 1} of ${total}, ` +
      `${answeredCount} answered${flaggedCount ? `, ${flaggedCount} flagged` : ''}, ${mm}:${ss} left on the clock.`;
    resumeBox.dataset.saved = JSON.stringify(saved);
  } else {
    resumeBox.hidden = true;
    delete resumeBox.dataset.saved;
  }
}

function beginSession(mode) {
  state.mode = mode;
  state.answers = {};
  state.checked = {};
  state.flagged = {};
  state.currentIndex = 0;
  if (mode === 'exam') {
    const minutes = Math.max(1, Number(qs('durationInput').value) || DEFAULT_DURATION_MIN);
    state.durationMinutes = minutes;
    state.timerSecondsRemaining = minutes * 60;
    if (state.session === 'mock') clearSavedProgress(state.examId);
  }
  enterExam();
}

function resumeSaved() {
  const raw = qs('resumeBox').dataset.saved;
  if (!raw) return beginSession('exam');
  const saved = JSON.parse(raw);
  state.mode = 'exam';
  state.answers = saved.answers || {};
  state.flagged = saved.flagged || {};
  state.checked = {};
  state.currentIndex = saved.currentIndex || 0;
  state.durationMinutes = saved.durationMinutes || DEFAULT_DURATION_MIN;
  state.timerSecondsRemaining = saved.timerSecondsRemaining;
  enterExam();
}

function discardSaved() {
  clearSavedProgress(state.examId);
  qs('resumeBox').hidden = true;
}

// ---------------------------------------------------------------------------
// Exam / study view
// ---------------------------------------------------------------------------

function enterExam() {
  showView('view-exam');
  clearInterval(state.timerHandle);
  const study = state.mode === 'study';
  qs('submitBtn').textContent = study ? 'Finish' : 'Submit exam';
  qs('legendAnswered').lastChild.textContent = study ? ' Correct' : ' Answered';
  qs('legendWrong').hidden = !study;
  if (study) {
    updateStudyScore();
  } else {
    startTimer();
  }
  renderQuestion();
}

function startTimer() {
  updateTimerDisplay();
  state.timerHandle = setInterval(() => {
    state.timerSecondsRemaining -= 1;
    updateTimerDisplay();
    if (state.timerSecondsRemaining % 20 === 0) saveProgress();
    if (state.timerSecondsRemaining <= 0) {
      submitExam(true);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const secs = Math.max(0, state.timerSecondsRemaining);
  const hh = Math.floor(secs / 3600);
  const mm = Math.floor((secs % 3600) / 60);
  const ss = String(secs % 60).padStart(2, '0');
  const el = qs('timerDisplay');
  el.textContent = hh > 0 ? `${hh}:${String(mm).padStart(2, '0')}:${ss}` : `${mm}:${ss}`;
  el.classList.toggle('timer-low', secs <= 300 && secs > 60);
  el.classList.toggle('timer-critical', secs <= 60);
}

function isCorrectAnswer(q, letters) {
  if (!q.key) return null;
  const a = (letters || []).slice().sort();
  const b = q.key.letters.slice().sort();
  return a.length === b.length && a.every((l, i) => l === b[i]);
}

function updateStudyScore() {
  const checkedQs = state.flatQuestions.filter((q) => state.checked[q.uid]);
  const right = checkedQs.filter((q) => isCorrectAnswer(q, state.answers[q.uid])).length;
  const el = qs('timerDisplay');
  el.classList.remove('timer-low', 'timer-critical');
  el.textContent = `Study mode · ${right} / ${checkedQs.length} correct`;
}

function questionLabel(q) {
  if (state.session === 'practice') return `${currentTrack().code} · Exam ${q.examId} · Q${q.number}`;
  return currentTrack().groupLabel === 'Scenario' ? q.scenarioTitle : `${currentTrack().code} · Question ${q.number}`;
}

function renderQuestion() {
  const q = state.flatQuestions[state.currentIndex];
  const total = state.flatQuestions.length;
  const study = state.mode === 'study';
  const revealed = study && state.checked[q.uid];

  qs('progressDisplay').textContent = `Question ${state.currentIndex + 1} of ${total}`;
  qs('scenarioTag').textContent = questionLabel(q);
  qs('questionStem').innerHTML = renderInline(q.stem);
  qs('selectHint').textContent = q.selectCount > 1 ? `Select exactly ${q.selectCount}` : '';
  qs('selectHint').hidden = q.selectCount <= 1;

  const flagged = Boolean(state.flagged[q.uid]);
  const flagBtn = qs('flagBtn');
  flagBtn.textContent = flagged ? '⚑ Flagged' : '⚑ Flag for review';
  flagBtn.classList.toggle('flag-btn-active', flagged);
  flagBtn.setAttribute('aria-pressed', String(flagged));

  const list = qs('choicesList');
  list.innerHTML = '';
  const selected = new Set(state.answers[q.uid] || []);
  const correct = new Set(q.key ? q.key.letters : []);
  const isMulti = q.selectCount > 1;

  for (const letter of ['A', 'B', 'C', 'D']) {
    const label = document.createElement('label');
    label.className = 'choice-row';

    const input = document.createElement('input');
    input.type = isMulti ? 'checkbox' : 'radio';
    input.name = 'choice';
    input.value = letter;
    input.checked = selected.has(letter);
    if (revealed || (isMulti && !input.checked && selected.size >= q.selectCount)) {
      input.disabled = true;
    }
    input.addEventListener('change', () => onChoiceChange(q, letter, isMulti));

    if (revealed) {
      if (correct.has(letter)) label.classList.add('choice-correct');
      else if (selected.has(letter)) label.classList.add('choice-wrong');
    }

    const letterSpan = document.createElement('span');
    letterSpan.className = 'choice-letter';
    letterSpan.textContent = letter;

    const textSpan = document.createElement('span');
    textSpan.className = 'choice-text';
    textSpan.innerHTML = renderInline(q.choices[letter]);

    label.append(input, letterSpan, textSpan);
    list.appendChild(label);
  }

  // Study-mode feedback
  const fb = qs('studyFeedback');
  const checkBtn = qs('checkBtn');
  checkBtn.hidden = !study || revealed;
  checkBtn.disabled = selected.size !== q.selectCount;
  if (revealed) {
    const ok = isCorrectAnswer(q, state.answers[q.uid]);
    fb.hidden = false;
    fb.className = `study-feedback ${ok ? 'study-feedback-correct' : 'study-feedback-wrong'}`;
    fb.innerHTML = `
      <div class="study-feedback-head">
        <strong>${ok ? '✓ Correct' : '✗ Not quite'}</strong>
        <span>Answer: <strong>${escapeHtml(q.key ? q.key.letters.join(', ') : 'n/a')}</strong></span>
        ${q.key ? `<span class="review-domain">${escapeHtml(domainLabel(q.key.domain))}</span>` : ''}
      </div>
      <div class="study-feedback-body">${q.key && q.key.rationale ? renderInline(q.key.rationale) : ''}</div>
    `;
  } else {
    fb.hidden = true;
    fb.innerHTML = '';
  }

  qs('prevBtn').disabled = state.currentIndex === 0;
  qs('nextBtn').disabled = state.currentIndex === total - 1;

  renderPaletteGrid();
}

function onChoiceChange(q, letter, isMulti) {
  if (state.mode === 'study' && state.checked[q.uid]) return;
  const current = new Set(state.answers[q.uid] || []);
  if (isMulti) {
    if (current.has(letter)) current.delete(letter);
    else current.add(letter);
  } else {
    current.clear();
    current.add(letter);
  }
  state.answers[q.uid] = Array.from(current);
  saveProgress();
  renderQuestion();
}

function toggleFlag() {
  const q = state.flatQuestions[state.currentIndex];
  if (!q) return;
  if (state.flagged[q.uid]) delete state.flagged[q.uid];
  else state.flagged[q.uid] = true;
  saveProgress();
  renderQuestion();
}

function checkAnswer() {
  const q = state.flatQuestions[state.currentIndex];
  if ((state.answers[q.uid] || []).length !== q.selectCount) return;
  state.checked[q.uid] = true;
  updateStudyScore();
  renderQuestion();
  qs('studyFeedback').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function goPrev() {
  if (state.currentIndex > 0) {
    state.currentIndex -= 1;
    renderQuestion();
    saveProgress();
  }
}

function goNext() {
  if (state.currentIndex < state.flatQuestions.length - 1) {
    state.currentIndex += 1;
    renderQuestion();
    saveProgress();
  }
}

function jumpTo(index) {
  state.currentIndex = index;
  renderQuestion();
  saveProgress();
}

// ---------------------------------------------------------------------------
// Question palette (always-visible sidebar)
// ---------------------------------------------------------------------------

function renderPaletteGrid() {
  const grid = qs('paletteGrid');
  grid.innerHTML = '';
  const study = state.mode === 'study';
  state.flatQuestions.forEach((q, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = String(i + 1);
    btn.className = 'palette-btn';
    if (i === state.currentIndex) btn.classList.add('palette-current');
    if (state.flagged[q.uid]) btn.classList.add('palette-flagged');
    if (study) {
      if (state.checked[q.uid]) {
        btn.classList.add(isCorrectAnswer(q, state.answers[q.uid]) ? 'palette-answered' : 'palette-wrong');
      }
    } else if ((state.answers[q.uid] || []).length > 0) {
      btn.classList.add('palette-answered');
    }
    btn.addEventListener('click', () => jumpTo(i));
    grid.appendChild(btn);
  });
}

// ---------------------------------------------------------------------------
// Submit + grading
// ---------------------------------------------------------------------------

function submitExam(auto) {
  const study = state.mode === 'study';
  if (!auto) {
    if (study) {
      const checkedCount = Object.keys(state.checked).length;
      if (checkedCount === 0) {
        alert('Check at least one answer before finishing.');
        return;
      }
      const left = state.flatQuestions.length - checkedCount;
      if (left > 0 && !confirm(`${left} question(s) not checked yet. Finish and score only the ${checkedCount} you checked?`)) return;
    } else {
      const answeredCount = Object.keys(state.answers).filter((k) => state.answers[k].length > 0).length;
      const unanswered = state.flatQuestions.length - answeredCount;
      if (unanswered > 0 && !confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    }
  }

  clearInterval(state.timerHandle);
  if (state.session === 'mock' && !study) clearSavedProgress(state.examId);

  // In study mode only the questions the candidate actually checked are scored.
  const graded = study ? state.flatQuestions.filter((q) => state.checked[q.uid]) : state.flatQuestions;

  const scenarioStats = new Map();
  const domainStats = new Map();
  const reviewItems = [];
  let correctCount = 0;
  let gradedCount = 0;
  let ungradedCount = 0;

  for (const q of graded) {
    const userLetters = (state.answers[q.uid] || []).slice().sort();
    if (!q.key) {
      ungradedCount += 1;
      reviewItems.push({ q, userLetters, key: null, isCorrect: null });
      continue;
    }
    const isCorrect = isCorrectAnswer(q, userLetters);
    gradedCount += 1;
    if (isCorrect) correctCount += 1;

    if (!scenarioStats.has(q.scenarioTitle)) scenarioStats.set(q.scenarioTitle, { correct: 0, total: 0 });
    const sStat = scenarioStats.get(q.scenarioTitle);
    sStat.total += 1;
    if (isCorrect) sStat.correct += 1;

    for (const d of domainsOf(q.key)) {
      if (!domainStats.has(d)) domainStats.set(d, { correct: 0, total: 0 });
      const dStat = domainStats.get(d);
      dStat.total += 1;
      if (isCorrect) dStat.correct += 1;
    }
    reviewItems.push({ q, userLetters, key: q.key, isCorrect });
  }

  renderResults({ correctCount, gradedCount, ungradedCount, scenarioStats, domainStats, reviewItems });
}

function sessionTitle() {
  const t = currentTrack();
  if (state.session === 'practice') {
    const d = state.practiceDomain;
    return d === 'ALL' ? `${t.code} Practice · mixed domains` : `${t.code} Practice · ${d} ${DOMAIN_NAMES[state.track][d]}`;
  }
  return `${t.code} Mock Exam ${state.examId}${state.mode === 'study' ? ' (study mode)' : ''}`;
}

function renderResults({ correctCount, gradedCount, ungradedCount, scenarioStats, domainStats, reviewItems }) {
  showView('view-results');

  const pct = gradedCount > 0 ? Math.round((correctCount / gradedCount) * 100) : 0;
  qs('resultsTitle').textContent = `Results — ${sessionTitle()}`;
  qs('scoreSummary').innerHTML = `
    <div class="score-big">${correctCount} / ${gradedCount}</div>
    <div class="score-pct">${pct}%</div>
  `;

  qs('warningBanner').hidden = ungradedCount === 0;
  if (ungradedCount > 0) {
    qs('warningBanner').textContent =
      `${ungradedCount} question(s) couldn't be matched to an answer key entry and were excluded from scoring.`;
  }

  const scenarioTable = qs('scenarioTable');
  const showScenarioTable = currentTrack().groupLabel === 'Scenario' && state.session === 'mock';
  scenarioTable.hidden = !showScenarioTable;
  qs('resultsTables').classList.toggle('results-tables-single', !showScenarioTable);
  scenarioTable.innerHTML = '<tr><th>Scenario</th><th>Correct</th><th>%</th></tr>';
  for (const [title, stat] of scenarioStats) {
    const row = document.createElement('tr');
    const p = Math.round((stat.correct / stat.total) * 100);
    row.innerHTML = `<td>${escapeHtml(title)}</td><td>${stat.correct} / ${stat.total}</td><td>${p}%</td>`;
    scenarioTable.appendChild(row);
  }

  const domainTable = qs('domainTable');
  domainTable.innerHTML = '<tr><th>Domain</th><th>Correct</th><th>%</th></tr>';
  const sortedDomains = Array.from(domainStats.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [domain, stat] of sortedDomains) {
    const row = document.createElement('tr');
    const p = Math.round((stat.correct / stat.total) * 100);
    row.innerHTML = `<td>${escapeHtml(domainLabel(domain))}</td><td>${stat.correct} / ${stat.total}</td><td>${p}%</td>`;
    domainTable.appendChild(row);
  }

  qs('retakeBtn').textContent = state.session === 'practice' ? 'New practice set' : 'Retake this exam';

  state.lastResult = { correctCount, gradedCount, pct, title: sessionTitle(), domains: sortedDomains };
  renderShareCard();

  state.reviewItems = reviewItems;
  state.reviewShowScenarios = showScenarioTable;
  qs('countAll').textContent = `(${reviewItems.length})`;
  qs('countIncorrect').textContent = `(${reviewItems.filter((it) => it.isCorrect === false).length})`;
  qs('countFlagged').textContent = `(${reviewItems.filter((it) => state.flagged[it.q.uid]).length})`;
  setReviewFilter(reviewItems.some((it) => state.flagged[it.q.uid]) ? 'flagged' : 'all');
}

function setReviewFilter(filter) {
  state.reviewFilter = filter;
  for (const b of document.querySelectorAll('.review-filter')) {
    b.classList.toggle('review-filter-active', b.dataset.filter === filter);
  }
  renderReviewList();
}

function renderReviewList() {
  const filter = state.reviewFilter;
  const items = state.reviewItems.filter((it) =>
    filter === 'incorrect' ? it.isCorrect === false : filter === 'flagged' ? state.flagged[it.q.uid] : true);
  const showScenarioTable = state.reviewShowScenarios && filter === 'all';
  const empty = qs('reviewEmpty');
  empty.hidden = items.length > 0;
  empty.textContent = filter === 'flagged' ? 'You didn\'t flag any questions.' : 'Nothing incorrect — nice work.';

  const reviewList = qs('reviewList');
  reviewList.innerHTML = '';
  let lastScenario = null;
  for (const item of items) {
    if (showScenarioTable && item.q.scenarioTitle !== lastScenario) {
      lastScenario = item.q.scenarioTitle;
      const heading = document.createElement('h3');
      heading.className = 'review-scenario-heading';
      heading.textContent = lastScenario;
      reviewList.appendChild(heading);
    }

    const card = document.createElement('div');
    card.className = 'review-item';
    card.classList.add(item.isCorrect === null ? 'review-ungraded' : item.isCorrect ? 'review-correct' : 'review-incorrect');

    const userText = item.userLetters.length ? item.userLetters.join(', ') : '(no answer)';
    const correctText = item.key ? item.key.letters.join(', ') : 'n/a';
    const rationale = item.key && item.key.rationale
      ? renderInline(item.key.rationale)
      : '<em>No written rationale available for this question.</em>';
    const domainBadge = item.key ? escapeHtml(domainLabel(item.key.domain)) : '';
    const qLabel = state.session === 'practice' ? `Exam ${item.q.examId} · Q${item.q.number}` : `Q${item.q.number}`;

    card.innerHTML = `
      <div class="review-item-head">
        <span class="review-q-number">${qLabel}</span>
        <span class="review-badge">${item.isCorrect === null ? 'UNGRADED' : item.isCorrect ? 'Correct' : 'Incorrect'}</span>
        ${state.flagged[item.q.uid] ? '<span class="review-flag">⚑ Flagged</span>' : ''}
        ${domainBadge ? `<span class="review-domain">${domainBadge}</span>` : ''}
      </div>
      <div class="review-stem">${renderInline(item.q.stem)}</div>
      <div class="review-answers">
        <span>Your answer: <strong>${escapeHtml(userText)}</strong></span>
        <span>Correct answer: <strong>${escapeHtml(correctText)}</strong></span>
      </div>
      <details class="review-options">
        <summary>Show all options</summary>
        <ul>${reviewOptionsHtml(item)}</ul>
      </details>
      <div class="review-rationale">${rationale}</div>
    `;
    reviewList.appendChild(card);
  }
}

function reviewOptionsHtml(item) {
  const mine = new Set(item.userLetters);
  const right = new Set(item.key ? item.key.letters : []);
  return ['A', 'B', 'C', 'D'].map((l) => {
    const cls = right.has(l) ? 'opt-correct' : mine.has(l) ? 'opt-wrong' : '';
    const tags = [mine.has(l) ? 'your answer' : '', right.has(l) ? 'correct' : ''].filter(Boolean).join(' · ');
    return `<li class="${cls}"><span class="choice-letter">${l}</span><span>${renderInline(item.q.choices[l])}</span>` +
      `${tags ? `<span class="opt-tag">${tags}</span>` : ''}</li>`;
  }).join('');
}

// ---------------------------------------------------------------------------
// Shareable score card (drawn on a canvas, 1200×630 — the size LinkedIn and X
// use for link previews)
// ---------------------------------------------------------------------------

function shareUrl() {
  return state.track === 'foundations' ? SITE_URL : `${SITE_URL}#${state.track}`;
}

function shareText() {
  const r = state.lastResult;
  const t = currentTrack();
  return `I scored ${r.pct}% (${r.correctCount}/${r.gradedCount}) on ${r.title} — free Claude Certified Architect ` +
    `${t.label} (${t.code}) practice exams:`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawScoreCard() {
  const r = state.lastResult;
  const t = currentTrack();
  const W = 1200;
  const H = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const font = (w, s) => `${w} ${s}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

  const serif = (w, sz) => `${w} ${sz}px "Iowan Old Style", "New York", Palatino, Georgia, serif`;
  const CREAM = '#f5efe4';
  const CLAY = '#d97757';
  const CLAY_DK = '#b85c3e';
  const INK = '#1f1e1c';
  const MUTED = '#6b665d';

  // Cream "exam paper" with dots and a warm glow (matches the social preview)
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(31,30,28,0.10)';
  for (let x = 13; x < W; x += 26) for (let y = 13; y < H; y += 26) ctx.fillRect(x, y, 2, 2);
  const glow = ctx.createRadialGradient(W - 140, 40, 10, W - 140, 40, 460);
  glow.addColorStop(0, 'rgba(217,119,87,0.28)');
  glow.addColorStop(1, 'rgba(217,119,87,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Kicker pill
  const kicker = `CLAUDE CERTIFIED ARCHITECT · ${t.label.toUpperCase()} (${t.code})`;
  ctx.font = font('700', 20);
  const kw = ctx.measureText(kicker).width + 44;
  roundRect(ctx, 60, 52, kw, 40, 20);
  ctx.fillStyle = 'rgba(217,119,87,0.13)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(217,119,87,0.40)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = CLAY;
  ctx.beginPath();
  ctx.arc(80, 72, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CLAY_DK;
  ctx.fillText(kicker, 94, 79);

  // Title: shrink to fit the left column (domain panel starts at x=620), then ellipsize
  let subtitle = r.title.replace(`${t.code} `, '');
  subtitle = subtitle.charAt(0).toUpperCase() + subtitle.slice(1);
  const maxW = 530;
  let size = 44;
  ctx.font = serif('700', size);
  while (ctx.measureText(subtitle).width > maxW && size > 30) {
    size -= 2;
    ctx.font = serif('700', size);
  }
  while (ctx.measureText(subtitle).width > maxW && subtitle.length > 4) {
    subtitle = `${subtitle.slice(0, -2).trimEnd()}…`;
  }
  ctx.fillStyle = INK;
  ctx.fillText(subtitle, 60, 152);

  // Big score
  ctx.fillStyle = CLAY_DK;
  ctx.font = serif('700', 150);
  ctx.fillText(`${r.pct}%`, 54, 320);
  ctx.fillStyle = MUTED;
  ctx.font = font('600', 32);
  ctx.fillText(`${r.correctCount} of ${r.gradedCount} correct`, 62, 372);

  // Domain panel (right) — a white "exam card"
  const domains = r.domains.slice(0, 7);
  const px = 620;
  const py = 120;
  const pw = 520;
  const rowH = domains.length > 5 ? 44 : 54;
  const ph = Math.max(150, 70 + domains.length * rowH);
  ctx.save();
  ctx.shadowColor = 'rgba(60,40,20,0.16)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 14;
  roundRect(ctx, px, py, pw, ph, 20);
  ctx.fillStyle = '#fffdf9';
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#e3d8c5';
  ctx.lineWidth = 1.5;
  roundRect(ctx, px, py, pw, ph, 20);
  ctx.stroke();
  ctx.fillStyle = CLAY_DK;
  ctx.font = font('700', 17);
  ctx.fillText('SCORE BY DOMAIN', px + 28, py + 40);

  let y = py + 66;
  ctx.font = font('700', 21);
  for (const [tag, stat] of domains) {
    const p = stat.total ? stat.correct / stat.total : 0;
    ctx.fillStyle = INK;
    ctx.fillText(tag, px + 28, y + 17);
    const bx = px + 88;
    const bw = pw - 88 - 96;
    roundRect(ctx, bx, y, bw, 20, 10);
    ctx.fillStyle = '#ece3d3';
    ctx.fill();
    roundRect(ctx, bx, y, Math.max(20, bw * p), 20, 10);
    ctx.fillStyle = p >= 0.75 ? '#4f8a5b' : p >= 0.6 ? '#d9a441' : CLAY;
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.fillText(`${Math.round(p * 100)}%`, px + pw - 78, y + 17);
    y += rowH;
  }

  // Footer band
  ctx.fillStyle = 'rgba(31,30,28,0.06)';
  ctx.fillRect(0, H - 104, W, 104);
  ctx.fillStyle = INK;
  ctx.font = serif('700', 32);
  ctx.fillText('Free CCAR-F & CCAR-P practice exams', 60, H - 58);
  ctx.fillStyle = MUTED;
  ctx.font = font('600', 23);
  ctx.fillText('utkarsh1agarwal.github.io/claude-architect-exam-guide', 60, H - 24);

  return canvas;
}

function renderShareCard() {
  const canvas = drawScoreCard();
  state.cardCanvas = canvas;
  qs('scoreCardImg').src = canvas.toDataURL('image/png');
  qs('shareStatus').textContent = '';
  const url = encodeURIComponent(shareUrl());
  const text = encodeURIComponent(shareText());
  qs('shareLinkedInBtn').href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  qs('shareXBtn').href = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  qs('shareNativeBtn').hidden = !(navigator.share && navigator.canShare);
}

function cardBlob() {
  return new Promise((resolve) => state.cardCanvas.toBlob(resolve, 'image/png'));
}

function cardFilename() {
  return `${currentTrack().code.toLowerCase()}-score-${state.lastResult.pct}.png`;
}

async function downloadCard() {
  const blob = await cardBlob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = cardFilename();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  qs('shareStatus').textContent = 'Image downloaded — attach it to your post.';
}

async function shareNative() {
  try {
    const file = new File([await cardBlob()], cardFilename(), { type: 'image/png' });
    const data = { text: shareText(), url: shareUrl() };
    if (navigator.canShare({ files: [file] })) data.files = [file];
    await navigator.share(data);
  } catch (e) {
    // user cancelled or sharing unavailable — nothing to do
  }
}

async function copyShareText() {
  const text = `${shareText()} ${shareUrl()}`;
  try {
    await navigator.clipboard.writeText(text);
    qs('shareStatus').textContent = 'Copied! Paste it into your post (and attach the image).';
  } catch (e) {
    qs('shareStatus').textContent = text;
  }
}

function retakeExam() {
  if (state.session === 'practice') {
    showView('view-start');
    startPractice();
    return;
  }
  clearSavedProgress(state.examId);
  startLoadExam(state.examId);
}

function chooseAnotherExam() {
  clearInterval(state.timerHandle);
  showView('view-start');
  qs('loadStatus').hidden = true;
  qs('filePickerPanel').hidden = true;
}

// ---------------------------------------------------------------------------
// Wire up
// ---------------------------------------------------------------------------

function init() {
  for (const btn of document.querySelectorAll('.track-tab')) {
    btn.addEventListener('click', () => selectTrack(btn.dataset.track));
  }
  const hashTrack = location.hash.replace('#', '');
  selectTrack(TRACKS[hashTrack] ? hashTrack : 'foundations', { updateHash: false });

  qs('questionsFileInput').addEventListener('change', checkFilePickerReady);
  qs('answersFileInput').addEventListener('change', checkFilePickerReady);
  qs('loadFilesBtn').addEventListener('click', loadFromFilePicker);
  qs('startPracticeBtn').addEventListener('click', startPractice);

  qs('startFreshBtn').addEventListener('click', () => beginSession('exam'));
  qs('startStudyBtn').addEventListener('click', () => beginSession('study'));
  qs('resumeBtn').addEventListener('click', resumeSaved);
  qs('discardResumeBtn').addEventListener('click', discardSaved);
  qs('backToGridBtn').addEventListener('click', chooseAnotherExam);

  qs('prevBtn').addEventListener('click', goPrev);
  qs('nextBtn').addEventListener('click', goNext);
  qs('checkBtn').addEventListener('click', checkAnswer);
  qs('flagBtn').addEventListener('click', toggleFlag);
  for (const b of document.querySelectorAll('.review-filter')) {
    b.addEventListener('click', () => setReviewFilter(b.dataset.filter));
  }
  qs('submitBtn').addEventListener('click', () => submitExam(false));

  qs('retakeBtn').addEventListener('click', retakeExam);
  qs('chooseAnotherBtn').addEventListener('click', chooseAnotherExam);
  qs('downloadCardBtn').addEventListener('click', downloadCard);
  qs('shareNativeBtn').addEventListener('click', shareNative);
  qs('copyShareBtn').addEventListener('click', copyShareText);

  window.addEventListener('beforeunload', saveProgress);

  document.addEventListener('keydown', (e) => {
    if (qs('view-exam').hidden) return;
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'Enter' && state.mode === 'study' && !qs('checkBtn').hidden && !qs('checkBtn').disabled) checkAnswer();
  });
}

document.addEventListener('DOMContentLoaded', init);
