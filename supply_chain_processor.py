#!/usr/bin/env python3
"""
MISB ALSILA Supply Chain Data Processor
Converts Excel data to JSON for interactive dashboard
"""

import pandas as pd
import json
from datetime import datetime, timedelta
from pathlib import Path
import numpy as np

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
            item = {
                'code': row['Item Code'],
                'name': row['Item Name'],
                'baseQty': row['BaseQty'],
                'capacity40ft': row.get('40ft', 0),
                'capacity20ft': row.get('20ft', 0),
                'cbmPerUnit': row.get('cbm', 0),
                'supplier': row.get('Supplier Name', ''),
                'moq': row.get('MOQ', 0),
                'leadTime': int(row.get('Transit Time(Days)', 0))
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
            if pd.isna(row['Item Code']) or row['Item Code'] == 0:
                continue
                
            inv_item = {
                'code': int(row['Item Code']),
                'name': row.get('Item Name', ''),
                'currentQty': int(row.get('Qty(Ctn)', 0)),
                'currentPcs': int(row.get('Qty(Pcs)', 0)),
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
        
        # LocalItemReport has pattern: BAL, INC, DEC repeated
        # Extract DEC columns (sales)
        sales_stats = {}
        
        for code in self.sales_raw['Code'].unique():
            if pd.isna(code):
                continue
            
            item_sales = self.sales_raw[self.sales_raw['Code'] == code]
            
            # Find all DEC columns (every 3rd column starting from DEC)
            dec_columns = [col for col in self.sales_raw.columns if 'DEC' in str(col)]
            
            # Sum sales from recent periods
            total_sales = 0
            period_count = 0
            
            for col in dec_columns[-months*3:]:  # Last 3 months (3 cols per month)
                try:
                    sales = item_sales[col].sum()
                    if not pd.isna(sales):
                        total_sales += sales
                        period_count += 1
                except:
                    pass
            
            # Average daily
            avg_daily = (total_sales / (period_count * 30)) if period_count > 0 else 0
            sales_stats[code] = {
                'totalSales': total_sales,
                'avgDaily': round(avg_daily, 2),
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
            import math
            required_qty = math.ceil(required_qty_raw / moq) * moq
            
            # Calculate PO quantity (only if needed)
            po_qty = max(0, required_qty - current_qty)
            
            # Calculate containers
            capacity_40ft = item.get('capacity40ft', 0)
            capacity_20ft = item.get('capacity20ft', 0)
            
            containers_40ft = math.ceil(po_qty / capacity_40ft) if capacity_40ft > 0 else 0
            containers_20ft = math.ceil(po_qty / capacity_20ft) if capacity_20ft > 0 else 0
            
            # Determine best container
            if containers_40ft > 0 and containers_20ft == 0:
                best_container = '40ft'
                best_containers = containers_40ft
            elif containers_20ft > 0 and containers_40ft == 0:
                best_container = '20ft'
                best_containers = containers_20ft
            elif containers_40ft > 0 and containers_20ft > 0:
                # Choose based on utilization
                util_40 = po_qty / (containers_40ft * capacity_40ft)
                util_20 = po_qty / (containers_20ft * capacity_20ft)
                best_container = '40ft' if util_40 >= util_20 else '20ft'
                best_containers = containers_40ft if util_40 >= util_20 else containers_20ft
            else:
                best_container = '40ft'
                best_containers = 0
            
            # Calculate CBM
            cbm_total = po_qty * item.get('cbmPerUnit', 0)
            
            # Days until stock runs out
            days_supply = current_qty / avg_daily if avg_daily > 0 else 0
            
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
                'containerType': best_container,
                'containers': int(best_containers),
                'cbmTotal': round(cbm_total, 2),
                'requiredDate': required_date.strftime('%Y-%m-%d'),
                'status': 'Pending' if po_qty > 0 else 'No PO Needed',
                'priority': self._get_priority(days_supply)
            }
            
            po_calc.append(po_record)
        
        # Sort by priority
        po_calc.sort(key=lambda x: self._priority_order(x['priority']))
        
        self.po_calculations = po_calc
        print(f"  Generated {len(po_calc)} PO records")
        
        return po_calc
    
    def _get_priority(self, days_supply):
        """Determine priority based on days supply"""
        if days_supply < 10:
            return 'CRITICAL'
        elif days_supply < 20:
            return 'HIGH'
        elif days_supply < 30:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _priority_order(self, priority):
        """Return sort order for priority"""
        order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
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
            'highPriority': len([p for p in self.po_calculations if p['priority'] == 'HIGH']),
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
        high = [p for p in self.po_calculations if p['priority'] == 'HIGH']
        
        print(f"\nItems Processed: {len(self.items)}")
        print(f"PO Orders Generated: {len(self.po_calculations)}")
        print(f"\nPriority Breakdown:")
        print(f"  🔴 CRITICAL (< 10 days): {len(critical)}")
        for item in critical[:5]:
            print(f"     - {item['itemCode']}: {item['daysSupply']} days")
        
        print(f"  🟠 HIGH (10-20 days): {len(high)}")
        print(f"  🟡 MEDIUM: {len([p for p in self.po_calculations if p['priority'] == 'MEDIUM'])}")
        print(f"  🟢 LOW: {len([p for p in self.po_calculations if p['priority'] == 'LOW'])}")
        
        print(f"\nContainer Summary:")
        df = pd.DataFrame(self.po_calculations)
        print(f"  40ft containers: {len(df[df['containerType'] == '40ft'])}")
        print(f"  20ft containers: {len(df[df['containerType'] == '20ft'])}")
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
