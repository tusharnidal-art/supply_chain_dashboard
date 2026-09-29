#!/usr/bin/env python3
"""
MISB ALSILA Supply Chain Data Processor
Converts Excel data to JSON for interactive dashboard
"""

import pandas as pd
import json
import math
from datetime import datetime, timedelta
from pathlib import Path
import numpy as np

# Quantities (stock, sales, MOQ, container capacity, PO qty) are in cartons.
# 'cbm' in ItemData is volume per piece and 'BaseQty' is pieces per carton,
# so one carton takes cbm * BaseQty cubic metres.

# Usable container volumes, used only to estimate capacity when an item has
# no 20ft/40ft value. Keep in step with the dashboard's Settings tab.
USABLE_CBM_20FT = 28
USABLE_CBM_40FT = 58


def _code(value):
    """Normalise an item code so 321601, 321601.0 and '321601' all match."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ''
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return str(value).strip()


def _num(value, default=0):
    """Convert a cell to a float, returning default for blanks and text."""
    try:
        n = float(str(value).replace(',', ''))
    except (TypeError, ValueError):
        return default
    return default if math.isnan(n) else n


def get_status(days_supply):
    """Stock status; same thresholds as the dashboard."""
    if days_supply is None:
        return 'NO SALES'
    if days_supply < 10:
        return 'CRITICAL'
    if days_supply < 20:
        return 'LOW'
    if days_supply > 90:
        return 'HIGH'
    return 'OPTIMAL'


def cbm_per_carton(item):
    """Volume of one carton in cubic metres."""
    base_qty = item.get('baseQty') or 1
    return (item.get('cbmPerUnit') or 0) * base_qty


def container_capacity(item, size):
    """Cartons per container: the item's own value, else estimated from CBM.

    Returns (capacity, estimated) or None when neither is available.
    """
    explicit = item.get('capacity20ft' if size == '20ft' else 'capacity40ft') or 0
    if explicit > 0:
        return explicit, False
    cbm = cbm_per_carton(item)
    if cbm > 0:
        cap = math.floor((USABLE_CBM_20FT if size == '20ft' else USABLE_CBM_40FT) / cbm)
        if cap > 0:
            return cap, True
    return None


def plan_containers(qty, item, preferred=''):
    """Containers for qty cartons; same rules as the dashboard.

    Uses the preferred size when given; otherwise fills 40ft containers and
    ships the remainder in one 20ft when it fits.
    """
    c20 = container_capacity(item, '20ft')
    c40 = container_capacity(item, '40ft')
    if not c20 and not c40:
        return None

    n20 = n40 = 0
    if (preferred == '20ft' and c20) or not c40:
        n20 = math.ceil(qty / c20[0])
    elif preferred == '40ft' or not c20:
        n40 = math.ceil(qty / c40[0])
    else:
        n40 = qty // c40[0]
        remainder = qty - n40 * c40[0]
        if remainder > 0:
            if remainder <= c20[0]:
                n20 = 1
            else:
                n40 += 1

    capacity = n20 * (c20[0] if c20 else 0) + n40 * (c40[0] if c40 else 0)
    parts = []
    if n40:
        parts.append(f'{int(n40)} x 40ft')
    if n20:
        parts.append(f'{int(n20)} x 20ft')
    return {
        'containers20ft': int(n20),
        'containers40ft': int(n40),
        'label': ' + '.join(parts),
        'fill': round(qty / capacity, 3) if capacity else 0,
        'estimated': bool((n20 and c20[1]) or (n40 and c40[1])),
    }


class SupplyChainProcessor:
    """Process supply chain data from Excel files"""
    
    def __init__(self, excel_file=None):
        """Initialize processor with optional Excel file"""
        self.excel_file = excel_file
        self.inventory = None
        self.sales_data = None
        self.item_master = None
        self.suppliers = None
        
    def read_excel_file(self, excel_file):
        """Read all necessary sheets from MISB Excel file"""
        print(f"Reading Excel file: {excel_file}")
        
        # Read all relevant sheets
        self.item_master = pd.read_excel(excel_file, sheet_name='ItemData', header=0)
        self.inventory_current = pd.read_excel(excel_file, sheet_name='MisbWH', header=1)
        self.sales_raw = pd.read_excel(excel_file, sheet_name='LocalItemReport', header=3)
        
        print(f"✓ ItemData: {len(self.item_master)} items loaded")
        print(f"✓ MisbWH: {len(self.inventory_current)} warehouse records")
        print(f"✓ LocalItemReport: {self.sales_raw.shape} records")
        
        return True
    
    def process_item_master(self):
        """Extract and process item master data"""
        print("\n[1] Processing Item Master Data...")
        
        # Key columns from ItemData
        columns_needed = ['Item Code', 'Item Name', 'BaseQty', '40ft', '20ft', 
                         'cbm', 'Supplier Name', 'MOQ', 'Transit Time(Days)']
        
        items = []
        for idx, row in self.item_master.iterrows():
            code = _code(row['Item Code'])
            if not code:
                continue
            item = {
                'code': code,
                'name': row['Item Name'],
                'baseQty': _num(row.get('BaseQty'), 1) or 1,
                'capacity40ft': _num(row.get('40ft')),
                'capacity20ft': _num(row.get('20ft')),
                'cbmPerUnit': _num(row.get('cbm')),
                'supplier': row.get('Supplier Name', ''),
                'moq': _num(row.get('MOQ'), 1) or 1,
                'leadTime': int(_num(row.get('Transit Time(Days)')))
            }
            items.append(item)
        
        self.items = items
        print(f"  Processed {len(items)} items")
        
        # Extract unique suppliers
        suppliers = self.item_master[['Supplier Name', 'VendorCode']].drop_duplicates()
        self.suppliers = suppliers.to_dict('records')
        print(f"  Found {len(self.suppliers)} suppliers")
        
        return items
    
    def process_current_inventory(self):
        """Extract current inventory levels"""
        print("\n[2] Processing Current Inventory...")
        
        current = []
        
        for idx, row in self.inventory_current.iterrows():
            code = _code(row['Item Code'])
            if not code or code == '0':
                continue
                
            inv_item = {
                'code': code,
                'name': row.get('Item Name', ''),
                'currentQty': int(_num(row.get('Qty(Ctn)'))),
                'currentPcs': int(_num(row.get('Qty(Pcs)'))),
                'salePrice': float(row.get('Sale Price', 0)) if 'Sale Price' in row else 0,
                'purchasePrice': float(row.get('PurPrice', 0)) if 'PurPrice' in row else 0
            }
            current.append(inv_item)
        
        self.current_inventory = current
        print(f"  Processed {len(current)} current inventory records")
        
        return current
    
    def calculate_average_daily_sales(self, months=3):
        """Calculate average daily sales from LocalItemReport"""
        print(f"\n[3] Calculating Average Daily Sales (Last {months} months)...")
        
        # LocalItemReport has BAL, INC, DEC columns repeated once per month
        # (pandas names the repeats DEC, DEC.1, ...). Each DEC column is one
        # month of sales, so the last `months` of them cover the period.
        sales_stats = {}
        dec_columns = [col for col in self.sales_raw.columns if 'DEC' in str(col)]
        recent_columns = dec_columns[-months:]
        
        for raw_code in self.sales_raw['Code'].unique():
            code = _code(raw_code)
            if not code:
                continue
            
            item_sales = self.sales_raw[self.sales_raw['Code'] == raw_code]
            
            # Sum sales from recent months
            total_sales = 0
            period_count = 0
            
            for col in recent_columns:
                sales = pd.to_numeric(item_sales[col], errors='coerce').sum()
                if not pd.isna(sales):
                    total_sales += sales
                    period_count += 1
            
            # Average daily
            avg_daily = (total_sales / (period_count * 30)) if period_count > 0 else 0
            sales_stats[code] = {
                'totalSales': float(total_sales),
                'avgDaily': round(float(avg_daily), 2),
                'periodsAnalyzed': period_count
            }
        
        self.sales_stats = sales_stats
        print(f"  Calculated for {len(sales_stats)} items")
        
        return sales_stats
    
    def calculate_po_quantities(self, inventory_days=30, safety_stock_days=7):
        """Calculate required PO quantities"""
        print(f"\n[4] Calculating PO Quantities...")
        print(f"    Inventory Days: {inventory_days}")
        print(f"    Safety Stock Days: {safety_stock_days}")
        
        po_calc = []
        
        for item in self.items:
            code = item['code']
            
            # Get current stock
            current = next((i for i in self.current_inventory if i['code'] == code), None)
            current_qty = current['currentQty'] if current else 0
            
            # Get sales stats
            sales = self.sales_stats.get(code, {'avgDaily': 0})
            avg_daily = sales.get('avgDaily', 0)
            
            # Skip if no sales data
            if avg_daily <= 0:
                continue
            
            # Calculate required days
            lead_time = item.get('leadTime', 0)
            moq = item.get('moq', 1)
            
            required_days = inventory_days + lead_time + safety_stock_days
            
            # Calculate required quantity
            required_qty_raw = avg_daily * required_days
            
            # Round up to MOQ
            required_qty = math.ceil(required_qty_raw / moq) * moq
            
            # Calculate PO quantity (only if needed)
            po_qty = max(0, required_qty - current_qty)
            
            # Calculate containers
            plan = plan_containers(po_qty, item) if po_qty > 0 else None
            
            # Calculate CBM
            cbm_total = po_qty * cbm_per_carton(item)
            
            # Days until stock runs out
            days_supply = current_qty / avg_daily
            
            # Required delivery date
            required_date = datetime.now() + timedelta(days=lead_time)
            
            po_record = {
                'itemCode': code,
                'itemName': item.get('name', ''),
                'currentStock': current_qty,
                'avgDaily': avg_daily,
                'daysSupply': round(days_supply, 1),
                'leadTime': lead_time,
                'moq': moq,
                'requiredQty': int(required_qty),
                'poQty': int(po_qty),
                'supplier': item.get('supplier', ''),
                'containers20ft': plan['containers20ft'] if plan else 0,
                'containers40ft': plan['containers40ft'] if plan else 0,
                'containers': (plan['containers20ft'] + plan['containers40ft']) if plan else 0,
                'containerPlan': plan['label'] if plan else '',
                'containerFill': plan['fill'] if plan else 0,
                'capacityEstimated': plan['estimated'] if plan else False,
                'cbmTotal': round(cbm_total, 2),
                'requiredDate': required_date.strftime('%Y-%m-%d'),
                'status': 'Pending' if po_qty > 0 else 'No PO Needed',
                'priority': get_status(days_supply)
            }
            
            po_calc.append(po_record)
        
        # Sort by priority
        po_calc.sort(key=lambda x: self._priority_order(x['priority']))
        
        self.po_calculations = po_calc
        print(f"  Generated {len(po_calc)} PO records")
        
        return po_calc
    
    def _priority_order(self, priority):
        """Return sort order for priority"""
        order = {'CRITICAL': 0, 'LOW': 1, 'OPTIMAL': 2, 'HIGH': 3}
        return order.get(priority, 4)
    
    def export_json(self, output_dir='./data'):
        """Export processed data to JSON files"""
        print(f"\n[5] Exporting Data to JSON...")
        
        Path(output_dir).mkdir(exist_ok=True)
        
        # Items master
        with open(f'{output_dir}/items.json', 'w') as f:
            json.dump(self.items, f, indent=2, default=str)
        print(f"  ✓ items.json ({len(self.items)} items)")
        
        # Current inventory
        with open(f'{output_dir}/inventory.json', 'w') as f:
            json.dump(self.current_inventory, f, indent=2, default=str)
        print(f"  ✓ inventory.json ({len(self.current_inventory)} records)")
        
        # Sales statistics
        with open(f'{output_dir}/sales_stats.json', 'w') as f:
            json.dump(self.sales_stats, f, indent=2, default=str)
        print(f"  ✓ sales_stats.json")
        
        # PO calculations
        with open(f'{output_dir}/po_calculations.json', 'w') as f:
            json.dump(self.po_calculations, f, indent=2, default=str)
        print(f"  ✓ po_calculations.json ({len(self.po_calculations)} POs)")
        
        # Suppliers
        with open(f'{output_dir}/suppliers.json', 'w') as f:
            json.dump(self.suppliers, f, indent=2, default=str)
        print(f"  ✓ suppliers.json ({len(self.suppliers)} suppliers)")
        
        # Summary report
        summary = {
            'processedDate': datetime.now().isoformat(),
            'totalItems': len(self.items),
            'itemsWithPO': len([p for p in self.po_calculations if p['poQty'] > 0]),
            'criticalItems': len([p for p in self.po_calculations if p['priority'] == 'CRITICAL']),
            'lowStock': len([p for p in self.po_calculations if p['priority'] == 'LOW']),
            'totalPOValue': sum([p['poQty'] for p in self.po_calculations]),
            'suppliers': len(self.suppliers)
        }
        
        with open(f'{output_dir}/summary.json', 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        print(f"  ✓ summary.json")
        
        print(f"\n✓ All files exported to {output_dir}/")
        return summary
    
    def export_csv(self, output_file='po_orders.csv'):
        """Export PO calculations to CSV"""
        print(f"\n[6] Exporting PO Orders to CSV...")
        
        df = pd.DataFrame(self.po_calculations)
        df.to_csv(output_file, index=False)
        
        print(f"  ✓ Exported to {output_file}")
        print(f"\nPO Summary:")
        print(f"  Total orders: {len(df)}")
        print(f"  Critical items: {len(df[df['priority'] == 'CRITICAL'])}")
        print(f"  Total CBM required: {df['cbmTotal'].sum():.2f}")
        print(f"  Total containers: {df['containers'].sum()}")
        
        return df
    
    def print_summary(self):
        """Print processing summary"""
        print("\n" + "="*60)
        print("SUPPLY CHAIN PROCESSING SUMMARY")
        print("="*60)
        
        critical = [p for p in self.po_calculations if p['priority'] == 'CRITICAL']
        low = [p for p in self.po_calculations if p['priority'] == 'LOW']
        
        print(f"\nItems Processed: {len(self.items)}")
        print(f"PO Orders Generated: {len(self.po_calculations)}")
        print(f"\nPriority Breakdown:")
        print(f"  🔴 CRITICAL (< 10 days): {len(critical)}")
        for item in critical[:5]:
            print(f"     - {item['itemCode']}: {item['daysSupply']} days")
        
        print(f"  🟠 LOW (10-20 days): {len(low)}")
        print(f"  🟢 OPTIMAL (20-90 days): {len([p for p in self.po_calculations if p['priority'] == 'OPTIMAL'])}")
        print(f"  🔵 HIGH (> 90 days): {len([p for p in self.po_calculations if p['priority'] == 'HIGH'])}")
        
        print(f"\nContainer Summary:")
        df = pd.DataFrame(self.po_calculations)
        print(f"  40ft containers: {df['containers40ft'].sum()}")
        print(f"  20ft containers: {df['containers20ft'].sum()}")
        print(f"  Total CBM: {df['cbmTotal'].sum():.2f}")
        
        print(f"\nSupplier Distribution:")
        suppliers_count = df['supplier'].value_counts()
        for supp, count in suppliers_count.items():
            print(f"  {supp}: {count} items")
        
        print("\n" + "="*60)


def main():
    """Main processing function"""
    
    # Example usage
    processor = SupplyChainProcessor()
    
    # Path to your Excel file
    excel_file = '024_MISB_ALSILA_Supply_Chain_Final.xlsm'
    
    try:
        # Step 1: Read Excel
        processor.read_excel_file(excel_file)
        
        # Step 2: Process all data
        processor.process_item_master()
        processor.process_current_inventory()
        processor.calculate_average_daily_sales(months=3)
        
        # Step 3: Calculate POs with custom settings
        processor.calculate_po_quantities(
            inventory_days=30,      # Days of inventory to maintain
            safety_stock_days=7     # Safety stock buffer
        )
        
        # Step 4: Export results
        summary = processor.export_json()
        processor.export_csv('po_orders_export.csv')
        
        # Step 5: Print summary
        processor.print_summary()
        
        print("\n✓ Processing complete!")
        
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
