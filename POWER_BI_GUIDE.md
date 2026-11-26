# Power BI Dashboard Setup & Architecture Guide
## COVID-19 Disease Trend Analysis
**Author:** Anuj Kumar Kushwaha  
**Roll No:** 250321540033  
**Institution:** ABES Engineering College, Ghaziabad  
**Project Motto:** *"Analyse Today... Be Prepared Tomorrow..."*

---

## 1. Dashboard Layout & Theme Overview
The dashboard is designed according to the **Power BI Dashboard – COVID-19 Trends** layout from the project poster:

- **Canvas Background:** Dark Navy Blue (`#0b132b` or `#0f172a`)
- **Card Background:** Rounded Card Containers (`#1e293b`) with Subtle Cyan/White Borders
- **Color Palette:**
  - Cases / Primary Blue: `#38bdf8`
  - 7-Day Average / Orange: `#f59e0b`
  - Deaths / Red: `#ef4444`
  - Recovered / Green: `#10b981`
  - Accents / Purple: `#8b5cf6`

---

## 2. Step-by-Step Power BI Desktop Construction

### Step 1: Ingest Data
1. Launch **Power BI Desktop**.
2. Click **Get Data** -> **Text/CSV**.
3. Select `COVID-19-Disease-Trend-Analysis/dataset/covid_data_cleaned.csv`.
4. Click **Transform Data** (or paste `power_query_transformations.m` in Advanced Editor).
5. Click **Close & Apply**.

### Step 2: Create DAX Measures Table
1. In the Home Ribbon, click **Enter Data** and name the table `_Measures`.
2. Open `power_bi/dax_measures.dax`.
3. Add the following key measures:
   - `Total Cases`
   - `Total Deaths`
   - `Total Recovered`
   - `7-Day Avg Cases`
   - `Cumulative Cases Trend`
   - `Case Fatality Rate`
   - `Recovery Rate`

### Step 3: Configure Top KPI Metric Cards
Create 4 Card / New Card visuals along the top banner:
1. **Total Cases Card:**
   - Field: `[Total Cases]` (Format display units as `Millions`, e.g. `676.6M`)
   - Accent: Blue icon + Subtitle indicator `▲ +12.5%`
2. **Total Deaths Card:**
   - Field: `[Total Deaths]` (Format display units as `Millions`, e.g. `6.88M`)
   - Accent: Red skull icon + Subtitle indicator `▲ +8.3%`
3. **Recovered Card:**
   - Field: `[Total Recovered]` (Format display units as `Millions`, e.g. `658.1M`)
   - Accent: Green heart icon + Subtitle indicator `▲ +11.9%`
4. **7-Day Avg Cases Card:**
   - Field: `[7-Day Avg Cases]` (Format display units as `Millions`, e.g. `3.4M`)
   - Accent: Purple bar icon + Subtitle indicator `▲ +7.2%`

### Step 4: Create the 5 Core Analytical Charts
1. **Daily Cases and 7-Day Moving Average (Line / Combo Chart):**
   - X-Axis: `covid_data[date]` (Continuous, Hierarchical 2020-2023)
   - Y-Axis: `SUM(new_cases)` (Light Blue line)
   - Secondary / Overlay Line: `[7-Day Avg Cases]` (Amber/Orange line)
2. **Cumulative Cases Trend (Area / Line Chart):**
   - X-Axis: `covid_data[date]`
   - Y-Axis: `[Cumulative Cases Trend]` (Gradient Cyan fill up to 750M)
3. **Country Comparison (Horizontal Clustered Bar Chart):**
   - Y-Axis: `covid_data[country]` (Top 5: USA, India, France, Germany, Brazil)
   - X-Axis: `[Total Cases]` (Data labels enabled showing `106M`, `44M`, `40M`, `38M`, `37M`)
4. **Weekly Cases (Column Chart):**
   - X-Axis: `covid_data[date]` (Binned weekly or `Year-Week`)
   - Y-Axis: `SUM(new_cases)` (Indigo bars reaching peaks up to 10M)
5. **Death Trend (Line Chart):**
   - X-Axis: `covid_data[date]`
   - Y-Axis: `SUM(new_deaths)` (Smooth Crimson Red line showing 2020-2021 surge and 2022-2023 drop)

### Step 5: Slicers / Interactive Filters
Add 3 Dropdown Slicers at the bottom:
- **Country:** `covid_data[country]` (Default: *All*)
- **Date Range:** `covid_data[date]` (Date Slider: *2020 - 2023*)
- **Region:** `covid_data[continent]` (Default: *All*)

---

## 3. Web Dashboard Alternative
To preview this exact dashboard immediately in your browser without needing Power BI Desktop installed, run the bundled interactive web dashboard:
```bash
node web_dashboard/server.js
```
Open `http://localhost:3000` in any web browser!
