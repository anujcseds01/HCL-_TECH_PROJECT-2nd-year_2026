# Academic Project Report: COVID-19 Disease Trend Analysis
### Comprehensive Data Analytics with Python, SQL, and Power BI

---

**Project Title:** COVID-19 Disease Trend Analysis  
**Technology Stack:** Python (Pandas, NumPy, Matplotlib) + SQL (Window Functions) + Power BI (Interactive Executive Dashboard)  
**Student Name:** Anuj Kumar Kushwaha  
**Roll Number:** 250321540033  
**Institution:** ABES Engineering College, Ghaziabad  
**Project Tagline:** *"Analyse Today... Be Prepared Tomorrow..."*  

---

## 1. Abstract
The COVID-19 pandemic has produced one of the largest volumes of public health timeseries data in modern history. This project delivers an end-to-end data analytics and business intelligence solution to track, model, and visualize epidemiological trends spanning the four-year period from January 2020 through December 2023. By synergizing **Python** for automated data ingestion, cleaning, and rolling statistical transformations, **SQL** for relational data modeling and advanced window calculations (including running cumulative totals, moving average frames, ranking, and growth lags), and **Power BI** for executive-grade interactive visual intelligence, this system extracts key epidemiological insights. These include wave identification, vaccine impact on mortality reduction, seasonal disease recurrence, and regional cross-comparison.

---

## 2. Project Architecture & Methodology
The data pipeline is partitioned into three decoupled tiers:

```
+-------------------------------------------------------------+
| 1. DATA INGESTION & CLEANING (Python - Pandas & NumPy)     |
|    - Raw WHO/OWID dataset ingestion                         |
|    - Casing, date format (YYYY-MM-DD), and null imputation  |
|    - Feature engineering: 7-day rolling window, cumulative  |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| 2. RELATIONAL MODELING & ANALYSIS (SQL / SQLite / MySQL)    |
|    - Star schema (covid_data fact, dim_country, dim_date)   |
|    - Advanced Window Functions: SUM() OVER, AVG() OVER,     |
|      DENSE_RANK(), LAG() for MoM infection velocity         |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| 3. BUSINESS INTELLIGENCE (Power BI & Interactive Web App)   |
|    - 4 Core KPI Cards (Total Cases 676.6M, Deaths 6.88M,   |
|      Recoveries 658.1M, 7-Day Peak Avg 3.4M)                |
|    - 5 Visual Trend Charts (Daily & 7D MA, Cumulative,      |
|      Country Comparison, Weekly Cases, Death Trajectory)    |
|    - Dynamic Slicers: Country, Date Range, Region           |
+-------------------------------------------------------------+
```

---

## 3. Dataset Description
- **Source:** Our World in Data (OWID) / World Health Organization (WHO)
- **Period Covered:** January 1, 2020 – December 31, 2023 (1,461 calendar days)
- **Granularity:** Daily country-level records
- **Primary Attributes:**
  - `date`: Timestamp formatted in ISO 8601 (`YYYY-MM-DD`)
  - `country` & `iso_code`: Sovereign nation identifier
  - `continent`: Geographical region (North America, Asia, Europe, South America, etc.)
  - `new_cases` & `total_cases`: Incident and cumulative confirmed laboratory cases
  - `new_deaths` & `total_deaths`: Incident and cumulative attributable fatalities
  - `new_recovered` & `total_recovered`: Incident and cumulative resolved cases
  - `active_cases`: Active infectious volume (`total_cases - total_deaths - total_recovered`)
  - `rolling_7day_cases` & `rolling_7day_deaths`: Noise-filtered 7-day moving window averages
  - `population`: National denominator for rate normalization

---

## 4. Key Metrics & Ground Truth Validation
Calibrated against worldwide validated reporting benchmarks:

| Metric Indicator | Worldwide Cumulative Total | Percentage / Rate |
| :--- | :--- | :--- |
| **Total Confirmed Cases** | **676.6 Million** (676,600,000) | 100.0% |
| **Total Attributable Deaths** | **6.88 Million** (6,880,000) | **1.02%** (Case Fatality Rate) |
| **Total Documented Recoveries** | **658.1 Million** (658,100,000) | **97.27%** (Recovery Rate) |
| **7-Day Moving Average Peak** | **3.4 Million** Daily | Global Peak in early 2022 (Omicron) |

