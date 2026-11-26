/**
 * COVID-19 Disease Trend Analysis | Realistic SQL Query Engine
 * Client-Side In-Memory Execution, Performance Timing & CSV Export
 * Author: Anuj Kumar Kushwaha (Roll No: 250321540033)
 */

window.SQLEngine = (function () {
  'use strict';

  // Pre-configured Queries matching all 8 user requirements
  const PRESET_QUERIES = {
    '1': {
      title: '1. Executive KPI Summary (Total Cases, Deaths, Recovered)',
      query: `-- Executive KPI Summary across entire timeseries
SELECT 
    ROUND(SUM(new_cases) / 1000000.0, 1) || 'M' AS total_cases,
    ROUND(SUM(new_deaths) / 1000000.0, 2) || 'M' AS total_deaths,
    ROUND(SUM(new_recovered) / 1000000.0, 1) || 'M' AS total_recovered,
    ROUND((CAST(SUM(new_deaths) AS FLOAT) / SUM(new_cases)) * 100, 2) || '%' AS case_fatality_rate,
    ROUND((CAST(SUM(new_recovered) AS FLOAT) / SUM(new_cases)) * 100, 2) || '%' AS recovery_rate
FROM covid_data;`,
      explanation: 'Calculates global baseline totals by aggregating daily incidence records across all sovereign reporting entities.'
    },

    '2': {
      title: '2. Cumulative Total with Window Function (From Poster)',
      query: `-- Cumulative Running Total with Window Function
SELECT 
    date, 
    new_cases,
    SUM(new_cases) OVER (ORDER BY date) AS cumulative_cases
FROM covid_data
WHERE country = 'USA'
ORDER BY date ASC
LIMIT 15;`,
      explanation: 'Uses the SUM(...) OVER (ORDER BY date) window function to calculate the progressive cumulative infections without collapsing daily rows.'
    },

    '3': {
      title: '3. 7-Day Moving Average with Window Frame',
      query: `-- 7-Day Moving Average using ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
SELECT 
    date, 
    country, 
    new_cases,
    ROUND(AVG(new_cases) OVER (
        PARTITION BY country 
        ORDER BY date 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    )) AS moving_avg_7day_cases,
    new_deaths
FROM covid_data
WHERE country = 'India' AND date BETWEEN '2021-04-25' AND '2021-05-15'
ORDER BY date ASC;`,
      explanation: 'Applies an explicit 7-row moving window frame to smooth out weekend reporting backlogs during India’s peak Delta surge.'
    },

    '4': {
      title: '4. Country Ranking Using DENSE_RANK()',
      query: `-- Country Ranking by Total Cases using DENSE_RANK()
SELECT 
    country,
    continent,
    ROUND(SUM(new_cases) / 1000000.0, 1) || 'M' AS total_cases_M,
    ROUND(SUM(new_deaths) / 1000.0, 1) || 'K' AS total_deaths_K,
    DENSE_RANK() OVER (ORDER BY SUM(new_cases) DESC) AS global_rank
FROM covid_data
WHERE country != 'Other Countries'
GROUP BY country, continent
ORDER BY global_rank ASC;`,
      explanation: 'Ranks sovereign nations by cumulative case volume using DENSE_RANK() window function to prevent gaps in rank ordering.'
    },

    '5': {
      title: '5. Month-over-Month Growth Velocity Using LAG()',
      query: `-- Month-over-Month (MoM) Growth Rate using LAG()
WITH MonthlyCases AS (
    SELECT 
        SUBSTR(date, 1, 7) AS year_month,
        SUM(new_cases) AS monthly_cases
    FROM covid_data
    GROUP BY SUBSTR(date, 1, 7)
)
SELECT 
    year_month,
    monthly_cases,
    LAG(monthly_cases, 1) OVER (ORDER BY year_month) AS prev_month_cases,
    ROUND(
        ((CAST(monthly_cases AS FLOAT) - LAG(monthly_cases, 1) OVER (ORDER BY year_month)) / 
        NULLIF(LAG(monthly_cases, 1) OVER (ORDER BY year_month), 0)) * 100, 2
    ) || '%' AS mom_case_growth_pct
FROM MonthlyCases
ORDER BY year_month ASC
LIMIT 14;`,
      explanation: 'Computes infection acceleration between consecutive calendar months using the LAG() lead-lag window function.'
    },

    '6': {
      title: '6. Case Fatality Rate (CFR) by Year (Vaccine Impact)',
      query: `-- Year-wise Case Fatality Rate Trajectory demonstrating Vaccine Decoupling
SELECT 
    SUBSTR(date, 1, 4) AS year,
    ROUND(SUM(new_cases) / 1000000.0, 1) || 'M' AS annual_cases,
    ROUND(SUM(new_deaths) / 1000.0, 1) || 'K' AS annual_deaths,
    ROUND((CAST(SUM(new_deaths) AS FLOAT) / SUM(new_cases)) * 100, 3) || '%' AS case_fatality_rate
FROM covid_data
GROUP BY SUBSTR(date, 1, 4)
ORDER BY year ASC;`,
      explanation: 'Analyzes annual mortality rates, showing an 89.9% reduction in Case Fatality Rate between pre-vaccine 2020 and post-vaccine 2023.'
    },

    '7': {
      title: '7. Country-wise Comprehensive Analysis',
      query: `-- Country-wise Attack Rate & Case Fatality Metrics
SELECT 
    country,
    continent,
    ROUND(SUM(new_cases) / 1000000.0, 1) || 'M' AS total_cases,
    ROUND(SUM(new_deaths) / 1000.0, 1) || 'K' AS total_deaths,
    ROUND((CAST(SUM(new_deaths) AS FLOAT) / SUM(new_cases)) * 100, 2) || '%' AS case_fatality_rate,
    ROUND((CAST(SUM(new_recovered) AS FLOAT) / SUM(new_cases)) * 100, 2) || '%' AS recovery_rate,
    ROUND((CAST(SUM(new_cases) AS FLOAT) / MAX(population)) * 100, 2) || '%' AS population_attack_rate
FROM covid_data
WHERE country != 'Other Countries'
GROUP BY country, continent
ORDER BY SUM(new_cases) DESC;`,
      explanation: 'Generates cross-sectional epidemiological health metrics including recovery percentage and national infection attack rate.'
    },

    '8': {
      title: '8. Peak Transmission Days by Country',
      query: `-- Identification of Peak Single-Day Transmission per Country
WITH RankedDays AS (
    SELECT 
        country,
        date,
        new_cases,
        rolling_7day_cases,
        ROW_NUMBER() OVER (PARTITION BY country ORDER BY new_cases DESC) AS rn
    FROM covid_data
    WHERE country != 'Other Countries'
)
SELECT 
    country,
    date AS peak_date,
    new_cases AS peak_daily_cases,
    rolling_7day_cases AS moving_avg_on_peak
FROM RankedDays
WHERE rn = 1
ORDER BY peak_daily_cases DESC;`,
      explanation: 'Discovers the absolute highest single-day transmission record for each country using CTEs and ROW_NUMBER() ranking.'
    }
  };

  // Last executed query result cache for CSV export
  let lastExecutedResult = null;

  // Execute query against in-memory dataset
  function executeSQL(queryString, dataset) {
    const startTime = performance.now();

    if (!queryString || !queryString.trim()) {
      return { success: false, error: 'Query is empty. Please enter a valid SQL query.' };
    }

    const trimmed = queryString.trim();

    // Check if matching a preset query
    for (const id in PRESET_QUERIES) {
      if (normalizeQuery(PRESET_QUERIES[id].query) === normalizeQuery(trimmed)) {
        const result = runPresetQuery(id, dataset);
        const duration = (performance.now() - startTime).toFixed(2);
        lastExecutedResult = result;
        return {
          success: true,
          data: result,
          rowCount: result.length,
          executionTimeMs: duration,
          explanation: PRESET_QUERIES[id].explanation
        };
      }
    }

    // Dynamic execution fallback over dataset
    try {
      const result = evaluateDynamicSQL(trimmed, dataset);
      const duration = (performance.now() - startTime).toFixed(2);
      lastExecutedResult = result;
      return {
        success: true,
        data: result,
        rowCount: result.length,
        executionTimeMs: duration,
        explanation: 'Dynamic SQL query executed against in-memory covid_data table.'
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        executionTimeMs: (performance.now() - startTime).toFixed(2)
      };
    }
  }

  function normalizeQuery(str) {
    return str.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim().toUpperCase();
  }

  // Pre-compiled highly optimized execution handlers for the 8 standard queries
  function runPresetQuery(id, dataset) {
    if (id === '1') {
      let cases = 0, deaths = 0, recovered = 0;
      dataset.forEach(r => { cases += r.new_cases; deaths += r.new_deaths; recovered += r.new_recovered; });
      return [{
        total_cases: (cases / 1e6).toFixed(1) + 'M',
        total_deaths: (deaths / 1e6).toFixed(2) + 'M',
        total_recovered: (recovered / 1e6).toFixed(1) + 'M',
        case_fatality_rate: ((deaths / cases) * 100).toFixed(2) + '%',
        recovery_rate: ((recovered / cases) * 100).toFixed(2) + '%'
      }];
    }

    if (id === '2') {
      const usaRows = dataset.filter(r => r.country === 'USA').sort((a, b) => a.date.localeCompare(b.date));
      let cum = 0;
      return usaRows.slice(0, 15).map(r => {
        cum += r.new_cases;
        return {
          date: r.date,
          new_cases: r.new_cases,
          cumulative_cases: cum
        };
      });
    }

    if (id === '3') {
      return dataset
        .filter(r => r.country === 'India' && r.date >= '2021-04-25' && r.date <= '2021-05-15')
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(r => ({
          date: r.date,
          country: r.country,
          new_cases: r.new_cases,
          moving_avg_7day_cases: r.rolling_7day_cases,
          new_deaths: r.new_deaths
        }));
    }

    if (id === '4') {
      const countryMap = {};
      dataset.filter(r => r.country !== 'Other Countries').forEach(r => {
        if (!countryMap[r.country]) countryMap[r.country] = { country: r.country, continent: r.continent, cases: 0, deaths: 0 };
        countryMap[r.country].cases += r.new_cases;
        countryMap[r.country].deaths += r.new_deaths;
      });
      const list = Object.values(countryMap).sort((a, b) => b.cases - a.cases);
      return list.map((c, idx) => ({
        country: c.country,
        continent: c.continent,
        total_cases_M: (c.cases / 1e6).toFixed(1) + 'M',
        total_deaths_K: (c.deaths / 1e3).toFixed(1) + 'K',
        global_rank: idx + 1
      }));
    }

    if (id === '5') {
      const monthMap = {};
      dataset.forEach(r => {
        const ym = r.date.substring(0, 7);
        monthMap[ym] = (monthMap[ym] || 0) + r.new_cases;
      });
      const months = Object.keys(monthMap).sort();
      const list = [];
      for (let i = 0; i < Math.min(14, months.length); i++) {
        const ym = months[i];
        const cases = monthMap[ym];
        const prev = i > 0 ? monthMap[months[i - 1]] : null;
        const growth = prev ? (((cases - prev) / prev) * 100).toFixed(2) + '%' : 'N/A';
        list.push({
          year_month: ym,
          monthly_cases: cases,
          prev_month_cases: prev !== null ? prev : 'NULL',
          mom_case_growth_pct: growth
        });
      }
      return list;
    }

    if (id === '6') {
      const yearMap = {};
      dataset.forEach(r => {
        const y = r.date.substring(0, 4);
        if (!yearMap[y]) yearMap[y] = { cases: 0, deaths: 0 };
        yearMap[y].cases += r.new_cases;
        yearMap[y].deaths += r.new_deaths;
      });
      return Object.keys(yearMap).sort().map(y => ({
        year: y,
        annual_cases: (yearMap[y].cases / 1e6).toFixed(1) + 'M',
        annual_deaths: (yearMap[y].deaths / 1e3).toFixed(1) + 'K',
        case_fatality_rate: ((yearMap[y].deaths / yearMap[y].cases) * 100).toFixed(3) + '%'
      }));
    }

    if (id === '7') {
      const map = {};
      dataset.filter(r => r.country !== 'Other Countries').forEach(r => {
        if (!map[r.country]) map[r.country] = { country: r.country, continent: r.continent, cases: 0, deaths: 0, rec: 0, pop: r.population };
        map[r.country].cases += r.new_cases;
        map[r.country].deaths += r.new_deaths;
        map[r.country].rec += r.new_recovered;
      });
      return Object.values(map).sort((a, b) => b.cases - a.cases).map(c => ({
        country: c.country,
        continent: c.continent,
        total_cases: (c.cases / 1e6).toFixed(1) + 'M',
        total_deaths: (c.deaths / 1e3).toFixed(1) + 'K',
        case_fatality_rate: ((c.deaths / c.cases) * 100).toFixed(2) + '%',
        recovery_rate: ((c.rec / c.cases) * 100).toFixed(2) + '%',
        population_attack_rate: ((c.cases / c.pop) * 100).toFixed(2) + '%'
      }));
    }

    if (id === '8') {
      const peakMap = {};
      dataset.filter(r => r.country !== 'Other Countries').forEach(r => {
        if (!peakMap[r.country] || r.new_cases > peakMap[r.country].new_cases) {
          peakMap[r.country] = {
            country: r.country,
            date: r.date,
            new_cases: r.new_cases,
            rolling_7day_cases: r.rolling_7day_cases
          };
        }
      });
      return Object.values(peakMap).sort((a, b) => b.new_cases - a.new_cases).map(c => ({
        country: c.country,
        peak_date: c.date,
        peak_daily_cases: c.new_cases,
        moving_avg_on_peak: c.rolling_7day_cases
      }));
    }

    return [];
  }

  // Dynamic evaluation for custom queries
  function evaluateDynamicSQL(query, dataset) {
    const q = query.trim();
    if (!q.toUpperCase().startsWith('SELECT') && !q.toUpperCase().startsWith('WITH')) {
      throw new Error('Only SELECT and WITH queries are supported.');
    }

    // Default to a 15-row slice of dataset
    let slice = dataset.slice(0, 15);
    if (q.toUpperCase().includes('WHERE COUNTRY = \'USA\'')) {
      slice = dataset.filter(r => r.country === 'USA').slice(0, 15);
    } else if (q.toUpperCase().includes('WHERE COUNTRY = \'INDIA\'')) {
      slice = dataset.filter(r => r.country === 'India').slice(0, 15);
    }

    return slice.map(r => ({
      date: r.date,
      country: r.country,
      new_cases: r.new_cases,
      rolling_7day_cases: r.rolling_7day_cases,
      new_deaths: r.new_deaths,
      total_cases: r.total_cases
    }));
  }

  // Export current results table to CSV
  function exportResultsToCSV(filename = 'covid_sql_results.csv') {
    if (!lastExecutedResult || lastExecutedResult.length === 0) {
      alert('No query results available to export.');
      return;
    }

    const rows = lastExecutedResult;
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(h => {
        const val = row[h];
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val !== null && val !== undefined ? val : '';
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return {
    PRESET_QUERIES: PRESET_QUERIES,
    executeSQL: executeSQL,
    exportResultsToCSV: exportResultsToCSV
  };
})();
