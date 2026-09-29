# 🎉 HTML Dashboard - Quick Start Guide

## What You Have

**File:** `supply_chain_dashboard.html`
- Single HTML file - no installation needed
- Works in any web browser
- All CSS and JavaScript built-in
- Ready to use immediately

---

## How to Use

### Step 1: Open the File
1. Find `supply_chain_dashboard.html` on your computer
2. Double-click it
3. Browser opens automatically
4. Dashboard loads with sample data

**OR**
- Right-click the file → "Open with" → Choose your browser

---

## Dashboard Features

### 5 Main Tabs

#### 🏠 DASHBOARD Tab
- **What you see:**
  - File upload boxes (for your CSV files)
  - Quick stats (Total Items, Suppliers, Pending POs, Critical Items)
  - Inventory status summary with color-coded indicators

- **Actions:**
  - Upload your sales data
  - Upload your inventory
  - Review overall health

#### 📦 INVENTORY Tab
- **What you see:**
  - List of all items with current stock
  - Days supply remaining
  - Color-coded status
  - Supplier information

- **Controls:**
  - Filter by supplier (dropdown)
  - Adjust "Days Inventory Needed" (slider)
  - Adjust "Days Safety Stock" (slider)

- **Color Indicators:**
  - 🔴 CRITICAL (red) = Order immediately
  - 🟠 LOW (orange) = Order this week
  - 🟢 OPTIMAL (green) = Normal situation
  - 🔵 HIGH (blue) = May be overstocked

#### 🛒 PO GENERATOR Tab
- **What you see:**
  - "Generate PO" button
  - Table of created purchase orders
  - PO details (Item, Qty, Containers, CBM, Supplier, Delivery Date)

- **Actions:**
  1. Click "Generate PO" button
  2. Dashboard calculates all quantities automatically
  3. Review the PO table
  4. Print or copy for your suppliers

- **Information Shown:**
  - PO ID (unique identifier)
  - Item Code and Name
  - Required Quantity
  - Container Type (20ft or 40ft)
  - CBM (cargo space needed)
  - Supplier Name
  - Lead Time
  - Required Delivery Date
  - Status

#### 📊 ANALYTICS Tab
- **What you see:**
  - 4-month sales trends per item
  - Purchase vs sales comparison
  - Monthly balance tracking
  - Visual breakdown

- **Use for:**
  - Identifying trends (sales going up/down)
  - Planning for seasonal changes
  - Validating average daily sales

#### ⚙️ SETTINGS Tab
- **What you see:**
  - Default Inventory Days setting
  - Default Safety Stock Days setting
  - List of all suppliers and their lead times

- **Actions:**
  - Adjust company-wide defaults
  - Review supplier information
  - Update settings for your business policy

---

## The 4 Status Colors Explained

| Color | Status | Meaning | Action |
|-------|--------|---------|--------|
| 🔴 Red | CRITICAL | Less than 10 days of stock | **Order immediately** |
| 🟠 Orange | LOW | 10-20 days of stock | **Order this week** |
| 🟢 Green | OPTIMAL | 20-90 days of stock | **Normal - monitor** |
| 🔵 Blue | HIGH | More than 90 days | **May be overstocked** |

---

## How PO Quantities Are Calculated

The dashboard uses this formula:

```
Total Days Needed = Inventory Days + Supplier Lead Time + Safety Days

Example:
- Inventory Days: 30 (you control this)
- Lead Time: 80 days (from Vietnam supplier)
- Safety Stock: 7 days (you control this)
- Total: 30 + 80 + 7 = 117 days

Required Quantity = (Average Daily Sales × 117) ÷ MOQ × MOQ

Example:
- Average Daily Sales: 85 units/day
- MOQ: 450 units
- Calculation: (85 × 117) ÷ 450 = 22.1 → rounds to 23 × 450 = 10,350 units
- Current Stock: 2,500 units
- PO Quantity: 10,350 - 2,500 = 7,850 units
- Containers: 7,850 ÷ 2,100 per 40ft = 3.7 → need 4 containers
- Total CBM: 7,850 ctn × 24 pcs × 0.00128 = 241.15 CBM
```

---

## Step-by-Step: How to Create a PO

### Method 1: Quick Start (Using Sample Data)
1. Open `supply_chain_dashboard.html`
2. Go to **INVENTORY** tab
3. Review the items and their status
4. Go to **PO GENERATOR** tab
5. Click **"Generate PO"** button
6. Review the generated PO table
7. Copy/print for your suppliers

### Method 2: With Your Own Data
1. Prepare your data in CSV format (see below)
2. Click file upload on **DASHBOARD** tab
3. Upload your sales data
4. Upload your inventory
5. Follow steps 3-7 above

