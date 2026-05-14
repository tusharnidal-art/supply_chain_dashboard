# MISB ALSILA Supply Chain Dashboard - Quick Reference Guide

## Dashboard Overview

Your interactive dashboard has 5 main tabs for managing supply chain operations:

---

## 📊 Tab 1: DASHBOARD

### What it does
- Overview of entire supply chain status
- Upload your sales and inventory files
- Quick statistics at a glance

### How to use
1. **Upload Sales Data**
   - Click file upload box
   - Select CSV/XLSX with last 3 months data
   - Columns needed: Date, Item Code, Purchases, Sales, Balance

2. **Upload Current Inventory**
   - Click second upload box
   - Select current inventory file
   - Columns needed: Item Code, Qty, Supplier, Lead Time

3. **Read the Stats**
   - Total Items: How many SKUs you have
   - Active Suppliers: Number of vendors
   - Pending POs: Orders waiting to be created
   - Critical Items: Items running low on stock

### Key Indicator Colors
- 🔴 **Red numbers** = Urgent action needed
- 🟡 **Orange numbers** = Need attention soon
- 🟢 **Green numbers** = Healthy status
- 🔵 **Blue numbers** = Monitor situation

---

## 📦 Tab 2: INVENTORY

### What it does
- See all items with their current stock levels
- Identify which items need immediate orders
- Filter by supplier to see their products
- Adjust how many days of stock you want

### Key Settings on this Tab

**Filter by Supplier** (Dropdown)
- Select one vendor to see only their items
- Options: All Suppliers, YU DAT BS, YU DAT CJ, Local Supplier A, etc.
- Shows: Item codes, names, current stock, supplier contact

**Days Inventory Needed** (Slider: 7-90 days)
- How many days of inventory you want to keep
- Default: 30 days
- Increase for slower-moving items or uncertain demand
- Decrease for fast-moving items or cash constraints

**Days Safety Stock** (Slider: 3-30 days)
- Minimum buffer stock to prevent stockouts
- Default: 7 days
- Increase if supplier lead time is unpredictable
- Decrease if storage is expensive

### Table Columns Explained

| Column | Meaning | Example |
|--------|---------|---------|
| Item Code | Unique ID | 321601 |
| Item Name | Product name | Richina Basil Seed-Mango-290ml X 24 |
| Current Stock | How much you have now | 2,500 units |
| Avg Daily | Average daily sales | 85 units/day |
| Days Supply | How many days until empty | 29.4 days |
| Status | Color-coded health | OPTIMAL (green) |
| Supplier | Who supplies this | YU DAT BS |

### Status Colors Explained
- 🔴 **CRITICAL** (Red) = Less than 10 days supply → Order NOW
- 🟠 **LOW** (Orange) = 10-20 days supply → Order this week
- 🟢 **OPTIMAL** (Green) = 20-90 days supply → Normal situation
- 🔵 **HIGH** (Blue) = More than 90 days supply → May be overstocked

---

## 🛒 Tab 3: PO GENERATOR

### What it does
- Creates purchase orders automatically
- Calculates exact quantities needed
- Shows container requirements (20ft or 40ft)
- Determines delivery dates based on lead times

### How to use
1. **Adjust settings** (go to Settings tab first if needed)
   - Set inventory days you want
   - Set safety stock buffer
   - Choose which suppliers to order from

2. **Click "Generate PO" button** (blue button at top)
   - Dashboard calculates all quantities
   - Shows you what to order

3. **Review the PO table**
   - Check Item Code and Quantity
   - Verify Supplier and Lead Time
   - Look at Required Date (when it must arrive)

4. **Use the POs**
   - Print or download the table
   - Send to suppliers
   - Track status in "Status" column

### PO Table Columns

| Column | What it means |
|--------|---|
| PO ID | Unique purchase order number |
| Item | Which product to order |
| Qty | How many units to order |
| Container | 40ft or 20ft shipping container |
| CBM | Cubic meters (space used) |
| Supplier | Which vendor to order from |
| Lead Time | Days until delivery |
| Required Date | When this order must arrive |
| Status | Current stage (Pending/Ordered/In Transit/Delivered) |

