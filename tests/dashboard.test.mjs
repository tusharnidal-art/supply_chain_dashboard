// Browser tests for supply_chain_dashboard.html.
// Setup: npm install    Run: npm test
// Set CHROMIUM_PATH to use an already-installed Chromium instead of `npx playwright install chromium`.
import { chromium } from 'playwright';
import fs from 'fs';
import { fileURLToPath } from 'url';

const root = new URL('..', import.meta.url);
const pagePath = new URL('supply_chain_dashboard.html', root).href;
const samplePath = name => fileURLToPath(new URL(`samples/${name}`, root));
const sheetJsPath = fileURLToPath(new URL('node_modules/xlsx/dist/xlsx.full.min.js', root));

const assert = (c, m) => { if (!c) { console.log('FAIL:', m); process.exitCode = 1; } else console.log('ok:', m); };

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
const errors = [];
page.on('dialog', d => d.accept());
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.route('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', r => r.fulfill({ path: sheetJsPath, contentType: 'application/javascript' }));
await page.goto(pagePath);

const text = sel => page.locator(sel).innerText();
const rows = sel => page.locator(sel + ' tbody tr').allInnerTexts();

// 1. sample data
assert((await rows('#inventoryTable')).length === 5, 'sample inventory has 5 rows');
await page.click('.tab-btn:text-is("PO GENERATOR")');
await page.click('text=+ Generate PO');
let po = await rows('#poTable');
const basil = po.find(r => r.includes('321601'));
assert(basil.includes('7,850') && basil.includes('4 × 40ft') && basil.includes('93%') && basil.includes('241.15'), 'basil PO: 7850 ctn, 4x40ft, 93%, 241.15 CBM');
const atta = po.find(r => r.includes('120405'));
assert(atta.includes('20ft') && atta.includes('est.'), 'atta uses estimated 20ft');

// 1b. analytics with sample data
await page.click('.tab-btn:text-is("ANALYTICS")');
assert(await page.locator('#trendChart svg .bar-group').count() === 4, 'sample chart has 4 months');
assert(await page.locator('#trendLegend .legend-item').count() === 2, 'legend shows sales + purchases');
assert((await rows('#trendTable')).length === 5, 'trend table has 5 items');
const trendRows = await rows('#trendTable');
assert(trendRows[0].includes('Rising') && trendRows[1].includes('Falling') && trendRows[2].includes('Steady'), 'trend labels');
await page.locator('#trendChart .bar-group').nth(1).hover();
assert((await text('#trendTooltip')).includes('/day'), 'tooltip shows on hover');
await page.locator('#trendTable tbody tr').first().click();
assert(await page.locator('#trendItem').inputValue() === '321601', 'row click selects item');
assert((await text('#trendChart')).includes('Used for POs: 85'), 'reference line = avg used for POs');

// 1c. PO grouping, filter, export
await page.click('.tab-btn:text-is("PO GENERATOR")');
const groupHeaders = await page.locator('#poTable tr.po-group').allInnerTexts();
assert(groupHeaders.length === 3 && groupHeaders[0].startsWith('Local Supplier A'), 'POs grouped by supplier, sorted');
let [download] = await Promise.all([page.waitForEvent('download'), page.click('#poExport')]);
let csv = fs.readFileSync(await download.path(), 'utf8');
assert(csv.split('\r\n')[0].includes('Supplier_Code,Supplier_Name,PO_ID') && csv.split('\r\n').filter(Boolean).length === 6, 'export has header + 5 lines');
assert(csv.indexOf('Local Supplier A') < csv.indexOf('YU DAT BS'), 'export grouped by supplier');
await page.selectOption('#poSupplierFilter', 'V20184');
assert((await rows('#poTable')).length === 2, 'filter shows 1 supplier (header + 1 line)');
[download] = await Promise.all([page.waitForEvent('download'), page.click('#poExport')]);
csv = fs.readFileSync(await download.path(), 'utf8');
assert(download.suggestedFilename().includes('V20184') && csv.trim().split('\r\n').length === 2, 'filtered export');
await page.selectOption('#poSupplierFilter', 'ALL');

