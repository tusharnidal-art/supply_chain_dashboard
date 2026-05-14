# MISB ALSILA Supply Chain Excel Analysis & Dashboard Guide

## File Analysis

### Overview
**File:** 024_MISB_ALSILA_Supply_Chain_Final.xlsm
**Purpose:** Supply chain management and PO (Purchase Order) projection system
**Sheets:** 10 sheets with complex formulas and interdependencies

---

## Sheet Structure & Key Data

### 1. **Projection Sheet** (Planning Engine)
**Purpose:** Calculate optimal PO quantities based on sales forecasts
**Key Columns:**
- **Item Code & Name:** Product identifier
- **Start/End Month Data:**
  - Projected Order Qty
  - Date to Order
  - Order Status
  - Avg Sales
  - Stock to Go (incl. order)
  - Manual Quantity Override
- **Container Info:** 40ft/60ft capacity tracking
- **Key Formulas:**
  - Daily sales × lead time × safety factor = required order qty
  - Considers MOQ (Minimum Order Qty)
  - Automatic container calculation

---

### 2. **MisbWH Sheet** (Warehouse Master Data)
**Purpose:** Current inventory and warehouse status
**Structure:**
- Item Code, Name, Factory
- Package quantities (Carton/Pieces)
- Weekly snapshots (W00001-W00007)
- Sales Price & Purchase Price
- Current status: Item quantities across time periods

**Key Metrics:**
- Current inventory balance
- Weekly movements
- Item master data

---

### 3. **LocalItemReport Sheet** (Inventory Movement Tracker)
**Purpose:** Track inventory flow (Increase/Decrease/Balance)
**Format:** 
- Daily/Monthly inventory tracking
- Three columns per period: Balance, Increase (IN), Decrease (OUT/Sales)
- 12+ months of historical data
- Average daily sales calculation

**Columns per Month:**
- BAL = Current Balance
- INC = Purchases/Receipts
- DEC = Sales/Withdrawals

---

### 4. **ItemData Sheet** (Master Product & Supplier Data)
**Critical Data for PO Creation:**

| Column | Description | Example |
|--------|-------------|---------|
| Item Code | Unique identifier | 321601 |
| Item Name | Product description | Richina Basil Seed-Mango-290ml X 24 |
| BaseQty | Package size | 24 |
| 20ft/40ft | Container capacity | 2100 units per 40ft |
| CBM | Volume per unit | 0.00128 CBM |
| Supplier Name | Vendor | YU DAT BS |
| MOQ | Minimum Order | 450 units |
| Transit Time (Days) | **LEAD TIME** | 80 days (YU DAT), 60 days (YU DAT CJ), 7 days (Local) |
| VendorName | Full supplier name | vn Yu Dat Trading Company Limited |

---

### 5. **UpComing Sheet**
**Purpose:** Track pending orders in transit
- Expected arrival dates
- Order quantities
- Supplier allocation

---

### 6. **Other Sheets**
- **Auto, ByOrder:** Automated PO records
- **invoiceMISB, invoiceAFL:** Invoice tracking
- **Instruction:** User guide

---

## PO Calculation Logic

### Formula Breakdown

```
Required Qty = (Average Daily Sales × Days Needed) / MOQ
             × MOQ (round up to MOQ)

Days Needed = Inventory Days + Lead Time + Safety Buffer

Container Calc:
40ft Capacity = Item × Container Load Factor
Units per 40ft = Load from ItemData column E

Example:
- Item: 321601 (Basil Seed)
- Avg Daily: 85 units
- Days Needed: 30 + 80 (lead time) = 110 days
- MOQ: 450
- Required: CEILING((85 × 110) / 450) × 450 = 9,450 units
- 40ft Containers: 9,450 ÷ 2,100 = 4.5 → 5 containers
```

---

## Key Features in Dashboard

### 1. **Inventory Status Management**
- **Critical:** < 10 days supply
- **Low:** 10-20 days
- **Optimal:** 20-90 days
- **High:** > 90 days