### How Quantities Are Calculated

```
Formula: (Average Daily Sales × Days Needed) ÷ MOQ × MOQ

Example:
- Average daily sales: 100 units/day
- Days needed: 30 (inventory) + 80 (lead time) = 110 days
- MOQ (minimum order): 450 units
- Calculation: (100 × 110) ÷ 450 = 24.4 → rounds to 25 × 450 = 11,250 units
- Container: 11,250 ÷ 2,100 = 5.36 → need 6 containers (40ft)
```

---

## 📈 Tab 4: ANALYTICS

### What it does
- Shows sales patterns over last 4 months
- Compares purchases vs. sales
- Identifies trends

### What you see
For each item:
- **Total Sales** (Red arrow down) = How much was sold
- **Total Purchase** (Blue arrow up) = How much was ordered
- **Monthly Breakdown** = Sales per month with balances

### How to interpret
- If Sales > Purchases = Stock is decreasing (may need to order more)
- If Purchases > Sales = Stock is accumulating (may be overstocked)
- If trend is increasing = Demand is growing (prepare for higher orders)
- If trend is flat = Steady demand (safe to use average)

### Actions to take
- **Increasing trend** → Increase inventory days setting
- **Decreasing trend** → Decrease inventory days setting
- **Spiky sales** → Increase safety stock days
- **Stable sales** → Can reduce safety stock days

---

## ⚙️ Tab 5: SETTINGS

### What it does
- Configure default settings for all calculations
- View all supplier information
- Adjust company-wide inventory policies

### Configuration Options

**Default Inventory Days** (Default: 30)
- How many days of stock to normally maintain
- Affects all PO calculations
- Industry standards: 15-45 days

**Default Safety Stock Days** (Default: 7)
- Minimum buffer to prevent stockouts
- For unpredictable suppliers: 15-30 days
- For reliable suppliers: 3-7 days

### Supplier Reference Table
Shows all suppliers with:
- Supplier Name and Code
- Lead Time (in days)
- Container Type (20ft or 40ft)

#### Understanding Lead Times
- **Local Suppliers:** 5-7 days (nearby sources)
- **Regional Suppliers:** 10-20 days (within country)
- **International (Vietnam):** 60-80 days (ship by sea)

---

## 🎯 Quick Decision Guide

### When Inventory Status is CRITICAL (Red)
```
Action: Urgent PO needed immediately
Steps:
1. Go to INVENTORY tab
2. Filter by the critical supplier
3. Go to PO GENERATOR tab
4. Generate PO
5. Send to supplier with "RUSH" request
6. Expect delivery in lead time days
```

### When Inventory Status is LOW (Orange)
```
Action: Create PO this week
Steps:
1. Plan for increased safety stock
2. Check 4-month sales trend (ANALYTICS tab)
3. Generate PO
4. Schedule delivery before critical
```

### When Inventory Status is HIGH (Blue)
```
Action: Consider why stock is high
Options:
1. Check if sales trend is down (ANALYTICS)
2. Might reduce next order quantity
3. Review supplier lead time assumptions
4. May need to adjust inventory days setting
```

---

## 💡 Pro Tips

### Tip 1: Use Sales Analytics First
- Always check ANALYTICS tab before generating PO
- Look for sales trends
- Adjust settings based on patterns

### Tip 2: Supplier Consolidation
- Filter by supplier on INVENTORY tab
- See if you can combine orders to reach bulk qty
- Saves shipping costs

### Tip 3: Container Optimization
- Watch CBM column in PO GENERATOR
- Try to fill containers efficiently
- Combine orders from same supplier

### Tip 4: Lead Time Buffer
- For 80-day suppliers: Increase inventory days to 35-40
- For 5-day suppliers: Can use 15-20 days
- Add extra days during holiday seasons