---

## CSV File Format

You can upload `.csv` files (comma, semicolon or tab separated) or Excel files (`.xlsx`, `.xls`,
`.xlsm`). Excel files need an internet connection the first time, to load the Excel reader; CSV
works fully offline. Column names are matched loosely (`Item Code`, `Item_Code` and `ItemCode`
all work), the header row can be anywhere in the first 15 rows, and in a workbook the first sheet
with the required columns is used. The **CSV templates** links on the Dashboard tab download
ready-to-fill examples.

After each upload the box shows what was loaded, any rows that were skipped and why, and any
assumptions made (for example a missing MOQ treated as 1).

All quantities are in **cartons**.

### Inventory Format
Save as: `inventory_current.csv`

```
Item_Code,Item_Name,Current_Qty,Supplier_Code,MOQ,Lead_Time,Container_Type,Base_Qty,CBM,20ft,40ft
321601,Richina Basil Seed-Mango,2500,V20183,450,80,40ft,24,0.00128,1000,2100
120405,Farm Fresh Chakki Fresh,2472,V20185,1000,7,20ft,4,0.025,,
```

- Required: `Item_Code`, `Current_Qty` (also accepted: `Qty(Ctn)`, `Stock`, `Balance`)
- `Lead_Time` can be left out if you upload a suppliers file
- `20ft` / `40ft` = cartons per container. If blank, capacity is estimated from `CBM` × `Base_Qty`
  (CBM per piece × pieces per carton) or `CBM_Per_Carton`
- `Container_Type` blank = mix 40ft and 20ft as needed
- An `Avg_Daily` column can be used instead of a sales file

### Sales Data Format
Save as: `sales_data.csv`

```
Date,Item_Code,Sales
2026-02-01,321601,1200
2026-02-02,321601,950
2026-02-03,321601,850
```

- Required: `Item_Code`, `Sales` (also accepted: `DEC`), and `Date` or `Month`
- Dates: `YYYY-MM-DD` or `DD/MM/YYYY`. Months: `Feb 2026` or `2026-02` (one row per item per month)
- Average daily sales = total sales ÷ days covered by the whole file (first to last date, or the
  full calendar months listed), so days with no row count as zero sales
- Other columns (Purchases, Balance, Item_Name) are ignored

### Suppliers Format (optional)
Save as: `suppliers.csv`

```
Supplier_Code,Supplier_Name,Lead_Time,Container_Type
V20183,YU DAT BS,80,40ft
V20185,Local Supplier A,7,20ft
```

A lead time on the inventory row takes priority over the supplier's lead time.

---

## Sample Data Included

The dashboard comes with sample data so you can explore immediately:

**Items:**
1. Richina Basil Seed-Mango (80 day lead time from Vietnam)
2. Richina Basil Seed-Strawberry (80 day lead time from Vietnam)
3. Richina Air Kelapa (60 day lead time from Vietnam)
4. Gear Energy Drinks (80 day lead time from Vietnam)
5. Farm Fresh Chakki Fresh (7 day lead time - Local)

**Suppliers:**
1. YU DAT BS (Vietnam, 80 days lead time, 40ft containers)
2. YU DAT CJ (Vietnam, 60 days lead time, 40ft containers)
3. Local Supplier A (Malaysia, 7 days lead time, 20ft containers)
4. Local Supplier B (Malaysia, 5 days lead time, 20ft containers)

---

## Adjusting the Sliders

### Days Inventory Needed (7-90 days)
**What it controls:** How many days of inventory you want to keep

**Examples:**
- **Fast-moving items:** 15-20 days
- **Medium items:** 25-35 days
- **Slow-moving items:** 40-60 days
- **For Vietnam suppliers:** 35-40 days (long lead time)

**What happens when you adjust:**
- Increase → PO quantities get LARGER
- Decrease → PO quantities get SMALLER

### Days Safety Stock (3-30 days)
**What it controls:** Minimum buffer stock to prevent stockouts

**Examples:**
- **Reliable suppliers:** 3-7 days
- **New suppliers:** 10-15 days
- **Unreliable suppliers:** 20-30 days

**What happens when you adjust:**
- Increase → PO quantities get LARGER
- Decrease → PO quantities get SMALLER

---

## Useful Tips

### Tip 1: Start with Sample Data
Before uploading your data:
1. Play with the sliders
2. Click "Generate PO" a few times
3. See how changes affect quantities
4. Understand the system

### Tip 2: Filter by Supplier
On **INVENTORY** tab:
1. Use "Filter by Supplier" dropdown
2. Select one supplier
3. See only their items
4. Identify patterns
5. Plan supplier orders together