### 2. **Dynamic Settings**
- **Inventory Days:** How many days to stock (7-90 days range)
- **Safety Stock:** Minimum buffer (3-30 days range)
- Adjusts PO quantities in real-time

### 3. **Supplier Filtering**
- Filter by supplier (All / V20183 / V20184, etc.)
- View lead times: 5-80 days
- Container type: 20ft or 40ft

### 4. **Container Management**
- Automatic 20ft/40ft allocation
- CBM calculation per item
- Total shipment volume tracking

### 5. **4-Month Sales Analytics**
- Purchase history (INC column)
- Sales history (DEC column)
- Balance tracking
- Trend identification

---

## Data Input Format

### Sales Data Upload (CSV/XLSX)
```
Date, Item Code, Item Name, Purchases(INC), Sales(DEC), Balance(BAL)
2026-02-01, 321601, Richina Basil Seed-Mango, 2100, 1200, 2500
2026-02-02, 321601, Richina Basil Seed-Mango, 0, 950, 1550
...
```

### Inventory Upload (CSV/XLSX)
```
Item Code, Item Name, Current Qty, Supplier Code, MOQ, Lead Time Days, Container Type, CBM/Unit
321601, Richina Basil Seed-Mango, 2500, V20183, 450, 80, 40ft, 0.00128
...
```

---

## PO Generation Algorithm

### Step 1: Calculate Average Daily Sales
```javascript
avgDaily = sum(sales last 30 days) / 30
```

### Step 2: Calculate Order Point
```javascript
orderPoint = avgDaily × (inventoryDays + leadTime) + safetyStock
```

### Step 3: Determine PO Qty
```javascript
requiredQty = CEILING((orderPoint - currentStock) / MOQ) × MOQ
```

### Step 4: Container Allocation
```javascript
containers40ft = CEILING(requiredQty / containerCapacity40ft)
or
containers20ft = CEILING(requiredQty / containerCapacity20ft)
```

### Step 5: Calculate CBM
```javascript
totalCBM = (requiredQty / baseQty) × cbmPerUnit
```

---

## Supplier Details (From Excel)

### International Suppliers (High Lead Time)
| Code | Name | Lead Time | Container | Type |
|------|------|-----------|-----------|------|
| V20183 | YU DAT BS | 80 days | 40ft | Basil Seeds |
| V20183 | YU DAT Trading | 80 days | 40ft | Multiple |
| V20184 | YU DAT CJ | 60 days | 40ft | Juice/Drinks |

### Local Suppliers (Quick Lead Time)
| Code | Name | Lead Time | Container |
|------|------|-----------|-----------|
| V20185 | Local Supplier A | 7 days | 20ft |
| V20186 | Local Supplier B | 5 days | 20ft |

---

## Dashboard Features Explained

### 1. Dashboard Tab
- Upload sales & inventory files
- Quick statistics (total items, suppliers, pending POs)
- Inventory status heatmap

### 2. Inventory Tab
- Adjustable filters (supplier, days needed, safety stock)
- Real-time inventory status
- Days of supply calculation
- Critical items highlighting

### 3. PO Generator Tab
- One-click PO generation
- Auto-calculates quantities based on settings
- Shows:
  - PO ID & Item details
  - Required quantity & containers
  - Supplier & lead time
  - Required delivery date
  - Status tracking

### 4. Analytics Tab
- 4-month sales breakdown per item
- Purchase vs. Sales tracking
- Monthly trends
- Balance history

### 5. Settings Tab
- Configure default inventory days
- Set safety stock levels
- View supplier master data
- Lead time reference

---

## Implementation Steps

### Step 1: Prepare Your Data
1. Export 3 months sales data from LocalItemReport sheet
2. Create CSV with columns: Date, Code, Inc, Dec, Balance
3. Export current inventory from MisbWH sheet
4. Current quantities per item

### Step 2: Upload to Dashboard
1. Go to Dashboard tab
2. Upload Sales Data file (last 3 months)
3. Upload Current Inventory file

### Step 3: Configure Settings
1. Go to Settings tab
2. Set desired inventory days (e.g., 30 days)
3. Set safety stock (e.g., 7 days)

