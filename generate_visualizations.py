"""
========================================================================================
PROJECT: COVID-19 Disease Trend Analysis
VISUALIZATION SUITE: Matplotlib & Seaborn Chart Generator
Matches the exact visual charts in the Power BI & Python poster
AUTHOR: Anuj Kumar Kushwaha (Roll No: 250321540033)
========================================================================================
"""

import os
import pandas as pd
import numpy as np

def generate_charts():
    try:
        import matplotlib.pyplot as plt
        import matplotlib.ticker as ticker
        import matplotlib.dates as mdates
        import seaborn as sns
    except ImportError:
        print("Matplotlib / Seaborn not installed in current environment.")
        print("Run `pip install -r requirements.txt` to execute chart generation.")
        return

    # Theme setup (matching modern dark/navy dashboard theme)
    plt.style.use('dark_background')
    plt.rcParams['font.sans-serif'] = 'Arial'
    plt.rcParams['axes.edgecolor'] = '#334155'
    plt.rcParams['axes.linewidth'] = 0.8

    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    data_path = os.path.join(project_root, "dataset", "covid_data_cleaned.csv")
    out_dir = os.path.join(base_dir, "figures")
    os.makedirs(out_dir, exist_ok=True)

    df = pd.read_csv(data_path)
    df['date'] = pd.to_datetime(df['date'])

    # Global daily aggregation
    df_global = df.groupby('date').agg({
        'new_cases': 'sum',
        'rolling_7day_cases': 'sum',
        'new_deaths': 'sum',
        'rolling_7day_deaths': 'sum',
        'total_cases': 'sum'
    }).reset_index()

    # -------------------------------------------------------------------------
    # CHART 1: Daily Cases vs 7-Day Moving Average
    # -------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(12, 5), dpi=300, facecolor='#0f172a')
    ax.set_facecolor('#0f172a')
    ax.plot(df_global['date'], df_global['new_cases'] / 1e6, color='#38bdf8', alpha=0.45, linewidth=1, label='Daily Cases')
    ax.plot(df_global['date'], df_global['rolling_7day_cases'] / 1e6, color='#f59e0b', linewidth=2.2, label='7-Day Average')
    ax.set_title('Daily Cases and 7-Day Moving Average (2020 - 2023)', fontsize=14, fontweight='bold', color='#f8fafc', pad=15)
    ax.set_ylabel('Cases (Millions)', color='#94a3b8', fontsize=11)
    ax.xaxis.set_major_locator(mdates.YearLocator())
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y'))
    ax.grid(True, linestyle='--', alpha=0.2, color='#64748b')
    ax.legend(facecolor='#1e293b', edgecolor='#334155', loc='upper left')
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'daily_cases_and_7day_avg.png'))
    plt.close()
    print("✓ Generated: daily_cases_and_7day_avg.png")

    # -------------------------------------------------------------------------
    # CHART 2: Cumulative Cases Trend
    # -------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 4.5), dpi=300, facecolor='#0f172a')
    ax.set_facecolor('#0f172a')
    # Compute true global cumulative sum
    df_global['cumulative_cases'] = df_global['new_cases'].cumsum() / 1e6
    ax.plot(df_global['date'], df_global['cumulative_cases'], color='#38bdf8', linewidth=2.8)
    ax.set_title('Cumulative Cases Trend (2020 - 2023)', fontsize=13, fontweight='bold', color='#f8fafc', pad=12)
    ax.set_ylabel('Total Cases (Millions)', color='#94a3b8', fontsize=11)
    ax.yaxis.set_major_formatter(ticker.FormatStrFormatter('%dM'))
    ax.xaxis.set_major_locator(mdates.YearLocator())
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y'))
    ax.grid(True, linestyle='--', alpha=0.2, color='#64748b')
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'cumulative_cases_trend.png'))
    plt.close()
    print("✓ Generated: cumulative_cases_trend.png")

    # -------------------------------------------------------------------------
    # CHART 3: Country Comparison (Horizontal Bar Chart)
    # -------------------------------------------------------------------------
    latest_date = df['date'].max()
    df_country = df[(df['date'] == latest_date) & (df['country'] != 'Other Countries')].sort_values('total_cases', ascending=True).tail(5)

    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=300, facecolor='#0f172a')
    ax.set_facecolor('#0f172a')
    bars = ax.barh(df_country['country'], df_country['total_cases'] / 1e6, color='#2563eb', height=0.6)
    ax.set_title('Country Comparison - Top Cases', fontsize=13, fontweight='bold', color='#f8fafc', pad=12)
    ax.set_xlabel('Confirmed Cases (Millions)', color='#94a3b8', fontsize=11)
    for bar in bars:
        w = bar.get_width()
        ax.text(w + 1.5, bar.get_y() + bar.get_height()/2, f'{int(round(w))}M', va='center', color='#f8fafc', fontweight='bold', fontsize=10)
    ax.set_xlim(0, 120)
    ax.grid(axis='x', linestyle='--', alpha=0.2, color='#64748b')
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'country_comparison.png'))
    plt.close()
    print("✓ Generated: country_comparison.png")

    # -------------------------------------------------------------------------
    # CHART 4: Death Trend
    # -------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 4.5), dpi=300, facecolor='#0f172a')
    ax.set_facecolor('#0f172a')
    ax.plot(df_global['date'], df_global['rolling_7day_deaths'], color='#ef4444', linewidth=2.2)
    ax.set_title('Global Daily Death Trend (7-Day Avg)', fontsize=13, fontweight='bold', color='#f8fafc', pad=12)
    ax.set_ylabel('Deaths / Day', color='#94a3b8', fontsize=11)
    ax.xaxis.set_major_locator(mdates.YearLocator())
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y'))
    ax.grid(True, linestyle='--', alpha=0.2, color='#64748b')
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'death_trend.png'))
    plt.close()
    print("✓ Generated: death_trend.png")

if __name__ == "__main__":
    generate_charts()
