// tags.js — 3-column: pie | tag cards | test list + detail
(function () {
  const chartSection   = document.getElementById('tagChartSection');
  const cardList       = document.getElementById('tagCardList');
  const rightTitle     = document.getElementById('tagRightTitle');
  const rightControls  = document.getElementById('tagRightControls');
  const drillLeft      = document.getElementById('tagDrillLeft');
  const drillRight     = document.getElementById('tagDrillRight');
  const searchT        = document.getElementById('tagSearch');
  const filterStatusT  = document.getElementById('tagFilterStatus');
  const btnResetT      = document.getElementById('tagResetFilter');
  const btnExportT     = document.getElementById('btnExportTag');
  const drillCount     = document.getElementById('tagDrillCount');

  let tagMap        = {};
  let currentTests  = [];
  let filteredDrill = [];
  let selectedCard  = null;

  window.initTags = function () {
    // Full reset — clear all previous data and DOM
    tagMap        = {};
    currentTests  = [];
    filteredDrill = [];
    selectedCard  = null;
    cardList.innerHTML     = '';
    drillLeft.innerHTML    = '';
    chartSection.innerHTML = '';
    rightTitle.textContent = 'Select a tag';
    rightControls.style.display = 'none';
    showNoSelection(drillRight);
    
    const { tests } = window.REPORT;
    tagMap = {};
    tests.forEach(t => {
      if (!t.tag) return;
      if (!tagMap[t.tag]) tagMap[t.tag] = { pass: 0, fail: 0, skip: 0, tests: [] };
      tagMap[t.tag][t.status] = (tagMap[t.tag][t.status] || 0) + 1;
      tagMap[t.tag].tests.push(t);
    });

    const pass = tests.filter(t => t.status === 'pass').length;
    const fail = tests.filter(t => t.status === 'fail').length;
    const skip = tests.filter(t => t.status === 'skip').length;
    window.buildPie(pass, fail, skip, chartSection);

    renderCards();
  };

  function renderCards() {
    cardList.innerHTML = '';
    const frag = document.createDocumentFragment();
    Object.keys(tagMap).sort().forEach(tag => {
      const d   = tagMap[tag];
      const tot = d.tests.length;
      const pct = Math.round(((d.pass || 0) / tot) * 100);
      const card = document.createElement('div');
      card.className = 'group-card-compact';
      card.innerHTML = `
        <h4>🏷 ${escHtml(tag)}</h4>
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
        openDrill(tag, d.tests);
      });
      frag.appendChild(card);
    });
    cardList.appendChild(frag);
  }

  function openDrill(tag, tests) {
    currentTests  = tests;
    filteredDrill = tests;
    rightTitle.textContent = `🏷 ${tag} — ${tests.length} tests`;
    rightControls.style.display = 'flex';
    searchT.value = '';
    filterStatusT.value = '';
    renderDrillLeft(tests, '');
    showNoSelection(drillRight);
  }

  if (searchT)       searchT.addEventListener('input', filterDrill);
  if (filterStatusT) filterStatusT.addEventListener('change', filterDrill);
  if (btnResetT)     btnResetT.addEventListener('click', () => { searchT.value = ''; filterStatusT.value = ''; filterDrill(); });
  if (btnExportT)    btnExportT.addEventListener('click', () => window.exportCSV(filteredDrill, 'tag-export.csv'));

  function filterDrill() {
    const q = searchT.value.toLowerCase().trim();
    const s = filterStatusT.value;
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
    if (!tests.length) { drillLeft.innerHTML = `<div class="empty" style="padding:20px 8px"><p>No tests match.</p></div>`; return; }
    const frag = document.createDocumentFragment();
    tests.forEach((t, i) => {
      const row = document.createElement('div');
      row.className = `test-row status-${t.status}`;
      row.innerHTML = `
        <span class="badge-status ${t.status}">${t.status}</span>
        <div style="flex:1;min-width:0">
          <div class="tr-name">${hlText(escHtml(t.name), q)}</div>
          ${t.author ? `<div style="margin-top:2px"><span class="chip author">👤 ${escHtml(t.author)}</span></div>` : ''}
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
})();
