// dashboard.js — Tests page: split-pane list + detail
(function () {
  let activeStatusCard = '';
  let filteredTests    = [];
  let selectedIndex    = -1;

  const searchInput  = document.getElementById('searchInput');
  const filterStatus = document.getElementById('filterStatus');
  const filterAuthor = document.getElementById('filterAuthor');
  const filterTag    = document.getElementById('filterTag');
  const btnReset     = document.getElementById('btnReset');
  const btnExport    = document.getElementById('btnExportTests');
  const resultCount  = document.getElementById('resultCount');
  const splitLeft    = document.getElementById('splitLeft');
  const splitRight   = document.getElementById('splitRight');
  const authorStatsBar  = document.getElementById('authorStatsBar');
  const authorStatsName = document.getElementById('authorStatsName');
  const authorStatPass  = document.getElementById('authorStatPass');
  const authorStatFail  = document.getElementById('authorStatFail');
  const authorStatSkip  = document.getElementById('authorStatSkip');
  const authorStatPct   = document.getElementById('authorStatPct');

  function populateSelect(sel, values, placeholder) {
    sel.innerHTML = `<option value="">${placeholder}</option>`;
    values.forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o); });
  }

  window.initDashboard = function () {
    const { tests } = window.REPORT;

    document.getElementById('numTotal').textContent = tests.length;
    document.getElementById('numPass').textContent  = tests.filter(t => t.status === 'pass').length;
    document.getElementById('numFail').textContent  = tests.filter(t => t.status === 'fail').length;
    document.getElementById('numSkip').textContent  = tests.filter(t => t.status === 'skip').length;

    populateSelect(filterAuthor, [...new Set(tests.map(t => t.author).filter(Boolean))].sort(), 'All Authors');
    populateSelect(filterTag,    [...new Set(tests.map(t => t.tag).filter(Boolean))].sort(),    'All Tags');

    activeStatusCard = '';
    selectedIndex    = -1;
    highlightCard();
    applyFilters();
  };

  // summary card clicks
  document.querySelectorAll('#testsPage .scard').forEach(card => {
    card.addEventListener('click', () => {
      const s = card.dataset.filterStatus;
      activeStatusCard = (activeStatusCard === s) ? '' : s;
      filterStatus.value = activeStatusCard;
      highlightCard();
      applyFilters();
    });
  });

  function highlightCard() {
    document.querySelectorAll('#testsPage .scard').forEach(c =>
      c.classList.toggle('active', c.dataset.filterStatus === activeStatusCard && activeStatusCard !== ''));
  }

  searchInput.addEventListener('input', applyFilters);
  filterStatus.addEventListener('change', () => { activeStatusCard = ''; highlightCard(); applyFilters(); });
  filterAuthor.addEventListener('change', applyFilters);
  filterTag.addEventListener('change', applyFilters);
  btnReset.addEventListener('click', () => {
    searchInput.value = ''; filterStatus.value = ''; filterAuthor.value = ''; filterTag.value = '';
    activeStatusCard = ''; highlightCard();
    authorStatsBar.classList.remove('visible');
    applyFilters();
  });
  btnExport.addEventListener('click', () => window.exportCSV(filteredTests, 'tests-export.csv'));

  function applyFilters() {
    const q      = searchInput.value.toLowerCase().trim();
    const status = filterStatus.value;
    const author = filterAuthor.value;
    const tag    = filterTag.value;

    filteredTests = window.REPORT.tests.filter(t => {
      if (status && t.status !== status) return false;
      if (author && t.author !== author) return false;
      if (tag    && t.tag    !== tag)    return false;
      if (q) {
        const inName  = t.name.toLowerCase().includes(q);
        const inSteps = t.steps.some(s => s.detail.toLowerCase().includes(q));
        if (!inName && !inSteps) return false;
      }
      return true;
    });

    resultCount.textContent = `${filteredTests.length} of ${window.REPORT.tests.length} tests`;
    updateAuthorStats(author);
    selectedIndex = -1;
    renderLeft(filteredTests, q);
    showNoSelection();
  }

  function updateAuthorStats(author) {
    if (!author) { authorStatsBar.classList.remove('visible'); return; }
    const tests = window.REPORT.tests.filter(t => t.author === author);
    const pass  = tests.filter(t => t.status === 'pass').length;
    const fail  = tests.filter(t => t.status === 'fail').length;
    const skip  = tests.filter(t => t.status === 'skip').length;
    const pct   = tests.length ? Math.round((pass / tests.length) * 100) : 0;
    authorStatsName.textContent = author;
    authorStatPass.textContent  = `${pass} pass`;
    authorStatFail.textContent  = `${fail} fail`;
    authorStatSkip.textContent  = `${skip} skip`;
    authorStatPct.textContent   = `${pct}% pass rate`;
    authorStatsBar.classList.add('visible');
  }

  function renderLeft(tests, q) {
    splitLeft.innerHTML = '';
    if (!tests.length) {
      splitLeft.innerHTML = `<div class="empty" style="padding:40px 10px"><p>No tests match.</p></div>`;
      return;
    }
    const frag = document.createDocumentFragment();
    tests.forEach((t, i) => {
      const row = document.createElement('div');
      row.className = `test-row status-${t.status}`;
      row.innerHTML = `
        <span class="badge-status ${t.status}">${t.status}</span>
        <div style="flex:1;min-width:0">
          <div class="tr-name">${hlText(escHtml(t.name), q)}</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:3px">
            ${t.author ? `<span class="chip author">👤 ${escHtml(t.author)}</span>` : ''}
            ${t.tag    ? `<span class="chip tag">🏷 ${escHtml(t.tag)}</span>`        : ''}
          </div>
        </div>`;
      row.addEventListener('click', () => selectTest(i, q));
      frag.appendChild(row);
    });
    splitLeft.appendChild(frag);
  }

  function selectTest(i, q) {
    selectedIndex = i;
    splitLeft.querySelectorAll('.test-row').forEach((r, idx) => r.classList.toggle('selected', idx === i));
    window.renderDetail(splitRight, filteredTests[i], q || searchInput.value.toLowerCase().trim());
  }

  function showNoSelection() {
    splitRight.innerHTML = `
      <div class="no-selection">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <p>Select a test to view step details</p>
      </div>`;
  }
})();