### Tip 3: Check Analytics First
Before generating POs:
1. Go to **ANALYTICS** tab
2. Look at sales trends
3. See if demand is increasing/decreasing
4. Adjust your "Days Inventory Needed" accordingly

### Tip 4: Update Regularly
For best results:
- Export inventory **daily**
- Upload to dashboard **daily**
- Generate POs **weekly**
- Keep data current

### Tip 5: Use Color Codes
- If you see 🔴 RED → Order IMMEDIATELY
- If you see 🟠 ORANGE → Order THIS WEEK
- If you see 🟢 GREEN → Normal, monitor
- If you see 🔵 BLUE → May be too much stock

---

## Keyboard Shortcuts

| Action | How |
|--------|-----|
| Switch tabs | Click tab buttons or press Tab key |
| Adjust slider | Click and drag or use arrow keys |
| Select from dropdown | Click dropdown and choose option |
| Generate PO | Click button or press Enter |

---

## Browser Compatibility

**Works with:**
- ✅ Google Chrome (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Microsoft Edge
- ✅ Opera

**Requirements:**
- Modern browser (made in last 5 years)
- Internet NOT required (works offline)
- JavaScript enabled (usually default)

---

## Troubleshooting

### Problem: Dashboard won't open
**Solution:**
1. Make sure you're clicking the HTML file (not opening in text editor)
2. Try right-click → "Open with" → Choose your browser
3. Try a different browser (Chrome is best)

### Problem: Sliders won't move
**Solution:**
- Click and drag the slider
- Or use arrow keys after clicking the slider

### Problem: File upload not working
**Solution:**
- This is for future CSV upload feature
- Currently uses sample data for demo
- Will work when integrated with your system

### Problem: PO quantities look wrong
**Solution:**
1. Check "Days Inventory Needed" value
2. Check supplier lead time in SETTINGS
3. Verify average daily sales calculation
4. Check MOQ value

### Problem: Colors not showing
**Solution:**
- Try different browser
- Clear browser cache (Ctrl+Shift+Del)
- Refresh page (F5)

---

## Weekly Workflow with HTML Dashboard

### Monday
1. Open dashboard
2. Review DASHBOARD tab
3. Check for 🔴 RED items
4. Note any critical items

### Tuesday-Wednesday
1. Go to INVENTORY tab
2. Filter by first supplier
3. Adjust sliders if needed
4. Go to PO GENERATOR
5. Click "Generate PO"
6. Review results
7. Repeat for other suppliers

### Thursday
1. Export/print generated POs
2. Send to suppliers
3. Update tracking spreadsheet

### Friday
1. Receive shipments
2. Update inventory quantities
3. Plan next week

---

## Moving to Real Data

When ready to use your actual data:

1. **Export from your system:**
   - Last 3 months sales data
   - Current inventory counts
   - Supplier information

2. **Format as CSV files:**
   - Follow the format shown above
   - Save with .csv extension
   - Use simple column names

3. **Upload to Dashboard:**
   - Click file upload on DASHBOARD tab
   - Upload sales data
   - Upload inventory data

4. **System will calculate everything:**
   - Average daily sales
   - Days supply
   - Required PO quantities
   - Container allocations

---

## Support & Help

**If you need help:**
1. Read this guide completely
2. Review the QUICK_REFERENCE.md file
3. Check IMPLEMENTATION_GUIDE.md
4. See MISB_ALSILA_Analysis.md for technical details

**For questions:**
- About the HTML: This file is self-contained
- About your business: See other documentation files
- About data format: Check CSV examples above

---

## Customizing the Dashboard

The HTML file is editable. If you know HTML/CSS:

1. Right-click the HTML file
2. Select "Open with" → "Notepad" or "Code Editor"
3. Make changes
4. Save
5. Refresh browser

**Common customizations:**
- Change colors
- Add your company logo
- Modify column names
- Adjust slider ranges

---

## Performance Tips

For best performance:
- Use Chrome browser
- Don't open too many tabs
- Keep file sizes under 5MB
- Refresh every hour if using all day

---

## Data Privacy

Important notes:
- ✅ All data stays on your computer
- ✅ Nothing is sent to servers
- ✅ Works completely offline
- ✅ Safe to use with sensitive data
- ✅ No account or login needed

---

## Summary

**What you have:**
- Professional supply chain dashboard
- Works immediately, no setup needed
- Uses sample data for learning
- Ready for your real data
- Fast, offline, secure

**What to do next:**
1. Open the HTML file
2. Explore with sample data
3. Prepare your CSV files
4. Upload your data
5. Start generating POs

---

**Version:** 1.0 - HTML Edition
**Status:** Ready to Use
**Last Updated:** May 14, 2026

**Good luck! 🚀**
