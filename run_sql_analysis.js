const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, 'covid_database.db');
const db = new DatabaseSync(dbPath);

console.log('='.repeat(80));
console.log(' COVID-19 SQL ANALYSIS & WINDOW FUNCTIONS RUNNER (v2.0) '.padStart(68, '=').padEnd(80, '='));
console.log(' Author: Anuj Kumar Kushwaha | Roll No: 250321540033 | ABES Engineering College');
console.log('='.repeat(80) + '\n');

// 1. Executive Global KPIs
console.log('--- [QUERY 1: EXECUTIVE GLOBAL KPI CARDS] ---');
const kpis = db.prepare(`
  SELECT 
    ROUND(SUM(new_cases) / 1000000.0, 1) || 'M' AS total_cases,
    ROUND(SUM(new_deaths) / 1000000.0, 2) || 'M' AS total_deaths,
    ROUND(SUM(new_recovered) / 1000000.0, 1) || 'M' AS total_recovered,
    ROUND((CAST(SUM(new_deaths) AS FLOAT) / SUM(new_cases)) * 100, 2) || '%' AS case_fatality_rate,
    ROUND((CAST(SUM(new_recovered) AS FLOAT) / SUM(new_cases)) * 100, 2) || '%' AS recovery_rate
  FROM covid_data;
`).all();
console.table(kpis);

// 2. Window Function: Cumulative Cases (Snippet from Poster)
console.log('\n--- [QUERY 2: CUMULATIVE CASES WINDOW FUNCTION (POSTER SNIPPET)] ---');
const cumCases = db.prepare(`
  SELECT date, new_cases,
         SUM(new_cases) OVER (ORDER BY date) AS cumulative_cases
  FROM covid_data
  WHERE country = 'USA'
  ORDER BY date ASC
  LIMIT 10;
`).all();
console.table(cumCases);

// 3. 7-Day Moving Average in SQL
console.log('\n--- [QUERY 3: 7-DAY MOVING AVERAGE VIA WINDOW FRAME (ROWS BETWEEN 6 PRECEDING)] ---');
const movingAvgSample = db.prepare(`
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
  WHERE country = 'India' AND date BETWEEN '2021-05-01' AND '2021-05-10'
  ORDER BY date ASC;
`).all();
console.table(movingAvgSample);

// 4. Country Comparison & Ranking (DENSE_RANK)
console.log('\n--- [QUERY 4: COUNTRY COMPARISON & DENSE_RANK WINDOW FUNCTION] ---');
const countryRanks = db.prepare(`
  SELECT 
    country,
    continent,
    ROUND(SUM(new_cases) / 1000000.0, 1) || 'M' AS cases_millions,
    ROUND(SUM(new_deaths) / 1000.0, 1) || 'K' AS deaths_thousands,
    DENSE_RANK() OVER (ORDER BY SUM(new_cases) DESC) AS global_rank
  FROM covid_data
  WHERE country != 'Other Countries'
  GROUP BY country, continent
  ORDER BY global_rank ASC;
`).all();
console.table(countryRanks);

// 5. Month-over-Month Growth (LAG)
console.log('\n--- [QUERY 5: MONTH-OVER-MONTH GROWTH RATE USING LAG()] ---');
const momGrowth = db.prepare(`
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
  LIMIT 8;
`).all();
console.table(momGrowth);

// 6. Case Fatality Rate by Year (Demonstrating vaccine impact)
console.log('\n--- [QUERY 6: CASE FATALITY RATE (CFR) YEARLY TRAJECTORY - VACCINE IMPACT] ---');
const yearlyCFR = db.prepare(`
  SELECT 
    SUBSTR(date, 1, 4) AS year,
    ROUND(SUM(new_cases) / 1000000.0, 1) || 'M' AS total_cases,
    ROUND(SUM(new_deaths) / 1000.0, 1) || 'K' AS total_deaths,
    ROUND((CAST(SUM(new_deaths) AS FLOAT) / SUM(new_cases)) * 100, 3) || '%' AS case_fatality_rate
  FROM covid_data
  GROUP BY SUBSTR(date, 1, 4)
  ORDER BY year ASC;
`).all();
console.table(yearlyCFR);

// 7. Country-wise Comprehensive Analysis
console.log('\n--- [QUERY 7: COUNTRY-WISE ATTACK RATE & CASE FATALITY] ---');
const countryAnalysis = db.prepare(`
  SELECT 
    country,
    continent,
    ROUND(SUM(new_cases) / 1000000.0, 1) || 'M' AS total_cases,
    ROUND((CAST(SUM(new_deaths) AS FLOAT) / SUM(new_cases)) * 100, 2) || '%' AS cfr,
    ROUND((CAST(SUM(new_recovered) AS FLOAT) / SUM(new_cases)) * 100, 2) || '%' AS rec_rate,
    ROUND((CAST(SUM(new_cases) AS FLOAT) / MAX(population)) * 100, 2) || '%' AS attack_rate
  FROM covid_data
  WHERE country != 'Other Countries'
  GROUP BY country, continent
  ORDER BY SUM(new_cases) DESC
  LIMIT 5;
`).all();
console.table(countryAnalysis);

// 8. Peak Transmission Days by Country
console.log('\n--- [QUERY 8: PEAK SINGLE-DAY TRANSMISSION PER COUNTRY (CTE + ROW_NUMBER)] ---');
const peakDays = db.prepare(`
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
  ORDER BY peak_daily_cases DESC
  LIMIT 5;
`).all();
console.table(peakDays);

console.log('\n' + '='.repeat(80));
console.log(' ✓ All 8 Advanced SQL Queries Executed Successfully against covid_database.db');
console.log('='.repeat(80));
