// authors.js — 3-column: pie | author cards | test list + detail
(function () {
  let authorMap     = {};
  let currentTests  = [];
  let filteredDrill = [];
  let selectedCard  = null;

  window.initAuthors = function () {
    // Resolve elements here — guaranteed to exist and be in a live document
    const chartSection  = document.getElementById('authorChartSection');
    const cardList      = document.getElementById('authorCardList');
    const rightTitle    = document.getElementById('authorRightTitle');
    const rightControls = document.getElementById('authorRightControls');
    const drillLeft     = document.getElementById('authorDrillLeft');
    const drillRight    = document.getElementById('authorDrillRight');
    const searchA       = document.getElementById('authorSearch');
    const filterStatusA = document.getElementById('authorFilterStatus');
    const btnResetA     = document.getElementById('authorResetFilter');
    const btnExportA    = document.getElementById('btnExportAuthor');
    const drillCount    = document.getElementById('authorDrillCount');

    if (!cardList || !chartSection) return; // safety guard

    const { tests } = window.REPORT;
    authorMap = {};
    tests.forEach(t => {
      if (!t.author) return;
      if (!authorMap[t.author]) authorMap[t.author] = { pass: 0, fail: 0, skip: 0, tests: [] };
      authorMap[t.author][t.status] = (authorMap[t.author][t.status] || 0) + 1;
      authorMap[t.author].tests.push(t);
    });

    const pass = tests.filter(t => t.status === 'pass').length;
    const fail = tests.filter(t => t.status === 'fail').length;
    const skip = tests.filter(t => t.status === 'skip').length;
    window.buildPie(pass, fail, skip, chartSection);

    // Render author cards
    cardList.innerHTML = '';
    const frag = document.createDocumentFragment();
    Object.keys(authorMap).sort().forEach(author => {
      const d   = authorMap[author];
      const tot = d.tests.length;
      const pct = Math.round(((d.pass || 0) / tot) * 100);
      const card = document.createElement('div');
      card.className = 'group-card-compact';
      card.innerHTML = `
        <h4>👤 ${escHtml(author)}</h4>
        <div class="gcc-stats">
          <span class="stat-pill total">${tot}</span>
          <span class="stat-pill pass">${d.pass||0} ✓</span>
          <span class="stat-pill fail">${d.fail||0} ✗</span>
          <span class="stat-pill skip">${d.skip||0} ⊘</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="pct-label">${pct}% pass rate</div>`;
      card.addEventListener('click', () => {
        if (selectedCard) selectedCard.classList.remove('selected');
        card.classList.add('selected');
        selectedCard = card;
        openDrill(author, d.tests);
      });
      frag.appendChild(card);
    });
    cardList.appendChild(frag);

    // Wire up filter controls (safe — elements are live now)
    searchA.addEventListener('input', filterDrill);
    filterStatusA.addEventListener('change', filterDrill);
    btnResetA.addEventListener('click', () => { searchA.value = ''; filterStatusA.value = ''; filterDrill(); });
    if (btnExportA) btnExportA.addEventListener('click', () => window.exportCSV(filteredDrill, 'author-export.csv'));

    function openDrill(author, tests) {
      currentTests  = tests;
      filteredDrill = tests;
      rightTitle.textContent = `👤 ${author} — ${tests.length} tests`;
      rightControls.style.display = 'flex';
      searchA.value = '';
      filterStatusA.value = '';
      renderDrillLeft(tests, '');
      showNoSelection(drillRight);
    }

    function filterDrill() {
      const q = searchA.value.toLowerCase().trim();
      const s = filterStatusA.value;
      filteredDrill = currentTests.filter(t => {
        if (s && t.status !== s) return false;
        if (q && !t.name.toLowerCase().includes(q) && !t.steps.some(st => st.detail.toLowerCase().includes(q))) return false;
        return true;
      });
      renderDrillLeft(filteredDrill, q);
      showNoSelection(drillRight);
    }

    function renderDrillLeft(tests, q) {
      drillCount.textContent = `${tests.length} tests`;
      drillLeft.innerHTML = '';
      if (!tests.length) {
        drillLeft.innerHTML = `<div class="empty" style="padding:20px 8px"><p>No tests match.</p></div>`;
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
            ${t.tag ? `<div style="margin-top:2px"><span class="chip tag">🏷 ${escHtml(t.tag)}</span></div>` : ''}
          </div>`;
        row.addEventListener('click', () => {
          drillLeft.querySelectorAll('.test-row').forEach((r, idx) => r.classList.toggle('selected', idx === i));
          window.renderDetail(drillRight, t, q);
        });
        frag.appendChild(row);
      });
      drillLeft.appendChild(frag);
    }

    function showNoSelection(el) {
      el.innerHTML = `<div class="no-selection"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg><p>Select a test to view details</p></div>`;
    }
  };
})();