### Tip 5: Safety Stock Adjustment
- Increase for new/unreliable suppliers
- Decrease for proven, stable suppliers
- Review quarterly based on actual performance

---

## 📋 Sample Data Guide

### If Using Sample Data
The dashboard comes with sample data:
- 5 sample products from MISB
- 4 suppliers (Vietnam + Local)
- 3 months of sales history

### To Use Your Own Data
1. Export from your current system (ERP, Excel, Accounting)
2. Format as CSV with required columns
3. Upload to Dashboard

### Required File Formats

**Sales Data CSV:**
```
Date,Item_Code,Item_Name,Purchases,Sales,Balance
2026-02-01,321601,Richina Basil Seed-Mango,2100,1200,2500
2026-02-02,321601,Richina Basil Seed-Mango,0,950,1550
```

**Inventory CSV:**
```
Item_Code,Item_Name,Current_Qty,Supplier_Code,MOQ,Lead_Time,Container_Type,CBM
321601,Richina Basil Seed-Mango,2500,V20183,450,80,40ft,0.00128
```

---

## 🔧 Troubleshooting

### Problem: PO quantities too high
**Solution:** Reduce "Days Inventory Needed" in Settings tab

### Problem: PO quantities too low
**Solution:** Increase "Days Inventory Needed" in Settings tab

### Problem: Wrong supplier showing
**Solution:** 
1. Check INVENTORY tab
2. Filter by correct supplier
3. Verify supplier code in Settings

### Problem: Lead times incorrect
**Solution:**
1. Go to Settings tab
2. Check supplier lead times in table
3. Update in your source Excel file
4. Re-upload to dashboard

### Problem: Status shows incorrect
**Solution:**
1. Verify average daily sales is accurate
2. Check if sales data is recent (last 30 days)
3. Confirm current inventory quantities

---

## 📞 Quick Reference Checklist

Before generating POs, verify:
- [ ] Current inventory quantities are accurate
- [ ] Sales data is from last 3 months
- [ ] Supplier lead times are correct
- [ ] MOQ values are current
- [ ] Inventory days setting matches your policy
- [ ] Safety stock days are appropriate
- [ ] Container types (20ft/40ft) are available

---

## 📅 Weekly Workflow Recommendation

**Monday:**
- Upload latest inventory count
- Check DASHBOARD for critical items
- Review ANALYTICS for trend changes

**Tuesday-Wednesday:**
- Create POs for HIGH/CRITICAL items (INVENTORY tab)
- Consolidate orders by supplier (PO GENERATOR tab)
- Adjust settings if needed (SETTINGS tab)

**Thursday:**
- Send all generated POs to suppliers
- Update status in dashboard
- Plan for next week

**Friday:**
- Reconcile received goods
- Review upcoming deliveries
- Plan for next week POs

---

## 📊 Dashboard Metrics Legend

| Metric | Good Range | Warning | Action |
|--------|---|---|---|
| Days Supply | 20-90 | <10 or >90 | Order or reduce |
| Items in Stock | Any | CRITICAL count >5 | Urgent review |
| PO Pending | Low | High | May be over-ordering |
| Critical Items | 0-2 | >5 | Increase inventory |
| Avg Lead Time | 5-80 | >100 | Find new suppliers |

---

## 🎓 Learning Path

1. **Day 1:** Explore with SAMPLE DATA
   - Click each tab
   - Read descriptions
   - Understand each metric

2. **Day 2:** Test with YOUR DATA
   - Upload real sales data
   - Upload real inventory
   - Generate test POs

3. **Day 3:** Optimize SETTINGS
   - Adjust inventory days
   - Set safety stock
   - Validate lead times

4. **Day 4+:** Use in PRODUCTION
   - Generate weekly POs
   - Monitor ANALYTICS
   - Adjust as needed

---

**Version:** 1.0  
**Last Updated:** May 2026  
**Support:** Refer to MISB_ALSILA_Analysis.md for detailed documentation