// 2. slider regenerates
await page.click('.tab-btn:text-is("INVENTORY")');
await page.locator('#inventoryDays').fill('60');
await page.click('.tab-btn:text-is("PO GENERATOR")');
po = await rows('#poTable');
assert(!po.find(r => r.includes('321601')).includes('7,850'), 'slider change regenerated POs');
await page.click('.tab-btn:text-is("INVENTORY")');
await page.locator('#inventoryDays').fill('30');

// 3. CSV inventory upload with quirks
await page.click('.tab-btn:text-is("DASHBOARD")');
const inv = 'Item_Code;Item_Name;Current_Qty;Supplier_Code;MOQ;Lead_Time;Container_Type;CBM_Per_Carton\r\n'
 + '"A1";"Widget; big ""XL""";"1,200";S1;100;30;;0.05\r\n'
 + 'A2;<b>Gadget</b>;500;S1;;;;\r\n'
 + ';No code;10;S1;1;1;;\r\n'
 + 'A3;Bad qty;abc;S2;1;1;;\r\n'
 + 'A4;Never sold;300;S2;50;10;20ft;0.1\r\n';
await page.setInputFiles('#inventoryFile', { name: 'inv.csv', mimeType: 'text/csv', buffer: Buffer.from(inv) });
await page.waitForTimeout(300);
assert((await text('#inventoryStatus')).includes('Loaded 3 items'), 'inventory: 3 valid items');
assert((await text('#inventoryStatus')).includes('Skipped 2 row'), 'inventory: 2 skipped rows reported');
const invRows = await rows('#inventoryTable');
assert(invRows.some(r => r.includes('Widget; big "XL"')), 'quoted CSV field parsed');
assert(invRows.some(r => r.includes('<b>Gadget</b>')), 'HTML in names is escaped');
assert(invRows.every(r => r.includes('NO SALES')), 'no sales yet -> NO SALES status');
assert((await text('#countNoSales')) === '3', 'no-sales count 3');

// 4. sales upload, DD/MM/YYYY, 3 months
let sales = 'Date,Item_Code,Sales\n';
const start = Date.UTC(2026, 0, 1);
for (let d = 0; d < 90; d++) { const t = new Date(start + d * 864e5); const s = `${String(t.getUTCDate()).padStart(2,'0')}/${String(t.getUTCMonth()+1).padStart(2,'0')}/${t.getUTCFullYear()}`; sales += `${s},A1,20\n`; if (d % 2 === 0) sales += `${s},A2,10\n`; }
sales += '31/02/2026,A1,5\n';
await page.setInputFiles('#salesFile', { name: 'sales.csv', mimeType: 'text/csv', buffer: Buffer.from(sales) });
await page.waitForTimeout(300);
assert((await text('#salesStatus')).includes('over 90 days'), 'sales: 90-day period');
const inv2 = await rows('#inventoryTable');
assert(inv2.find(r => r.includes('A1')).includes('20') && inv2.find(r => r.includes('A1')).includes('60.0 days'), 'A1 avg 20/day, 60 days supply');
assert(inv2.find(r => r.includes('A4')).includes('NO SALES'), 'A4 still no sales');
await page.click('.tab-btn:text-is("PO GENERATOR")');
await page.click('text=+ Generate PO');
po = await rows('#poTable');
// A1: 20*(30+30+7)=1340 -> ceil(13.4)*100=1400 -1200=200; est cap40 = floor(58/0.05)=1160 -> mixed (no pref, supplier S1 derived) -> 0x40 remainder 200 <= cap20 560 -> 1x20ft
assert(po.find(r => r.includes('A1')).includes('200') && po.find(r => r.includes('A1')).includes('1 × 20ft'), 'A1: 200 ctn in 1x20ft');
assert(!po.some(r => r.includes('A4')), 'no PO for zero-sales item');

// 5. missing columns error
await page.click('.tab-btn:text-is("DASHBOARD")');
await page.setInputFiles('#salesFile', { name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('Code,Qty\n1,2\n') });
await page.waitForTimeout(300);
assert((await text('#salesStatus')).includes('Missing required column'), 'missing columns error');

