# MISB ALSILA Supply Chain Dashboard

A single-file dashboard that turns stock and sales data into purchase-order (PO) suggestions:
how many cartons to order per item, how many 20ft/40ft containers that takes, and when it
would arrive. A companion Python script does the same calculation straight from the MISB
ALSILA Excel workbook.

```
supply_chain_dashboard.html   The dashboard. Open it in a browser; no install needed.
supply_chain_processor.py     Batch version: reads the workbook, writes PO CSV + JSON.
samples/                      Example inventory, sales and supplier CSVs to try the upload.
tests/                        Python unit tests and browser tests.
```

## Quick start

1. Double-click `supply_chain_dashboard.html`. It opens with built-in sample data.
2. Look around: **Inventory** shows stock status, **PO Generator** → *Generate PO* shows
   suggested orders, **Analytics** shows monthly sales trends.
3. To use your own data, go to **Dashboard** and upload your files (see [Data files](#data-files)).
   Try the files in `samples/` first to see what a good upload looks like.

Everything runs in your browser. Uploaded data is saved in that browser only (not sent
anywhere) and is still there next time you open the file. **Reset to sample data** removes it.

## The tabs

| Tab | What it does |
|---|---|
| **Dashboard** | Upload files, see how many items are in each stock status, download CSV templates. |
| **Inventory** | Stock, average daily sales and days of stock per item, filterable by supplier. The two sliders set the planning days used for POs. |
| **PO Generator** | Suggested POs grouped by supplier, with container plan, fill %, CBM, lead time and arrival date. Filter by supplier and **Export CSV** (the export matches what is shown). |
| **Analytics** | Average daily sales (and purchases, if the sales file has them) per month for one item or all items, with the rate currently used for POs as a dashed line. The *Trend by Item* table compares the first and last month. |
| **Settings** | The same planning days as the sliders, the container volumes used for estimates, and the supplier list. |

Settings and slider positions are saved in the browser too. Moving a slider recalculates
POs straight away.

## How the numbers are worked out

All quantities are in **cartons**.

**Average daily sales** = total sales in the sales file ÷ days the file covers (first to last
date, or the full calendar months listed). Days with no row count as zero sales.

**Days of stock** = current stock ÷ average daily sales.

| Status | Days of stock |
|---|---|
| CRITICAL | under 10 |
| LOW | 10 – 20 |
| OPTIMAL | 20 – 90 |
| HIGH | over 90 |
| NO SALES | item has no sales, so no PO is suggested |

**PO quantity**

```
Days needed  = inventory days + lead time + safety days          30 + 80 + 7 = 117
Required qty = avg daily sales × days needed, rounded UP to a     85 × 117 = 9,945 → 10,350
               multiple of MOQ                                    (23 × 450)
PO qty       = required qty − current stock (0 if negative)       10,350 − 2,500 = 7,850
```

Note the PO quantity itself is not rounded to the MOQ (7,850 above is not a multiple of 450).

**Containers.** Capacity is cartons per container, from the item's `20ft` / `40ft` values.
- If the item or its supplier has a container type, only that size is used.
- Otherwise 40ft containers are filled and a remainder that fits goes in one 20ft;
  a bigger remainder takes another 40ft.
- If an item has no capacity values, capacity is estimated as usable container volume ÷
  carton volume (defaults 28 m³ for 20ft and 58 m³ for 40ft, editable in Settings), and the
  PO shows **est.**

Example: 7,850 ÷ 2,100 per 40ft → 4 × 40ft, 93% full.

**CBM** = cartons × pieces per carton (`Base_Qty`) × CBM per piece.
Example: 7,850 × 24 × 0.00128 = 241.15 m³. (Check: 2,100 cartons × 24 × 0.00128 ≈ 64.5 m³,
about one 40ft container.) If you have volume per carton instead, use a `CBM_Per_Carton` column.

**Arrival date** = today + lead time.

## Data files

Upload CSV (comma, semicolon or tab separated) or Excel (`.xlsx`, `.xls`, `.xlsm`). Excel
needs an internet connection the first time, to load the Excel reader; CSV works fully offline.

- Column names are matched loosely: `Item Code`, `Item_Code` and `ItemCode` all work, and so do
  the MISB names such as `Qty(Ctn)`, `VendorCode`, `Transit Time(Days)`, `BaseQty`, `40ft`.
- The header row can be anywhere in the first 15 rows. In a workbook, the first sheet with the
  required columns is used.
- After each upload the box says what was loaded, which rows were skipped and why, and what was
  assumed (for example a missing MOQ treated as 1).

### Inventory (required)

```
Item_Code,Item_Name,Current_Qty,Supplier_Code,MOQ,Lead_Time,Container_Type,Base_Qty,CBM,20ft,40ft
321601,Richina Basil Seed-Mango-290ml X 24,2500,V20183,450,80,40ft,24,0.00128,1000,2100
120405,Farm Fresh Chakki Fresh (Atta)-5Kg X 4,2472,V20185,1000,7,20ft,4,0.025,,
```

| Column | Required | Notes |
|---|---|---|
| `Item_Code` | yes | |
| `Current_Qty` | yes | cartons. Also accepted: `Qty(Ctn)`, `Stock`, `Balance` |
| `Item_Name` | | |
| `Supplier_Code` / `Supplier_Name` | | links the item to a supplier |
| `MOQ` | | cartons; 1 if missing |
| `Lead_Time` | | days; overrides the supplier's lead time |
| `Container_Type` | | `20ft` or `40ft`; blank = mix as needed |
| `20ft`, `40ft` | | cartons per container |
| `Base_Qty`, `CBM` | | pieces per carton, CBM per piece (or `CBM_Per_Carton`) |
| `Avg_Daily` | | used only if there is no sales file |

### Sales (needed for POs)

```
Date,Item_Code,Purchases,Sales
2025-12-01,321601,1130,85
2025-12-02,321601,0,86
```

- Required: `Item_Code`, `Sales` (also accepted: `DEC`), and either `Date` or `Month`.
- Dates: `YYYY-MM-DD` or `DD/MM/YYYY` (03/04/2026 is 3 April). Months: `Feb 2026` or `2026-02`,
  one row per item per month.
- `Purchases` (or `INC`) is optional and only used for the Analytics chart.
- Use about the last 3 months, so the average reflects current demand.

### Suppliers (optional)

```
Supplier_Code,Supplier_Name,Lead_Time,Container_Type
V20183,YU DAT BS,80,40ft
V20185,Local Supplier A,7,20ft
```

Without this file, suppliers are taken from the inventory file and each item needs its own
`Lead_Time`.

## Python processor

For working directly from the workbook (`024_MISB_ALSILA_Supply_Chain_Final.xlsm`). It uses the
same rules as the dashboard, except it has no container-type column to read, so it always mixes
40ft + 20ft.

```bash
pip install -r requirements.txt
python supply_chain_processor.py 024_MISB_ALSILA_Supply_Chain_Final.xlsm \
    --inventory-days 30 --safety-days 7 --months 3
```

It writes `po_orders_export.csv` and JSON files in `./data/` (`--csv` and `--output-dir` change
these) and prints a summary.

Sheets it reads:

| Sheet | Header row | Used for |
|---|---|---|
| `ItemData` | 1 | `Item Code`, `Item Name`, `BaseQty`, `40ft`, `20ft`, `cbm`, `Supplier Name`, `VendorCode`, `MOQ`, `Transit Time(Days)` |
| `MisbWH` | 2 | current stock: `Item Code`, `Qty(Ctn)` |
| `LocalItemReport` | 4 | sales: `Code`, then `BAL` / `INC` / `DEC` columns repeated once per month; the last `--months` `DEC` columns are averaged (30 days per month) |

## Tests

```bash
python -m unittest discover tests      # Python processor (needs requirements.txt)
npm install && npm test                # dashboard in a headless browser (needs Node 18+)
```

`npm install` downloads Playwright; run `npx playwright install chromium` once if you don't
already have a Playwright browser, or set `CHROMIUM_PATH` to an existing Chromium.

## Good practice

- Upload fresh inventory at least weekly, and before every ordering round.
- Check CRITICAL and LOW items first; review every PO before sending it to a supplier.
- Watch for **est.** container plans and fill % well under 100%. Adding the real 20ft/40ft
  capacities to the inventory file makes container plans exact.
- Compare actual supplier lead times with the ones in your files every few months.
