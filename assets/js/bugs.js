// bugs.js — Failures page (complete rewrite for reliable scroll)
(function () {
  const bugSearch = document.getElementById('bugSearch');
  const bugFilter = document.getElementById('bugFilterCat');
  const bugReset  = document.getElementById('bugReset');
  const bugCount  = document.getElementById('bugCount');
  const btnExport = document.getElementById('btnExportFailures');
  const btnGrid   = document.getElementById('failBtnGrid');
  const btnList   = document.getElementById('failBtnList');
  const failLeft  = document.getElementById('failLeft');
  const failRight = document.getElementById('failRight');

  let allBugs  = [];
  let viewMode = 'list';

  function extractCategory(detail) {
    const m = detail.match(/([A-Za-z.]+Exception[A-Za-z]*|[A-Za-z.]+Error[A-Za-z]*)/);
    if (m) return m[1].split('.').pop();
    if (detail.toLowerCase().includes('timeout'))         return 'TimeoutException';
    if (detail.toLowerCase().includes('no such element')) return 'NoSuchElementException';
    if (detail.toLowerCase().includes('stale'))           return 'StaleElementException';
    if (detail.toLowerCase().includes('assertion'))       return 'AssertionError';
    return 'OtherFailure';
  }

  window.initBugs = function () {
    // Full reset — clear previous data and DOM
    allBugs = [];
    failLeft.innerHTML  = '';
    failRight.innerHTML = '';
    bugSearch.value     = '';
    bugFilter.value     = '';
    bugFilter.innerHTML = '<option value="">All Categories</option>';
    bugCount.textContent = '';
    showNoSelection();
    
    const { tests } = window.REPORT;
    allBugs = [];
    tests.forEach(t => {
      if (t.status !== 'fail') return;
      const failStep = t.steps.find(s => s.stepStatus === 'fail' && s.detail.trim());
      const detail   = failStep ? failStep.detail : '';
      const category = extractCategory(detail);
      const message  = detail.split('\n')[0].replace(/^Fail/i, '').trim().substring(0, 200);
      allBugs.push({ category, tcName: t.name, author: t.author, tag: t.tag, message, _test: t });
    });

    const cats = [...new Set(allBugs.map(b => b.category))].sort();
    bugFilter.innerHTML = `<option value="">All Categories</option>`;
    cats.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; bugFilter.appendChild(o); });

    applyFilters();
  };

  bugSearch.addEventListener('input', applyFilters);
  bugFilter.addEventListener('change', applyFilters);
  bugReset.addEventListener('click', () => { bugSearch.value = ''; bugFilter.value = ''; applyFilters(); });
  btnExport.addEventListener('click', () => window.exportCSV(getFiltered().map(b => b._test), 'failures-export.csv'));
  btnGrid.addEventListener('click', () => { viewMode = 'grid'; applyFilters(); });
  btnList.addEventListener('click', () => { viewMode = 'list'; applyFilters(); });

  function getFiltered() {
    const q   = bugSearch.value.toLowerCase().trim();
    const cat = bugFilter.value;
    return allBugs.filter(b => {
      if (cat && b.category !== cat) return false;
      if (q && !b.tcName.toLowerCase().includes(q) && !b.message.toLowerCase().includes(q) && !(b.author||'').toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function applyFilters() {
    btnGrid.classList.toggle('active', viewMode === 'grid');
    btnList.classList.toggle('active', viewMode === 'list');
    const bugs = getFiltered();
    bugCount.textContent = `${bugs.length} failures`;
    renderLeft(bugs);
    showNoSelection();
  }

  function renderLeft(bugs) {
    // Clear by replacing innerHTML — avoids any stale event listeners
    failLeft.innerHTML = '';

    if (!bugs.length) {
      failLeft.innerHTML = `<div class="empty"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><p>No failures found.</p></div>`;
      return;
    }

    // Group by category
    const grouped = {};
    bugs.forEach(b => { if (!grouped[b.category]) grouped[b.category] = []; grouped[b.category].push(b); });

    if (viewMode === 'grid') {
      // Summary cards row
      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;padding:10px 0 6px';
      Object.keys(grouped).sort().forEach(cat => {
        const items = grouped[cat];
        const card  = document.createElement('div');
        card.className = 'group-card';
        card.style.cursor = 'default';
        card.innerHTML = `
          <h3>⚠️ ${escHtml(cat)}</h3>
          <div class="group-stats"><span class="stat-pill fail">${items.length} failure${items.length > 1 ? 's' : ''}</span></div>
          <div style="font-size:.72rem;color:var(--muted);margin-top:5px">
            ${items.slice(0, 3).map(b => `<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(b.tcName)}</div>`).join('')}
            ${items.length > 3 ? `<div style="color:var(--accent)">+${items.length - 3} more</div>` : ''}
          </div>`;
        grid.appendChild(card);
      });
      failLeft.appendChild(grid);
    }

    // Collapsible list (always rendered, in both modes)
    const frag = document.createDocumentFragment();
    Object.keys(grouped).sort().forEach(cat => {
      const items = grouped[cat];

      const wrap = document.createElement('div');
      wrap.className = 'fail-category';

      const hdr = document.createElement('div');
      hdr.className = 'fail-cat-header';
      const chevron = document.createElement('span');
      chevron.className = 'chevron-icon';
      chevron.textContent = '▶';
      const title = document.createElement('span');
      title.className = 'fail-cat-title';
      title.textContent = `⚠️ ${cat}`;
      const badge = document.createElement('span');
      badge.className = 'fail-count';
      badge.textContent = `${items.length} failure${items.length > 1 ? 's' : ''}`;
      hdr.appendChild(chevron);
      hdr.appendChild(title);
      hdr.appendChild(badge);

      const list = document.createElement('div');
      list.className = 'fail-list';

      items.forEach(b => {
        const item = document.createElement('div');
        item.className = 'fail-item';
        item.style.cursor = 'pointer';

        const tc = document.createElement('div');
        tc.className = 'fail-tc';
        tc.innerHTML = `${escHtml(b.tcName)}
          ${b.author ? `<span class="chip author">👤 ${escHtml(b.author)}</span>` : ''}
          ${b.tag    ? `<span class="chip tag">🏷 ${escHtml(b.tag)}</span>`       : ''}`;

        const msg = document.createElement('div');
        msg.className = 'fail-msg';
        msg.textContent = b.message;

        item.appendChild(tc);
        item.appendChild(msg);

        item.addEventListener('click', () => {
          failLeft.querySelectorAll('.fail-item').forEach(el => el.style.background = '');
          item.style.background = 'rgba(56,189,248,.07)';
          window.renderDetail(failRight, b._test, '');
        });

        list.appendChild(item);
      });

      hdr.addEventListener('click', () => {
        const open = wrap.classList.toggle('open');
        chevron.textContent = open ? '▼' : '▶';
      });

      wrap.appendChild(hdr);
      wrap.appendChild(list);
      frag.appendChild(wrap);
    });
    failLeft.appendChild(frag);
  }

  function showNoSelection() {
    failRight.innerHTML = `<div class="no-selection"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg><p>Click a failure to view step details</p></div>`;
  }
})();
