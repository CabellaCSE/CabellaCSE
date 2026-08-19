const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Update Invoice 8381 in DEFAULT_QBO_STORE
const oldInv8381Pattern = /\{\s*id:\s*'8381'[\s\S]*?attachments:\s*\[\]\s*\}/;

const newInv8381 = `{
      id: '8381',
      customer: 'Nick Elo',
      company: 'Fast Vegas Home Buyers',
      jobsite: 'Fast Vegas Home Buyers — 2620 Regatta Dr',
      shipTo: 'Fast Vegas Home Buyers\\nNick Elo\\n2620 Regatta Dr #102\\nLas Vegas, NV 89128\\nUnited States',
      date: '2026-08-15',
      dueDate: '2026-08-15',
      terms: 'Due on receipt',
      salesRep: 'Gil Sirimarco (CFO)',
      poNumber: 'FVHB-8381',
      items: [
        { product: 'Flooring', desc: 'Natural Coastal Oak 20MIL SPC Rigid Core Flooring (24 sqft/box)', qty: 35, rate: 65.00, amount: 2275.00, tax: true },
        { product: 'Accessories', desc: 'Acoustic Underlayment Padding Rolls + T-Moldings', qty: 6, rate: 45.00, amount: 270.00, tax: true }
      ],
      subtotal: 2545.00,
      taxRate: 0.08375,
      taxAmount: 211.25,
      shipping: 0.00,
      total: 2756.25,
      deposit: 2756.25,
      balanceDue: 0.00,
      status: 'Paid in Full',
      paymentInstructions: 'You can Pay - Zelle@CabellaCollections.com | Check payable to Cabella Cabinets Stone & Flooring',
      customerNote: 'Paid in full. A copy of this invoice is required for pickup.',
      internalNotes: 'Invoice total: $2,756.25 for Nick Elo / Fast Vegas Home Buyers (2620 Regatta Dr #102, Las Vegas, NV 89128).',
      attachments: []
    }`;

if (oldInv8381Pattern.test(html)) {
  html = html.replace(oldInv8381Pattern, newInv8381);
  console.log('1. Successfully updated Invoice 8381 in DEFAULT_QBO_STORE');
} else {
  console.error('1. Failed to find Invoice 8381 pattern');
}

// 2. Update getQboStore to ensure 8381 updates seamlessly in existing localStorage
const getQboRegex = /function getQboStore\(\)\s*\{[\s\S]*?return DEFAULT_QBO_STORE;\s*\}/;
const newGetQboStore = `function getQboStore() {
  try {
    const raw = localStorage.getItem('cabellaQboData');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.invoices) {
        const inv8381 = parsed.invoices.find(x => x.id === '8381');
        if (inv8381) {
          inv8381.customer = 'Nick Elo';
          inv8381.company = 'Fast Vegas Home Buyers';
          inv8381.shipTo = 'Fast Vegas Home Buyers\\nNick Elo\\n2620 Regatta Dr #102\\nLas Vegas, NV 89128\\nUnited States';
          inv8381.total = 2756.25;
          inv8381.subtotal = 2545.00;
          inv8381.taxAmount = 211.25;
          inv8381.date = '2026-08-15';
          inv8381.dueDate = '2026-08-15';
          inv8381.status = 'Paid in Full';
        }
      }
      return parsed;
    }
  } catch(e) {}
  localStorage.setItem('cabellaQboData', JSON.stringify(DEFAULT_QBO_STORE));
  return DEFAULT_QBO_STORE;
}`;

if (getQboRegex.test(html)) {
  html = html.replace(getQboRegex, newGetQboStore);
  console.log('2. Successfully replaced getQboStore');
} else {
  console.error('2. Failed to match getQboStore');
}

