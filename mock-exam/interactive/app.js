'use strict';

// ---------------------------------------------------------------------------
// Config — mirrors the table in the repo README. Add a line here if a new
// mock-exam-N pair is added later; nothing else in this app needs to change.
// ---------------------------------------------------------------------------
const EXAMS = [
  { id: 1, difficulty: 'Medium', coverage: 'All 6 scenarios' },
  { id: 2, difficulty: 'Medium', coverage: '4-of-6 draw (leans D1/D5)' },
  { id: 3, difficulty: 'Medium', coverage: '4-of-6 draw (leans D3/D4)' },
  { id: 4, difficulty: 'Hard', coverage: 'All 6 scenarios' },
  { id: 5, difficulty: 'Hard', coverage: 'All 6 scenarios' },
  { id: 6, difficulty: 'Hard', coverage: 'All 6 scenarios' },
];

const STORAGE_PREFIX = 'mockExamPlayer:v1:exam';
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
  const scenarioRe = /^##\s*Scenario\s+(\d+)\s*:\s*(.+)$/i;
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
// ---------------------------------------------------------------------------

const state = {
  examId: null,
  flatQuestions: [], // [{number, scenarioTitle, stem, choices, selectCount}]
  answerKey: new Map(),
  answers: {}, // questionNumber -> string[] of selected letters
  currentIndex: 0,
  timerSecondsRemaining: 0,
  timerHandle: null,
  durationMinutes: DEFAULT_DURATION_MIN,
  pendingLoadExamId: null,
};

function storageKey(examId) {
  return `${STORAGE_PREFIX}${examId}`;
}

