// ============================================================================
// PROJECT: COVID-19 Disease Trend Analysis
// POWER QUERY (M) ETL SCRIPT
// AUTHOR: Anuj Kumar Kushwaha (Roll No: 250321540033)
// ============================================================================

let
    // 1. Load Cleaned CSV Source
    Source = Csv.Document(
        File.Contents("C:\Users\anujk\OneDrive\Desktop\FSD Workshop1\COVID-19-Disease-Trend-Analysis\dataset\covid_data_cleaned.csv"),
        [Delimiter=",", Columns=14, Encoding=65001, QuoteStyle=QuoteStyle.None]
    ),
    
    // 2. Promote First Row as Headers
    PromoteHeaders = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    
    // 3. Strongly Type Schema
    TypedColumns = Table.TransformColumnTypes(PromoteHeaders,{
        {"date", type date},
        {"country", type text},
        {"iso_code", type text},
        {"continent", type text},
        {"new_cases", Int64.Type},
        {"total_cases", Int64.Type},
        {"new_deaths", Int64.Type},
        {"total_deaths", Int64.Type},
        {"new_recovered", Int64.Type},
        {"total_recovered", Int64.Type},
        {"active_cases", Int64.Type},
        {"rolling_7day_cases", Int64.Type},
        {"rolling_7day_deaths", Int64.Type},
        {"population", Int64.Type}
    }),
    
    // 4. Add Year, Month, and Week Columns for Hierarchical Slicing
    AddYear = Table.AddColumn(TypedColumns, "Year", each Date.Year([date]), Int64.Type),
    AddMonthName = Table.AddColumn(AddYear, "Month Name", each Date.MonthName([date]), type text),
    AddMonthNum = Table.AddColumn(AddMonthName, "Month Number", each Date.Month([date]), Int64.Type),
    AddYearMonth = Table.AddColumn(AddMonthNum, "Year-Month", each Text.From([Year]) & "-" & Text.PadStart(Text.From([Month Number]), 2, "0"), type text),
    AddWeekOfYear = Table.AddColumn(AddYearMonth, "Week Number", each Date.WeekOfYear([date]), Int64.Type),
    
    // 5. Replace Any Negative or Null Anomalies
    CleanedData = Table.ReplaceValue(AddWeekOfYear, null, 0, Replacer.ReplaceValue, {"new_cases", "new_deaths", "new_recovered"})
in
    CleanedData
