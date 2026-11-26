/**
 * COVID-19 Disease Trend Analysis | Chart.js Visualizations Controller
 * Real Data-Driven Rendering & Dynamic Filter Updates
 * Author: Anuj Kumar Kushwaha (Roll No: 250321540033)
 */

window.ChartsController = (function () {
  'use strict';

  // Global instances to enable destroy/re-render on filter change
  let chartDailyCases = null;
  let chartCumulative = null;
  let chartCountryBar = null;
  let chartMonthly = null;
  let chartDailyDeaths = null;
  let chartCFRTrend = null;
  let chartPerMillion = null;

  // Chart.js default styling for dark mode
  function configureChartDefaults() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 11.5;
    Chart.defaults.plugins.tooltip.backgroundColor = '#0b162c';
    Chart.defaults.plugins.tooltip.borderColor = '#1f355e';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 6;
    Chart.defaults.plugins.legend.labels.boxWidth = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
  }

  // Aggregate daily records across all countries in filtered rows
  function aggregateByDate(rows) {
    const map = {};
    rows.forEach(r => {
      if (!map[r.date]) {
        map[r.date] = {
          date: r.date,
          new_cases: 0,
          new_deaths: 0,
          new_recovered: 0,
          rolling_7day_cases: 0,
          rolling_7day_deaths: 0
        };
      }
      map[r.date].new_cases += r.new_cases;
      map[r.date].new_deaths += r.new_deaths;
      map[r.date].new_recovered += r.new_recovered;
      map[r.date].rolling_7day_cases += r.rolling_7day_cases;
      map[r.date].rolling_7day_deaths += r.rolling_7day_deaths;
    });

    const dates = Object.keys(map).sort();
    let runCases = 0;
    let runDeaths = 0;
    const list = [];

    dates.forEach(d => {
      runCases += map[d].new_cases;
      runDeaths += map[d].new_deaths;
      list.push({
        date: d,
        new_cases: map[d].new_cases,
        new_deaths: map[d].new_deaths,
        new_recovered: map[d].new_recovered,
        rolling_7day_cases: map[d].rolling_7day_cases,
        rolling_7day_deaths: map[d].rolling_7day_deaths,
        cumulative_cases: runCases,
        cumulative_deaths: runDeaths
      });
    });

    return list;
  }

  // Downsample timeseries if it exceeds 200 points for smooth rendering
  function downsample(list, targetCount = 180) {
    if (list.length <= targetCount) return list;
    const step = Math.ceil(list.length / targetCount);
    const sampled = [];
    for (let i = 0; i < list.length; i += step) {
      sampled.push(list[i]);
    }
    if (sampled[sampled.length - 1] !== list[list.length - 1]) {
      sampled.push(list[list.length - 1]);
    }
    return sampled;
  }

  // Main Render/Update function called whenever filters change
  function updateAllCharts(filteredRows, allRows = [], selectedCountry = 'All') {
    configureChartDefaults();

    if (!filteredRows || filteredRows.length === 0) {
      destroyAllCharts();
      return;
    }

    const dateAgg = aggregateByDate(filteredRows);
    const sampled = downsample(dateAgg, 200);

    renderDailyCasesChart(sampled);
    renderCumulativeChart(sampled);
    renderCountryComparisonChart(filteredRows, allRows, selectedCountry);
    renderMonthlyChart(filteredRows);
    renderDailyDeathsChart(sampled);
    renderCFRTrendChart(filteredRows);
    renderPerMillionChart(filteredRows);
  }

  // 1. Daily Cases + 7-Day Moving Average
  function renderDailyCasesChart(data) {
    const canvas = document.getElementById('chart-daily-cases');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (chartDailyCases) chartDailyCases.destroy();

    const labels = data.map(d => d.date);
    const daily = data.map(d => d.new_cases);
    const ma = data.map(d => d.rolling_7day_cases);

    chartDailyCases = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Daily Cases',
            data: daily,
            borderColor: 'rgba(56, 189, 248, 0.45)',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            borderWidth: 1.2,
            pointRadius: 0,
            fill: true,
            tension: 0.1
          },
          {
            label: '7-Day Moving Average',
            data: ma,
            borderColor: '#f59e0b',
            borderWidth: 2.4,
            pointRadius: 0,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            ticks: {
              maxTicksLimit: 8,
              callback: function (val) {
                const d = this.getLabelForValue(val);
                return d ? d.substring(0, 7) : '';
              }
            }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              callback: val => formatTick(val)
            }
          }
        }
      }
    });
  }

  // 2. Cumulative Cases Trend
  function renderCumulativeChart(data) {
    const canvas = document.getElementById('chart-cumulative');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (chartCumulative) chartCumulative.destroy();

    const labels = data.map(d => d.date);
    const cum = data.map(d => d.cumulative_cases);

    chartCumulative = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cumulative Total Cases',
          data: cum,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.15)',
          borderWidth: 2.5,
          fill: true,
          pointRadius: 0,
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 6,
              callback: function (val) {
                const d = this.getLabelForValue(val);
                return d ? d.substring(0, 4) : '';
              }
            }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { callback: val => formatTick(val) }
          }
        }
      }
    });
  }

  // 3. Country Comparison Leaderboard (Top 10)
  function renderCountryComparisonChart(rows, allRows = [], selectedCountry = 'All') {
    const canvas = document.getElementById('chart-country-bar');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (chartCountryBar) chartCountryBar.destroy();

    // Use allRows if selectedCountry !== 'All' so that other countries remain visible for comparative context
    const targetRows = (selectedCountry !== 'All' && allRows && allRows.length > 0) ? allRows : rows;

    const countrySums = {};
    targetRows.forEach(r => {
      if (!countrySums[r.country]) {
        countrySums[r.country] = { country: r.country, cases: 0, deaths: 0 };
      }
      countrySums[r.country].cases += r.new_cases;
      countrySums[r.country].deaths += r.new_deaths;
    });

    const list = Object.values(countrySums)
      .filter(c => c.country !== 'Other Countries')
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 10);

    const labels = list.map(c => c.country);
    const cases = list.map(c => c.cases);
    const bgColors = list.map(c => (c.country === selectedCountry ? '#f59e0b' : '#2563eb'));

    chartCountryBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Cases',
          data: cases,
          backgroundColor: bgColors,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const isSel = (labels[ctx.dataIndex] === selectedCountry);
                return ` ${formatTick(ctx.raw)} Confirmed Cases${isSel ? ' (Selected Country)' : ''}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { callback: val => formatTick(val) }
          },
          y: { grid: { display: false } }
        }
      }
    });
  }

  // 4. Monthly Cases & Deaths Trend
  function renderMonthlyChart(rows) {
    const canvas = document.getElementById('chart-monthly');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (chartMonthly) chartMonthly.destroy();

    const monthlyMap = {};
    rows.forEach(r => {
      const ym = r.date.substring(0, 7);
      if (!monthlyMap[ym]) {
        monthlyMap[ym] = { ym: ym, cases: 0, deaths: 0 };
      }
      monthlyMap[ym].cases += r.new_cases;
      monthlyMap[ym].deaths += r.new_deaths;
    });

    const sortedYMs = Object.keys(monthlyMap).sort();
    const cases = sortedYMs.map(ym => monthlyMap[ym].cases);
    const deaths = sortedYMs.map(ym => monthlyMap[ym].deaths);

    chartMonthly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedYMs,
        datasets: [
          {
            label: 'Monthly Cases',
            data: cases,
            backgroundColor: '#38bdf8',
            borderRadius: 3,
            yAxisID: 'y'
          },
          {
            label: 'Monthly Deaths',
            data: deaths,
            type: 'line',
            borderColor: '#ef4444',
            backgroundColor: '#ef4444',
            borderWidth: 2,
            pointRadius: 2,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: true, position: 'top', labels: { boxWidth: 10 } }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 12 }
          },
          y: {
            type: 'linear',
            position: 'left',
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { callback: val => formatTick(val) }
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { callback: val => formatTick(val) }
          }
        }
      }
    });
  }

  // 5. Daily Deaths Trajectory
  function renderDailyDeathsChart(data) {
    const canvas = document.getElementById('chart-deaths');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (chartDailyDeaths) chartDailyDeaths.destroy();

    const labels = data.map(d => d.date);
    const deathsMA = data.map(d => d.rolling_7day_deaths || d.new_deaths);

    chartDailyDeaths = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Daily Deaths (7-Day Avg)',
          data: deathsMA,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          borderWidth: 2,
          fill: true,
          pointRadius: 0,
          tension: 0.25
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 6,
              callback: function (val) {
                const d = this.getLabelForValue(val);
                return d ? d.substring(0, 4) : '';
              }
            }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { callback: val => formatTick(val) }
          }
        }
      }
    });
  }

  // 6. Case Fatality Rate (CFR) Evolution
  function renderCFRTrendChart(rows) {
    const canvas = document.getElementById('chart-cfr-trend');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (chartCFRTrend) chartCFRTrend.destroy();

    const quarterlyMap = {};
    rows.forEach(r => {
      const year = r.date.substring(0, 4);
      const month = parseInt(r.date.substring(5, 7), 10);
      const quarter = `Q${Math.ceil(month / 3)} ${year}`;
      if (!quarterlyMap[quarter]) {
        quarterlyMap[quarter] = { quarter: quarter, cases: 0, deaths: 0 };
      }
      quarterlyMap[quarter].cases += r.new_cases;
      quarterlyMap[quarter].deaths += r.new_deaths;
    });

    // Custom chronological sort for quarters
    const sortedQuarters = Object.keys(quarterlyMap).sort((a, b) => {
      const [qa, ya] = a.split(' ');
      const [qb, yb] = b.split(' ');
      return (ya + qa).localeCompare(yb + qb);
    });

    const cfrValues = sortedQuarters.map(q => {
      const item = quarterlyMap[q];
      return item.cases > 0 ? parseFloat(((item.deaths / item.cases) * 100).toFixed(2)) : 0;
    });

    chartCFRTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sortedQuarters,
        datasets: [{
          label: 'Case Fatality Rate (%)',
          data: cfrValues,
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.15)',
          borderWidth: 2.4,
          fill: true,
          pointRadius: 3,
          tension: 0.25
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` CFR: ${ctx.raw}%`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { callback: val => val + '%' }
          }
        }
      }
    });
  }

  // 7. Cases & Deaths per Million Population
  function renderPerMillionChart(rows) {
    const canvas = document.getElementById('chart-per-million');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (chartPerMillion) chartPerMillion.destroy();

    const countryMap = {};
    rows.forEach(r => {
      if (!countryMap[r.country] && r.country !== 'Other Countries') {
        countryMap[r.country] = { country: r.country, cases: 0, pop: r.population };
      }
      if (countryMap[r.country]) {
        countryMap[r.country].cases += r.new_cases;
      }
    });

    const list = Object.values(countryMap)
      .filter(c => c.pop > 0)
      .map(c => ({
        country: c.country,
        casesPerM: Math.round((c.cases * 1000000) / c.pop)
      }))
      .sort((a, b) => b.casesPerM - a.casesPerM)
      .slice(0, 7);

    chartPerMillion = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: list.map(c => c.country),
        datasets: [{
          label: 'Cases per 1M People',
          data: list.map(c => c.casesPerM),
          backgroundColor: '#059669',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.raw.toLocaleString()} Cases per Million`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { callback: val => formatTick(val) }
          },
          y: { grid: { display: false } }
        }
      }
    });
  }

  function formatTick(val) {
    if (Math.abs(val) >= 1e9) return (val / 1e9).toFixed(1) + 'B';
    if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(1) + 'M';
    if (Math.abs(val) >= 1e3) return (val / 1e3).toFixed(0) + 'K';
    return val;
  }

  function destroyAllCharts() {
    [chartDailyCases, chartCumulative, chartCountryBar, chartMonthly, chartDailyDeaths, chartCFRTrend, chartPerMillion].forEach(c => {
      if (c) c.destroy();
    });
  }

  return {
    updateAllCharts: updateAllCharts,
    destroyAllCharts: destroyAllCharts
  };
})();
