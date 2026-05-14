import React, { useState, useEffect } from 'react';
import { Upload, Download, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';

const SupplyChainDashboard = () => {
  const [salesData, setSalesData] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [poOrders, setPoOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSupplier, setSelectedSupplier] = useState('ALL');
  const [inventoryDays, setInventoryDays] = useState(30);
  const [stockKeepDays, setStockKeepDays] = useState(7);
  const [filterMonth, setFilterMonth] = useState('current');

  // Sample data - Replace with actual file upload
  const sampleSuppliers = [
    { code: 'V20183', name: 'YU DAT BS', leadTime: 80, type: '40ft' },
    { code: 'V20184', name: 'YU DAT CJ', leadTime: 60, type: '40ft' },
    { code: 'V20185', name: 'Local Supplier A', leadTime: 7, type: '20ft' },
    { code: 'V20186', name: 'Local Supplier B', leadTime: 5, type: '20ft' },
  ];

  const sampleInventoryData = [
    { code: 321601, name: 'Richina Basil Seed-Mango-290ml X 24', currentStock: 2500, moq: 450, supplier: 'V20183', container: '40ft', cbm: 0.00128, avgDaily: 85 },
    { code: 321602, name: 'Richina Basil Seed-Strawberry-290ml X 24', currentStock: 1800, moq: 450, supplier: 'V20183', container: '40ft', cbm: 0.00128, avgDaily: 62 },
    { code: 321614, name: 'Richina Air Kelapa Tall Can-330ml X 24', currentStock: 3200, moq: 900, supplier: 'V20184', container: '40ft', cbm: 0.00048, avgDaily: 110 },
    { code: 101204, name: 'Gear Energy Drinks (Pet)-250ml X 24', currentStock: 85723, moq: 450, supplier: 'V20183', container: '40ft', cbm: 0.001288, avgDaily: 3059 },
    { code: 120405, name: 'Farm Fresh Chakki Fresh (Atta)-5Kg X 4', currentStock: 2472, moq: 1000, supplier: 'V20185', container: '20ft', cbm: 0.025, avgDaily: 180 },
  ];

  const sampleSalesData = [
    { code: 321601, month: 'Feb 2026', inc: 2100, dec: 1200, bal: 2500 },
    { code: 321601, month: 'Jan 2026', inc: 1800, dec: 950, bal: 1350 },
    { code: 321601, month: 'Dec 2025', inc: 2200, dec: 1100, bal: 500 },
  ];

  useEffect(() => {
    setSuppliers(sampleSuppliers);
    setInventory(sampleInventoryData);
    setSalesData(sampleSalesData);
  }, []);

  const calculatePOQuantity = (item) => {
    const supplier = suppliers.find(s => s.code === item.supplier);
    if (!supplier) return 0;

    const daysToOrder = inventoryDays + supplier.leadTime;
    const requiredQty = Math.ceil((item.avgDaily * daysToOrder) / item.moq) * item.moq;
    const safeStock = Math.ceil((item.avgDaily * stockKeepDays) / item.moq) * item.moq;
    
    return Math.max(requiredQty - item.currentStock, safeStock);
  };

  const generatePO = () => {
    const newPOs = inventory.map(item => {
      const supplier = suppliers.find(s => s.code === item.supplier);
      const poQty = calculatePOQuantity(item);
      const containers = Math.ceil(poQty / (poQty / item.moq)); // Simplified container calc
      
      return {
        id: `PO-${Date.now()}-${item.code}`,
        itemCode: item.code,
        itemName: item.name,
        supplier: supplier?.name,
        supplierCode: item.supplier,
        quantity: poQty,
        moq: item.moq,
        containerType: item.container,
        containers: containers,
        cbmTotal: (poQty / item.moq) * item.cbm,
        leadTime: supplier?.leadTime,
        requiredDate: new Date(Date.now() + supplier?.leadTime * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Pending',
      };
    }).filter(po => po.quantity > 0);

    setPoOrders(newPOs);
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // In a real app, parse CSV/XLSX here
    console.log(`Uploading ${type}:`, file.name);
    alert(`File uploaded: ${file.name}\nNote: Real CSV/XLSX parsing would happen here`);
  };

  const getInventoryStatus = (item) => {
    const daysSupply = item.currentStock / item.avgDaily;
    if (daysSupply < 10) return 'critical';
    if (daysSupply < 20) return 'low';
    if (daysSupply > 90) return 'high';
    return 'optimal';
  };

  const statusColors = {
    critical: '#ef4444',
    low: '#f97316',
    optimal: '#22c55e',
    high: '#3b82f6'
  };

  const statusLabels = {
    critical: 'Critical (< 10 days)',
    low: 'Low (10-20 days)',
    optimal: 'Optimal (20-90 days)',
    high: 'High (> 90 days)'
  };

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#e2e8f0', minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#f0f9ff' }}>
          Supply Chain PO Management
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Manage purchases, inventory, and suppliers efficiently
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
        {['dashboard', 'inventory', 'po-generator', 'analytics', 'settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === tab ? '#3b82f6' : 'transparent',
              color: '#e2e8f0',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '600' : '400',
              transition: 'all 0.3s'
            }}
          >
            {tab.replace('-', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Upload Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '8px', border: '2px dashed #475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Upload size={20} color="#3b82f6" />
                <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Upload Sales Data (Last 3 Months)</h3>
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload(e, 'sales')}
                style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '4px', color: '#e2e8f0' }}
              />
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                Include: Date, Item Code, Purchase Qty, Sales Qty, Balance
              </p>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '8px', border: '2px dashed #475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Upload size={20} color="#3b82f6" />
                <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Upload Current Inventory</h3>
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload(e, 'inventory')}
                style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '4px', color: '#e2e8f0' }}
              />
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                Include: Item Code, Current Qty, Supplier, MOQ, Lead Time
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Total Items</p>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold' }}>{inventory.length}</h2>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Active Suppliers</p>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold' }}>{suppliers.length}</h2>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Pending POs</p>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#f97316' }}>{poOrders.filter(po => po.status === 'Pending').length}</h2>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Critical Items</p>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
                {inventory.filter(i => getInventoryStatus(i) === 'critical').length}
              </h2>
            </div>
          </div>

          {/* Inventory Status Overview */}
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Inventory Status Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {Object.entries(statusLabels).map(([status, label]) => (
                <div key={status} style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '6px', borderLeft: `4px solid ${statusColors[status]}` }}>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>{label}</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: statusColors[status] }}>
                    {inventory.filter(i => getInventoryStatus(i) === status).length}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Filter by Supplier
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: '4px',
                  color: '#e2e8f0'
                }}
              >
                <option value="ALL">All Suppliers</option>
                {suppliers.map(s => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Days Inventory Needed: {inventoryDays}
              </label>
              <input
                type="range"
                min="7"
                max="90"
                value={inventoryDays}
                onChange={(e) => setInventoryDays(Number(e.target.value))}
                style={{ width: '200px', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Days Safety Stock: {stockKeepDays}
              </label>
              <input
                type="range"
                min="3"
                max="30"
                value={stockKeepDays}
                onChange={(e) => setStockKeepDays(Number(e.target.value))}
                style={{ width: '200px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto', backgroundColor: '#1e293b', borderRadius: '8px', padding: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #475569' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#cbd5e1' }}>Item Code</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#cbd5e1' }}>Item Name</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#cbd5e1' }}>Current Stock</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#cbd5e1' }}>Avg Daily</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#cbd5e1' }}>Days Supply</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#cbd5e1' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#cbd5e1' }}>Supplier</th>
                </tr>
              </thead>
              <tbody>
                {inventory
                  .filter(item => selectedSupplier === 'ALL' || item.supplier === selectedSupplier)
                  .map(item => {
                    const status = getInventoryStatus(item);
                    const daysSupply = (item.currentStock / item.avgDaily).toFixed(1);
                    return (
                      <tr key={item.code} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '12px', color: '#e2e8f0' }}>{item.code}</td>
                        <td style={{ padding: '12px', color: '#cbd5e1', fontSize: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#e2e8f0' }}>
                          {(item.currentStock).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#e2e8f0' }}>{item.avgDaily}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#e2e8f0', fontWeight: '600' }}>
                          <span style={{ color: statusColors[status] }}>{daysSupply} days</span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              backgroundColor: statusColors[status],
                              color: '#fff',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              display: 'inline-block'
                            }}
                          >
                            {status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#cbd5e1', fontSize: '12px' }}>
                          {suppliers.find(s => s.code === item.supplier)?.name}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PO Generator Tab */}
      {activeTab === 'po-generator' && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={generatePO}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={18} />
              Generate PO
            </button>
          </div>

          {poOrders.length > 0 && (
            <div style={{ overflowX: 'auto', backgroundColor: '#1e293b', borderRadius: '8px', padding: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #475569' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#cbd5e1' }}>PO ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#cbd5e1' }}>Item</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#cbd5e1' }}>Qty</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#cbd5e1' }}>Container</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#cbd5e1' }}>CBM</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#cbd5e1' }}>Supplier</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#cbd5e1' }}>Lead Time</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#cbd5e1' }}>Required Date</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#cbd5e1' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {poOrders.map(po => (
                    <tr key={po.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px', color: '#3b82f6', fontWeight: '600' }}>{po.id.substring(0, 15)}...</td>
                      <td style={{ padding: '12px', color: '#cbd5e1', fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {po.itemCode}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#e2e8f0', fontWeight: '600' }}>
                        {po.quantity.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#e2e8f0' }}>
                        {po.containerType} x{po.containers}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#e2e8f0' }}>
                        {po.cbmTotal.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>{po.supplier}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#cbd5e1' }}>{po.leadTime} days</td>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>{po.requiredDate}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 8px', backgroundColor: '#22c55e', color: '#fff', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {poOrders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#1e293b', borderRadius: '8px', color: '#94a3b8' }}>
              <p>Click "Generate PO" to create purchase orders based on current settings</p>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>4-Month Sales Analysis</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {[...new Set(salesData.map(d => d.code))].map(code => {
                const itemData = salesData.filter(d => d.code === code);
                const item = inventory.find(i => i.code === code);
                const totalSales = itemData.reduce((sum, d) => sum + d.dec, 0);
                const totalPurchase = itemData.reduce((sum, d) => sum + d.inc, 0);

                return (
                  <div key={code} style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#e2e8f0' }}>
                      {item?.name}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Total Sales</p>
                        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <TrendingDown size={14} /> {totalSales.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Total Purchase</p>
                        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <TrendingUp size={14} /> {totalPurchase.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #334155' }}>
                      <p style={{ fontSize: '11px', color: '#94a3b8' }}>Monthly Breakdown</p>
                      {itemData.map((d, idx) => (
                        <div key={idx} style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{d.month}</span>
                          <span>Sale: {d.dec} | Bal: {d.bal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div>
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '8px', maxWidth: '600px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>Supply Chain Settings</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', display: 'block', marginBottom: '8px' }}>
                Default Inventory Days
              </label>
              <input
                type="number"
                value={inventoryDays}
                onChange={(e) => setInventoryDays(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  fontSize: '14px'
                }}
              />
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Number of days of inventory to maintain
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', display: 'block', marginBottom: '8px' }}>
                Safety Stock Days
              </label>
              <input
                type="number"
                value={stockKeepDays}
                onChange={(e) => setStockKeepDays(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  fontSize: '14px'
                }}
              />
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Minimum safety stock buffer days
              </p>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '6px', borderLeft: '4px solid #f97316' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' }}>Supplier Summary</h4>
              {suppliers.map(supplier => (
                <div key={supplier.code} style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #334155' }}>
                  <p style={{ fontWeight: '600' }}>{supplier.name} ({supplier.code})</p>
                  <p style={{ color: '#94a3b8' }}>Lead Time: {supplier.leadTime} days | Container: {supplier.type}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyChainDashboard;
