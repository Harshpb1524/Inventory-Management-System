/* ============================================================
   InventoryPro — script.js
   Modular frontend state manager, renderer, and event hub.
   ============================================================ */

'use strict';

/* ── Constants ── */
const AUTH_KEY  = 'inventorypro_logged_in';
const THEME_KEY = 'inventorypro_theme';

/* ── State ── */
const state = {
  page: 'dashboard',
  products: [
    { id: 1, sku: 'RO-001',  name: 'RO Model A',     category: 'Water Purifiers',  purchase: 5500, selling: 7500, stock: 24, minStock: 5,  supplier: 'ABC Traders' },
    { id: 2, sku: 'RO-002',  name: 'RO Model B',     category: 'Water Purifiers',  purchase: 7000, selling: 9500, stock: 12, minStock: 5,  supplier: 'Pure Water Supply' },
    { id: 3, sku: 'FLT-001', name: 'Filter Kit',     category: 'Filters & Parts',  purchase: 700,  selling: 1200, stock: 4,  minStock: 10, supplier: 'ABC Traders' },
    { id: 4, sku: 'ACC-001', name: 'Pre-Filter',     category: 'Accessories',      purchase: 350,  selling: 650,  stock: 38, minStock: 10, supplier: 'WaterTech' },
    { id: 5, sku: 'AMC-001', name: 'Annual Service', category: 'Service & AMC',    purchase: 500,  selling: 1500, stock: 7,  minStock: 3,  supplier: 'Internal' },
  ],
  customers: [
    { id: 1, name: 'Rahul Sharma', phone: '9876543210', total: 25000, paid: 10000, due: 15000, status: 'Partial' },
    { id: 2, name: 'Amit Kumar',   phone: '9811122233', total: 8500,  paid: 0,     due: 8500,  status: 'Unpaid' },
    { id: 3, name: 'Neha Singh',   phone: '9822334455', total: 18000, paid: 12000, due: 6000,  status: 'Partial' },
    { id: 4, name: 'Vikram Patel', phone: '9898989898', total: 4250,  paid: 0,     due: 4250,  status: 'Unpaid' },
    { id: 5, name: 'Pooja Verma',  phone: '9765432100', total: 7800,  paid: 7800,  due: 0,     status: 'Paid' },
  ],
  sales: [
    { id: '#INV-1052', customer: 'Rahul Sharma', product: 'RO Model A',  quantity: 2, amount: 15000, cost: 11000, payment: 'Partial', date: '20 Aug 2026' },
    { id: '#INV-1051', customer: 'Amit Kumar',   product: 'Filter Kit',   quantity: 2, amount: 2400,  cost: 1400,  payment: 'Unpaid',  date: '19 Aug 2026' },
    { id: '#INV-1050', customer: 'Neha Singh',   product: 'RO Model B',   quantity: 2, amount: 19000, cost: 14000, payment: 'Partial', date: '19 Aug 2026' },
    { id: '#INV-1049', customer: 'Vikram Patel', product: 'Pre-Filter',   quantity: 5, amount: 3250,  cost: 1750,  payment: 'Unpaid',  date: '18 Aug 2026' },
    { id: '#INV-1048', customer: 'Pooja Verma',  product: 'RO Model A',   quantity: 1, amount: 7500,  cost: 5500,  payment: 'Paid',    date: '18 Aug 2026' },
  ],
};

const revenueData = [9000, 5200, 10000, 14000, 8500, 4300, 15800, 8200, 16000, 11800, 9000, 13800, 17500, 14300, 17800, 22500];
const labels      = ['01','03','05','07','09','11','13','15','17','19','21','23','25','27','29','31'];
let revenueChart = null;
let pieChart     = null;

/* ── DOM helpers ── */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ── Formatters ── */
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');

function totals() {
  const revenue     = state.sales.reduce((a, s) => a + s.amount, 0) + 82000;
  const cost        = state.sales.reduce((a, s) => a + s.cost, 0) + 62000;
  const outstanding = state.customers.reduce((a, c) => a + c.due, 0);
  return { revenue, cost, profit: revenue - cost, outstanding };
}

