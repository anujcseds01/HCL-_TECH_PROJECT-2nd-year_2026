-- ============================================================================
-- PROJECT: COVID-19 Disease Trend Analysis
-- DATABASE SCHEMA: Relational Data Model (MySQL / PostgreSQL / SQLite Compatible)
-- AUTHOR: Anuj Kumar Kushwaha (Roll No: 250321540033)
-- INSTITUTION: ABES Engineering College, Ghaziabad
-- ============================================================================

-- 1. Country Dimension Table
DROP TABLE IF EXISTS dim_country;
CREATE TABLE dim_country (
    country VARCHAR(100) PRIMARY KEY,
    iso_code VARCHAR(10) NOT NULL,
    continent VARCHAR(50) NOT NULL,
    population BIGINT NOT NULL
);

-- 2. Date Dimension Table (for Star Schema / Power BI modeling)
DROP TABLE IF EXISTS dim_date;
CREATE TABLE dim_date (
    date_id VARCHAR(10) PRIMARY KEY, -- YYYY-MM-DD
    year INT NOT NULL,
    month INT NOT NULL,
    month_name VARCHAR(20) NOT NULL,
    quarter INT NOT NULL,
    week_of_year INT NOT NULL,
    day_of_week VARCHAR(15) NOT NULL,
    is_weekend BOOLEAN NOT NULL
);

-- 3. Core COVID-19 Fact & Timeseries Table
DROP TABLE IF EXISTS covid_data;
CREATE TABLE covid_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date VARCHAR(10) NOT NULL,
    country VARCHAR(100) NOT NULL,
    iso_code VARCHAR(10),
    continent VARCHAR(50),
    new_cases INT DEFAULT 0,
    total_cases BIGINT DEFAULT 0,
    new_deaths INT DEFAULT 0,
    total_deaths BIGINT DEFAULT 0,
    new_recovered INT DEFAULT 0,
    total_recovered BIGINT DEFAULT 0,
    active_cases BIGINT DEFAULT 0,
    rolling_7day_cases INT DEFAULT 0,
    rolling_7day_deaths INT DEFAULT 0,
    population BIGINT,
    FOREIGN KEY (country) REFERENCES dim_country(country)
);

-- Optimization Indexes
CREATE INDEX idx_covid_date ON covid_data(date);
CREATE INDEX idx_covid_country ON covid_data(country);
CREATE INDEX idx_covid_continent ON covid_data(continent);
CREATE INDEX idx_covid_country_date ON covid_data(country, date);

-- 4. Analytical View: Country KPI Summary
DROP VIEW IF EXISTS vw_country_kpis;
CREATE VIEW vw_country_kpis AS
SELECT 
    country,
    continent,
    MAX(total_cases) AS total_cases,
    MAX(total_deaths) AS total_deaths,
    MAX(total_recovered) AS total_recovered,
    ROUND(CAST(MAX(total_deaths) AS FLOAT) * 100.0 / NULLIF(MAX(total_cases), 0), 2) AS case_fatality_rate_pct,
    ROUND(CAST(MAX(total_recovered) AS FLOAT) * 100.0 / NULLIF(MAX(total_cases), 0), 2) AS recovery_rate_pct,
    MAX(population) AS population,
    ROUND(CAST(MAX(total_cases) AS FLOAT) * 1000000.0 / NULLIF(MAX(population), 0), 2) AS cases_per_million
FROM covid_data
GROUP BY country, continent;
