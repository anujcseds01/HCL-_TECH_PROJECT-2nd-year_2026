# 🦠 COVID-19 Disease Trend Analysis
### End-to-End Analytics with Python, SQL, and Power BI

<p align="center">
  <img src="assets/covid_trend_poster.jpg" alt="COVID-19 Disease Trend Analysis Poster" width="850">
</p>

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![SQL](https://img.shields.io/badge/SQL-Window_Functions-orange.svg?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Power BI](https://img.shields.io/badge/Power_BI-Executive_Dashboard-yellow.svg?logo=powerbi&logoColor=black)](https://powerbi.microsoft.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v24%2B-green.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

> *"Analyse Today... Be Prepared Tomorrow..."*

---

## 👨‍🎓 Project Credits & Attribution
- **Student Name:** **Anuj Kumar Kushwaha**
- **Roll Number:** **250321540033**
- **College:** **ABES Engineering College, Ghaziabad**
- **Project Features:** Data Cleaning | Trend Analysis | SQL Window Functions | Interactive Dashboard | Data Validation

---

## 📌 Project Overview
The **COVID-19 Disease Trend Analysis** project analyzes global pandemic epidemiological data (2020–2023) sourced from **Our World in Data (WHO)**. The project integrates a complete modern data stack:
1. **Python (Pandas, NumPy, Matplotlib):** For automated data cleaning, handling null values, calculating 7-day moving averages, and cumulative totals.
2. **SQL (MySQL / SQLite / PostgreSQL):** For relational modeling and advanced window calculations (`SUM() OVER`, `AVG() OVER ROWS BETWEEN`, `DENSE_RANK()`, `LAG()`).
3. **Power BI & Interactive Web Dashboard:** Executive dark-themed dashboards with live KPI cards, time intelligence, dynamic slicers, and trend visualizers.

---

## 📊 Executive Dashboard Key Performance Indicators (KPIs)

| KPI Metric Card | Value | Trajectory Indicator | Significance |
| :--- | :--- | :--- | :--- |
| **Total Cases** | **676.6M** | ▲ `+12.5%` | Worldwide confirmed infections |
| **Total Deaths** | **6.88M** | ▲ `+8.3%` | Overall mortality (1.02% CFR) |
| **Recovered** | **658.1M** | ▲ `+11.9%` | Resolved infections (97.27% recovery) |
| **7-Day Avg Peak** | **3.4M** | ▲ `+7.2%` | Peak single-day worldwide transmission |

### Top 5 Nations by Infection Volume
- **USA:** 106.0M
- **India:** 44.7M
- **France:** 40.1M
- **Germany:** 38.4M
- **Brazil:** 37.5M

---

## 🏗️ Project Architecture & Directory Structure

```
COVID-19-Disease-Trend-Analysis/
├── dataset/
│   ├── covid_data_cleaned.csv            # 16,071 cleaned records (2020-2023)
│   ├── covid_data_raw.csv                # Raw WHO/OWID data with nulls & formats
│   ├── daily_global_trends.json          # Daily timeseries aggregates
│   ├── dataset_summary.json              # Calibrated global totals & metadata
│   └── generate_dataset.js               # Mathematical wave & data generator
│
├── python/
│   ├── covid_analysis.py                 # Full Python ETL, cleaning & stats
│   ├── generate_visualizations.py        # Matplotlib/Seaborn dark-mode charts
│   ├── covid_analysis_notebook.ipynb     # Jupyter Notebook for lab/submission
│   └── requirements.txt                  # Python dependencies
│
├── sql/
│   ├── schema.sql                        # DDL for SQLite, MySQL, and PostgreSQL
│   ├── analysis_queries.sql              # Advanced queries & window functions
│   ├── run_sql_analysis.js               # Node.js runner executing queries
│   └── covid_database.db                 # Populated SQLite database (2.1 MB)
│
├── power_bi/
│   ├── dax_measures.dax                  # Complete DAX formulas for Power BI
│   ├── power_query_transformations.m     # Power Query ETL M script
│   └── POWER_BI_GUIDE.md                 # Step-by-step .pbix construction guide
│
├── web_dashboard/
│   ├── index.html                        # Pixel-perfect Power BI replica UI
│   ├── style.css                         # Dark navy executive styling
│   ├── app.js                            # Chart.js controller & dynamic slicers
│   ├── data.js                           # Pre-bundled offline dataset cache
│   └── server.js                         # Lightweight Node API & static server
│
├── docs/
│   ├── PROJECT_REPORT.md                 # Academic report ready for submission
│   └── VIVA_QUESTIONS_AND_ANSWERS.md     # 20 Viva questions & answers
│
├── package.json                          # NPM run scripts
└── README.md                             # Documentation & user guide
```

---

## 🚀 How to Run the Project

### Option 1: Instant Browser View (Zero Setup)
Simply open the interactive dashboard file in any modern web browser:
```bash
# Double-click or open directly in your browser:
web_dashboard/index.html
```
*Works completely offline with all charts, slicers, and SQL results pre-cached!*

---

### Option 2: Live Local Server (With Interactive SQL API)
Start the built-in Node.js server:
```bash
npm start
# or: node web_dashboard/server.js
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser:
- **Tab 1: Power BI Dashboard:** Live interactive charts, KPI cards, and dynamic slicers.
- **Tab 2: SQL Queries & Engine:** Live SQL editor executing real queries against `sql/covid_database.db` with sub-millisecond execution times.
- **Tab 3: Python Analysis:** Interactive breakdown of the 4-stage data cleaning pipeline.
- **Tab 4: Project Overview & Poster:** Complete college blueprint and poster specs.

---

### Option 3: Execute SQL Analysis in Terminal
Run all 7 advanced SQL analytical queries and view formatted tabular outputs:
```bash
npm run run-sql
# or: node sql/run_sql_analysis.js
```

---

### Option 4: Python Analysis & Jupyter Notebook
1. Install Python packages:
   ```bash
   pip install -r python/requirements.txt
   ```
2. Run automated analysis:
   ```bash
   python python/covid_analysis.py
   ```
3. Open `python/covid_analysis_notebook.ipynb` in VS Code or JupyterLab.

---

### Option 5: Power BI Desktop Setup
Follow the complete step-by-step tutorial in **[power_bi/POWER_BI_GUIDE.md](power_bi/POWER_BI_GUIDE.md)** to load `covid_data_cleaned.csv` into Power BI Desktop and import the measures from `power_bi/dax_measures.dax`.

---

## 🔍 Key Findings & Insights
1. **Peak Years (2021 & 2022):** Transmission hit record highs during the mid-2021 Delta surge and early-2022 Omicron wave (peaking above 3.4M daily cases).
2. **Smoothing Weekly Noise:** The 7-day moving average effectively removes false weekend testing troughs and Tuesday reporting spikes.
3. **Vaccine Decoupling Impact:** In 2020–2021, spikes in cases caused severe surges in deaths (Case Fatality Rate ~2.3%). In 2022–2023, following global vaccinations, CFR dropped to **0.23%**, an 80%+ drop in mortality.
4. **Geographic Concentration:** USA and India experienced the highest total case burden.
5. **Clear Seasonality:** Recurring bi-annual wave patterns were recorded across the 4-year period.

---

## 🎓 Academic Presentation & Viva Voce
See **[docs/VIVA_QUESTIONS_AND_ANSWERS.md](docs/VIVA_QUESTIONS_AND_ANSWERS.md)** for a curated set of 20 questions and answers covering SQL Window Functions, Python pandas operations, DAX measures, and epidemiological interpretations.