### Step 4: Adjust by Supplier
1. Use Inventory tab filter
2. Select specific supplier
3. View their items and status

### Step 5: Generate PO
1. Go to PO Generator tab
2. Review settings
3. Click "Generate PO"
4. Review generated orders
5. Download/Print for submission

---

## Key Calculations in Dashboard

### Days Supply Remaining
```
Days Supply = Current Stock / Average Daily Sales
```

### EOQ (Economic Order Quantity)
```
EOQ = CEILING((Avg Daily × (Inventory Days + Lead Time)) / MOQ) × MOQ
```

### Container Selection Logic
```
IF item CBM × required qty ≤ 20ft capacity
  USE 20ft container
ELSE
  USE 40ft container
```

### Safety Stock Value
```
Safety Stock = Avg Daily × Safety Stock Days
```

---

## Monitoring & Alerts

### Automatic Flags
- 🔴 **Critical:** When days supply < 10 days
- 🟠 **Low:** When days supply < 20 days
- 🟢 **Optimal:** 20-90 days supply
- 🔵 **High:** When days supply > 90 days

### Required Actions
| Status | Action | Urgency |
|--------|--------|---------|
| Critical | Create urgent PO | Immediate |
| Low | Create PO this week | High |
| Optimal | Monitor | Normal |
| High | Review & possibly reduce | Low |

---

## Excel vs Dashboard Comparison

| Feature | Original Excel | Dashboard |
|---------|---|---|
| Lead time lookup | Manual VLOOKUP | Auto-populated |
| PO calculation | Complex formulas | One-click |
| Container split | Manual math | Auto-calculated |
| Multi-month sales | Scroll through sheets | Consolidated view |
| Supplier filter | Manual | Dropdown filter |
| Settings adjustment | Hard-coded | Dynamic sliders |
| Days supply visual | Numbers only | Color-coded status |

---

## Advanced Features

### 1. What-If Analysis
- Adjust "Days Inventory Needed" slider
- See PO qty change in real-time
- Identify cost optimization opportunities

### 2. Supplier Consolidation
- View all items per supplier
- Identify opportunities to increase containers
- Track lead times for planning

### 3. Predictive Analysis
- Monthly trend from 4-month data
- Forecast next month sales
- Plan ahead for high-demand periods

### 4. Cost Tracking
- Track purchase price × PO qty
- Monitor supplier cost changes
- Identify bulk buy opportunities

---

## File Upload Specifications

### Sales Data CSV
```
Required Columns:
- Date (DD-MM-YYYY)
- Item_Code (numeric)
- Item_Name (text)
- Purchases (numeric) - INC from LocalItemReport
- Sales (numeric) - DEC from LocalItemReport
- Balance (numeric) - BAL from LocalItemReport

Optional:
- Warehouse (if multiple locations)
- Supplier_Code
```

### Inventory CSV
```
Required Columns:
- Item_Code (numeric)
- Item_Name (text)
- Current_Quantity (numeric)
- Supplier_Code (text like V20183)
- MOQ (numeric)
- Lead_Time_Days (numeric)
- Container_Type (20ft or 40ft)
- CBM_Per_Unit (decimal)

Optional:
- Base_Qty (carton qty)
- 40ft_Capacity (units per container)
- Price (for cost tracking)
```

---

## Troubleshooting

### Issue: PO quantities seem too high
**Solution:** Reduce "Days Inventory Needed" in Settings

### Issue: Critical items not showing
**Solution:** Check if average daily sales is calculated from at least 30 days data

### Issue: Wrong container type
**Solution:** Verify CBM values and container capacity in ItemData

### Issue: Lead time not correct
**Solution:** Update Lead_Time_Days in ItemData sheet for each supplier

---

## Next Steps

1. **Export current Excel data** to CSV format
2. **Upload to Dashboard** (use sample data first)
3. **Configure settings** for your business
4. **Generate test POs** to verify calculations
5. **Integrate with ERP/accounting** system
6. **Set up automated exports** from ERP to Dashboard

---

**Last Updated:** May 2026
**Version:** 1.0 - Interactive Dashboard
