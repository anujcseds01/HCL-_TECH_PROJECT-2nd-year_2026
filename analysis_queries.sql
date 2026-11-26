-- ============================================================================
-- PROJECT: COVID-19 Disease Trend Analysis
-- ADVANCED SQL ANALYSIS & WINDOW FUNCTIONS
-- AUTHOR: Anuj Kumar Kushwaha (Roll No: 250321540033)
-- INSTITUTION: ABES Engineering College, Ghaziabad
-- ============================================================================

-- ----------------------------------------------------------------------------
-- QUERY 1: Executive KPI Summary (Total Cases, Deaths, Recovered, CFR)
-- ----------------------------------------------------------------------------
SELECT 
    ROUND(SUM(new_cases) / 1000000.0, 1) || 'M' AS total_cases,
    ROUND(SUM(new_deaths) / 1000000.0, 2) || 'M' AS total_deaths,
    ROUND(SUM(new_recovered) / 1000000.0, 1) || 'M' AS total_recovered,
    ROUND((CAST(SUM(new_deaths) AS FLOAT) / SUM(new_cases)) * 100, 2) || '%' AS case_fatality_rate,
    ROUND((CAST(SUM(new_recovered) AS FLOAT) / SUM(new_cases)) * 100, 2) || '%' AS recovery_rate
FROM covid_data;


-- ----------------------------------------------------------------------------
-- QUERY 2: Cumulative Total with Window Function (From Poster)
-- Calculates the running cumulative cases ordered by date.
-- ----------------------------------------------------------------------------
SELECT 
    date, 
    new_cases,
    SUM(new_cases) OVER (ORDER BY date) AS cumulative_cases
FROM covid_data
WHERE country = 'USA'
ORDER BY date ASC
LIMIT 20;


-- ----------------------------------------------------------------------------
-- QUERY 3: 7-Day Moving Average with Window Frame
-- Uses ROWS BETWEEN 6 PRECEDING AND CURRENT ROW to smooth reporting noise.
-- ----------------------------------------------------------------------------
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
ORDER BY date ASC;


-- ----------------------------------------------------------------------------
-- QUERY 4: Country Ranking Using DENSE_RANK()
-- Ranks sovereign nations by cumulative case volume without rank gaps.
-- ----------------------------------------------------------------------------
SELECT 
    country,
    continent,
    ROUND(SUM(new_cases) / 1000000.0, 1) || 'M' AS total_cases_M,
    ROUND(SUM(new_deaths) / 1000.0, 1) || 'K' AS total_deaths_K,
    DENSE_RANK() OVER (ORDER BY SUM(new_cases) DESC) AS global_rank
FROM covid_data
WHERE country != 'Other Countries'
GROUP BY country, continent
ORDER BY global_rank ASC;


-- ----------------------------------------------------------------------------
-- QUERY 5: Month-over-Month (MoM) Growth Rate Using LAG() Window Function
-- Measures infection velocity acceleration / deceleration across months.
-- ----------------------------------------------------------------------------
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
    ) || '%' AS mom_growth_pct
FROM MonthlyCases
ORDER BY year_month ASC
LIMIT 15;


-- ----------------------------------------------------------------------------
-- QUERY 6: Year-wise Case Fatality Rate (CFR) Trajectory (Vaccine Impact)
-- Demonstrates the clinical decoupling between case volume and mortality.
-- ----------------------------------------------------------------------------
SELECT 
    SUBSTR(date, 1, 4) AS year,
    ROUND(SUM(new_cases) / 1000000.0, 1) || 'M' AS annual_cases,
    ROUND(SUM(new_deaths) / 1000.0, 1) || 'K' AS annual_deaths,
    ROUND((CAST(SUM(new_deaths) AS FLOAT) / SUM(new_cases)) * 100, 3) || '%' AS case_fatality_rate
FROM covid_data
GROUP BY SUBSTR(date, 1, 4)
ORDER BY year ASC;


-- ----------------------------------------------------------------------------
-- QUERY 7: Country-wise Attack Rate & Case Fatality Metrics
-- ----------------------------------------------------------------------------
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
ORDER BY SUM(new_cases) DESC;


-- ----------------------------------------------------------------------------
-- QUERY 8: Peak Transmission Day Identification per Country (CTE + ROW_NUMBER)
-- ----------------------------------------------------------------------------
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
ORDER BY peak_daily_cases DESC;
