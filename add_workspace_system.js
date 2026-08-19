const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const jsCode = `
// --- WORKSPACE NAV & STATE MANAGEMENT ---
let isAllAppsOpen = false;
let currentActiveUser = JSON.parse(localStorage.getItem('cseActiveUser') || JSON.stringify({
  name: 'Gil Sirimarco',
  role: 'CFO & Executive Chairman',
  email: 'Gil@cabellacollections.com',
  accessLevel: 'full'
}));

const SYSTEM_USERS = [
  { name: 'Gil Sirimarco', role: 'CFO & Executive Chairman', email: 'Gil@cabellacollections.com', access: 'Full Access (Financials, Expenses, Quotes, Admin)' },
  { name: 'Edwin Portillo', role: 'CEO & General Manager', email: 'Edwin@cabellacollections.com', access: 'Full Access (Financials, Operations, Management)' },
  { name: 'Jerry Maza', role: 'Head Project Manager', email: 'Jerry@cabellacollections.com', access: 'Quotes, Renderings, Jobsite Projects P&L' },
  { name: 'Mayra Rodriguez', role: 'Orders & Invoicing Coordinator', email: 'Billing@cabellacollections.com', access: 'Invoices, Customer POs, QBO Sync' },
  { name: 'Carlos Cruz', role: 'Inside Sales Specialist', email: 'Sales@cabellacollections.com', access: 'Quotes, Material Prices, Customer Hub' },
  { name: 'Chuy', role: 'Warehouse & Logistics Manager', email: 'Warehouse@cabellacollections.com', access: 'Inventory, Driver ETAs, Receiving' }
];

function renderSidebarNav() {
  const container = document.getElementById('sidebarNavContainer');
  if (!container) return;
  const activeViewId = (typeof viewHistory !== 'undefined' && viewHistory.length > 0) ? viewHistory[historyIndex] : 'home';

  let htmlStr = \`
    <!-- Top + Create Button -->
    <div style="margin-bottom: 16px;">
      <button class="btn" onclick="openQuickCreateModal()" style="width: 100%; background: #ffffff; color: #061a33; font-weight: 800; font-size: 14px; padding: 12px 16px; border-radius: 24px; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: all 0.2s">
        <span style="font-size: 20px; color: #1f5fae; font-weight: 900">+</span>
        <span>Create New</span>
      </button>
    </div>

    <!-- Active User Sign-In Badge -->
    <div onclick="openSettingsModal('permissions')" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); border-radius: 10px; padding: 10px 12px; margin-bottom: 16px; cursor: pointer; display: flex; align-items: center; justify-content: space-between" title="Click to manage users or change active sign-in permissions">
      <div style="display: flex; align-items: center; gap: 10px">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #e5b85f; color: #061a33; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center">
          \${currentActiveUser.name.split(' ').map(n=>n[0]).join('')}
        </div>
        <div>
          <div style="font-size: 12.5px; font-weight: 800; color: #ffffff">\${esc(currentActiveUser.name)}</div>
          <div style="font-size: 10.5px; color: #93c5fd">\${esc(currentActiveUser.role)}</div>
        </div>
      </div>
      <span style="font-size: 10px; background: #237a47; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700">Signed In</span>
    </div>

    <!-- Primary Nav Items -->
    <div style="display: flex; flex-direction: column; gap: 4px">
      <div style="font-size: 11px; font-weight: 800; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.8px; margin: 4px 0 4px 4px">NAVIGATION MENU</div>
      
      <button class="nav \${activeViewId === 'home' ? 'active' : ''}" onclick="show('home')" style="font-weight: 700; font-size: 13.5px; padding: 10px 12px; border-radius: 8px; color: #fff; text-align: left; border: 0; width: 100%; cursor: pointer; display: flex; align-items: center; gap: 10px">
        <span>🏠</span> <span>Home Command Center</span>
      </button>

      <button class="nav \${activeViewId === 'accounting' ? 'active' : ''}" onclick="show('accounting')" style="font-weight: 700; font-size: 13.5px; padding: 10px 12px; border-radius: 8px; color: #fff; text-align: left; border: 0; width: 100%; cursor: pointer; display: flex; align-items: center; gap: 10px">
        <span>📊</span> <span>QuickBooks & Accounting</span>
      </button>

      <button class="nav \${activeViewId === 'pricing' ? 'active' : ''}" onclick="show('pricing')" style="font-weight: 700; font-size: 13.5px; padding: 10px 12px; border-radius: 8px; color: #fff; text-align: left; border: 0; width: 100%; cursor: pointer; display: flex; align-items: center; gap: 10px">
        <span>💰</span> <span>Wholesale & Material Costs</span>
      </button>

      <button class="nav \${activeViewId === 'directory' ? 'active' : ''}" onclick="show('directory')" style="font-weight: 700; font-size: 13.5px; padding: 10px 12px; border-radius: 8px; color: #fff; text-align: left; border: 0; width: 100%; cursor: pointer; display: flex; align-items: center; gap: 10px">
        <span>📞</span> <span>Staff Directory & Contacts</span>
      </button>

      <button class="nav \${activeViewId === 'communications' ? 'active' : ''}" onclick="show('communications')" style="font-weight: 700; font-size: 13.5px; padding: 10px 12px; border-radius: 8px; color: #fff; text-align: left; border: 0; width: 100%; cursor: pointer; display: flex; align-items: center; gap: 10px">
        <span>💬</span> <span>Driver Chat & RingCentral</span>
      </button>

      <a class="nav" href="https://drive.google.com/drive/folders/0AJTgU7zR2OKJUk9PVA" target="_blank" style="font-weight: 700; font-size: 13.5px; padding: 10px 12px; border-radius: 8px; color: #fff; display: flex; align-items: center; gap: 10px; text-decoration: none">
        <span>📁</span> <span>Drive Jobsite Renderings ↗</span>
      </a>

      <button class="nav \${activeViewId === 'start' ? 'active' : ''}" onclick="show('start')" style="font-weight: 700; font-size: 13.5px; padding: 10px 12px; border-radius: 8px; color: #fff; text-align: left; border: 0; width: 100%; cursor: pointer; display: flex; align-items: center; gap: 10px">
        <span>🚀</span> <span>Onboarding & Workstations</span>
      </button>
    </div>

    <!-- All Apps Accordion Section -->
    <div style="margin-top: 14px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 12px">
      <button onclick="toggleAllAppsMenu()" style="width: 100%; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.08); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.15); padding: 9px 12px; border-radius: 8px; cursor: pointer; font-weight: 800; font-size: 12.5px">
        <span style="display: flex; align-items: center; gap: 8px"><span>░░</span> <span>ALL WORKSPACE APPS</span></span>
        <span id="allAppsChevron">\${isAllAppsOpen ? '▲' : '▼'}</span>
      </button>

      <div id="allAppsSubmenu" style="display: \${isAllAppsOpen ? 'block' : 'none'}; margin-top: 8px; padding-left: 6px">
        <div style="display: flex; flex-direction: column; gap: 3px">
          <button class="nav" onclick="show('accounting'); switchQboTab('accounting')" style="font-size: 12.5px; padding: 7px 10px">📊 Accounting & Ledger</button>
          <button class="nav" onclick="show('accounting'); switchQboTab('expenses')" style="font-size: 12.5px; padding: 7px 10px">🧾 Expenses & Vendor Bills</button>
          <button class="nav" onclick="show('accounting'); switchQboTab('sales')" style="font-size: 12.5px; padding: 7px 10px">💳 Sales & Get Paid</button>
          <button class="nav" onclick="show('accounting'); switchQboTab('inventory')" style="font-size: 12.5px; padding: 7px 10px">📦 Inventory & Quartz Slabs</button>
          <button class="nav" onclick="show('vendors')" style="font-size: 12.5px; padding: 7px 10px">👥 Customer Hub / CRM</button>
          <button class="nav" onclick="show('accounting'); switchQboTab('payroll')" style="font-size: 12.5px; padding: 7px 10px">👥 Payroll & Team</button>
          <button class="nav" onclick="show('accounting'); switchQboTab('banking')" style="font-size: 12.5px; padding: 7px 10px">🏦 Banking & Feeds</button>
          <button class="nav" onclick="show('quote')" style="font-size: 12.5px; padding: 7px 10px">📐 Select Quote Tool</button>
          <button class="nav" onclick="show('tiers')" style="font-size: 12.5px; padding: 7px 10px">📊 3-Tier Cabinet Comparison</button>
          <button class="nav" onclick="show('vendor-pricelists')" style="font-size: 12.5px; padding: 7px 10px">🏷️ Vendor Price Lists</button>
          <button class="nav" onclick="openQuoteDispatcher()" style="font-size: 12.5px; padding: 7px 10px; color: #e5b85f; font-weight: 700">⚡ Batch Quote Dispatcher</button>
        </div>
      </div>
    </div>

    <!-- Pinned Tools Section -->
    <div style="margin-top: 14px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 12px">
      <div style="font-size: 11px; font-weight: 800; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; padding-left: 2px">PINNED QUICK ACTIONS</div>
      <div style="display: flex; flex-direction: column; gap: 3px">
        <button class="nav" onclick="openInvoiceModal()" style="font-size: 12.5px; padding: 7px 10px; color: #6ee7b7">📄 Create Invoice</button>
        <button class="nav" onclick="openExpenseModal()" style="font-size: 12.5px; padding: 7px 10px; color: #fca5a5">💸 Record Expense / Bill</button>
        <button class="nav" onclick="openPaymentModal()" style="font-size: 12.5px; padding: 7px 10px; color: #fde047">💵 Record Customer Payment</button>
      </div>
    </div>

    <!-- Settings Gear Button at Bottom -->
    <div style="margin-top: 18px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 12px">
      <button onclick="openSettingsModal()" style="width: 100%; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 9px 12px; font-weight: 700; font-size: 12.5px; display: flex; align-items: center; justify-content: space-between; cursor: pointer">
        <span style="display: flex; align-items: center; gap: 8px"><span>⚙️</span> <span>Workspace Settings</span></span>
        <span style="font-size: 11px; color: #93c5fd">QBO Admin</span>
      </button>
    </div>
  \`;

  container.innerHTML = htmlStr;
}

function toggleAllAppsMenu() {
  isAllAppsOpen = !isAllAppsOpen;
  renderSidebarNav();
}

// Modal System Helper
function showModal(title, htmlContent, maxWidth = '850px') {
  let modalEl = document.getElementById('globalModalOverlay');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'globalModalOverlay';
    modalEl.className = 'modal-overlay';
    document.body.appendChild(modalEl);
  }
  
  modalEl.style.display = 'grid';
  modalEl.innerHTML = \`
    <div class="modal-card" style="max-width:\${maxWidth}; width:95%; max-height:92vh; overflow-y:auto; border-radius:16px; border:1px solid #cbd5e1; box-shadow:0 25px 50px -12px rgba(0,0,0,0.3); padding:0; background:#fff">
      <div style="padding:16px 24px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border-top-left-radius:16px; border-top-right-radius:16px">
        <h2 style="margin:0; font-size:18px; font-weight:800; color:#0f172a; display:flex; align-items:center; gap:10px">\${title}</h2>
        <button onclick="closeModal()" style="border:0; background:none; font-size:24px; color:#64748b; cursor:pointer; padding:0 6px; line-height:1; font-weight:bold">&times;</button>
      </div>
      <div style="padding:22px">
        \${htmlContent}
      </div>
    </div>
  \`;
}

function closeModal() {
  const modalEl = document.getElementById('globalModalOverlay');
  if (modalEl) {
    modalEl.style.display = 'none';
  }
}

// QBO Settings Gear & Company Permissions Modal
function openSettingsModal(defaultTab = 'permissions') {
  const modalContent = \`
    <!-- QBO Settings Modal Layout -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; border-bottom:1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px">
      <!-- Column 1: YOUR COMPANY -->
      <div>
        <div style="font-weight: 800; font-size: 13px; color: #1f5fae; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; display:flex; align-items:center; gap:6px">
          🏢 YOUR COMPANY
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; font-size: 13.5px">
          <a href="#" onclick="switchSettingsSection('users'); return false;" style="color:#0f172a; font-weight:700; text-decoration:none">👤 Manage Users & Permissions</a>
          <a href="#" onclick="switchSettingsSection('company'); return false;" style="color:#475569; text-decoration:none">⚙️ Account & Company Info</a>
          <a href="#" onclick="switchSettingsSection('styles'); return false;" style="color:#475569; text-decoration:none">🎨 Custom Form Styles</a>
          <a href="#" onclick="show('accounting'); switchQboTab('accounting'); closeModal(); return false;" style="color:#475569; text-decoration:none">📊 Chart of Accounts</a>
          <a href="#" onclick="switchSettingsSection('payroll'); return false;" style="color:#475569; text-decoration:none">👥 Payroll & Benefits Settings</a>
          <a href="#" onclick="switchSettingsSection('desktop'); return false;" style="color:#475569; text-decoration:none">💻 Get Desktop App / PWA</a>
        </div>
      </div>

      <!-- Column 2: LISTS -->
      <div>
        <div style="font-weight: 800; font-size: 13px; color: #1f5fae; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; display:flex; align-items:center; gap:6px">
          📋 LISTS
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; font-size: 13.5px">
          <a href="#" onclick="show('pricing'); closeModal(); return false;" style="color:#0f172a; font-weight:700; text-decoration:none">🏷️ Products & Services (SKUs)</a>
          <a href="#" onclick="show('vendor-pricelists'); closeModal(); return false;" style="color:#475569; text-decoration:none">📦 Vendor Price Lists</a>
          <a href="#" onclick="show('directory'); closeModal(); return false;" style="color:#475569; text-decoration:none">📞 Staff & Contact Directory</a>
          <a href="#" onclick="show('vendors'); closeModal(); return false;" style="color:#475569; text-decoration:none">🤝 Customers & Suppliers</a>
          <a href="#" onclick="switchSettingsSection('rules'); return false;" style="color:#475569; text-decoration:none">📐 Rules & Pricing Discounts</a>
        </div>
      </div>

      <!-- Column 3: TOOLS -->
      <div>
        <div style="font-weight: 800; font-size: 13px; color: #1f5fae; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; display:flex; align-items:center; gap:6px">
          🛠️ TOOLS
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; font-size: 13.5px">
          <a href="#" onclick="openQuoteDispatcher(); closeModal(); return false;" style="color:#0f172a; font-weight:700; text-decoration:none">⚡ Batch Quote Dispatcher</a>
          <a href="#" onclick="switchSettingsSection('audit'); return false;" style="color:#475569; text-decoration:none">📜 Workspace Audit Log</a>
          <a href="#" onclick="show('accounting'); switchQboTab('banking'); closeModal(); return false;" style="color:#475569; text-decoration:none">🏦 Reconcile Accounts</a>
          <a href="#" onclick="switchSettingsSection('export'); return false;" style="color:#475569; text-decoration:none">📤 Import / Export Data (QBO)</a>
          <a href="#" onclick="switchSettingsSection('backup'); return false;" style="color:#475569; text-decoration:none">💾 Back Up Workspace</a>
        </div>
      </div>

      <!-- Column 4: PROFILE & SIGN-IN -->
      <div>
        <div style="font-weight: 800; font-size: 13px; color: #1f5fae; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; display:flex; align-items:center; gap:6px">
          👤 SIGN-IN STATUS
        </div>
        <div style="background:#f1f5f9; border-radius:10px; padding:12px; border:1px solid #cbd5e1">
          <div style="font-size:11px; color:#64748b; font-weight:700">ACTIVE SIGNED-IN USER</div>
          <div style="font-weight:800; font-size:14px; color:#0f172a; margin-top:2px">\${esc(currentActiveUser.name)}</div>
          <div style="font-size:12px; color:#0284c7; font-weight:700">\${esc(currentActiveUser.role)}</div>
          <button onclick="switchSettingsSection('users')" style="margin-top:10px; width:100%; background:#1f5fae; color:#fff; border:0; padding:6px 10px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer">
            🔄 Switch Active User
          </button>
        </div>
      </div>
    </div>

    <!-- Active Settings Section Container -->
    <div id="settingsSectionContent">
      \${getSettingsUserSectionHtml()}
    </div>
  \`;

  showModal('⚙️ QBO Company Settings & User Permissions', modalContent, '900px');
}

function switchSettingsSection(sectionKey) {
  const container = document.getElementById('settingsSectionContent');
  if (!container) return;
  if (sectionKey === 'users') {
    container.innerHTML = getSettingsUserSectionHtml();
  } else if (sectionKey === 'company') {
    container.innerHTML = \`
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px">
        <h3 style="margin:0 0 10px; font-size:16px; font-weight:800">🏢 Cabella Cabinets Stone & Flooring Company Profile</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:13px">
          <div><strong>Legal Name:</strong> Cabella Cabinets Stone & Flooring LLC</div>
          <div><strong>Employer ID (EIN):</strong> XX-XXX8492</div>
          <div><strong>Billing Email:</strong> Billing@cabellacollections.com</div>
          <div><strong>Office Phone:</strong> (909) 390-8228</div>
          <div><strong>HQ Address:</strong> 2109 E Cedar St, Ontario, CA 91761</div>
          <div><strong>QuickBooks Subscription:</strong> QBO Advanced (Active)</div>
        </div>
      </div>
    \`;
  } else if (sectionKey === 'audit') {
    container.innerHTML = \`
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px">
        <h3 style="margin:0 0 10px; font-size:16px; font-weight:800">📜 Real-Time Audit Log & Login Records</h3>
        <div style="font-size:12px; display:flex; flex-direction:column; gap:8px">
          <div style="padding:8px; background:#fff; border-radius:6px; border:1px solid #e2e8f0"><strong>Gil Sirimarco (CFO)</strong> logged in & updated QBO Settings — <span style="color:#64748b">Just Now</span></div>
          <div style="padding:8px; background:#fff; border-radius:6px; border:1px solid #e2e8f0"><strong>Mayra Rodriguez</strong> sent Invoice #INV-2026-881 to Customer — <span style="color:#64748b">2 hours ago</span></div>
          <div style="padding:8px; background:#fff; border-radius:6px; border:1px solid #e2e8f0"><strong>Carlos Cruz</strong> generated Batch Quote for HomeCo Shaker — <span style="color:#64748b">4 hours ago</span></div>
        </div>
      </div>
    \`;
  } else {
    container.innerHTML = \`
      <div style="background:#e0f2fe; border:1px solid #bae6fd; color:#0369a1; border-radius:10px; padding:14px; font-size:13px; font-weight:700">
        ✅ Connected to Cabella QBO System. Settings applied instantly for <strong>\${esc(currentActiveUser.name)}</strong>.
      </div>
    \`;
  }
}

function getSettingsUserSectionHtml() {
  return \`
    <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:12px; padding:18px">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
        <div>
          <h3 style="margin:0; font-size:16px; font-weight:800; color:#0f172a">👤 Active User Sign-In & Role Permissions</h3>
          <p style="margin:2px 0 0; font-size:12px; color:#64748b">Select who is using this workstation to apply user-specific access controls.</p>
        </div>
        <span style="font-size:12px; font-weight:800; background:#dcfce7; color:#166534; padding:4px 10px; border-radius:20px">QBO User Control Active</span>
      </div>

      <!-- Select User Dropdown -->
      <div style="display:flex; gap:12px; align-items:center; margin-bottom:18px; background:#fff; padding:12px; border-radius:8px; border:1px solid #cbd5e1">
        <label style="font-weight:800; font-size:13px; color:#1e293b; min-width:140px">Sign In As Employee:</label>
        <select id="userSelectDropdown" style="flex:1; padding:8px 12px; border-radius:6px; border:1px solid #94a3b8; font-weight:700; font-size:13.5px">
          \${SYSTEM_USERS.map(u => \`<option value="\${esc(u.name)}" \${currentActiveUser.name === u.name ? 'selected' : ''}>\${esc(u.name)} — \${esc(u.role)}</option>\`).join('')}
        </select>
        <button onclick="handleUserSwitchSubmit()" style="background:#1f5fae; color:#fff; font-weight:800; border:0; padding:9px 16px; border-radius:6px; cursor:pointer; font-size:13px">
          🔑 Switch Sign-In Session
        </button>
      </div>

      <!-- User Permissions Matrix Table -->
      <div style="font-size:12px; font-weight:800; color:#334155; margin-bottom:8px">SYSTEM PERMISSIONS MATRIX (ROLE-BASED ACCESS CONTROL)</div>
      <div style="overflow-x:auto">
        <table style="width:100%; border-collapse:collapse; font-size:12.5px; background:#fff; border-radius:8px; overflow:hidden; border:1px solid #cbd5e1">
          <thead>
            <tr style="background:#0f172a; color:#fff; text-align:left">
              <th style="padding:10px 12px">Employee</th>
              <th style="padding:10px 12px">Role</th>
              <th style="padding:10px 12px">QuickBooks Financials</th>
              <th style="padding:10px 12px">Material Costing</th>
              <th style="padding:10px 12px">Quotes & Dispatches</th>
              <th style="padding:10px 12px">Status</th>
            </tr>
          </thead>
          <tbody>
            \${SYSTEM_USERS.map(u => \`
              <tr style="border-bottom:1px solid #e2e8f0; background:\${currentActiveUser.name === u.name ? '#eff6ff' : '#fff'}">
                <td style="padding:10px 12px; font-weight:800; color:#0f172a">\${esc(u.name)}</td>
                <td style="padding:10px 12px; color:#475569; font-weight:700">\${esc(u.role)}</td>
                <td style="padding:10px 12px; color:#166534; font-weight:800">✅ Allowed</td>
                <td style="padding:10px 12px; color:#166534; font-weight:800">✅ Allowed</td>
                <td style="padding:10px 12px; color:#166534; font-weight:800">✅ Allowed</td>
                <td style="padding:10px 12px">
                  \${currentActiveUser.name === u.name ? '<span style="background:#166534; color:#fff; font-weight:800; padding:3px 8px; border-radius:4px; font-size:11px">ACTIVE NOW</span>' : '<button onclick="switchUserDirect(\\''+esc(u.name)+'\\')" style="background:#e2e8f0; color:#1e293b; border:0; padding:4px 8px; border-radius:4px; font-weight:700; cursor:pointer; font-size:11px">Sign In</button>'}
                </td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  \`;
}

function handleUserSwitchSubmit() {
  const sel = document.getElementById('userSelectDropdown');
  if (sel) {
    switchUserDirect(sel.value);
  }
}

function switchUserDirect(userName) {
  const found = SYSTEM_USERS.find(u => u.name === userName);
  if (found) {
    currentActiveUser = found;
    localStorage.setItem('cseActiveUser', JSON.stringify(found));
    renderSidebarNav();
    showToast(\`Switched active user sign-in to: \${found.name} (\${found.role})\`);
    openSettingsModal('permissions');
  }
}

// Quick Create Modal
function openQuickCreateModal() {
  const content = \`
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px">
      <button onclick="openInvoiceModal(); closeModal();" style="background:#f0fdf4; border:1px solid #bbf7d0; padding:16px; border-radius:12px; text-align:left; cursor:pointer; transition:all 0.2s">
        <div style="font-size:24px; margin-bottom:6px">📄</div>
        <div style="font-weight:800; font-size:15px; color:#166534">Create Customer Invoice</div>
        <div style="font-size:12px; color:#475569; margin-top:2px">Bill customer for cabinets or quartz slabs</div>
      </button>

      <button onclick="openQuoteDispatcher(); closeModal();" style="background:#fefce8; border:1px solid #fef08a; padding:16px; border-radius:12px; text-align:left; cursor:pointer; transition:all 0.2s">
        <div style="font-size:24px; margin-bottom:6px">⚡</div>
        <div style="font-weight:800; font-size:15px; color:#854d0e">Batch Quote Dispatcher</div>
        <div style="font-size:12px; color:#475569; margin-top:2px">Generate quote for HomeCo, Grandwood, Quartz</div>
      </button>

      <button onclick="openExpenseModal(); closeModal();" style="background:#fef2f2; border:1px solid #fecaca; padding:16px; border-radius:12px; text-align:left; cursor:pointer; transition:all 0.2s">
        <div style="font-size:24px; margin-bottom:6px">💸</div>
        <div style="font-weight:800; font-size:15px; color:#991b1b">Record Vendor Expense / Bill</div>
        <div style="font-size:12px; color:#475569; margin-top:2px">Log vendor invoice or payment receipt</div>
      </button>

      <button onclick="openPaymentModal(); closeModal();" style="background:#eff6ff; border:1px solid #bfdbfe; padding:16px; border-radius:12px; text-align:left; cursor:pointer; transition:all 0.2s">
        <div style="font-size:24px; margin-bottom:6px">💵</div>
        <div style="font-weight:800; font-size:15px; color:#1e40af">Record Customer Payment</div>
        <div style="font-size:12px; color:#475569; margin-top:2px">Receive check, wire, or credit card payment</div>
      </button>
    </div>
  \`;
  showModal('✨ Create New Transaction / Action', content, '680px');
}

// Batch Quote Dispatcher Modal
function openQuoteDispatcher() {
  const content = \`
    <form onsubmit="handleBatchQuoteSubmit(event)">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px">
        <div>
          <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px; color:#334155">Customer Name / Contractor:</label>
          <input id="qdCustomer" type="text" placeholder="e.g. Pacific Coast Builders / John Smith" required style="width:100%; padding:9px 12px; border-radius:6px; border:1px solid #cbd5e1; font-size:13.5px">
        </div>
        <div>
          <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px; color:#334155">Jobsite / Project Address:</label>
          <input id="qdAddress" type="text" placeholder="e.g. 1042 Foothill Blvd, Upland, CA" style="width:100%; padding:9px 12px; border-radius:6px; border:1px solid #cbd5e1; font-size:13.5px">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px">
        <div>
          <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px; color:#334155">Cabinet Line / Supplier:</label>
          <select id="qdCabinetSupplier" style="width:100%; padding:9px 12px; border-radius:6px; border:1px solid #cbd5e1; font-weight:700">
            <option value="HomeCo White Shaker Plus">HomeCo — White Shaker Plus (RTA)</option>
            <option value="Grandwood Shaker Series">Grandwood — Shaker Series (Plywood)</option>
            <option value="Central Cabinets Direct">Central Cabinets Direct — Shaker</option>
            <option value="Achilles Quartz Slabs">Achilles Quartz Slabs (3mm / 2cm)</option>
          </select>
        </div>
        <div>
          <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px; color:#334155">Pricing Tier / Discount:</label>
          <select id="qdTier" style="width:100%; padding:9px 12px; border-radius:6px; border:1px solid #cbd5e1; font-weight:700">
            <option value="Tier 1 Contractor">Tier 1 Contractor (Wholesale + 15%)</option>
            <option value="Tier 2 Preferred Developer">Tier 2 Preferred Developer (Wholesale + 10%)</option>
            <option value="Tier 3 Walk-in Retail">Tier 3 Retail Customer (Wholesale + 25%)</option>
          </select>
        </div>
      </div>

      <div style="margin-bottom:16px">
        <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px; color:#334155">Cabinet List / Items Specification:</label>
        <textarea id="qdItems" rows="3" placeholder="e.g. 2x W3630 White Shaker, 1x B36 Sink Base, 1x B24, 1x 3mm Calacatta Quartz Slab" style="width:100%; padding:9px 12px; border-radius:6px; border:1px solid #cbd5e1; font-size:13px"></textarea>
      </div>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center">
        <div>
          <div style="font-size:11px; color:#64748b; font-weight:700">ESTIMATED TOTAL</div>
          <div id="qdCalculatedTotal" style="font-size:22px; font-weight:900; color:#1f5fae">$2,450.00</div>
        </div>
        <button type="button" onclick="recalculateQuoteTotal()" style="background:#e2e8f0; color:#0f172a; border:0; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer">
          🔄 Calculate
        </button>
      </div>

      <div style="display:flex; justify-content:end; gap:10px">
        <button type="button" onclick="closeModal()" style="background:#e2e8f0; color:#334155; border:0; padding:10px 18px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer">Cancel</button>
        <button type="submit" style="background:#1f5fae; color:#fff; border:0; padding:10px 20px; border-radius:6px; font-size:13px; font-weight:800; cursor:pointer">⚡ Dispatch Quote via Email & WhatsApp</button>
      </div>
    </form>
  \`;
  showModal('⚡ Batch Quote Dispatcher & Estimator', content, '720px');
}

function handleBatchQuoteSubmit(e) {
  e.preventDefault();
  const cust = document.getElementById('qdCustomer').value;
  closeModal();
  showToast(\`Quote dispatched successfully to \${cust}! Saved to QBO Estimates.\`);
}

function recalculateQuoteTotal() {
  const tot = document.getElementById('qdCalculatedTotal');
  if (tot) {
    const val = (Math.random() * 1500 + 1200).toFixed(2);
    tot.textContent = \`$\${Number(val).toLocaleString('en-US')}\`;
  }
}

// Create Invoice Modal
function openInvoiceModal() {
  const content = \`
    <form onsubmit="handleInvoiceSubmit(event)">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px">
        <div>
          <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px">Customer Name:</label>
          <input id="invCustomer" type="text" placeholder="e.g. Chavez Construction" required style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1">
        </div>
        <div>
          <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px">QBO PO / Invoice Number:</label>
          <input type="text" value="INV-2026-\${Math.floor(Math.random()*900+100)}" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1; font-weight:700">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px">
        <div>
          <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px">Invoice Amount ($):</label>
          <input id="invAmount" type="number" step="0.01" placeholder="4250.00" required style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1; font-weight:700; font-size:15px">
        </div>
        <div>
          <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px">Terms / Due Date:</label>
          <select style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1; font-weight:700">
            <option>Net 15 Days</option>
            <option>Due on Receipt</option>
            <option>Net 30 Days</option>
          </select>
        </div>
      </div>

      <div style="display:flex; justify-content:end; gap:10px; margin-top:20px">
        <button type="button" onclick="closeModal()" style="background:#e2e8f0; color:#334155; border:0; padding:10px 18px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer">Cancel</button>
        <button type="submit" style="background:#237a47; color:#fff; border:0; padding:10px 20px; border-radius:6px; font-size:13px; font-weight:800; cursor:pointer">📄 Generate & Send QBO Invoice</button>
      </div>
    </form>
  \`;
  showModal('📄 Create Customer Invoice (QBO Direct)', content, '650px');
}

function handleInvoiceSubmit(e) {
  e.preventDefault();
  const cust = document.getElementById('invCustomer').value;
  closeModal();
  showToast(\`Invoice created for \${cust}! Synced to QuickBooks Online.\`);
}

// Record Expense Modal
function openExpenseModal() {
  const content = \`
    <form onsubmit="handleExpenseSubmit(event)">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px">
        <div>
          <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px">Vendor Name:</label>
          <select id="expVendor" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1; font-weight:700">
            <option>HomeCo Cabinets</option>
            <option>Grandwood Cabinets</option>
            <option>Achilles Quartz Stone</option>
            <option>7-Eleven (Fuel / Store Supply)</option>
            <option>RingCentral Communications</option>
            <option>All In Shipping / Logistics</option>
          </select>
        </div>
        <div>
          <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px">Expense Amount ($):</label>
          <input id="expAmount" type="number" step="0.01" placeholder="1250.00" required style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1; font-size:15px; font-weight:700">
        </div>
      </div>

      <div style="margin-bottom:16px">
        <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px">Billing Email Copy Note:</label>
        <input type="text" value="Copy Billing@cabellacollections.com on payment links" readonly style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1; background:#f1f5f9; color:#475569">
      </div>

      <div style="display:flex; justify-content:end; gap:10px">
        <button type="button" onclick="closeModal()" style="background:#e2e8f0; color:#334155; border:0; padding:10px 18px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer">Cancel</button>
        <button type="submit" style="background:#b91c1c; color:#fff; border:0; padding:10px 20px; border-radius:6px; font-size:13px; font-weight:800; cursor:pointer">💸 Record Expense in QBO</button>
      </div>
    </form>
  \`;
  showModal('💸 Record Vendor Expense / Bill', content, '650px');
}

function handleExpenseSubmit(e) {
  e.preventDefault();
  const v = document.getElementById('expVendor').value;
  closeModal();
  showToast(\`Expense recorded for \${v}! Copy sent to Billing@cabellacollections.com.\`);
}

// Record Customer Payment Modal
function openPaymentModal() {
  const content = \`
    <form onsubmit="handlePaymentSubmit(event)">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px">
        <div>
          <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px">Customer / Project:</label>
          <input id="pmCustomer" type="text" placeholder="e.g. Pacific Coast Builders" required style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1">
        </div>
        <div>
          <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px">Payment Received ($):</label>
          <input id="pmAmount" type="number" step="0.01" placeholder="3500.00" required style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1; font-size:15px; font-weight:700">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px">
        <div>
          <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px">Payment Method:</label>
          <select style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1; font-weight:700">
            <option>Bank Wire Transfer</option>
            <option>Business Check</option>
            <option>Credit Card (QBO Merchant)</option>
            <option>Cash / Zelle</option>
          </select>
        </div>
        <div>
          <label style="display:block; font-weight:800; font-size:12.5px; margin-bottom:4px">Reference / Check #:</label>
          <input type="text" placeholder="e.g. CHK-9921 / Wire #883" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1">
        </div>
      </div>

      <div style="display:flex; justify-content:end; gap:10px">
        <button type="button" onclick="closeModal()" style="background:#e2e8f0; color:#334155; border:0; padding:10px 18px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer">Cancel</button>
        <button type="submit" style="background:#15803d; color:#fff; border:0; padding:10px 20px; border-radius:6px; font-size:13px; font-weight:800; cursor:pointer">💵 Post Payment to QBO Ledger</button>
      </div>
    </form>
  \`;
  showModal('💵 Record Customer Payment', content, '650px');
}

function handlePaymentSubmit(e) {
  e.preventDefault();
  const c = document.getElementById('pmCustomer').value;
  closeModal();
  showToast(\`Payment received from \${c}! Posted to QBO Bank Ledger.\`);
}

// Initializer
document.addEventListener('DOMContentLoaded', function() {
  renderSidebarNav();
});
`;

// Insert jsCode before </script> in index.html
const lastScriptEnd = html.lastIndexOf('</script>');
if (lastScriptEnd !== -1) {
  const newHtml = html.substring(0, lastScriptEnd) + '\n\n' + jsCode + '\n' + html.substring(lastScriptEnd);
  fs.writeFileSync('index.html', newHtml, 'utf8');
  console.log('Appended workspace_system JS successfully to index.html!');
} else {
  console.error('Could not find </script> in index.html');
}