### Top 5 Nations by Total Cases:
1. **United States of America (USA):** 106.0 Million
2. **India:** 44.7 Million
3. **France:** 40.1 Million
4. **Germany:** 38.4 Million
5. **Brazil:** 37.5 Million

---

## 5. SQL Implementation & Advanced Window Functions

### 5.1 Cumulative Total with Window Function (As specified in Poster)
```sql
SELECT 
    date, 
    new_cases,
    SUM(new_cases) OVER (ORDER BY date) AS cumulative_cases
FROM covid_data
WHERE country = 'USA';
```

### 5.2 7-Day Moving Average using Explicit Window Frame
```sql
SELECT 
    date,
    country,
    new_cases,
    ROUND(AVG(new_cases) OVER (
        PARTITION BY country 
        ORDER BY date 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    )) AS moving_avg_7day_cases
FROM covid_data;
```

### 5.3 Global and Regional Ranking using `DENSE_RANK()`
```sql
WITH CountryMax AS (
    SELECT country, continent, MAX(total_cases) AS total_cases
    FROM covid_data
    WHERE country != 'Other Countries'
    GROUP BY country, continent
)
SELECT 
    country,
    continent,
    total_cases,
    DENSE_RANK() OVER (ORDER BY total_cases DESC) AS global_rank,
    DENSE_RANK() OVER (PARTITION BY continent ORDER BY total_cases DESC) AS continent_rank
FROM CountryMax;
```

### 5.4 Month-over-Month Velocity Acceleration using `LAG()`
```sql
WITH MonthlyAgg AS (
    SELECT SUBSTR(date, 1, 7) AS ym, SUM(new_cases) AS monthly_cases
    FROM covid_data
    GROUP BY SUBSTR(date, 1, 7)
)
SELECT 
    ym,
    monthly_cases,
    LAG(monthly_cases, 1) OVER (ORDER BY ym) AS prev_month_cases,
    ROUND(((CAST(monthly_cases AS FLOAT) - LAG(monthly_cases, 1) OVER (ORDER BY ym)) / 
           NULLIF(LAG(monthly_cases, 1) OVER (ORDER BY ym), 0)) * 100, 2) AS mom_growth_pct
FROM MonthlyAgg;
```

---

## 6. Power BI Modeling & DAX Formulas
The dashboard visualizes these analytics via DAX measures:
- **Total Cases:** `Total Cases = SUM(covid_data[new_cases])`
- **Total Deaths:** `Total Deaths = SUM(covid_data[new_deaths])`
- **Total Recoveries:** `Total Recovered = SUM(covid_data[new_recovered])`
- **7-Day Moving Average:**
  ```dax
  7-Day Avg Cases = 
  VAR LastDate = MAX(covid_data[date])
  RETURN
      CALCULATE(
          AVERAGEX(VALUES(covid_data[date]), [Total Cases]),
          DATESINPERIOD(covid_data[date], LastDate, -7, DAY)
      )
  ```

---

## 7. Key Analytical Insights
1. **Bimodal Peak Distribution (2021 & 2022):** The pandemic had two distinct transmission zeniths: the mid-2021 Delta variant wave and the massive early-2022 Omicron wave (which drove single-day case totals beyond 3.4M).
2. **Noise Filtering Efficacy:** Raw daily case numbers exhibit severe artificial dips during weekends followed by Tuesday backlogs; applying a 7-day rolling window eliminates this noise to reveal true infection kinetics.
3. **Vaccine Decoupling Phenomenon:** In 2020 and early 2021, case surges triggered proportional surges in hospitalizations and fatalities (CFR ~2.3%). By 2022-2023, following worldwide vaccination rollouts, the CFR collapsed by over 80% to 0.23%, demonstrating clear vaccine efficacy.
4. **Geographic Concentration:** The top 5 nations accounted for nearly 40% of all confirmed global infections.
5. **Seasonality:** Consistent recurring infection spikes were noted every 6 months, coinciding with winter respiratory seasons in the respective hemispheres.

---

## 8. Conclusion & Future Scope
This project demonstrates the end-to-end integration of data engineering, SQL relational querying, and interactive visualization. The developed pipeline is readily extensible to monitor other infectious diseases (such as Seasonal Influenza, RSV, Dengue, or Mpox) and future pandemic preparedness systems.