/* ── SVG icon library ── */
const icons = {
  rupee:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12M6 8h12M6 21l7-13"/><path d="M6 13h5a4 4 0 0 0 0-5"/></svg>`,
  cart:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
  profit:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  users:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  package:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  list:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  alert:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  check:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  filter:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
  plus:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  search:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  close:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  payment:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  invoice:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  purchase: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  supplier: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  trendUp:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  arrowUp:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
  units:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>`,
  reports:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
};

/* ── Icon helper ── */
function icon(name, cls = '') {
  const raw = icons[name] || icons.package;
  const el  = document.createElement('span');
  el.innerHTML = raw;
  const svg = el.firstChild;
  if (svg && cls) svg.setAttribute('class', cls);
  return el.innerHTML;
}

/* ── Badge builder ── */
function badge(status) {
  const cls = status.toLowerCase().replaceAll(' ', '-');
  return `<span class="badge ${cls}">${status}</span>`;
}

/* ── Page header builder ── */
function pageHeader(title, subtitle, actions = '') {
  return `
    <div class="page-header">
      <div class="page-header-left">
        <div class="eyebrow">InventoryPro</div>
        <h1>${title}</h1>
        <p class="subtitle">${subtitle}</p>
      </div>
      <div class="header-actions">${actions}</div>
    </div>`;
}

/* ── Stat card ── */
function stat(iconName, title, value, note, change = '', colorClass = '') {
  const changePill = change
    ? `<div class="change-pill">${icon('arrowUp')} ${change}</div>`
    : '';
  return `
    <div class="card stat">
      <div class="stat-header">
        <div class="stat-icon ${colorClass}">${icon(iconName)}</div>
        ${changePill}
      </div>
      <div class="stat-label">${title}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-note">${note}</div>
    </div>`;
}

/* ── Mini card ── */
function mini(iconName, title, value, text, iconColor = '') {
  return `
    <div class="card mini">
      <div class="mini-icon" style="${iconColor}">${icon(iconName)}</div>
      <div class="mini-info">
        <p>${title}</p>
        <b>${value}</b>
        <small>${text}</small>
      </div>
    </div>`;
}

/* ── Form field ── */
function field(label, id, type = 'text', value = '', placeholder = '') {
  const val = value !== '' ? `value="${value}"` : '';
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <input id="${id}" type="${type}" ${val} placeholder="${placeholder}" autocomplete="off">
    </div>`;
}

/* ============================================================
   PAGE RENDERERS
   ============================================================ */