// 3. Update getQboWorkedTodayItems
const oldGetWorkedRegex = /function getQboWorkedTodayItems\(\)\s*\{[\s\S]*?return items;\s*\}/;
const newGetWorked = `function getQboWorkedTodayItems() {
  const store = getQboStore();
  const items = [];

  // Estimates
  (store.estimates || []).forEach(function(est) {
    const itemsSummary = (est.items || []).map(it => (it.product || '') + ' ' + (it.desc || '')).join(', ');
    items.push({
      type: 'Estimate',
      id: est.id,
      name: 'Estimate ' + est.id,
      customer: est.customer,
      company: est.company || '',
      shipTo: est.shipTo || est.jobsite || '',
      date: est.date || '08/15/2026',
      amount: Number(est.total || 0),
      status: est.status || 'Closed',
      statusClass: est.status === 'Closed' ? 'status-closed' : 'status-open',
      statusIcon: est.status === 'Closed' ? '🕒' : '⭕',
      hasPrint: true,
      itemsSummary: itemsSummary,
      raw: est
    });
  });

  // Purchase Orders
  (store.pos || []).forEach(function(po) {
    const itemsSummary = (po.items || []).map(it => (it.product || '') + ' ' + (it.desc || '')).join(', ');
    items.push({
      type: 'Purchase Order',
      id: po.id,
      name: 'Purchase Order ' + po.id,
      customer: po.vendor,
      company: po.vendor,
      shipTo: po.jobsiteRef || '',
      date: po.date || '08/15/2026',
      amount: Number(po.total || 0),
      status: po.status || 'Open',
      statusClass: 'status-open',
      statusIcon: '⭕',
      hasPrint: false,
      itemsSummary: itemsSummary,
      raw: po
    });
  });

  // Invoices
  (store.invoices || []).forEach(function(inv) {
    let statusClass = 'status-paid';
    let statusIcon = '🟢';
    if (inv.status === 'Overdue') {
      statusClass = 'status-overdue';
      statusIcon = '🔴';
    } else if (inv.status === 'Open' || inv.status === 'Unpaid') {
      statusClass = 'status-open';
      statusIcon = '⭕';
    }
    const itemsSummary = (inv.items || []).map(it => (it.product || '') + ' ' + (it.desc || '')).join(', ');
    items.push({
      type: 'Invoice',
      id: inv.id,
      name: 'Invoice ' + inv.id,
      customer: inv.customer,
      company: inv.company || (inv.id === '8381' ? 'Fast Vegas Home Buyers' : ''),
      shipTo: inv.shipTo || inv.jobsite || '',
      date: inv.date || '08/15/2026',
      amount: Number(inv.total || 0),
      status: inv.status || 'Paid in Full',
      statusClass: statusClass,
      statusIcon: statusIcon,
      hasPrint: true,
      itemsSummary: itemsSummary,
      raw: inv
    });
  });

  // Payments & Tax Payments
  (store.payments || []).forEach(function(pay) {
    items.push({
      type: pay.status === 'Tax Payment' ? 'Tax Payment' : 'Payment',
      id: pay.id,
      name: pay.status === 'Tax Payment' ? 'Tax Payment' : 'Payment',
      customer: pay.customer,
      company: pay.customer,
      shipTo: pay.ref || '',
      date: pay.date || '08/15/2026',
      amount: Number(pay.amount || 0),
      status: pay.status || 'Paid',
      statusClass: 'status-paid',
      statusIcon: '🟢',
      hasPrint: false,
      raw: pay
    });
  });

  return items;
}`;

if (oldGetWorkedRegex.test(html)) {
  html = html.replace(oldGetWorkedRegex, newGetWorked);
  console.log('3. Successfully replaced getQboWorkedTodayItems');
} else {
  console.error('3. Failed to match getQboWorkedTodayItems');
}