// 6. month-format sales
await page.setInputFiles('#salesFile', { name: 'm.csv', mimeType: 'text/csv', buffer: Buffer.from('Month,Item Code,DEC\nJan 2026,A4,310\nFeb 2026,A4,280\nMar 2026,A4,310\n') });
await page.waitForTimeout(300);
assert((await text('#salesStatus')).includes('90 days'), 'monthly: Jan-Mar = 90 days');

// 6b. analytics from uploaded monthly sales, no purchases -> single series, no legend
await page.click('.tab-btn:text-is("ANALYTICS")');
await page.selectOption('#trendItem', 'A4');
assert(await page.locator('#trendChart svg .bar-group').count() === 3, 'uploaded chart has 3 months');
assert(await page.locator('#trendLegend .legend-item').count() === 0, 'single series has no legend');
await page.click('.tab-btn:text-is("DASHBOARD")');

// 6c. persistence across reload
await page.click('.tab-btn:text-is("INVENTORY")');
await page.locator('#inventoryDays').fill('45');
await page.reload();
assert((await text('#dataSourceLabel')).includes('inv.csv') && (await text('#dataSourceLabel')).includes('Saved in this browser'), 'data source restored after reload');
assert((await rows('#inventoryTable')).length === 3, 'uploaded inventory restored');
assert(await page.locator('#inventoryDays').inputValue() === '45' && (await text('#invDaysDisplay')) === '45', 'slider restored');
assert((await rows('#inventoryTable')).find(r => r.includes('A4')).includes('30.0 days'), 'sales averages restored (A4 10/day)');
await page.click('.tab-btn:text-is("PO GENERATOR")');
assert((await rows('#poTable')).length > 0, 'generated POs restored');
await page.click('.tab-btn:text-is("DASHBOARD")');

// 6d. the sample CSVs in samples/ load without skipped rows and produce POs
await page.setInputFiles('#suppliersFile', samplePath('suppliers.csv'));
await page.setInputFiles('#inventoryFile', samplePath('inventory.csv'));
await page.setInputFiles('#salesFile', samplePath('sales.csv'));
await page.waitForTimeout(500);
const sampleStatus = (await text('#suppliersStatus')) + (await text('#inventoryStatus')) + (await text('#salesStatus'));
assert(sampleStatus.includes('Loaded 4 suppliers') && sampleStatus.includes('Loaded 5 items') && sampleStatus.includes('over 90 days'), 'sample CSVs load');
assert(!sampleStatus.includes('Skipped') && !sampleStatus.includes('no lead time'), 'sample CSVs have no skipped rows or missing lead times');
await page.click('.tab-btn:text-is("PO GENERATOR")');
await page.click('text=+ Generate PO');
assert((await page.locator('#poTable tr.po-group').count()) === 3, 'sample CSVs produce POs for 3 suppliers');
await page.click('.tab-btn:text-is("DASHBOARD")');

// 7. Excel upload (MISB-like: title rows above header)
await page.click('text=Reset to sample data');
assert((await rows('#inventoryTable')).length === 5, 'reset restores sample');
const ok = await page.evaluate(async () => { try { await loadSheetJS(); return true; } catch (e) { return e.message; } });
if (ok === true) {
  const b64 = await page.evaluate(() => {
    const ws = XLSX.utils.aoa_to_sheet([['MISB Warehouse'], ['Item Code', 'Item Name', 'Qty(Ctn)', 'VendorCode', 'MOQ', 'Transit Time(Days)', '40ft', '20ft', 'BaseQty', 'cbm'], [321601, 'Basil', 2500, 'V20183', 450, 80, 2100, 1000, 24, 0.00128]]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['notes']]), 'Instruction'); XLSX.utils.book_append_sheet(wb, ws, 'MisbWH');
    return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  });
  await page.setInputFiles('#inventoryFile', { name: 'misb.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.from(b64, 'base64') });
  await page.waitForTimeout(500);
  assert((await text('#inventoryStatus')).includes('sheet "MisbWH", header on row 2'), 'xlsx: finds sheet and header row');
} else console.log('SKIP xlsx:', ok);

assert(errors.length === 0, 'no JS errors: ' + errors.join(' | '));
await browser.close();
