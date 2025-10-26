Simplified case study (short & actionable)
1 — What you’ve been given

A file Sales Case Study.csv with daily rows for one product. Each row has:

Date — day of sales

Sales — total R (Rand) value sold that day

Cost of Sales — total R cost that day

Quantity Sold — units sold that day

2 — Goal (in plain language)

Create clear metrics and insights that explain pricing, profitability and how promotions affect demand. Deliver numbers, short written conclusions and a few visuals/dashboards.

3 — Required metrics (what to compute)

For each day (and overall as requested):

Daily sales price per unit
Price_per_unit_day = Sales / Quantity_Sold

Average unit sales price (over the whole dataset or any chosen period)
Avg_price = mean(Price_per_unit_day)

Daily % gross profit (on total sales)
Gross_profit_R = Sales - Cost_of_Sales
Gross_profit_%_day = (Gross_profit_R / Sales) * 100

Daily % gross profit per unit
Gross_profit_per_unit = (Sales - Cost_of_Sales) / Quantity_Sold
Gross_profit_%_per_unit = (Gross_profit_per_unit / Price_per_unit_day) * 100

Promotion analysis (pick 3 promo periods)

Identify three date ranges where price dropped (or quantity spiked).

For each period, compute Price Elasticity of Demand (PED):
PED = (% change in Quantity) / (% change in Price)
Use midpoint formula for stability:
%ΔQ = (Q2 - Q1) / ((Q2 + Q1)/2) and %ΔP = (P2 - P1) / ((P2 + P1)/2)

Conclude: Does demand rise enough to increase revenue or profit when price is lower? (compare total Revenue and Gross Profit before vs during promo)

Anything else interesting

Seasonal patterns, weekday vs weekend differences, outliers, stockouts (if quantity = 0), correlation between price and quantity, top-selling days, etc.

4 — Suggested visuals & quick reports

Time series: Price per unit, Quantity sold and Gross profit over time (same chart or stacked small multiples).

Scatter plot: Price per unit vs Quantity sold (shows elasticity visually).

Bar / KPI cards: Average price, average margin %, total revenue, total gross profit.

Promo comparison: Small table or bar chart that compares Revenue, Units, Gross Profit for Before, During, After each promo.

Histogram: Distribution of daily prices or daily quantities.

Boxplot: Price by weekday (to check weekday effects).

5 — Recommended approach (quick steps)

Load CSV into Excel / Python (pandas) / Power BI.

Compute daily metrics (price, gross profit, %).

Plot time series to visually find promo windows (price drops or quantity spikes).

For 3 selected promo windows compute PED and compare revenue & profit vs baseline.

Summarise top 5 insights + 2–3 visualizations and recommended actions (e.g., run promos only when margin remains positive).

6 — Deliverables (what to hand in)

A short one-page summary with top 5 insights.

A table with computed daily metrics (price, gross profit, %).

Promo analysis: three periods, PED values, revenue & profit comparison, recommendation per period.

3–6 visuals (time series, scatter, promo comparison).

Optional: a dashboard file (Power BI / Excel) or notebook (Python/pandas + charts).

If you want, I can now:

produce the exact formulas in Excel, or

provide a ready-to-run pandas script to compute everything and make the charts, or