// 4. Update renderQboRecentTransactions
const oldRenderQboRegex = /function renderQboRecentTransactions\(query\)\s*\{[\s\S]*?openQboTransactionItem\(item\.type[\s\S]*?listEl\.innerHTML = rowsHtml;\s*\}/;

const newRenderQbo = `function renderQboRecentTransactions(query) {
  query = query || '';
  const listEl = document.getElementById('qboRecentTransactionsList');
  if (!listEl) return;

  const q = String(query || '').trim().toLowerCase();
  const qClean = q.replace(/[\\$,]/g, '').trim();
  const allItems = getQboWorkedTodayItems();
  const store = getQboStore();

  const countInvoices = allItems.filter(function(x) { return x.type === 'Invoice'; }).length;
  const countEstimates = allItems.filter(function(x) { return x.type === 'Estimate'; }).length;
  const countPos = allItems.filter(function(x) { return x.type === 'Purchase Order'; }).length;
  const countPayments = allItems.filter(function(x) { return x.type === 'Payment' || x.type === 'Tax Payment'; }).length;
  const countClients = (store.projects || []).length;
  const countTotal = allItems.length;

  if (document.getElementById('qboTallyTotalCount')) document.getElementById('qboTallyTotalCount').textContent = countTotal;
  if (document.getElementById('topTallyCountBadge')) document.getElementById('topTallyCountBadge').textContent = countTotal;
  if (document.getElementById('filterCount-all')) document.getElementById('filterCount-all').textContent = countTotal;
  if (document.getElementById('filterCount-invoices')) document.getElementById('filterCount-invoices').textContent = countInvoices;
  if (document.getElementById('filterCount-estimates')) document.getElementById('filterCount-estimates').textContent = countEstimates;
  if (document.getElementById('filterCount-pos')) document.getElementById('filterCount-pos').textContent = countPos;
  if (document.getElementById('filterCount-payments')) document.getElementById('filterCount-payments').textContent = countPayments;
  if (document.getElementById('filterCount-clients')) document.getElementById('filterCount-clients').textContent = countClients;

  let filtered = allItems;
  if (currentQboSearchFilter === 'invoices') {
    filtered = filtered.filter(function(x) { return x.type === 'Invoice'; });
  } else if (currentQboSearchFilter === 'estimates') {
    filtered = filtered.filter(function(x) { return x.type === 'Estimate'; });
  } else if (currentQboSearchFilter === 'pos') {
    filtered = filtered.filter(function(x) { return x.type === 'Purchase Order'; });
  } else if (currentQboSearchFilter === 'payments') {
    filtered = filtered.filter(function(x) { return x.type === 'Payment' || x.type === 'Tax Payment'; });
  }

  if (q) {
    filtered = filtered.filter(function(x) {
      const amtStr = x.amount ? String(x.amount) : '';
      const amtFixed = x.amount ? x.amount.toFixed(2) : '';
      const amtFormatted = x.amount ? x.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '';
      const rawNotes = (x.raw && (x.raw.customerNote || x.raw.internalNotes || x.raw.notes)) ? String(x.raw.customerNote + ' ' + x.raw.internalNotes + ' ' + x.raw.notes).toLowerCase() : '';
      const rawItems = (x.raw && x.raw.items) ? x.raw.items.map(it => (it.product || '') + ' ' + (it.desc || '')).join(' ').toLowerCase() : '';
      const rawShipTo = (x.raw && (x.raw.shipTo || x.raw.jobsite || x.raw.jobsiteRef)) ? String(x.raw.shipTo + ' ' + x.raw.jobsite + ' ' + (x.raw.jobsiteRef || '')).toLowerCase() : '';
      const company = (x.company || (x.raw && x.raw.company) || '').toLowerCase();

      return x.name.toLowerCase().includes(q) ||
             (x.customer && x.customer.toLowerCase().includes(q)) ||
             x.id.toLowerCase().includes(q) ||
             company.includes(q) ||
             rawShipTo.includes(q) ||
             rawItems.includes(q) ||
             rawNotes.includes(q) ||
             (x.status && x.status.toLowerCase().includes(q)) ||
             (qClean && (amtStr.includes(qClean) || amtFixed.includes(qClean) || amtFormatted.includes(q) || amtFormatted.includes(qClean)));
    });
  }

  const sugBox = document.getElementById('qboSearchSuggestionsBox');
  if (sugBox) {
    sugBox.style.display = q ? 'none' : 'block';
  }

  if (filtered.length === 0 && currentQboSearchFilter !== 'clients') {
    listEl.innerHTML = '<div style="padding:16px; text-align:center; color:#64748b; font-size:13px">' +
      'No transactions matched "<strong style=\\"color:#0f172a\\">' + (typeof escapeHtml === 'function' ? escapeHtml(query) : query) + '</strong>".' +
      '<div style="font-size:11.5px; margin-top:4px">Try searching by client name, invoice number (e.g. 8381), exact amount (e.g. $2,756.25), or address.</div>' +
    '</div>';
  } else if (currentQboSearchFilter !== 'clients') {
    let rowsHtml = '';
    for (let i = 0; i < filtered.length; i++) {
      const item = filtered[i];
      let statusBg = '#dcfce7';
      let statusColor = '#166534';
      if (item.statusClass === 'status-overdue') {
        statusBg = '#fee2e2';
        statusColor = '#991b1b';
      } else if (item.statusClass === 'status-open' || item.status === 'Open' || item.status === 'Unpaid') {
        statusBg = '#fef3c7';
        statusColor = '#92400e';
      } else if (item.statusClass === 'status-closed' || item.status === 'Closed') {
        statusBg = '#f1f5f9';
        statusColor = '#475569';
      }

      const formattedAmount = '$' + Number(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const safeCust = (typeof escapeHtml === 'function') ? escapeHtml(item.customer || '') : (item.customer || '');
      const safeCompany = (item.company && item.company !== item.customer) ? ' (' + (typeof escapeHtml === 'function' ? escapeHtml(item.company) : item.company) + ')' : '';
      const safeAddress = item.shipTo ? (typeof escapeHtml === 'function' ? escapeHtml(item.shipTo.replace(/\\n/g, ', ')) : item.shipTo.replace(/\\n/g, ', ')) : '';

      const printBtn = item.hasPrint ? 
        '<button onclick="event.stopPropagation(); printQboTransaction(\\'' + item.type + '\\', \\'' + item.id + '\\')" ' +
          'style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:4px; padding:3px 7px; color:#475569; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:3px" title="Print">' +
          '🖨️' +
        '</button>' 
        : '<span style="width:22px"></span>';

      rowsHtml += '<div onclick="openQboTransactionItem(\\'' + item.type + '\\', \\'' + item.id + '\\', \\'' + safeCust.replace(/'/g, "\\\\'") + '\\')" ' +
        'style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-radius:6px; cursor:pointer; font-size:13px; transition:background 0.15s; border-bottom:1px solid #f1f5f9" ' +
        'onmouseover="this.style.background=\\'#f8fafc\\'" ' +
        'onmouseout="this.style.background=\\'transparent\\\\'">' +
        '<div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0">' +
          '<span style="font-size:15px; color:#64748b">🕒</span>' +
          '<div style="min-width:130px">' +
            '<div style="font-weight:800; color:#0f172a; white-space:nowrap">' + item.name + '</div>' +
            (safeAddress ? '<div style="font-size:11px; color:#64748b; max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">' + safeAddress + '</div>' : '') +
          '</div>' +
          '<div style="color:#1e293b; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1">' +
            safeCust + '<span style="font-weight:500; color:#64748b">' + safeCompany + '</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex; align-items:center; gap:12px; flex-shrink:0">' +
          '<span style="color:#64748b; font-size:12px; font-weight:500">' + item.date + '</span>' +
          '<span style="font-weight:900; color:#0f172a; font-size:13.5px; min-width:85px; text-align:right">' + formattedAmount + '</span>' +
          '<span style="background:' + statusBg + '; color:' + statusColor + '; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:800; display:flex; align-items:center; gap:4px">' +
            '<span>' + item.statusIcon + '</span> <span>' + item.status + '</span>' +
          '</span>' +
          printBtn +
        '</div>' +
      '</div>';
    }
    listEl.innerHTML = rowsHtml;
  }`;

if (oldRenderQboRegex.test(html)) {
  html = html.replace(oldRenderQboRegex, newRenderQbo);
  console.log('4. Successfully replaced renderQboRecentTransactions');
} else {
  console.error('4. Failed to match renderQboRecentTransactions');
}

// 5. Update executeUniversalCSESearch, synthesizeDirectCSEAnswer, and displayUniversalSearchResults
const cseBlockRegex = /function executeUniversalCSESearch\(rawQuery\)[\s\S]*?function openReportIssueModal\(queryStr\)/;

const newCseBlock = `function executeUniversalCSESearch(rawQuery) {
  const q = String(rawQuery || '').trim();
  if (!q) {
    showToast('⚠️ Please enter a search question, product name, SKU, price, or invoice number');
    return;
  }

  const qLower = q.toLowerCase();
  const qClean = qLower.replace(/[\\$,]/g, '').trim();
  cseCurrentThreadQuery = q;

  // Search Knowledge Collections
  const results = {
    query: q,
    directAnswer: null,
    sourceType: 'cabella', // 'cabella' | 'ai' | 'web'
    sourceLabel: 'Cabella Official Knowledge Base',
    citations: [],
    products: [],
    vendors: [],
    sops: [],
    accounting: [],
    people: [],
    suggestedActions: []
  };

  // A. QuickBooks Invoices, Estimates, POs, Bills, Payments & Projects Search
  try {
    const store = getQboStore();
    
    // Invoices Search
    (store.invoices || []).forEach(inv => {
      const invId = String(inv.id || '').toLowerCase();
      const cust = String(inv.customer || '').toLowerCase();
      const comp = String(inv.company || '').toLowerCase();
      const ship = String(inv.shipTo || '').toLowerCase();
      const job = String(inv.jobsite || '').toLowerCase();
      const notes = String((inv.customerNote || '') + ' ' + (inv.internalNotes || '')).toLowerCase();
      const totalNum = Number(inv.total || 0);
      const totalStr = String(inv.total || '');
      const totalFixed = totalNum.toFixed(2);
      const totalFormatted = totalNum.toLocaleString('en-US', { minimumFractionDigits: 2 });
      const itemsText = (inv.items || []).map(it => (it.product || '') + ' ' + (it.desc || '')).join(' ').toLowerCase();

      const isExactAmountMatch = qClean && (totalStr === qClean || totalFixed === qClean || totalFormatted === q || totalFormatted === qClean || totalStr.includes(qClean) || totalFixed.includes(qClean));
      const isIdMatch = invId.includes(qClean) || qLower.includes(invId) || qLower.includes('inv ' + invId) || qLower.includes('invoice ' + invId);
      const isTextMatch = cust.includes(qLower) || comp.includes(qLower) || ship.includes(qLower) || job.includes(qLower) || itemsText.includes(qLower) || notes.includes(qLower);

      if (isExactAmountMatch || isIdMatch || isTextMatch) {
        const itemObj = {
          type: 'Invoice',
          id: inv.id,
          customer: inv.customer,
          company: inv.company || (inv.id === '8381' ? 'Fast Vegas Home Buyers' : ''),
          shipTo: inv.shipTo || inv.jobsite || '',
          total: totalNum,
          date: inv.date || '08/15/2026',
          status: inv.status || 'Paid in Full',
          salesRep: inv.salesRep || 'Gil Sirimarco (CFO)',
          itemsSummary: (inv.items || []).map(it => it.desc || it.product).join(', '),
          notes: inv.customerNote || inv.internalNotes || '',
          raw: inv
        };
        results.accounting.push(itemObj);
        results.citations.push({
          type: 'QuickBooks Invoice',
          title: 'Invoice #' + inv.id + ' — ' + inv.customer + (itemObj.company ? ' (' + itemObj.company + ')' : ''),
          detail: 'Cost/Total: $' + totalFormatted + ' | Date: ' + itemObj.date + ' | Status: ' + itemObj.status + ' | ' + (inv.shipTo ? inv.shipTo.replace(/\\n/g, ', ') : 'Las Vegas NV'),
          action: () => openQboTransactionModal('Invoice', inv.id)
        });
      }
    });

    // Estimates Search
    (store.estimates || []).forEach(est => {
      const estId = String(est.id || '').toLowerCase();
      const cust = String(est.customer || '').toLowerCase();
      const ship = String(est.shipTo || est.jobsite || '').toLowerCase();
      const totalNum = Number(est.total || 0);
      const totalStr = String(est.total || '');
      const totalFixed = totalNum.toFixed(2);
      const totalFormatted = totalNum.toLocaleString('en-US', { minimumFractionDigits: 2 });
      const itemsText = (est.items || []).map(it => (it.product || '') + ' ' + (it.desc || '')).join(' ').toLowerCase();

      const isExactAmountMatch = qClean && (totalStr === qClean || totalFixed === qClean || totalFormatted === q || totalFormatted === qClean || totalStr.includes(qClean));
      const isIdMatch = estId.includes(qClean) || qLower.includes(estId) || qLower.includes('estimate ' + estId);
      const isTextMatch = cust.includes(qLower) || ship.includes(qLower) || itemsText.includes(qLower);

      if (isExactAmountMatch || isIdMatch || isTextMatch) {
        const itemObj = {
          type: 'Estimate',
          id: est.id,
          customer: est.customer,
          company: est.company || '',
          shipTo: est.shipTo || est.jobsite || '',
          total: totalNum,
          date: est.date || '08/15/2026',
          status: est.status || 'Closed',
          salesRep: est.salesRep || 'Gil Sirimarco (CFO)',
          itemsSummary: (est.items || []).map(it => it.desc || it.product).join(', '),
          notes: est.notes || '',
          raw: est
        };
        results.accounting.push(itemObj);
        results.citations.push({
          type: 'QuickBooks Estimate',
          title: 'Estimate #' + est.id + ' — ' + est.customer,
          detail: 'Amount: $' + totalFormatted + ' | Date: ' + itemObj.date + ' | Status: ' + itemObj.status,
          action: () => openQboTransactionModal('Estimate', est.id)
        });
      }
    });

    // Purchase Orders Search
    (store.pos || []).forEach(po => {
      const poId = String(po.id || '').toLowerCase();
      const vend = String(po.vendor || '').toLowerCase();
      const job = String(po.jobsiteRef || '').toLowerCase();
      const totalNum = Number(po.total || 0);
      const totalStr = String(po.total || '');
      const totalFormatted = totalNum.toLocaleString('en-US', { minimumFractionDigits: 2 });

      if (vend.includes(qLower) || poId.includes(qClean) || job.includes(qLower) || (qClean && totalStr.includes(qClean))) {
        results.accounting.push({
          type: 'Purchase Order',
          id: po.id,
          vendor: po.vendor,
          customer: po.vendor,
          shipTo: po.jobsiteRef,
          total: totalNum,
          date: po.date || '08/15/2026',
          status: po.status || 'Open',
          itemsSummary: (po.items || []).map(it => it.desc || it.product).join(', '),
          raw: po
        });
        results.citations.push({
          type: 'Purchase Order',
          title: 'Purchase Order #' + po.id + ' — ' + po.vendor,
          detail: 'Amount: $' + totalFormatted + ' | Status: ' + (po.status || 'Open') + ' | Jobsite: ' + (po.jobsiteRef || 'Restock'),
          action: () => openQboTransactionModal('Purchase Order', po.id)
        });
      }
    });

    // Payments Search
    (store.payments || []).forEach(pay => {
      const cust = String(pay.customer || '').toLowerCase();
      const ref = String(pay.ref || '').toLowerCase();
      const amtNum = Number(pay.amount || 0);
      const amtStr = String(pay.amount || '');
      const amtFormatted = amtNum.toLocaleString('en-US', { minimumFractionDigits: 2 });

      if (cust.includes(qLower) || ref.includes(qLower) || (qClean && (amtStr.includes(qClean) || amtFormatted.includes(qClean)))) {
        results.accounting.push({
          type: pay.status === 'Tax Payment' ? 'Tax Payment' : 'Payment',
          id: pay.id,
          customer: pay.customer,
          amount: amtNum,
          date: pay.date || '08/15/2026',
          status: pay.status || 'Paid',
          notes: pay.ref || '',
          raw: pay
        });
        results.citations.push({
          type: pay.status === 'Tax Payment' ? 'Tax Payment' : 'Payment Record',
          title: (pay.status === 'Tax Payment' ? 'Tax Payment' : 'Payment') + ' — ' + pay.customer,
          detail: 'Amount: $' + amtFormatted + ' | Method: ' + (pay.method || 'Zelle') + ' | Ref: ' + (pay.ref || 'Cleared'),
          action: () => { show('accounting'); switchQboTab('invoices'); }
        });
      }
    });

  } catch (err) {
    console.error('Error searching QuickBooks data:', err);
  }

  // B. SKU & Product Search
  if (typeof BASE_DATA !== 'undefined') {
    // Check Vendors & Products
    BASE_DATA.vendors.forEach(v => {
      const vName = (v.name || '').toLowerCase();
      const vComp = (v.company || '').toLowerCase();
      const vCat = (v.category || []).join(' ').toLowerCase();
      if (vName.includes(qLower) || vComp.includes(qLower) || vCat.includes(qLower) || qLower.includes(vName) || (qLower.includes('vendor') && vName.length > 2)) {
        results.vendors.push(v);
        results.citations.push({
          type: 'Vendor Record',
          title: 'Vendor: ' + v.name,
          detail: 'Phone: ' + (v.phone || 'On file') + ' | Email: ' + (v.email || 'Billing@cabellacollections.com'),
          action: () => show('vendors', true, v.name)
        });
      }
      (v.products || []).forEach(p => {
        const pName = (p.name || '').toLowerCase();
        const pSku = (p.sku || '').toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        if (pName.includes(qLower) || pSku.includes(qLower) || pCat.includes(qLower) || qLower.includes('sku') || qLower.includes('price')) {
          results.products.push({ ...p, vendorName: v.name });
          if (results.citations.length < 6) {
            results.citations.push({
              type: 'Price Sheet Record',
              title: p.name + ' (' + (p.sku || 'SKU Indexed') + ')',
              detail: 'Price: ' + (p.price || '$0.00') + ' | Supplier: ' + v.name,
              action: () => show('pricing')
            });
          }
        }
      });
    });

    // Check SOPs & Policies
    if (BASE_DATA.policies || BASE_DATA.articles) {
      const articles = BASE_DATA.articles || [];
      articles.forEach(art => {
        const title = (art.title || '').toLowerCase();
        const body = (art.body || art.content || '').toLowerCase();
        if (title.includes(qLower) || body.includes(qLower) || qLower.includes('ship') || qLower.includes('damage') || qLower.includes('policy') || qLower.includes('order') || qLower.includes('return') || qLower.includes('pay')) {
          results.sops.push(art);
          results.citations.push({
            type: 'Company Policy & SOP',
            title: art.title,
            detail: art.summary || 'Official Cabella Standard Operating Procedure',
            action: () => show('policies')
          });
        }
      });
    }

    // Check Employee Directory
    if (BASE_DATA.people) {
      BASE_DATA.people.forEach(p => {
        const name = (p.name || '').toLowerCase();
        const role = (p.role || '').toLowerCase();
        if (name.includes(qLower) || role.includes(qLower) || qLower.includes('who') || qLower.includes('contact')) {
          results.people.push(p);
          results.citations.push({
            type: 'Employee Profile',
            title: p.name + ' — ' + p.role,
            detail: 'Email: ' + (p.email || 'cabellacollections.com') + ' | Phone: ' + (p.phone || ''),
            action: () => show('directory')
          });
        }
      });
    }
  }

  // Synthesize Direct Answer based on query context
  synthesizeDirectCSEAnswer(q, results);

  // Open Universal Search Results Modal
  displayUniversalSearchResults(results);
}

// B. DIRECT ANSWER SYNTHESIZER WITH CITATION MATCHING
function synthesizeDirectCSEAnswer(q, res) {
  const qLower = q.toLowerCase();
  const qClean = qLower.replace(/[\\$,]/g, '').trim();

  // Pattern 0: Exact Accounting / Invoice / Price / Customer Match
  if (res.accounting && res.accounting.length > 0) {
    const topAcc = res.accounting[0];
    const formattedAmt = Number(topAcc.total || topAcc.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const nameLabel = topAcc.customer || topAcc.vendor || topAcc.name || 'Customer Record';
    const compLabel = (topAcc.company && topAcc.company !== topAcc.customer) ? ' (' + topAcc.company + ')' : '';
    const addrLabel = topAcc.shipTo ? topAcc.shipTo.replace(/\\n/g, ', ') : (topAcc.address || topAcc.jobsite || '2620 Regatta Dr #102, Las Vegas, NV 89128');

    res.directAnswer = '<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:12px">' +
      '<div style="font-size:16.5px; font-weight:900; color:#0f172a">' +
        '📄 ' + esc(topAcc.type) + ' #' + esc(topAcc.id) + ': <span style="color:#0284c7">' + esc(nameLabel) + '</span>' +
        (compLabel ? ' <span style="font-size:13.5px; font-weight:700; color:#475569">' + esc(compLabel) + '</span>' : '') +
      '</div>' +
      '<div style="background:#dcfce7; color:#166534; padding:5px 14px; border-radius:20px; font-weight:900; font-size:16px; border:1px solid #bbf7d0; box-shadow:0 1px 3px rgba(0,0,0,0.06)">' +
        '$' + formattedAmt +
      '</div>' +
    '</div>' +
    '<div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:12px 14px; font-size:13px; color:#334155; line-height:1.6">' +
      '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:8px; margin-bottom:6px">' +
        '<div>📍 <strong>Billing / Jobsite:</strong> ' + esc(addrLabel) + '</div>' +
        '<div>📅 <strong>Date:</strong> ' + esc(topAcc.date || '08/15/2026') + '</div>' +
        '<div>🏷️ <strong>Status:</strong> <span style="font-weight:800; color:#166534">🟢 ' + esc(topAcc.status || 'Paid in Full') + '</span></div>' +
        '<div>👤 <strong>Sales Rep:</strong> ' + esc(topAcc.salesRep || 'Gil Sirimarco (CFO)') + '</div>' +
      '</div>' +
      (topAcc.itemsSummary ? '<div style="margin-top:6px; padding-top:6px; border-top:1px solid #f1f5f9">📦 <strong>Line Items:</strong> ' + esc(topAcc.itemsSummary) + '</div>' : '') +
      (topAcc.notes ? '<div style="margin-top:4px; font-size:12px; color:#64748b">📝 <em>' + esc(topAcc.notes) + '</em></div>' : '') +
    '</div>';

    res.sourceType = 'cabella';
    res.sourceLabel = 'QuickBooks Online Accounting Live Record';
    res.suggestedActions = [
      { label: '📄 Open ' + topAcc.type + ' #' + topAcc.id, icon: '🔍', fn: 'openQboTransactionModal("' + topAcc.type + '", "' + topAcc.id + '")' },
      { label: '🖨️ Print / Download PDF', icon: '🖨️', fn: 'printQboTransaction("' + topAcc.type + '", "' + topAcc.id + '")' },
      { label: '💼 QuickBooks Hub', icon: '📊', fn: 'show("accounting")' }
    ];
    return;
  }

  // Pattern 1: Price / SKU Lookup
  if (qLower.includes('price') || qLower.includes('cost') || qLower.includes('how much') || qLower.includes('ca-') || qLower.includes('sku') || res.products.length > 0) {
    if (res.products.length > 0) {
      const topP = res.products[0];
      res.directAnswer = 'The current verified price for <strong>' + esc(topP.name) + '</strong> is <strong>' + esc(topP.price || '$42.50 / sq ft') + '</strong> (Supplied by <em>' + esc(topP.vendorName) + '</em>). Pricing is synchronized with Cabella Price Lists 2026.';
      res.sourceType = 'cabella';
      res.sourceLabel = 'Cabella Price Sheet & Vendor DB';
      res.suggestedActions = [
        { label: '📝 Create Quote', icon: '⚡', fn: 'openQuoteDispatcher()' },
        { label: '✉️ Draft Email to Vendor', icon: '📧', fn: 'openEmailComposerModal("' + esc(topP.vendorName) + '", "' + esc(topP.name) + '")' },
        { label: '📄 View Full Price Sheet', icon: '📋', fn: 'show("pricing")' }
      ];
      return;
    }
  }

  // Pattern 2: Supplier / Vendor Lookup
  if (qLower.includes('supplier') || qLower.includes('vendor') || qLower.includes('who supplies') || res.vendors.length > 0) {
    if (res.vendors.length > 0) {
      const topV = res.vendors[0];
      res.directAnswer = '<strong>' + esc(topV.name) + '</strong> is an authorized supplier for Cabella Cabinets Stone & Flooring. Representative contact: ' + esc(topV.phone || '(702) 555-0199') + ' | Email: ' + esc(topV.email || 'Orders@' + topV.name.toLowerCase().replace(/[^a-z]/g,'') + '.com') + '.';
      res.sourceType = 'cabella';
      res.sourceLabel = 'Cabella Verified Vendor Directory';
      res.suggestedActions = [
        { label: '👤 Open Vendor Record', icon: '🏭', fn: 'show("vendors", true, "' + esc(topV.name) + '")' },
        { label: '✉️ Draft Vendor Order Email', icon: '📧', fn: 'openEmailComposerModal("' + esc(topV.name) + '", "Material Inquiry")' },
        { label: '📦 Create Purchase Order', icon: '📄', fn: 'openExpenseModal()' }
      ];
      return;
    }
  }

  // Pattern 3: SOP / Procedure Lookup
  if (qLower.includes('how do i') || qLower.includes('process') || qLower.includes('damage') || qLower.includes('shipment') || qLower.includes('policy') || qLower.includes('sop') || qLower.includes('order')) {
    res.directAnswer = '<strong>Cabella Standard Procedure:</strong> For order processing and damaged shipment protocol:<br>' +
      '1. Inspect packages immediately upon arrival and document damage with high-resolution photos on jobsite.<br>' +
      '2. Log a <strong>Vendor Credit Request</strong> or <strong>Change Order</strong> in QBO within 24 hours.<br>' +
      '3. Notify Orders Coordinator (Mayra Rodriguez) and Head Project Manager (Jerry Maza).';
    res.sourceType = 'cabella';
    res.sourceLabel = 'Cabella SOP Policy Guide #SOP-2026-04';
    res.suggestedActions = [
      { label: '📄 View Complete SOP Document', icon: '📜', fn: 'show("policies")' },
      { label: '📩 Email Operations Team', icon: '✉️', fn: 'openEmailComposerModal("Mayra Rodriguez", "Damaged Shipment Notice")' },
      { label: '📋 File Change Order', icon: '🔄', fn: 'openExpenseModal()' }
    ];
    return;
  }

  // Default AI Knowledge Synthesis Fallback
  res.directAnswer = 'Found relevant Cabella information for <strong>"' + esc(q) + '"</strong> across internal price sheets, supplier directories, and company policies.';
  res.sourceType = 'ai';
  res.sourceLabel = 'CSE AI Knowledge Synthesis';
  res.suggestedActions = [
    { label: '⚡ Batch Quote Dispatch', icon: '📝', fn: 'openQuoteDispatcher()' },
    { label: '📄 Create Invoice', icon: '💵', fn: 'openInvoiceModal()' },
    { label: '👥 Employee Directory', icon: '👤', fn: 'show("directory")' }
  ];
}

// C. DISPLAY RESULTS IN UNIVERSAL MODAL
function displayUniversalSearchResults(res) {
  // Expose citations globally for click execution
  window._cseCitations = res.citations || [];

  // Source badge styling
  let sourceBadgeHtml = '';
  if (res.sourceType === 'cabella') {
    sourceBadgeHtml = '<span style="background:#dcfce7; color:#166534; font-size:12px; font-weight:800; padding:4px 10px; border-radius:20px; border:1px solid #bbf7d0; display:inline-flex; align-items:center; gap:6px">' +
      '<span>🟢</span> <span>CABELLA OFFICIAL SOURCE</span>' +
    '</span>';
  } else if (res.sourceType === 'ai') {
    sourceBadgeHtml = '<span style="background:#e0f2fe; color:#0369a1; font-size:12px; font-weight:800; padding:4px 10px; border-radius:20px; border:1px solid #bae6fd; display:inline-flex; align-items:center; gap:6px">' +
      '<span>🔵</span> <span>CSE AI SYNTHESIS</span>' +
    '</span>';
  } else {
    sourceBadgeHtml = '<span style="background:#f1f5f9; color:#475569; font-size:12px; font-weight:800; padding:4px 10px; border-radius:20px; border:1px solid #cbd5e1; display:inline-flex; align-items:center; gap:6px">' +
      '<span>⚪</span> <span>WEB / REFERENCE</span>' +
    '</span>';
  }

  const content = '<div style="background:#ffffff; border-radius:12px; padding:4px">' +
    '<!-- Query Title Header -->' +
    '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; padding-bottom:12px; border-bottom:2px solid #e2e8f0">' +
      '<div>' +
        '<div style="font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">UNIVERSAL CABELLA SEARCH RESULT</div>' +
        '<h2 style="margin:0; font-size:20px; font-weight:900; color:#0f172a; display:flex; align-items:center; gap:8px">' +
          '<span>🔍</span> <span>"' + esc(res.query) + '"</span>' +
        '</h2>' +
      '</div>' +
      sourceBadgeHtml +
    '</div>' +

    '<!-- Direct Answer Card -->' +
    '<div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:18px; margin-bottom:18px">' +
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">' +
        '<span style="font-weight:800; font-size:13px; color:#0f172a; display:flex; align-items:center; gap:6px">' +
          '<span>✨</span> <span>DIRECT ANSWER:</span>' +
        '</span>' +
        '<span style="font-size:11px; font-weight:700; color:#64748b">' + esc(res.sourceLabel) + '</span>' +
      '</div>' +
      '<div style="font-size:14px; color:#1e293b; line-height:1.6; margin-bottom:14px">' +
        res.directAnswer +
      '</div>' +

      '<!-- Feedback & Report Section -->' +
      '<div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; margin-top:12px; padding-top:10px">' +
        '<div style="display:flex; align-items:center; gap:8px">' +
          '<span style="font-size:12px; font-weight:700; color:#64748b">Was this answer helpful?</span>' +
          '<button onclick="recordAnswerFeedback(true)" style="background:#fff; border:1px solid #cbd5e1; border-radius:4px; padding:3px 8px; cursor:pointer; font-size:12px">👍 Yes</button>' +
          '<button onclick="recordAnswerFeedback(false)" style="background:#fff; border:1px solid #cbd5e1; border-radius:4px; padding:3px 8px; cursor:pointer; font-size:12px">👎 No</button>' +
        '</div>' +
        '<button onclick="openReportIssueModal(\\'' + esc(res.query) + '\\')" style="background:none; border:0; color:#b91c1c; font-weight:700; font-size:12px; cursor:pointer; text-decoration:underline">' +
          '🚩 Report outdated / incorrect information' +
        '</button>' +
      '</div>' +
    '</div>' +

    '<!-- Suggested Instant Actions Grid -->' +
    '<div style="margin-bottom:18px">' +
      '<div style="font-size:12px; font-weight:800; color:#0f172a; margin-bottom:8px; text-transform:uppercase">RECOMMENDED ACTIONS:</div>' +
      '<div style="display:flex; gap:10px; flex-wrap:wrap">' +
        res.suggestedActions.map(act => 
          '<button onclick="' + act.fn + '; closeModal();" style="background:#0f172a; color:#ffffff; font-weight:800; border:0; padding:9px 14px; border-radius:8px; cursor:pointer; font-size:12.5px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(0,0,0,0.1)">' +
            '<span>' + act.icon + '</span> <span>' + act.label + '</span>' +
          '</button>'
        ).join('') +
        '<button onclick="openAskCSEAssistantModal(\\'' + esc(res.query) + '\\'); closeModal();" style="background:#1f5fae; color:#ffffff; font-weight:800; border:0; padding:9px 14px; border-radius:8px; cursor:pointer; font-size:12.5px; display:inline-flex; align-items:center; gap:6px">' +
          '💬 Ask Follow-Up Question' +
        '</button>' +
      '</div>' +
    '</div>' +

    '<!-- Clickable Source Citations & Backing Documents -->' +
    '<div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:10px; padding:16px">' +
      '<div style="font-weight:800; font-size:13px; color:#0f172a; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center">' +
        '<span style="display:flex; align-items:center; gap:6px"><span>📌</span> <span>VERIFIED BACKING CITATIONS & DOCUMENTS (' + res.citations.length + '):</span></span>' +
        '<span style="font-size:11px; color:#64748b">Click citation to view source record</span>' +
      '</div>' +
      (res.citations.length === 0 ? 
        '<div style="font-size:12.5px; color:#64748b; font-style:italic">Searching general Cabella repository...</div>' : 
        '<div style="display:flex; flex-direction:column; gap:8px">' +
          res.citations.map((c, idx) => 
            '<div onclick="closeModal(); if(window._cseCitations && window._cseCitations[' + idx + '] && window._cseCitations[' + idx + '].action){ window._cseCitations[' + idx + '].action(); }" ' +
              'style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; transition:all 0.2s" ' +
              'onmouseover="this.style.background=\\'#f1f5f9\\'" onmouseout="this.style.background=\\'#f8fafc\\'">' +
              '<div>' +
                '<span style="font-size:10px; background:#e0f2fe; color:#0369a1; font-weight:800; padding:2px 6px; border-radius:4px; margin-right:6px">' +
                  esc(c.type) +
                '</span>' +
                '<strong style="font-size:13px; color:#0f172a">' + esc(c.title) + '</strong>' +
                '<div style="font-size:11.5px; color:#64748b; margin-top:2px">' + esc(c.detail) + '</div>' +
              '</div>' +
              '<span style="font-weight:800; color:#1f5fae; font-size:12px">View Source →</span>' +
            '</div>'
          ).join('') +
        '</div>'
      ) +
    '</div>' +
  '</div>';

  showModal('⚡ Universal Cabella Intelligence Result', content, '820px');
}

function openReportIssueModal(queryStr)`;

if (cseBlockRegex.test(html)) {
  html = html.replace(cseBlockRegex, newCseBlock);
  console.log('5. Successfully replaced executeUniversalCSESearch, synthesizeDirectCSEAnswer, and displayUniversalSearchResults');
} else {
  console.error('5. Failed to match cseBlockRegex');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('All upgrades written to index.html successfully!');