function saveProgress() {
  if (state.examId == null) return;
  const payload = {
    answers: state.answers,
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

// ---------------------------------------------------------------------------
// View switching
// ---------------------------------------------------------------------------

function showView(id) {
  for (const el of document.querySelectorAll('.view')) {
    el.hidden = el.id !== id;
  }
  qs('examTopbar').hidden = id !== 'view-exam';
}

// ---------------------------------------------------------------------------
// Start screen — exam grid
// ---------------------------------------------------------------------------

function renderExamGrid() {
  const grid = qs('examGrid');
  grid.innerHTML = '';
  for (const meta of EXAMS) {
    const card = document.createElement('button');
    card.className = 'exam-card';
    card.type = 'button';
    card.innerHTML = `
      <span class="exam-card-title">Exam ${meta.id}</span>
      <span class="exam-card-badge badge-${meta.difficulty.toLowerCase()}">${meta.difficulty}</span>
      <span class="exam-card-coverage">${escapeHtml(meta.coverage)}</span>
    `;
    card.addEventListener('click', () => startLoadExam(meta.id));
    grid.appendChild(card);
  }
}

function startLoadExam(examId) {
  state.pendingLoadExamId = examId;
  qs('loadStatus').textContent = `Loading Exam ${examId}…`;
  qs('loadStatus').hidden = false;
  qs('filePickerPanel').hidden = true;

  const base = `../exam-${examId}`;
  Promise.all([
    fetch(`${base}-questions.md`).then((r) => (r.ok ? r.text() : Promise.reject(new Error('not ok')))),
    fetch(`${base}-answers.md`).then((r) => (r.ok ? r.text() : Promise.reject(new Error('not ok')))),
  ])
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
    `Couldn't load Exam ${examId} automatically — this usually happens when the page ` +
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
  const scenarios = parseQuestions(questionsMd);
  const answerKey = parseAnswers(answersMd);

  const flatQuestions = [];
  for (const scenario of scenarios) {
    for (const q of scenario.questions) {
      flatQuestions.push({ ...q, scenarioTitle: scenario.title, scenarioId: scenario.id });
    }
  }
  flatQuestions.sort((a, b) => a.number - b.number);

  if (flatQuestions.length === 0) {
    qs('loadStatus').hidden = false;
    qs('loadStatus').textContent =
      `Parsed Exam ${examId} but found 0 questions — the file format may have changed. ` +
      `Check the console for the raw content.`;
    return;
  }

  state.examId = examId;
  state.flatQuestions = flatQuestions;
  state.answerKey = answerKey;

  enterReady(examId, scenarios);
}

// ---------------------------------------------------------------------------
// Ready panel
// ---------------------------------------------------------------------------

function enterReady(examId, scenarios) {
  showView('view-ready');
  qs('readyTitle').textContent = `Exam ${examId} — ready`;

  const total = state.flatQuestions.length;
  const scenarioList = scenarios.map((s) => `${escapeHtml(s.title)} (${s.questions.length})`).join(' · ');
  qs('readyMeta').textContent = `${total} questions · ${scenarioList}`;

  qs('durationInput').value = DEFAULT_DURATION_MIN;

  const saved = loadSavedProgress(examId);
  const resumeBox = qs('resumeBox');
  if (saved && saved.total === total) {
    const answeredCount = Object.keys(saved.answers || {}).length;
    const mm = Math.floor(saved.timerSecondsRemaining / 60);
    const ss = String(saved.timerSecondsRemaining % 60).padStart(2, '0');
    resumeBox.hidden = false;
    qs('resumeInfo').textContent =
      `In-progress attempt found — question ${saved.currentIndex + 1} of ${total}, ` +
      `${answeredCount} answered, ${mm}:${ss} left on the clock.`;
    resumeBox.dataset.saved = JSON.stringify(saved);
  } else {
    resumeBox.hidden = true;
    delete resumeBox.dataset.saved;
  }
}

function startFresh() {
  state.answers = {};
  state.currentIndex = 0;
  const minutes = Math.max(1, Number(qs('durationInput').value) || DEFAULT_DURATION_MIN);
  state.durationMinutes = minutes;
  state.timerSecondsRemaining = minutes * 60;
  clearSavedProgress(state.examId);
  enterExam();
}

function resumeSaved() {
  const raw = qs('resumeBox').dataset.saved;
  if (!raw) return startFresh();
  const saved = JSON.parse(raw);
  state.answers = saved.answers || {};
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
// Exam view
// ---------------------------------------------------------------------------

function enterExam() {
  showView('view-exam');
  startTimer();
  renderQuestion();
}

function startTimer() {
  clearInterval(state.timerHandle);
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

function renderQuestion() {
  const q = state.flatQuestions[state.currentIndex];
  const total = state.flatQuestions.length;

  qs('progressDisplay').textContent = `Question ${state.currentIndex + 1} of ${total}`;
  qs('scenarioTag').textContent = q.scenarioTitle;
  qs('questionStem').innerHTML = renderInline(q.stem);
  qs('selectHint').textContent = q.selectCount > 1 ? `Select exactly ${q.selectCount}` : '';
  qs('selectHint').hidden = q.selectCount <= 1;

  const list = qs('choicesList');
  list.innerHTML = '';
  const selected = new Set(state.answers[q.number] || []);
  const isMulti = q.selectCount > 1;

  for (const letter of ['A', 'B', 'C', 'D']) {
    const label = document.createElement('label');
    label.className = 'choice-row';

    const input = document.createElement('input');
    input.type = isMulti ? 'checkbox' : 'radio';
    input.name = 'choice';
    input.value = letter;
    input.checked = selected.has(letter);
    if (isMulti && !input.checked && selected.size >= q.selectCount) {
      input.disabled = true;
    }
    input.addEventListener('change', () => onChoiceChange(q, letter, isMulti));

    const letterSpan = document.createElement('span');
    letterSpan.className = 'choice-letter';
    letterSpan.textContent = letter;

    const textSpan = document.createElement('span');
    textSpan.className = 'choice-text';
    textSpan.innerHTML = renderInline(q.choices[letter]);

    label.append(input, letterSpan, textSpan);
    list.appendChild(label);
  }

  qs('prevBtn').disabled = state.currentIndex === 0;
  qs('nextBtn').disabled = state.currentIndex === total - 1;

  renderPaletteGrid();
}

function onChoiceChange(q, letter, isMulti) {
  const current = new Set(state.answers[q.number] || []);
  if (isMulti) {
    if (current.has(letter)) current.delete(letter);
    else current.add(letter);
  } else {
    current.clear();
    current.add(letter);
  }
  state.answers[q.number] = Array.from(current);
  saveProgress();
  renderQuestion();
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
  state.flatQuestions.forEach((q, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = String(i + 1);
    btn.className = 'palette-btn';
    if (i === state.currentIndex) btn.classList.add('palette-current');
    if ((state.answers[q.number] || []).length > 0) btn.classList.add('palette-answered');
    btn.addEventListener('click', () => jumpTo(i));
    grid.appendChild(btn);
  });
}

// ---------------------------------------------------------------------------
// Submit + grading
// ---------------------------------------------------------------------------

function submitExam(auto) {
  if (!auto) {
    const answeredCount = Object.keys(state.answers).filter((k) => state.answers[k].length > 0).length;
    const unanswered = state.flatQuestions.length - answeredCount;
    if (unanswered > 0) {
      const ok = confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`);
      if (!ok) return;
    }
  }

  clearInterval(state.timerHandle);
  clearSavedProgress(state.examId);

  const scenarioStats = new Map(); // title -> {correct, total}
  const domainStats = new Map(); // domain -> {correct, total}
  const reviewItems = [];
  let correctCount = 0;
  let gradedCount = 0;
  let ungradedCount = 0;

  for (const q of state.flatQuestions) {
    const key = state.answerKey.get(q.number);
    const userLetters = (state.answers[q.number] || []).slice().sort();

    if (!key) {
      ungradedCount += 1;
      reviewItems.push({ q, userLetters, key: null, isCorrect: null });
      continue;
    }

    const correctLetters = key.letters.slice().sort();
    const isCorrect =
      userLetters.length === correctLetters.length && userLetters.every((l, i) => l === correctLetters[i]);

    gradedCount += 1;
    if (isCorrect) correctCount += 1;

    if (!scenarioStats.has(q.scenarioTitle)) scenarioStats.set(q.scenarioTitle, { correct: 0, total: 0 });
    const sStat = scenarioStats.get(q.scenarioTitle);
    sStat.total += 1;
    if (isCorrect) sStat.correct += 1;

    for (const d of key.domain.split(/[,/]/).map((s) => s.trim()).filter(Boolean)) {
      if (!domainStats.has(d)) domainStats.set(d, { correct: 0, total: 0 });
      const dStat = domainStats.get(d);
      dStat.total += 1;
      if (isCorrect) dStat.correct += 1;
    }

    reviewItems.push({ q, userLetters, key, isCorrect });
  }

  renderResults({ correctCount, gradedCount, ungradedCount, scenarioStats, domainStats, reviewItems });
}

function renderResults({ correctCount, gradedCount, ungradedCount, scenarioStats, domainStats, reviewItems }) {
  showView('view-results');

  const pct = gradedCount > 0 ? Math.round((correctCount / gradedCount) * 100) : 0;
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
    row.innerHTML = `<td>${escapeHtml(domain)}</td><td>${stat.correct} / ${stat.total}</td><td>${p}%</td>`;
    domainTable.appendChild(row);
  }

  const reviewList = qs('reviewList');
  reviewList.innerHTML = '';
  let lastScenario = null;
  for (const item of reviewItems) {
    if (item.q.scenarioTitle !== lastScenario) {
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
      : '<em>No written rationale available for this practice set — check the domain tag and the matching study-guide chapter.</em>';
    const domainBadge = item.key ? escapeHtml(item.key.domain) : '';

    card.innerHTML = `
      <div class="review-item-head">
        <span class="review-q-number">Q${item.q.number}</span>
        <span class="review-badge">${item.isCorrect === null ? 'UNGRADED' : item.isCorrect ? 'Correct' : 'Incorrect'}</span>
        ${domainBadge ? `<span class="review-domain">${domainBadge}</span>` : ''}
      </div>
      <div class="review-stem">${renderInline(item.q.stem)}</div>
      <div class="review-answers">
        <span>Your answer: <strong>${escapeHtml(userText)}</strong></span>
        <span>Correct answer: <strong>${escapeHtml(correctText)}</strong></span>
      </div>
      <div class="review-rationale">${rationale}</div>
    `;
    reviewList.appendChild(card);
  }
}

function retakeExam() {
  const examId = state.examId;
  clearSavedProgress(examId);
  startLoadExam(examId);
}

function chooseAnotherExam() {
  showView('view-start');
  qs('loadStatus').hidden = true;
  qs('filePickerPanel').hidden = true;
}

// ---------------------------------------------------------------------------
// Wire up
// ---------------------------------------------------------------------------

function init() {
  renderExamGrid();

  qs('questionsFileInput').addEventListener('change', checkFilePickerReady);
  qs('answersFileInput').addEventListener('change', checkFilePickerReady);
  qs('loadFilesBtn').addEventListener('click', loadFromFilePicker);

  qs('startFreshBtn').addEventListener('click', startFresh);
  qs('resumeBtn').addEventListener('click', resumeSaved);
  qs('discardResumeBtn').addEventListener('click', discardSaved);
  qs('backToGridBtn').addEventListener('click', chooseAnotherExam);

  qs('prevBtn').addEventListener('click', goPrev);
  qs('nextBtn').addEventListener('click', goNext);
  qs('submitBtn').addEventListener('click', () => submitExam(false));

  qs('retakeBtn').addEventListener('click', retakeExam);
  qs('chooseAnotherBtn').addEventListener('click', chooseAnotherExam);

  window.addEventListener('beforeunload', saveProgress);

  document.addEventListener('keydown', (e) => {
    if (qs('view-exam').hidden) return;
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
  });
}

document.addEventListener('DOMContentLoaded', init);
