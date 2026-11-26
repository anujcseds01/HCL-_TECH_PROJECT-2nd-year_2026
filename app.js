/**
 * COVID-19 Disease Trend Analysis | Main Application Controller
 * Coordinates Data Filtering, Interactive Dashboard, Charts, SQL Engine & Tabs
 * Author: Anuj Kumar Kushwaha (Roll No: 250321540033)
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Verify dataset availability
  if (!window.COVID_DATASET || window.COVID_DATASET.length === 0) {
    console.error('COVID_DATASET is not loaded. Please check js/data.js inclusion.');
    return;
  }

  const allData = window.COVID_DATASET;

  // --- 1. FILTER CONTROLS & STATE ---
  const filterState = {
    country: 'All',
    continent: 'All',
    startDate: '2020-01-01',
    endDate: '2023-12-31'
  };

  const selCountry = document.getElementById('filter-country');
  const selRegion = document.getElementById('filter-region');
  const inputStartDate = document.getElementById('filter-start-date');
  const inputEndDate = document.getElementById('filter-end-date');
  const btnResetFilters = document.getElementById('btn-reset-filters');
  const presetChips = document.querySelectorAll('.preset-chip');
  const tableSearch = document.getElementById('table-search-input');

  // Populate Country dropdown dynamically from unique dataset countries
  if (selCountry) {
    const countries = [...new Set(allData.map(d => d.country))].filter(c => c !== 'Other Countries').sort();
    let opts = '<option value="All">All Countries (Global)</option>';
    countries.forEach(c => {
      opts += `<option value="${c}">${c}</option>`;
    });
    opts += '<option value="Other Countries">Other Countries</option>';
    selCountry.innerHTML = opts;
  }

  // Populate Continent/Region dropdown dynamically
  if (selRegion) {
    const regions = [...new Set(allData.map(d => d.continent))].filter(r => r !== 'Global').sort();
    let opts = '<option value="All">All Regions</option>';
    regions.forEach(r => {
      opts += `<option value="${r}">${r}</option>`;
    });
    selRegion.innerHTML = opts;
  }

  // Master Filter Trigger Function
  function applyFiltersAndUpdate() {
    filterState.country = selCountry ? selCountry.value : 'All';
    filterState.continent = selRegion ? selRegion.value : 'All';
    filterState.startDate = inputStartDate ? inputStartDate.value : '2020-01-01';
    filterState.endDate = inputEndDate ? inputEndDate.value : '2023-12-31';

    // 1. Filter raw dataset
    const filteredRows = window.DashboardEngine.filterDataset(allData, filterState);

    // Regional/Date scope (without country constraint) for country comparison
    const scopeRows = window.DashboardEngine.filterDataset(allData, {
      country: 'All',
      continent: filterState.continent,
      startDate: filterState.startDate,
      endDate: filterState.endDate
    });

    // 2. Compute dynamic KPIs
    const kpis = window.DashboardEngine.computeKPIs(filteredRows);
    window.DashboardEngine.updateKPIDOM(kpis);

    // 3. Generate dynamic data-driven insights
    window.DashboardEngine.generateDynamicInsights(filteredRows, kpis, filterState);

    // 4. Update all 7 Chart.js visualizations
    window.ChartsController.updateAllCharts(filteredRows, scopeRows, filterState.country);

    // 5. Update Country-Wise Summary Leaderboard Table
    if (window.DashboardEngine.renderCountrySummaryTable) {
      window.DashboardEngine.renderCountrySummaryTable(scopeRows, filterState.country);
    }

    // 6. Update preview data table
    const searchVal = tableSearch ? tableSearch.value.trim() : '';
    window.DashboardEngine.renderTable(filteredRows, searchVal);
  }

  // Event Listeners for Filters
  if (selCountry) selCountry.addEventListener('change', applyFiltersAndUpdate);
  if (selRegion) selRegion.addEventListener('change', applyFiltersAndUpdate);
  if (inputStartDate) inputStartDate.addEventListener('change', applyFiltersAndUpdate);
  if (inputEndDate) inputEndDate.addEventListener('change', applyFiltersAndUpdate);

  if (btnResetFilters) {
    btnResetFilters.addEventListener('click', () => {
      if (selCountry) selCountry.value = 'All';
      if (selRegion) selRegion.value = 'All';
      if (inputStartDate) inputStartDate.value = '2020-01-01';
      if (inputEndDate) inputEndDate.value = '2023-12-31';
      presetChips.forEach(c => c.classList.remove('active'));
      const defaultChip = document.querySelector('.preset-chip[data-preset="all"]');
      if (defaultChip) defaultChip.classList.add('active');
      applyFiltersAndUpdate();
    });
  }

  // Quick Date Preset Chips
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const preset = chip.getAttribute('data-preset');
      if (preset === 'all') {
        inputStartDate.value = '2020-01-01';
        inputEndDate.value = '2023-12-31';
      } else if (preset === '2020') {
        inputStartDate.value = '2020-01-01';
        inputEndDate.value = '2020-12-31';
      } else if (preset === '2021') {
        inputStartDate.value = '2021-01-01';
        inputEndDate.value = '2021-12-31';
      } else if (preset === '2022') {
        inputStartDate.value = '2022-01-01';
        inputEndDate.value = '2022-12-31';
      } else if (preset === '2023') {
        inputStartDate.value = '2023-01-01';
        inputEndDate.value = '2023-12-31';
      } else if (preset === 'delta') {
        inputStartDate.value = '2021-04-01';
        inputEndDate.value = '2021-06-30';
      } else if (preset === 'omicron') {
        inputStartDate.value = '2021-12-01';
        inputEndDate.value = '2022-03-31';
      }
      applyFiltersAndUpdate();
    });
  });

  // Table Search Listener
  if (tableSearch) {
    tableSearch.addEventListener('input', () => {
      const filteredRows = window.DashboardEngine.filterDataset(allData, filterState);
      window.DashboardEngine.renderTable(filteredRows, tableSearch.value.trim());
    });
  }

  // --- 2. TAB CONTROLLER ---
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(t => t.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetTab = document.getElementById(targetId);
      if (targetTab) {
        targetTab.classList.add('active');
      }

      // If switching to SQL tab and first time, auto-run default query
      if (targetId === 'tab-sql' && !window._sqlHasRun) {
        window._sqlHasRun = true;
        const btnExec = document.getElementById('btn-execute-sql');
        if (btnExec) btnExec.click();
      }
    });
  });

  // --- 3. SQL QUERY ENGINE UI CONTROLLER ---
  const sqlEditor = document.getElementById('sql-editor-input');
  const sqlPresetBtns = document.querySelectorAll('.sql-preset-btn');
  const sqlExplanation = document.getElementById('sql-explanation-text');
  const btnExecuteSQL = document.getElementById('btn-execute-sql');
  const btnClearResults = document.getElementById('btn-clear-results');
  const btnExportCSV = document.getElementById('btn-export-csv');
  const sqlStatusText = document.getElementById('sql-status-indicator');
  const resultsCount = document.getElementById('sql-results-count');
  const resultsTime = document.getElementById('sql-results-time');
  const resultsTable = document.getElementById('sql-output-table');

  // Load default preset query (1. Executive KPI Summary)
  if (sqlEditor && window.SQLEngine) {
    sqlEditor.value = window.SQLEngine.PRESET_QUERIES['1'].query;
    if (sqlExplanation) sqlExplanation.innerHTML = `<strong>Query Analysis:</strong> ${window.SQLEngine.PRESET_QUERIES['1'].explanation}`;
  }

  sqlPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sqlPresetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const qid = btn.getAttribute('data-qid');
      const preset = window.SQLEngine.PRESET_QUERIES[qid];
      if (preset && sqlEditor) {
        sqlEditor.value = preset.query;
        if (sqlExplanation) {
          sqlExplanation.innerHTML = `<strong>Query Analysis:</strong> ${preset.explanation}`;
        }
        // Auto execute for responsive experience
        executeCurrentSQL();
      }
    });
  });

  function executeCurrentSQL() {
    if (!sqlEditor || !window.SQLEngine) return;
    const query = sqlEditor.value;

    if (sqlStatusText) sqlStatusText.innerHTML = '<span style="color: #fbbf24;">⚡ Executing...</span>';

    setTimeout(() => {
      const res = window.SQLEngine.executeSQL(query, allData);

      if (!res.success) {
        if (sqlStatusText) sqlStatusText.innerHTML = `<span style="color: #ef4444;">❌ Query Error</span>`;
        if (resultsCount) resultsCount.textContent = '0 rows';
        if (resultsTime) resultsTime.textContent = `${res.executionTimeMs || 0} ms`;
        renderSQLTableError(res.error);
        return;
      }

      if (sqlStatusText) sqlStatusText.innerHTML = `<span style="color: #10b981;">✓ Query Executed Successfully</span>`;
      if (resultsCount) resultsCount.textContent = `${res.rowCount} row${res.rowCount === 1 ? '' : 's'}`;
      if (resultsTime) resultsTime.textContent = `${res.executionTimeMs} ms`;

      renderSQLTableResults(res.data);
    }, 10);
  }

  function renderSQLTableResults(rows) {
    if (!resultsTable) return;
    const thead = resultsTable.querySelector('thead');
    const tbody = resultsTable.querySelector('tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (!rows || rows.length === 0) {
      tbody.innerHTML = '<tr><td style="padding: 18px; color: var(--text-muted); text-align: center;">Query returned 0 rows.</td></tr>';
      return;
    }

    const columns = Object.keys(rows[0]);
    const trHead = document.createElement('tr');
    columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    rows.forEach(r => {
      const tr = document.createElement('tr');
      columns.forEach(col => {
        const td = document.createElement('td');
        const val = r[col];
        td.textContent = typeof val === 'number' ? val.toLocaleString() : (val !== null ? val : 'NULL');
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function renderSQLTableError(errMessage) {
    if (!resultsTable) return;
    const thead = resultsTable.querySelector('thead');
    const tbody = resultsTable.querySelector('tbody');
    thead.innerHTML = '';
    tbody.innerHTML = `<tr><td style="padding: 18px; color: #ef4444; background: rgba(239,68,68,0.1);"><strong style="color: #fca5a5;">Syntax Error:</strong> ${errMessage}</td></tr>`;
  }

  if (btnExecuteSQL) btnExecuteSQL.addEventListener('click', executeCurrentSQL);

  if (btnClearResults) {
    btnClearResults.addEventListener('click', () => {
      if (resultsTable) {
        resultsTable.querySelector('thead').innerHTML = '';
        resultsTable.querySelector('tbody').innerHTML = '<tr><td style="padding: 18px; color: var(--text-dim); text-align: center;">Results cleared.</td></tr>';
      }
      if (resultsCount) resultsCount.textContent = '0 rows';
      if (resultsTime) resultsTime.textContent = '0 ms';
      if (sqlStatusText) sqlStatusText.textContent = 'Ready';
    });
  }

  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', () => {
      window.SQLEngine.exportResultsToCSV('covid_sql_query_results.csv');
    });
  }

  // --- 4. INITIALIZE DASHBOARD & DATA QUALITY ---
  window.DashboardEngine.renderDataQualityAudit();
  applyFiltersAndUpdate();
});