/* ── Dashboard ── */
function dashboard() {
  const t   = totals();
  const low = state.products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const out = state.products.filter(p => p.stock === 0).length;

  return `
    ${pageHeader('Hello, Admin! 👋', "Here's what's happening with your business today.",
      `<select class="small-select">
        <option>This Month</option>
        <option>This Week</option>
        <option>This Year</option>
      </select>`)}

    <div class="stats">
      ${stat('rupee',   'Total Revenue',   money(t.revenue),     'vs last month ₹88,420',  '12.5%', '')}
      ${stat('cart',    'Total Orders',    '1,248',              'vs last month 1,152',     '8.4%',  'blue')}
      ${stat('profit',  'Total Profit',    money(t.profit),      'Gross profit this month', '15.6%', 'green')}
      ${stat('users',   'Total Customers', '856',                'vs last month 798',       '7.2%',  'orange')}
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Revenue Overview</h2>
            <p class="panel-sub">Daily revenue for the selected period</p>
          </div>
          <select class="small-select"><option>This Month</option></select>
        </div>
        <div class="chart-wrap"><canvas id="revenueChart"></canvas></div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Sales by Category</h2>
            <p class="panel-sub">This month</p>
          </div>
        </div>
        <div class="pie-wrap"><canvas id="pieChart"></canvas></div>
        <div class="legend">
          ${[
            ['Water Purifiers', '#4f46e5', '32%'],
            ['Filters & Parts', '#f97316', '22%'],
            ['Accessories',     '#22c55e', '18%'],
            ['RO Systems',      '#8b5cf6', '16%'],
            ['Service & AMC',   '#fb7185', '12%'],
          ].map(([x, c, pct]) => `
            <div class="legend-item">
              <span class="dot" style="background:${c}"></span>
              ${x} <b>${pct}</b>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="mini-grid">
      ${mini('alert',   'Low Stock Items',     low,              'Items running low',         'color:var(--orange)')}
      ${mini('package', 'Out of Stock',         out,              'Items unavailable',         'color:var(--red)')}
      ${mini('rupee',   'Outstanding Amount',   money(t.outstanding), `From ${state.customers.filter(c => c.due > 0).length} customers`, 'color:var(--purple)')}
      ${mini('check',   'Paid This Month',      money(71090),     'From 65 customers',         'color:var(--green)')}
    </div>

    <div class="grid-2" style="margin-bottom:0">
      ${recentOrdersPanel()}
      ${outstandingPanel()}
    </div>`;
}

function recentOrdersPanel() {
  return `
    <div class="card table-panel" style="margin-top:0">
      <div class="panel-head" style="padding:20px">
        <div>
          <h2 class="panel-title">Recent Orders</h2>
          <p class="panel-sub">Latest sales transactions</p>
        </div>
        <button class="btn" onclick="navigate('sales')">View all</button>
      </div>
      ${salesTableHTML(state.sales.slice(0, 5))}
    </div>`;
}

function outstandingPanel() {
  const owing = state.customers.filter(c => c.due > 0).slice(0, 4);
  return `
    <div class="card outstanding" style="margin-top:0">
      <div class="panel-head" style="margin-bottom:4px">
        <div>
          <h2 class="panel-title">Outstanding Customers</h2>
          <p class="panel-sub">Customers with pending payments</p>
        </div>
        <button class="btn" onclick="navigate('customers')">View all</button>
      </div>
      ${owing.map(c => `
        <div class="customer-row">
          <div class="customer-info">
            <div class="customer-avatar">${c.name[0]}</div>
            <div>
              <div class="customer-name">${c.name}</div>
              <div class="customer-phone">${c.phone}</div>
            </div>
          </div>
          <div class="due">
            <div class="due-amount">${money(c.due)}</div>
            ${badge(c.status)}
          </div>
        </div>`).join('')}
    </div>`;
}

/* ── Products ── */
function productsPage() {
  const totalStock = state.products.reduce((a, p) => a + p.stock, 0);
  const stockValue = state.products.reduce((a, p) => a + p.purchase * p.stock, 0);

  return `
    ${pageHeader('Products', 'Manage products, pricing, suppliers and stock thresholds.',
      `<button class="btn primary" onclick="openProductModal()">
        ${icon('plus')} Add Product
      </button>`)}
    <div class="page-stat-grid">
      ${stat('package', 'Total Products', state.products.length, 'Active products')}
      ${stat('list',    'Stock Units',    totalStock, 'Across all products', '', 'blue')}
      ${stat('rupee',   'Stock Value',    money(stockValue), 'At purchase cost', '', 'green')}
    </div>
    <div class="card table-panel" style="margin-top:0">
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-small">
            ${icon('search')}
            <input id="productSearch" placeholder="Search products…" oninput="filterProducts(this.value)">
          </div>
        </div>
        <div class="toolbar-right">
          <button class="btn">${icon('filter')} Filter</button>
        </div>
      </div>
      <div id="productsTable">${productsTableHTML(state.products)}</div>
    </div>`;
}

function productsTableHTML(rows) {
  if (!rows.length) return emptyTableMsg('No products found');
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th><th>SKU</th><th>Category</th>
            <th>Purchase</th><th>Selling</th><th>Stock</th>
            <th>Margin</th><th>Supplier</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(p => {
            const margin  = ((p.selling - p.purchase) / p.selling * 100).toFixed(1);
            const stockSt = p.stock === 0 ? 'Out of Stock' : p.stock <= p.minStock ? 'Low Stock' : 'In Stock';
            return `
              <tr>
                <td><span class="td-bold">${p.name}</span></td>
                <td class="td-muted">${p.sku}</td>
                <td>${p.category}</td>
                <td>${money(p.purchase)}</td>
                <td><span class="td-bold">${money(p.selling)}</span></td>
                <td><span class="td-bold">${p.stock}</span></td>
                <td class="td-green">${margin}%</td>
                <td>${p.supplier}</td>
                <td>${badge(stockSt)}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ── Inventory ── */
function inventoryPage() {
  const totalStock = state.products.reduce((a, p) => a + p.stock, 0);
  const lowCount   = state.products.filter(p => p.stock <= p.minStock).length;
  const stockValue = state.products.reduce((a, p) => a + p.purchase * p.stock, 0);
  const maxStock   = Math.max(...state.products.map(p => p.stock), 1);

  return `
    ${pageHeader('Inventory', 'Monitor stock levels and movements.',
      `<button class="btn">${icon('download')} Export</button>`)}
    <div class="page-stat-grid">
      ${stat('list',   'Current Units',   totalStock,       'Available stock')}
      ${stat('alert',  'Low Stock Items', lowCount,         'Needs restocking', '', 'orange')}
      ${stat('rupee',  'Inventory Value', money(stockValue),'Purchase value',    '', 'green')}
    </div>
    <div class="panel" style="margin-top:0">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">Stock Levels</h2>
          <p class="panel-sub">Current stock vs minimum thresholds</p>
        </div>
      </div>
      ${state.products.map(p => {
        const pct      = Math.min(100, Math.round(p.stock / maxStock * 100));
        const lowColor = p.stock <= p.minStock ? '#ea580c' : '#4f46e5';
        const status   = p.stock === 0 ? 'Out of Stock' : p.stock <= p.minStock ? 'Low Stock' : 'In Stock';
        return `
          <div class="progress-row">
            <div class="progress-head">
              <span><b>${p.name}</b> &mdash; <span style="color:var(--text-muted)">${p.sku}</span></span>
              <span style="display:flex;align-items:center;gap:8px">
                ${badge(status)}
                <b>${p.stock} / ${p.minStock} min</b>
              </span>
            </div>
            <div class="progress">
              <span style="width:${pct}%;background:${lowColor}"></span>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

/* ── Sales ── */
function salesPage() {
  const totalOrders = state.sales.length + 167;
  const totalSales  = state.sales.reduce((a, s) => a + s.amount, 0) + 82000;
  const totalProfit = state.sales.reduce((a, s) => a + s.amount - s.cost, 0) + 20500;

  return `
    ${pageHeader('Sales', 'Create sales, track orders and payment status.',
      `<button class="btn primary" onclick="openSaleModal()">
        ${icon('plus')} New Sale
      </button>`)}
    <div class="page-stat-grid">
      ${stat('cart',   'Orders',     totalOrders,         'This month')}
      ${stat('rupee',  'Revenue',    money(totalSales),   'This month', '', 'blue')}
      ${stat('profit', 'Profit',     money(totalProfit),  'Gross profit', '', 'green')}
    </div>
    <div class="card table-panel" style="margin-top:0">
      <div class="toolbar">
        <div class="toolbar-left">
          <h2 class="panel-title" style="margin:0">Sales History</h2>
        </div>
        <div class="toolbar-right">
          <button class="btn">${icon('download')} Export</button>
        </div>
      </div>
      ${salesTableHTML(state.sales, true)}
    </div>`;
}

function salesTableHTML(rows, extended = false) {
  if (!rows.length) return emptyTableMsg('No sales found');
  const extCols = extended ? '<th>Profit</th>' : '';
  const extCell = s => extended ? `<td class="td-green">${money(s.amount - s.cost)}</td>` : '';
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Invoice</th><th>Customer</th><th>Product</th>
            <th>Qty</th><th>Amount</th>${extCols}
            <th>Payment</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(s => `
            <tr>
              <td><span class="td-bold">${s.id}</span></td>
              <td>${s.customer}</td>
              <td>${s.product}</td>
              <td>${s.quantity}</td>
              <td><span class="td-bold">${money(s.amount)}</span></td>
              ${extCell(s)}
              <td>${badge(s.payment)}</td>
              <td class="td-muted">${s.date}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ── Customers ── */
function customersPage(paymentsOnly = false) {
  const outstanding = state.customers.reduce((a, c) => a + c.due, 0);
  const totalPaid   = state.customers.reduce((a, c) => a + c.paid, 0);

  return `
    ${pageHeader(
      paymentsOnly ? 'Payments & Receivables' : 'Customers',
      paymentsOnly ? 'Track unpaid, partial and completed customer payments.' : 'Manage customers and outstanding dues.'
    )}
    <div class="page-stat-grid">
      ${stat('users',  'Customers',    state.customers.length, 'Customer accounts')}
      ${stat('alert',  'Outstanding',  money(outstanding),     'Total receivable', '', 'orange')}
      ${stat('check',  'Paid',         money(totalPaid),       'Payments received', '', 'green')}
    </div>
    <div class="card table-panel" style="margin-top:0">
      <div class="toolbar">
        <div class="toolbar-left">
          <div>
            <b style="font-size:13px">Customer Accounts</b>
            <div class="panel-sub">Unpaid balances remain visible until payment is recorded.</div>
          </div>
        </div>
        <div class="toolbar-right">
          <div class="search-small">
            ${icon('search')}
            <input id="customerSearch" placeholder="Search customer…" oninput="filterCustomers(this.value)">
          </div>
        </div>
      </div>
      <div id="customersTable">${customersTableHTML(state.customers)}</div>
    </div>`;
}

function customersTableHTML(rows) {
  if (!rows.length) return emptyTableMsg('No customers found');
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Customer</th><th>Phone</th><th>Total Purchases</th>
            <th>Paid</th><th>Outstanding</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(c => `
            <tr>
              <td>
                <div class="customer-info">
                  <div class="customer-avatar">${c.name[0]}</div>
                  <span class="td-bold">${c.name}</span>
                </div>
              </td>
              <td class="td-muted">${c.phone}</td>
              <td>${money(c.total)}</td>
              <td class="td-green">${money(c.paid)}</td>
              <td class="td-red">${money(c.due)}</td>
              <td>${badge(c.status)}</td>
              <td>
                ${c.due > 0
                  ? `<button class="btn" onclick="openPaymentModal(${c.id})">${icon('payment')} Record Payment</button>`
                  : `<span class="td-muted">No balance due</span>`}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ── Reports ── */
function reportsPage() {
  const t    = totals();
  const best = state.products.map(p => ({
    name:   p.name,
    sold:   state.sales.filter(s => s.product === p.name).reduce((a, s) => a + s.quantity, 0),
    profit: state.sales.filter(s => s.product === p.name).reduce((a, s) => a + s.amount - s.cost, 0),
  })).sort((a, b) => b.sold - a.sold);

  const checkItems = [
    'Sales summary', 'Profit & loss', 'Product performance',
    'Stock valuation', 'Customer receivables', 'Supplier purchases',
  ];

  return `
    ${pageHeader('Reports & Analytics', 'Daily, weekly, monthly and yearly business performance.',
      `<select class="small-select">
        <option>This Month</option>
        <option>This Week</option>
        <option>This Year</option>
      </select>
      <button class="btn primary" onclick="alert('Excel export will be available after backend integration.')">
        ${icon('download')} Excel
      </button>`)}

    <div class="report-cards">
      ${stat('rupee',   'Revenue',    money(t.revenue), 'This month', '17.3%', '')}
      ${stat('profit',  'Profit',     money(t.profit),  'Gross profit', '21.1%', 'green')}
      ${stat('package', 'Units Sold', '486',            'This month', '15.4%', 'blue')}
      ${stat('cart',    'Orders',     '172',            'This month', '16.2%', 'orange')}
    </div>

    <div class="grid-2-equal">
      <div class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Revenue & Profit Trend</h2>
            <p class="panel-sub">Daily breakdown</p>
          </div>
        </div>
        <div class="chart-wrap"><canvas id="reportChart"></canvas></div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Top Selling Products</h2>
            <p class="panel-sub">Ranked by units sold</p>
          </div>
        </div>
        ${best.slice(0, 5).map((p, i) => `
          <div class="customer-row">
            <div class="customer-info">
              <div class="customer-avatar">${i + 1}</div>
              <div>
                <div class="customer-name">${p.name}</div>
                <div class="customer-phone">${p.sold} units sold</div>
              </div>
            </div>
            <b style="color:var(--green)">${money(p.profit)}</b>
          </div>`).join('')}
      </div>
    </div>

    <div class="panel" style="margin-top:14px">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">Monthly Report Checklist</h2>
          <p class="panel-sub">All reports generated and reviewed</p>
        </div>
      </div>
      <div class="check-grid">
        ${checkItems.map(x => `
          <div class="check">
            <div class="check-icon">${icon('check')}</div>
            ${x}
          </div>`).join('')}
      </div>
    </div>`;
}

/* ── Simple placeholder page ── */
function simplePage(title, subtitle, iconName) {
  return `
    ${pageHeader(title, subtitle)}
    <div class="empty-page">
      <div class="empty-page-inner">
        <div class="empty-icon">${icon(iconName)}</div>
        <h2>${title} Module</h2>
        <p>The frontend shell is ready. This module will be fully functional after connecting to the FastAPI + PostgreSQL backend.</p>
      </div>
    </div>`;
}

/* ── Helpers ── */
function emptyTableMsg(msg) {
  return `<div style="padding:40px;text-align:center;color:var(--text-faint);font-size:13px">${msg}</div>`;
}

/* ============================================================
   RENDER ROUTER
   ============================================================ */
function render() {
  // Destroy existing charts before re-render
  if (revenueChart) { revenueChart.destroy(); revenueChart = null; }
  if (pieChart)     { pieChart.destroy();     pieChart     = null; }

  let html = '';
  switch (state.page) {
    case 'products':  html = productsPage();  break;
    case 'inventory': html = inventoryPage(); break;
    case 'sales':     html = salesPage();     break;
    case 'customers': html = customersPage(); break;
    case 'payments':  html = customersPage(true); break;
    case 'reports':   html = reportsPage();   break;
    case 'purchases': html = simplePage('Purchases', 'Manage supplier purchases and stock-in records.', 'purchase'); break;
    case 'suppliers': html = simplePage('Suppliers', 'Manage suppliers and purchase history.', 'supplier'); break;
    case 'invoices':  html = simplePage('Invoices', 'Create, view, print and download customer invoices.', 'invoice'); break;
    case 'settings':  html = simplePage('Settings', 'Business profile, users, permissions and tax settings.', 'settings'); break;
    default:          html = dashboard();
  }

  $('#content').innerHTML = html;

  // Init charts after DOM is ready
  if (state.page === 'dashboard') initDashboardCharts();
  if (state.page === 'reports')   initReportChart();

  // Update active nav
  $$('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === state.page);
  });
}

/* ============================================================
   CHART INIT
   ============================================================ */
function chartDefaults() {
  const dark  = document.documentElement.classList.contains('dark');
  const grid  = dark ? '#1e2d47' : '#f1f5f9';
  const tick  = dark ? '#475569' : '#94a3b8';
  return { grid, tick };
}

function initDashboardCharts() {
  const { grid, tick } = chartDefaults();

  revenueChart = new Chart($('#revenueChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data: revenueData,
        backgroundColor: 'rgba(79,70,229,.85)',
        borderRadius: 6,
        barThickness: 16,
        hoverBackgroundColor: '#4f46e5',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ₹' + ctx.parsed.y.toLocaleString('en-IN') } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: tick } },
        y: { grid: { color: grid }, ticks: { font: { size: 10 }, color: tick }, beginAtZero: true,
             callback: v => '₹' + (v >= 1000 ? (v / 1000) + 'k' : v) },
      },
    },
  });

  pieChart = new Chart($('#pieChart'), {
    type: 'doughnut',
    data: {
      labels: ['Water Purifiers', 'Filters & Parts', 'Accessories', 'RO Systems', 'Service & AMC'],
      datasets: [{
        data: [32, 22, 18, 16, 12],
        backgroundColor: ['#4f46e5', '#f97316', '#22c55e', '#8b5cf6', '#fb7185'],
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` } } },
    },
  });
}

function initReportChart() {
  const { grid, tick } = chartDefaults();
  new Chart($('#reportChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data: revenueData,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79,70,229,.1)',
        fill: true,
        tension: .38,
        pointRadius: 3,
        pointBackgroundColor: '#4f46e5',
        pointBorderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ₹' + ctx.parsed.y.toLocaleString('en-IN') } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: tick } },
        y: { grid: { color: grid }, ticks: { font: { size: 10 }, color: tick }, beginAtZero: true },
      },
    },
  });
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function navigate(page) {
  state.page = page;
  render();
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   SEARCH & FILTER
   ============================================================ */
function filterProducts(q) {
  const query = q.toLowerCase();
  const rows  = state.products.filter(p =>
    (p.name + p.sku + p.category + p.supplier).toLowerCase().includes(query)
  );
  $('#productsTable').innerHTML = productsTableHTML(rows);
}

function filterCustomers(q) {
  const query = q.toLowerCase();
  const rows  = state.customers.filter(c =>
    (c.name + c.phone).toLowerCase().includes(query)
  );
  $('#customersTable').innerHTML = customersTableHTML(rows);
}

/* ============================================================
   MODAL SYSTEM
   ============================================================ */
function openModal(content) {
  $('#modal').innerHTML = content;
  $('#modalBackdrop').classList.remove('hidden');
  // Trap focus in first input
  const firstInput = $('#modal').querySelector('input, select, button');
  if (firstInput) setTimeout(() => firstInput.focus(), 50);
}

function closeModal() {
  $('#modalBackdrop').classList.add('hidden');
  $('#modal').innerHTML = '';
}

/* ── Add Product Modal ── */
function openProductModal() {
  openModal(`
    <div class="modal-head">
      <h2>Add Product</h2>
      <button class="modal-close" onclick="closeModal()" aria-label="Close">${icon('close')}</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        ${field('Product Name', 'pname', 'text', '', 'e.g. RO Model C')}
        ${field('SKU', 'psku', 'text', '', 'e.g. RO-003')}
        ${field('Purchase Price (₹)', 'ppurchase', 'number', '', '5500')}
        ${field('Selling Price (₹)', 'pselling', 'number', '', '7500')}
        ${field('Opening Stock', 'pstock', 'number', '', '20')}
        ${field('Minimum Stock', 'pmin', 'number', '5', '5')}
        ${field('Category', 'pcat', 'text', 'Water Purifiers', '')}
        ${field('Supplier', 'psupplier', 'text', '', 'e.g. ABC Traders')}
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="saveProduct()">
        ${icon('plus')} Save Product
      </button>
    </div>`);
}

function saveProduct() {
  const p = {
    id:       Date.now(),
    name:     $('#pname').value.trim(),
    sku:      $('#psku').value.trim(),
    category: $('#pcat').value.trim() || 'Uncategorised',
    purchase: +$('#ppurchase').value,
    selling:  +$('#pselling').value,
    stock:    +$('#pstock').value,
    minStock: +$('#pmin').value,
    supplier: $('#psupplier').value.trim(),
  };
  if (!p.name || !p.sku) { alert('Product name and SKU are required.'); return; }
  state.products.push(p);
  closeModal();
  render();
}

/* ── New Sale Modal ── */
function openSaleModal() {
  const available = state.products.filter(p => p.stock > 0);
  if (!available.length) { alert('No products with available stock.'); return; }

  openModal(`
    <div class="modal-head">
      <h2>Create New Sale</h2>
      <button class="modal-close" onclick="closeModal()" aria-label="Close">${icon('close')}</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="field">
          <label for="scustomer">Customer</label>
          <select id="scustomer">
            ${state.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="sproduct">Product</label>
          <select id="sproduct">
            ${available.map(p => `<option value="${p.id}">${p.name} (${p.stock} in stock)</option>`).join('')}
          </select>
        </div>
        ${field('Quantity', 'sqty', 'number', '1', '1')}
        <div class="field">
          <label for="spayment">Payment Status</label>
          <select id="spayment">
            <option>Paid</option>
            <option>Partial</option>
            <option>Unpaid</option>
          </select>
        </div>
      </div>
      <div class="summary-box">
        <div class="summary-line"><span>Sale Total</span><b id="saleTotal">₹0</b></div>
        <div class="summary-line"><span>Estimated Profit</span><b id="saleProfit" style="color:var(--green)">₹0</b></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="saveSale()">
        ${icon('cart')} Create Sale
      </button>
    </div>`);

  $('#sproduct').addEventListener('change', updateSaleSummary);
  $('#sqty').addEventListener('input', updateSaleSummary);
  updateSaleSummary();
}

function updateSaleSummary() {
  const pid     = +$('#sproduct').value;
  const product = state.products.find(x => x.id === pid);
  const qty     = Math.max(0, +$('#sqty').value || 0);
  $('#saleTotal').textContent  = money((product?.selling || 0) * qty);
  $('#saleProfit').textContent = money(((product?.selling || 0) - (product?.purchase || 0)) * qty);
}

function saveSale() {
  const pid     = +$('#sproduct').value;
  const product = state.products.find(x => x.id === pid);
  const qty     = +$('#sqty').value;
  const custId  = +$('#scustomer').value;
  const payment = $('#spayment').value;

  if (!product || qty < 1)           { alert('Please enter a valid quantity.'); return; }
  if (qty > product.stock)           { alert(`Only ${product.stock} units available.`); return; }

  const amount   = product.selling * qty;
  const cost     = product.purchase * qty;
  product.stock -= qty;

  state.sales.unshift({
    id:       '#INV-' + (1053 + state.sales.length),
    customer: state.customers.find(c => c.id === custId)?.name || 'Unknown',
    product:  product.name,
    quantity: qty,
    amount,
    cost,
    payment,
    date: '22 Aug 2026',
  });

  const customer = state.customers.find(c => c.id === custId);
  if (customer) {
    customer.total += amount;
    if (payment !== 'Paid') customer.due += amount;
    else customer.paid += amount;
    customer.status = customer.due === 0 ? 'Paid' : customer.paid > 0 ? 'Partial' : 'Unpaid';
  }

  closeModal();
  render();
}

/* ── Record Payment Modal ── */
function openPaymentModal(id) {
  const customer = state.customers.find(c => c.id === id);
  if (!customer) return;

  openModal(`
    <div class="modal-head">
      <h2>Record Payment</h2>
      <button class="modal-close" onclick="closeModal()" aria-label="Close">${icon('close')}</button>
    </div>
    <div class="modal-body">
      <div class="customer-row" style="padding:0 0 16px;border-bottom:1px solid var(--border);margin-bottom:16px">
        <div class="customer-info">
          <div class="customer-avatar">${customer.name[0]}</div>
          <div>
            <div class="customer-name">${customer.name}</div>
            <div class="customer-phone">${customer.phone}</div>
          </div>
        </div>
        ${badge(customer.status)}
      </div>
      <div class="summary-box warning">
        <div style="font-size:11px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.4px">Outstanding Balance</div>
        <div class="outstanding-amount">${money(customer.due)}</div>
      </div>
      <div style="margin-top:16px">
        ${field('Payment Amount (₹)', 'payamount', 'number', '', 'Enter amount received')}
      </div>
      <p class="panel-sub" style="margin-top:8px">The customer balance will update automatically after saving.</p>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="savePayment(${id})">
        ${icon('payment')} Confirm Payment
      </button>
    </div>`);
}

function savePayment(id) {
  const customer = state.customers.find(c => c.id === id);
  const amount   = +$('#payamount').value;

  if (!amount || amount <= 0) { alert('Please enter a valid payment amount.'); return; }

  const paid       = Math.min(amount, customer.due);
  customer.paid   += paid;
  customer.due    -= paid;
  customer.status  = customer.due === 0 ? 'Paid' : 'Partial';

  closeModal();
  render();
}

/* ============================================================
   SIDEBAR MOBILE HELPERS
   ============================================================ */
function openSidebar() {
  $('#sidebar').classList.add('open');
  $('#overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  $('#sidebar').classList.remove('open');
  $('#overlay').classList.remove('show');
  document.body.style.overflow = '';
}

/* ============================================================
   AUTH
   ============================================================ */
function renderLogin() {
  const loginLogoSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="7" height="7" rx="1"/><rect x="15" y="3" width="7" height="7" rx="1"/><rect x="15" y="14" width="7" height="7" rx="1"/><rect x="2" y="14" width="7" height="7" rx="1"/></svg>`;

  $('#appShell').classList.add('hidden');
  $('#loginScreen').classList.remove('hidden');
  $('#loginScreen').innerHTML = `
    <div class="login-card">
      <div class="login-brand">
        <div class="login-logo">${loginLogoSVG}</div>
        <span>Inventory<span class="brand-accent">Pro</span></span>
      </div>
      <h1>Welcome back</h1>
      <p>Sign in to access your inventory management panel.</p>
      <form id="loginForm" novalidate>
        <div class="login-field">
          <label for="loginUsername">Username</label>
          <input id="loginUsername" autocomplete="username" placeholder="Enter username" required>
        </div>
        <div class="login-field">
          <label for="loginPassword">Password</label>
          <input id="loginPassword" type="password" autocomplete="current-password" placeholder="Enter password" required>
        </div>
        <div class="login-error" id="loginError" role="alert" aria-live="polite"></div>
        <button class="login-submit" type="submit">Sign in to Panel</button>
      </form>
      <div class="demo-login">
        <b>Demo credentials</b><br>
        Username: <b>admin</b> &nbsp;&middot;&nbsp; Password: <b>admin123</b>
      </div>
    </div>`;

  $('#loginForm').addEventListener('submit', handleLogin);
}

function handleLogin(e) {
  e.preventDefault();
  const username = $('#loginUsername').value.trim();
  const password = $('#loginPassword').value;

  if (username === 'admin' && password === 'admin123') {
    localStorage.setItem(AUTH_KEY, 'true');
    showApp();
  } else {
    const err = $('#loginError');
    err.textContent = 'Incorrect username or password. Check the demo credentials below.';
    $('#loginPassword').value = '';
    $('#loginPassword').focus();
  }
}

function showApp() {
  $('#loginScreen').classList.add('hidden');
  $('#appShell').classList.remove('hidden');
  render();
  updateThemeButton();
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  state.page = 'dashboard';
  renderLogin();
}

/* ============================================================
   THEME
   ============================================================ */
function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_KEY, theme);
  updateThemeButton();
}

function updateThemeButton() {
  const btn  = $('#themeToggle');
  if (!btn) return;
  const dark = document.documentElement.classList.contains('dark');
  btn.querySelector('.icon-moon')?.classList.toggle('hidden',  dark);
  btn.querySelector('.icon-sun')?.classList.toggle('hidden',  !dark);
  btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(saved);
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */
$('#nav').addEventListener('click', e => {
  const btn = e.target.closest('.nav-item');
  if (btn) navigate(btn.dataset.page);
});

$('#menuBtn').addEventListener('click', openSidebar);
$('#mobileClose').addEventListener('click', closeSidebar);
$('#overlay').addEventListener('click', closeSidebar);

$('#modalBackdrop').addEventListener('click', e => {
  if (e.target.id === 'modalBackdrop') closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

$('#themeToggle').addEventListener('click', () => {
  const dark = document.documentElement.classList.contains('dark');
  applyTheme(dark ? 'light' : 'dark');
});

$('#logoutBtn').addEventListener('click', logout);

/* ============================================================
   BOOT
   ============================================================ */
initTheme();
if (localStorage.getItem(AUTH_KEY) === 'true') showApp();
else renderLogin();
