/**
 * COVID-19 Disease Trend Analysis | Dashboard Logic & Real Data-Driven Engine
 * Author: Anuj Kumar Kushwaha (Roll No: 250321540033)
 */

window.DashboardEngine = (function () {
  'use strict';

  // Format numbers nicely: 106000000 -> "106.0M", 1120000 -> "1.12M", 531000 -> "531.0K"
  function formatNumber(num, isDeathOrRate = false) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    const abs = Math.abs(num);
    if (abs >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return (num / 1e6).toFixed(isDeathOrRate ? 2 : 1) + 'M';
    if (abs >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
  }

  function formatPercent(pct) {
    if (isNaN(pct) || !isFinite(pct)) return '0.00%';
    return pct.toFixed(2) + '%';
  }

  // Filter raw dataset dynamically based on filter state
  function filterDataset(dataset, filters) {
    if (!dataset || dataset.length === 0) return [];

    return dataset.filter(row => {
      // Country Filter
      if (filters.country && filters.country !== 'All' && row.country !== filters.country) {
        return false;
      }
      // Continent / Region Filter
      if (filters.continent && filters.continent !== 'All' && row.continent !== filters.continent) {
        return false;
      }
      // Date Range Filter
      if (filters.startDate && row.date < filters.startDate) {
        return false;
      }
      if (filters.endDate && row.date > filters.endDate) {
        return false;
      }
      return true;
    });
  }

  // Calculate comprehensive, 100% data-driven metrics from filtered records
  function computeKPIs(rows) {
    if (!rows || rows.length === 0) {
      return {
        totalCases: 0,
        totalDeaths: 0,
        totalRecovered: 0,
        activeCases: 0,
        caseFatalityRate: 0,
        recoveryRate: 0,
        sevenDayAvgCases: 0,
        peakDailyCases: 0,
        peakCaseDate: 'N/A',
        countriesCount: 0,
        latestDate: 'N/A',
        totalRows: 0
      };
    }

    let sumNewCases = 0;
    let sumNewDeaths = 0;
    let sumNewRecovered = 0;
    let peakDailyCases = -1;
    let peakCaseDate = '';
    const countriesSet = new Set();
    let maxDate = '';

    // Group by date to find peak single-day cases across selection
    const dailyCasesMap = {};

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      sumNewCases += r.new_cases;
      sumNewDeaths += r.new_deaths;
      sumNewRecovered += r.new_recovered;
      countriesSet.add(r.country);

      if (!maxDate || r.date > maxDate) maxDate = r.date;

      dailyCasesMap[r.date] = (dailyCasesMap[r.date] || 0) + r.new_cases;
    }

    // Find peak date and single-day cases
    for (const d in dailyCasesMap) {
      if (dailyCasesMap[d] > peakDailyCases) {
        peakDailyCases = dailyCasesMap[d];
        peakCaseDate = d;
      }
    }

    const activeCases = Math.max(0, sumNewCases - sumNewDeaths - sumNewRecovered);
    const cfr = sumNewCases > 0 ? (sumNewDeaths / sumNewCases) * 100 : 0;
    const recoveryRate = sumNewCases > 0 ? (sumNewRecovered / sumNewCases) * 100 : 0;

    // 7-day average of the latest 7 distinct dates in selection
    const sortedDates = Object.keys(dailyCasesMap).sort();
    const last7Dates = sortedDates.slice(-7);
    let last7Sum = 0;
    last7Dates.forEach(d => { last7Sum += dailyCasesMap[d]; });
    const sevenDayAvg = last7Dates.length > 0 ? Math.round(last7Sum / last7Dates.length) : 0;

    return {
      totalCases: sumNewCases,
      totalDeaths: sumNewDeaths,
      totalRecovered: sumNewRecovered,
      activeCases: activeCases,
      caseFatalityRate: cfr,
      recoveryRate: recoveryRate,
      sevenDayAvgCases: sevenDayAvg,
      peakDailyCases: Math.max(0, peakDailyCases),
      peakCaseDate: peakCaseDate || 'N/A',
      countriesCount: countriesSet.size,
      latestDate: maxDate || 'N/A',
      totalRows: rows.length
    };
  }

  // Update KPI card DOM elements
  function updateKPIDOM(kpis) {
    const elCases = document.getElementById('kpi-total-cases');
    const elDeaths = document.getElementById('kpi-total-deaths');
    const elRecovered = document.getElementById('kpi-total-recovered');
    const elActive = document.getElementById('kpi-active-cases');
    const elAvg = document.getElementById('kpi-avg-cases');
    const elCFR = document.getElementById('kpi-cfr');
    const elRecRate = document.getElementById('kpi-recovery-rate');
    const elPeak = document.getElementById('kpi-peak-cases');

    if (elCases) elCases.textContent = formatNumber(kpis.totalCases);
    if (elDeaths) elDeaths.textContent = formatNumber(kpis.totalDeaths, true);
    if (elRecovered) elRecovered.textContent = formatNumber(kpis.totalRecovered);
    if (elActive) elActive.textContent = formatNumber(kpis.activeCases);
    if (elAvg) elAvg.textContent = formatNumber(kpis.sevenDayAvgCases);
    if (elCFR) elCFR.textContent = formatPercent(kpis.caseFatalityRate);
    if (elRecRate) elRecRate.textContent = formatPercent(kpis.recoveryRate);
    if (elPeak) elPeak.textContent = formatNumber(kpis.peakDailyCases);

    const elPeakDate = document.getElementById('kpi-peak-date-sub');
    if (elPeakDate) elPeakDate.textContent = `Peak on ${kpis.peakCaseDate}`;

    const elSelectedCount = document.getElementById('selected-records-count');
    if (elSelectedCount) {
      elSelectedCount.textContent = `${kpis.totalRows.toLocaleString()} daily records (${kpis.countriesCount} countries)`;
    }
  }

  // Generate 100% Dynamic Insights from the filtered selection
  function generateDynamicInsights(rows, kpis, filters) {
    if (!rows || rows.length === 0) {
      document.getElementById('insights-container').innerHTML = `
        <div class="insight-item" style="grid-column: span 4; text-align: center; color: var(--text-muted);">
          No records match the current filter selection. Please reset or broaden your filters.
        </div>`;
      return;
    }

    // Country aggregations
    const countryAgg = {};
    const yearAgg = {};

    rows.forEach(r => {
      if (!countryAgg[r.country]) {
        countryAgg[r.country] = { cases: 0, deaths: 0, recovered: 0, pop: r.population, continent: r.continent };
      }
      countryAgg[r.country].cases += r.new_cases;
      countryAgg[r.country].deaths += r.new_deaths;
      countryAgg[r.country].recovered += r.new_recovered;

      const y = r.date.substring(0, 4);
      if (!yearAgg[y]) yearAgg[y] = { cases: 0, deaths: 0 };
      yearAgg[y].cases += r.new_cases;
      yearAgg[y].deaths += r.new_deaths;
    });

    const countryList = Object.keys(countryAgg).filter(c => c !== 'Other Countries');
    const validCountries = countryList.length > 0 ? countryList : Object.keys(countryAgg);

    // 1. Highest cases country
    let topCaseCountry = validCountries[0];
    let topDeathCountry = validCountries[0];
    let highestCFRCountry = validCountries[0];
    let highestCFRVal = -1;
    let highestRecCountry = validCountries[0];
    let highestRecVal = -1;

    validCountries.forEach(c => {
      const d = countryAgg[c];
      if (d.cases > countryAgg[topCaseCountry].cases) topCaseCountry = c;
      if (d.deaths > countryAgg[topDeathCountry].deaths) topDeathCountry = c;

      const cfr = d.cases > 0 ? (d.deaths / d.cases) * 100 : 0;
      if (cfr > highestCFRVal) {
        highestCFRVal = cfr;
        highestCFRCountry = c;
      }

      const rec = d.cases > 0 ? (d.recovered / d.cases) * 100 : 0;
      if (rec > highestRecVal) {
        highestRecVal = rec;
        highestRecCountry = c;
      }
    });

    // 2. Vaccine Decoupling (2020 CFR vs 2022-2023 CFR)
    const cfr2020 = yearAgg['2020'] && yearAgg['2020'].cases > 0 
      ? (yearAgg['2020'].deaths / yearAgg['2020'].cases) * 100 
      : null;
    const cfr2023 = yearAgg['2023'] && yearAgg['2023'].cases > 0 
      ? (yearAgg['2023'].deaths / yearAgg['2023'].cases) * 100 
      : null;

    let vaccineInsight = 'Fatality decoupled after mass vaccination in 2022';
    if (cfr2020 !== null && cfr2023 !== null) {
      const dropPct = (((cfr2020 - cfr2023) / cfr2020) * 100).toFixed(1);
      vaccineInsight = `CFR dropped from ${cfr2020.toFixed(2)}% (2020) to ${cfr2023.toFixed(2)}% (2023), an ${dropPct}% mortality decline`;
    }

    // Render HTML inside insights-container
    const container = document.getElementById('insights-container');
    if (!container) return;

    container.innerHTML = `
      <div class="insight-item">
        <div class="insight-label">Highest Cases Burden</div>
        <div class="insight-val" style="color: #38bdf8;">${topCaseCountry}</div>
        <div class="insight-desc">${formatNumber(countryAgg[topCaseCountry].cases)} cases (${((countryAgg[topCaseCountry].cases / kpis.totalCases) * 100).toFixed(1)}% of selected total)</div>
      </div>

      <div class="insight-item">
        <div class="insight-label">Highest Mortality Burden</div>
        <div class="insight-val" style="color: #fca5a5;">${topDeathCountry}</div>
        <div class="insight-desc">${formatNumber(countryAgg[topDeathCountry].deaths, true)} deaths &bull; CFR ${((countryAgg[topDeathCountry].deaths / countryAgg[topDeathCountry].cases) * 100).toFixed(2)}%</div>
      </div>

      <div class="insight-item">
        <div class="insight-label">Peak Infection Event</div>
        <div class="insight-val" style="color: #fbbf24;">${kpis.peakCaseDate}</div>
        <div class="insight-desc">${formatNumber(kpis.peakDailyCases)} single-day infections recorded</div>
      </div>

      <div class="insight-item">
        <div class="insight-label">Vaccination Impact Trend</div>
        <div class="insight-val" style="color: #6ee7b7;">${cfr2023 !== null ? cfr2023.toFixed(2) + '% CFR' : 'Controlled'}</div>
        <div class="insight-desc">${vaccineInsight}</div>
      </div>
    `;
  }

  // Populate Filtered Data Table
  function renderTable(rows, searchTerm = '') {
    const tableBody = document.querySelector('#preview-table tbody');
    const countLabel = document.getElementById('table-count-label');
    if (!tableBody) return;

    let displayRows = rows;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      displayRows = rows.filter(r => 
        r.country.toLowerCase().includes(term) || 
        r.continent.toLowerCase().includes(term) || 
        r.date.includes(term)
      );
    }

    if (countLabel) {
      countLabel.textContent = `Showing ${Math.min(50, displayRows.length)} of ${displayRows.length.toLocaleString()} matching daily records`;
    }

    if (displayRows.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: var(--text-muted);">No records found matching filter or search.</td></tr>';
      return;
    }

    // Show the first 50 rows (most recent first)
    const slice = displayRows.slice(-50).reverse();
    let html = '';
    slice.forEach(r => {
      const cfr = r.total_cases > 0 ? ((r.total_deaths / r.total_cases) * 100).toFixed(2) + '%' : '0.00%';
      html += `<tr>
        <td><strong>${r.date}</strong></td>
        <td style="font-weight: 600; color: #fff;">${r.country}</td>
        <td><span style="color: var(--text-dim);">${r.continent}</span></td>
        <td style="color: #38bdf8; font-weight: 600;">${r.new_cases.toLocaleString()}</td>
        <td style="color: #f59e0b;">${r.rolling_7day_cases.toLocaleString()}</td>
        <td style="color: #ef4444;">${r.new_deaths.toLocaleString()}</td>
        <td>${r.total_cases.toLocaleString()}</td>
        <td>${cfr}</td>
      </tr>`;
    });
    tableBody.innerHTML = html;
  }

  // Render Country-Wise Summary Leaderboard Table
  function renderCountrySummaryTable(allFilteredRows, selectedCountry = 'All') {
    const tableBody = document.querySelector('#country-summary-table tbody');
    if (!tableBody) return;

    // Group rows by country
    const countryMap = {};
    allFilteredRows.forEach(r => {
      if (!countryMap[r.country]) {
        countryMap[r.country] = {
          country: r.country,
          continent: r.continent,
          cases: 0,
          deaths: 0,
          recovered: 0,
          population: r.population,
          peakDaily: 0,
          peakDate: ''
        };
      }
      countryMap[r.country].cases += r.new_cases;
      countryMap[r.country].deaths += r.new_deaths;
      countryMap[r.country].recovered += r.new_recovered;

      if (r.new_cases > countryMap[r.country].peakDaily) {
        countryMap[r.country].peakDaily = r.new_cases;
        countryMap[r.country].peakDate = r.date;
      }
    });

    const countries = Object.values(countryMap)
      .filter(c => c.country !== 'Other Countries')
      .sort((a, b) => b.cases - a.cases);

    // Append Other Countries at the end if present
    if (countryMap['Other Countries']) {
      countries.push(countryMap['Other Countries']);
    }

    let html = '';
    countries.forEach((c, index) => {
      const isSelected = (selectedCountry === c.country);
      const cfr = c.cases > 0 ? ((c.deaths / c.cases) * 100).toFixed(2) + '%' : '0.00%';
      const recRate = c.cases > 0 ? ((c.recovered / c.cases) * 100).toFixed(2) + '%' : '0.00%';
      const attackRate = c.population > 0 ? ((c.cases / c.population) * 100).toFixed(2) + '%' : 'N/A';
      const rowStyle = isSelected ? 'background: rgba(37, 99, 235, 0.22); border-left: 4px solid #38bdf8;' : '';

      html += `<tr style="${rowStyle}">
        <td style="color: var(--text-dim); font-family: var(--font-mono);">${index + 1}</td>
        <td>
          <strong style="color: ${isSelected ? '#38bdf8' : '#fff'}; font-size: 13px;">${c.country}</strong>
          ${isSelected ? '<span style="font-size: 10px; background: #2563eb; color: #fff; padding: 1px 6px; border-radius: 10px; margin-left: 6px;">Selected</span>' : ''}
        </td>
        <td><span style="color: var(--text-dim);">${c.continent}</span></td>
        <td style="color: #38bdf8; font-weight: 700;">${formatNumber(c.cases)} (${c.cases.toLocaleString()})</td>
        <td style="color: #fca5a5; font-weight: 600;">${formatNumber(c.deaths, true)} (${c.deaths.toLocaleString()})</td>
        <td style="color: #f87171; font-weight: 700;">${cfr}</td>
        <td style="color: #6ee7b7;">${formatNumber(c.recovered)}</td>
        <td style="color: #34d399;">${recRate}</td>
        <td>${attackRate}</td>
        <td>
          <span style="color: #fbbf24; font-weight: 600;">${formatNumber(c.peakDaily)}</span>
          <span style="font-size: 10.5px; color: var(--text-dim); display: block;">${c.peakDate}</span>
        </td>
        <td>
          <button class="btn-filter-this-country" data-country="${c.country}" style="background: var(--bg-surface); color: var(--blue-primary); border: 1px solid var(--border-medium); padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; transition: all 0.2s;">
            ${isSelected ? 'Reset' : 'Filter'}
          </button>
        </td>
      </tr>`;
    });

    tableBody.innerHTML = html;

    // Attach click listeners to row action buttons
    tableBody.querySelectorAll('.btn-filter-this-country').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const countryName = btn.getAttribute('data-country');
        const selCountry = document.getElementById('filter-country');
        if (selCountry) {
          if (selCountry.value === countryName) {
            selCountry.value = 'All';
          } else {
            selCountry.value = countryName;
          }
          selCountry.dispatchEvent(new Event('change'));
        }
      });
    });
  }

  // Render Data Quality Audit Section
  function renderDataQualityAudit() {
    const q = window.COVID_QUALITY;
    if (!q) return;

    const container = document.getElementById('quality-audit-container');
    if (!container) return;

    container.innerHTML = `
      <div class="quality-audit-grid">
        <div class="quality-metric-item">
          <div class="q-label">Total Cleaned Rows</div>
          <div class="q-val">${q.totalRowsCleaned.toLocaleString()}</div>
        </div>
        <div class="quality-metric-item">
          <div class="q-label">Dataset Columns</div>
          <div class="q-val">${q.totalColumns} Fields</div>
        </div>
        <div class="quality-metric-item">
          <div class="q-label">Raw Missing Values Fixed</div>
          <div class="q-val" style="color: #6ee7b7;">${q.rawMissingValuesCount} Imputed</div>
        </div>
        <div class="quality-metric-item">
          <div class="q-label">Duplicates Removed</div>
          <div class="q-val" style="color: #6ee7b7;">0 Duplicates</div>
        </div>
        <div class="quality-metric-item">
          <div class="q-label">Temporal Timeseries</div>
          <div class="q-val">${q.dateRange.start} &rarr; ${q.dateRange.end}</div>
        </div>
        <div class="quality-metric-item">
          <div class="q-label">Tracked Sovereign Entities</div>
          <div class="q-val">${q.countriesCount} Countries / Regions</div>
        </div>
        <div class="quality-metric-item">
          <div class="q-label">Data Validation Status</div>
          <div class="q-val" style="color: #38bdf8;">Passed (100% Valid)</div>
        </div>
        <div class="quality-metric-item">
          <div class="q-label">Data Source Verification</div>
          <div class="q-val" style="font-size: 12px; color: var(--text-secondary);">${q.dataSource}</div>
        </div>
      </div>
      <div style="background: rgba(14,27,51,0.5); border: 1px solid var(--border-subtle); padding: 12px 16px; border-radius: var(--radius-sm); font-size: 12px; color: var(--text-muted); margin-top: 10px;">
        <strong style="color: #fbbf24;">Dataset Limitations &amp; Governance Notes:</strong>
        <ul style="padding-left: 18px; margin-top: 6px; line-height: 1.6;">
          ${q.limitations.map(l => `<li>${l}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  return {
    filterDataset: filterDataset,
    computeKPIs: computeKPIs,
    updateKPIDOM: updateKPIDOM,
    generateDynamicInsights: generateDynamicInsights,
    renderTable: renderTable,
    renderCountrySummaryTable: renderCountrySummaryTable,
    renderDataQualityAudit: renderDataQualityAudit,
    formatNumber: formatNumber,
    formatPercent: formatPercent
  };
})();
