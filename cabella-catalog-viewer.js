// ==========================================================================
// CABELLA COLLECTIONS — OFFICIAL 77-PAGE CLIENT PRESENTATION CATALOG VIEWER
// Designed for in-office client consultations, showroom walkthroughs & dealer reference
// 100% View-Only Client Presentation Mode (No Invoicing / Estimate / Quote baggage)
// ==========================================================================

var cabellaCatalogCurrentPage = window.cabellaCatalogCurrentPage || 1;
var cabellaCatalogViewMode = window.cabellaCatalogViewMode || 'booklet'; // 'booklet', 'search', 'gallery'
var cabellaCatalogSearchQuery = window.cabellaCatalogSearchQuery || '';
var cabellaCatalogFilterCategory = window.cabellaCatalogFilterCategory || 'all';
var cabellaCatalogActiveSwatchModal = null;

// Initialize and open the client presentation catalog modal
function openCabellaCatalogModal(targetPageOrTab) {
  if (typeof targetPageOrTab === 'number') {
    cabellaCatalogCurrentPage = Math.max(1, Math.min(77, targetPageOrTab));
    cabellaCatalogViewMode = 'booklet';
  } else if (typeof targetPageOrTab === 'string') {
    const tabMap = {
      'cover': 1,
      'intro': 2,
      'toc': 3,
      'cabinets': 4,
      'framed': 4,
      'frameless': 11,
      'swatches': 14,
      'finishes': 14,
      'construction': 18,
      'workflow': 19,
      'stone': 20,
      'quartz': 22,
      'tlquartz': 22,
      'elite': 36,
      'granite': 48,
      'quartzite': 53,
      'marble': 58,
      'butcher': 62,
      'flooring': 63,
      'spc': 63,
      'sinks': 70,
      'contractor': 75,
      'regional': 76,
      'contact': 77
    };
    if (tabMap[targetPageOrTab.toLowerCase()]) {
      cabellaCatalogCurrentPage = tabMap[targetPageOrTab.toLowerCase()];
      cabellaCatalogViewMode = 'booklet';
    }
  }
  cabellaCatalogSearchQuery = '';
  renderCabellaMasterCatalogModal();
}

function setCabellaCatalogPage(pageNum) {
  cabellaCatalogCurrentPage = Math.max(1, Math.min(77, parseInt(pageNum, 10) || 1));
  cabellaCatalogViewMode = 'booklet';
  renderCabellaMasterCatalogModal();
}

function nextCabellaCatalogPage() {
  if (cabellaCatalogCurrentPage < 77) {
    cabellaCatalogCurrentPage++;
    renderCabellaMasterCatalogModal();
  }
}

function prevCabellaCatalogPage() {
  if (cabellaCatalogCurrentPage > 1) {
    cabellaCatalogCurrentPage--;
    renderCabellaMasterCatalogModal();
  }
}

function setCabellaCatalogViewMode(mode) {
  cabellaCatalogViewMode = mode;
  renderCabellaMasterCatalogModal();
}

function handleCabellaSearchInput(query) {
  cabellaCatalogSearchQuery = String(query || '').trim().toLowerCase();
  cabellaCatalogViewMode = 'search';
  renderCabellaMasterCatalogModal();
}

function filterCabellaCategory(cat) {
  cabellaCatalogFilterCategory = cat;
  cabellaCatalogViewMode = 'search';
  renderCabellaMasterCatalogModal();
}

// --------------------------------------------------------------------------
// MODAL ROOT RENDERER
// --------------------------------------------------------------------------
function renderCabellaMasterCatalogModal() {
  const pages = window.CABELLA_CATALOG_77_PAGES || [];
  const curr = pages.find(p => p.pageNum === cabellaCatalogCurrentPage) || pages[0] || { pageNum: 1, section: "COVER", title: "CATALOG" };

  let mainBodyHtml = '';

  if (cabellaCatalogViewMode === 'search') {
    mainBodyHtml = renderCabellaCatalogSearchContent(pages);
  } else if (cabellaCatalogViewMode === 'gallery') {
    mainBodyHtml = renderCabellaCatalogThumbnailGallery(pages);
  } else {
    mainBodyHtml = renderSingleCatalogPageBooklet(curr);
  }

  const modalHtml = `
    <div id="cabellaCatalogModalRoot" style="display:flex; flex-direction:column; gap:12px; font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#0f172a">
      
      <!-- Top Luxury Navy & Crimson Showroom Header -->
      <div style="background:linear-gradient(135deg, #061a33 0%, #0f274a 100%); color:#ffffff; padding:16px 20px; border-radius:12px; border-left:6px solid #e11d48; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; box-shadow:0 4px 14px rgba(0,0,0,0.18)">
        <div>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap">
            <span style="font-weight:950; font-size:19px; letter-spacing:0.04em; color:#ffffff"><span style="color:#e11d48">CABELLA</span> Collections</span>
            <span style="background:#e11d48; color:#ffffff; font-size:10px; font-weight:900; padding:3px 8px; border-radius:4px; text-transform:uppercase; letter-spacing:0.5px">Official 77-Page Master Catalog</span>
            <span style="background:rgba(255,255,255,0.15); color:#fde047; font-size:10.5px; font-weight:800; padding:3px 8px; border-radius:4px">Client Showroom Edition (2026)</span>
          </div>
          <div style="font-size:12px; color:#cbd5e1; margin-top:3px; display:flex; align-items:center; gap:8px">
            <span>Showroom: 3555 W Reno Ave, Las Vegas NV</span>
            <span>•</span>
            <span>📞 (702) 879-2549</span>
            <span>•</span>
            <span style="color:#38bdf8">Wholesale & Trade Consultation</span>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap">
          <div style="display:flex; background:rgba(255,255,255,0.1); border-radius:8px; padding:3px; border:1px solid rgba(255,255,255,0.2)">
            <button onclick="setCabellaCatalogViewMode('booklet')" style="border:0; padding:7px 14px; font-size:12px; font-weight:800; border-radius:6px; cursor:pointer; background:${cabellaCatalogViewMode==='booklet'?'#ffffff':'transparent'}; color:${cabellaCatalogViewMode==='booklet'?'#061a33':'#cbd5e1'}; transition:all 0.15s; display:flex; align-items:center; gap:6px">
              <span>📖</span> <span>Booklet View</span>
            </button>
            <button onclick="setCabellaCatalogViewMode('search')" style="border:0; padding:7px 14px; font-size:12px; font-weight:800; border-radius:6px; cursor:pointer; background:${cabellaCatalogViewMode==='search'?'#ffffff':'transparent'}; color:${cabellaCatalogViewMode==='search'?'#061a33':'#cbd5e1'}; transition:all 0.15s; display:flex; align-items:center; gap:6px">
              <span>🔍</span> <span>Product Finder</span>
            </button>
            <button onclick="setCabellaCatalogViewMode('gallery')" style="border:0; padding:7px 14px; font-size:12px; font-weight:800; border-radius:6px; cursor:pointer; background:${cabellaCatalogViewMode==='gallery'?'#ffffff':'transparent'}; color:${cabellaCatalogViewMode==='gallery'?'#061a33':'#cbd5e1'}; transition:all 0.15s; display:flex; align-items:center; gap:6px">
              <span>🖼️</span> <span>All 77 Pages</span>
            </button>
          </div>
          <button onclick="window.print()" style="background:rgba(255,255,255,0.15); color:#fff; border:1px solid rgba(255,255,255,0.3); padding:7px 12px; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:5px" title="Print Current Page for Client">
            <span>🖨️</span> <span>Print Page</span>
          </button>
        </div>
      </div>

      <!-- Quick Section Jump Toolbar -->
      <div style="display:flex; gap:6px; overflow-x:auto; background:#f8fafc; padding:8px 10px; border-radius:10px; border:1px solid #e2e8f0; scrollbar-width:thin">
        <button onclick="setCabellaCatalogPage(1)" style="padding:5px 10px; font-size:11.5px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${curr.pageNum<=3?'#061a33':'#fff'}; color:${curr.pageNum<=3?'#fde047':'#334155'}; white-space:nowrap">📕 Cover & TOC (P.1-3)</button>
        <button onclick="setCabellaCatalogPage(4)" style="padding:5px 10px; font-size:11.5px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${(curr.pageNum>=4 && curr.pageNum<=10)?'#061a33':'#fff'}; color:${(curr.pageNum>=4 && curr.pageNum<=10)?'#fde047':'#334155'}; white-space:nowrap">🪵 Framed Shakers (P.4-10)</button>
        <button onclick="setCabellaCatalogPage(11)" style="padding:5px 10px; font-size:11.5px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${(curr.pageNum>=11 && curr.pageNum<=13)?'#061a33':'#fff'}; color:${(curr.pageNum>=11 && curr.pageNum<=13)?'#fde047':'#334155'}; white-space:nowrap">🏢 Frameless Slabs (P.11-13)</button>
        <button onclick="setCabellaCatalogPage(14)" style="padding:5px 10px; font-size:11.5px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${(curr.pageNum>=14 && curr.pageNum<=17)?'#061a33':'#fff'}; color:${(curr.pageNum>=14 && curr.pageNum<=17)?'#fde047':'#334155'}; white-space:nowrap">🚪 32 Door Swatches (P.14-17)</button>
        <button onclick="setCabellaCatalogPage(18)" style="padding:5px 10px; font-size:11.5px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${(curr.pageNum===18||curr.pageNum===19)?'#061a33':'#fff'}; color:${(curr.pageNum===18||curr.pageNum===19)?'#fde047':'#334155'}; white-space:nowrap">📐 Construction Specs (P.18-19)</button>
        <button onclick="setCabellaCatalogPage(22)" style="padding:5px 10px; font-size:11.5px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${(curr.pageNum>=20 && curr.pageNum<=35)?'#061a33':'#fff'}; color:${(curr.pageNum>=20 && curr.pageNum<=35)?'#fde047':'#334155'}; white-space:nowrap">💎 TL Quartz (P.22-35)</button>
        <button onclick="setCabellaCatalogPage(36)" style="padding:5px 10px; font-size:11.5px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${(curr.pageNum>=36 && curr.pageNum<=47)?'#061a33':'#fff'}; color:${(curr.pageNum>=36 && curr.pageNum<=47)?'#fde047':'#334155'}; white-space:nowrap">🌟 Elite Quartz (P.36-47)</button>
        <button onclick="setCabellaCatalogPage(48)" style="padding:5px 10px; font-size:11.5px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${(curr.pageNum>=48 && curr.pageNum<=52)?'#061a33':'#fff'}; color:${(curr.pageNum>=48 && curr.pageNum<=52)?'#fde047':'#334155'}; white-space:nowrap">🌋 Granite Slabs (P.48-52)</button>
        <button onclick="setCabellaCatalogPage(53)" style="padding:5px 10px; font-size:11.5px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${(curr.pageNum>=53 && curr.pageNum<=57)?'#061a33':'#fff'}; color:${(curr.pageNum>=53 && curr.pageNum<=57)?'#fde047':'#334155'}; white-space:nowrap">🏛️ Quartzite (P.53-57)</button>
        <button onclick="setCabellaCatalogPage(58)" style="padding:5px 10px; font-size:11.5px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${(curr.pageNum>=58 && curr.pageNum<=61)?'#061a33':'#fff'}; color:${(curr.pageNum>=58 && curr.pageNum<=61)?'#fde047':'#334155'}; white-space:nowrap">🏛️ Marble & Dolomite (P.58-61)</button>
        <button onclick="setCabellaCatalogPage(62)" style="padding:5px 10px; font-size:11.5px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${curr.pageNum===62?'#061a33':'#fff'}; color:${curr.pageNum===62?'#fde047':'#334155'}; white-space:nowrap">🪵 Butcher Block (P.62)</button>
        <button onclick="setCabellaCatalogPage(63)" style="padding:5px 10px; font-size:11.5px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${(curr.pageNum>=63 && curr.pageNum<=69)?'#061a33':'#fff'}; color:${(curr.pageNum>=63 && curr.pageNum<=69)?'#fde047':'#334155'}; white-space:nowrap">🪴 SPC Flooring (P.63-69)</button>
        <button onclick="setCabellaCatalogPage(70)" style="padding:5px 10px; font-size:11.5px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${(curr.pageNum>=70 && curr.pageNum<=74)?'#061a33':'#fff'}; color:${(curr.pageNum>=70 && curr.pageNum<=74)?'#fde047':'#334155'}; white-space:nowrap">🚰 Sinks & Aprons (P.70-74)</button>
        <button onclick="setCabellaCatalogPage(75)" style="padding:5px 10px; font-size:11.5px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${curr.pageNum>=75?'#061a33':'#fff'}; color:${curr.pageNum>=75?'#fde047':'#334155'}; white-space:nowrap">🤝 Contractor & Contact (P.75-77)</button>
      </div>

      <!-- Page Scrubber Controls (Booklet View) -->
      ${cabellaCatalogViewMode === 'booklet' ? `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#ffffff; padding:10px 16px; border-radius:10px; border:1px solid #e2e8f0; flex-wrap:wrap; gap:10px; box-shadow:0 1px 4px rgba(0,0,0,0.02)">
          <div style="display:flex; align-items:center; gap:8px">
            <button onclick="prevCabellaCatalogPage()" ${curr.pageNum === 1 ? 'disabled style="opacity:0.4; cursor:not-allowed; background:#f1f5f9; color:#94a3b8"' : 'style="background:#061a33; color:#ffffff; cursor:pointer"'} style="border:0; padding:7px 16px; font-size:13px; font-weight:900; border-radius:6px">
              ◀ Prev Page
            </button>
            <button onclick="nextCabellaCatalogPage()" ${curr.pageNum === 77 ? 'disabled style="opacity:0.4; cursor:not-allowed; background:#f1f5f9; color:#94a3b8"' : 'style="background:#061a33; color:#ffffff; cursor:pointer"'} style="border:0; padding:7px 16px; font-size:13px; font-weight:900; border-radius:6px">
              Next Page ▶
            </button>
          </div>

          <!-- Direct Page Jump Dropdown -->
          <div style="display:flex; align-items:center; gap:10px">
            <span style="font-size:13px; font-weight:800; color:#475569">Showing Page:</span>
            <select onchange="setCabellaCatalogPage(this.value)" style="padding:6px 12px; font-size:13px; font-weight:800; color:#0f172a; border:1px solid #cbd5e1; border-radius:6px; background:#fff; cursor:pointer">
              ${pages.map(p => `
                <option value="${p.pageNum}" ${p.pageNum === curr.pageNum ? 'selected' : ''}>
                  Page ${p.pageNum < 10 ? '0' + p.pageNum : p.pageNum} — ${p.section}: ${p.title}
                </option>
              `).join('')}
            </select>
            <span style="font-size:12px; font-weight:800; color:#94a3b8">of 77</span>
          </div>

          <div style="font-size:12px; color:#64748b; font-weight:700">
            <span style="color:#e11d48; font-weight:900">Section:</span> ${curr.section}
          </div>
        </div>
      ` : ''}

      <!-- Main Display Body -->
      <div id="cabellaCatalogMainDisplay">
        ${mainBodyHtml}
      </div>

    </div>
  `;

  if (typeof openModal === 'function') {
    openModal('📖 Cabella Collections — 77-Page Client Presentation Catalog (2026 Edition)', modalHtml, '1080px');
  }
}

// --------------------------------------------------------------------------
// RENDER SINGLE PAGE BOOKLET
// --------------------------------------------------------------------------
function renderSingleCatalogPageBooklet(page) {
  const pNum = page.pageNum;
  const pSec = page.section;
  let pageInner = '';

  // COVER PAGE (Page 1)
  if (page.type === 'cover') {
    const c = page.content;
    pageInner = `
      <div style="background:${c.heroBg}; border-radius:12px; color:#ffffff; padding:50px 30px; text-align:center; min-height:560px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 10px 30px rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.1)">
        <div>
          <div style="font-size:13px; letter-spacing:0.25em; text-transform:uppercase; color:#94a3b8; font-weight:800; margin-bottom:12px">
            CABELLA CABINETS • STONE • FLOORING
          </div>
          <h1 style="font-size:44px; font-weight:950; letter-spacing:0.06em; margin:0 0 8px; color:#ffffff">
            <span style="color:#e11d48">CABELLA</span> COLLECTIONS
          </h1>
          <div style="width:90px; height:4px; background:#e11d48; margin:10px auto 20px; border-radius:2px"></div>
          
          <div style="font-size:18px; font-weight:800; color:#fde047; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:14px">
            ${c.subhead}
          </div>
          <p style="font-size:14.5px; color:#cbd5e1; max-width:620px; margin:0 auto 28px; line-height:1.6">
            ${c.tagline}
          </p>

          <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap; margin-bottom:30px">
            <span style="background:rgba(255,255,255,0.12); padding:8px 16px; border-radius:8px; font-size:13px; font-weight:800; border:1px solid rgba(255,255,255,0.2)">🪵 Solid Wood Cabinetry</span>
            <span style="background:rgba(255,255,255,0.12); padding:8px 16px; border-radius:8px; font-size:13px; font-weight:800; border:1px solid rgba(255,255,255,0.2)">⛰️ Engineered Quartz & Marble</span>
            <span style="background:rgba(255,255,255,0.12); padding:8px 16px; border-radius:8px; font-size:13px; font-weight:800; border:1px solid rgba(255,255,255,0.2)">🪴 Rigid Core SPC Flooring</span>
            <span style="background:rgba(255,255,255,0.12); padding:8px 16px; border-radius:8px; font-size:13px; font-weight:800; border:1px solid rgba(255,255,255,0.2)">🚰 Farmhouse & Chef Sinks</span>
          </div>
        </div>

        <div style="background:rgba(0,0,0,0.4); backdrop-filter:blur(6px); border-radius:10px; padding:18px; max-width:650px; margin:0 auto; border:1px solid rgba(255,255,255,0.15)">
          <div style="font-size:14px; font-weight:800; color:#ffffff; margin-bottom:4px">${c.address}</div>
          <div style="font-size:13px; color:#cbd5e1">📞 ${c.phone} • ✉️ ${c.email} • 🌐 ${c.web}</div>
          <div style="margin-top:14px">
            <button onclick="nextCabellaCatalogPage()" style="background:#e11d48; color:#ffffff; font-weight:900; font-size:13px; border:0; padding:9px 24px; border-radius:6px; cursor:pointer; box-shadow:0 4px 12px rgba(225,29,72,0.4)">
              Open Presentation Catalog ➔
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // INTRO PAGE (Page 2)
  else if (page.type === 'intro') {
    const c = page.content;
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:32px; min-height:560px">
        <div style="border-bottom:3px solid #e11d48; padding-bottom:12px; margin-bottom:24px">
          <div style="font-size:12px; font-weight:800; color:#e11d48; text-transform:uppercase; letter-spacing:0.1em">Section 01 • Introduction</div>
          <h2 style="font-size:26px; font-weight:900; color:#0f172a; margin:4px 0">${page.title}</h2>
          <div style="font-size:14px; font-weight:700; color:#64748b">${page.subtitle}</div>
        </div>

        <div style="margin-bottom:28px">
          <h3 style="font-size:18px; font-weight:900; color:#0f172a; margin:0 0 8px">${c.mainHeadline}</h3>
          <p style="font-size:14.5px; color:#475569; line-height:1.7; margin:0">${c.bodyParagraph}</p>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-bottom:24px">
          ${c.pillars.map((p, idx) => `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:18px; box-shadow:0 2px 6px rgba(0,0,0,0.02)">
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px">
                <span style="width:28px; height:28px; border-radius:50%; background:#061a33; color:#fde047; font-weight:900; font-size:12px; display:flex; align-items:center; justify-content:center">${idx+1}</span>
                <h4 style="margin:0; font-size:14px; font-weight:900; color:#0f172a">${p.label}</h4>
              </div>
              <p style="margin:0; font-size:12.5px; color:#64748b; line-height:1.5">${p.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // TABLE OF CONTENTS (Page 3)
  else if (page.type === 'toc') {
    const c = page.content;
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:32px; min-height:560px">
        <div style="border-bottom:3px solid #e11d48; padding-bottom:12px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:baseline">
          <div>
            <div style="font-size:12px; font-weight:800; color:#e11d48; text-transform:uppercase; letter-spacing:0.1em">Quick Navigator</div>
            <h2 style="font-size:26px; font-weight:900; color:#0f172a; margin:4px 0">${page.title}</h2>
          </div>
          <span style="font-size:13px; font-weight:800; color:#64748b">${page.subtitle}</span>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px">
          ${c.tocItems.map(item => `
            <div onclick="setCabellaCatalogPage(${item.page})" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:18px; cursor:pointer; transition:all 0.15s; display:flex; justify-content:space-between; align-items:center" onmouseover="this.style.borderColor='#e11d48'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='#e2e8f0'; this.style.transform='none'">
              <div style="display:flex; align-items:center; gap:14px">
                <span style="font-size:28px">${item.icon}</span>
                <div>
                  <div style="font-weight:900; font-size:15px; color:#0f172a">${item.title}</div>
                  <div style="font-size:12px; color:#64748b; margin-top:2px">${item.desc}</div>
                </div>
              </div>
              <div style="text-align:right">
                <span style="font-size:18px; font-weight:950; color:#e11d48">P.${item.code}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // HERO SHOWCASE (Page 4)
  else if (page.type === 'hero_showcase') {
    const c = page.content;
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:30px; min-height:560px">
        <div style="border-bottom:3px solid #e11d48; padding-bottom:10px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center">
          <div>
            <div style="font-size:12px; font-weight:800; color:#e11d48; text-transform:uppercase; letter-spacing:0.1em">Section 02 • Solid Wood Cabinetry</div>
            <h2 style="font-size:24px; font-weight:900; color:#0f172a; margin:4px 0">${page.title}</h2>
            <div style="font-size:13px; font-weight:700; color:#64748b">${page.subtitle}</div>
          </div>
          <span style="font-size:12px; font-weight:800; background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:6px">Page 04 of 77</span>
        </div>

        <div style="background:linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius:10px; padding:24px; color:#fff; margin-bottom:20px">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px">
            <h3 style="margin:0; font-size:20px; font-weight:900; color:#fde047">${c.featured.name}</h3>
            <span style="background:#e11d48; color:#fff; font-size:11px; font-weight:800; padding:3px 8px; border-radius:4px">Code: ${c.featured.code}</span>
          </div>
          <p style="font-size:13.5px; color:#cbd5e1; line-height:1.6; margin:0 0 16px">${c.featured.desc}</p>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px">
            <div style="background:rgba(255,255,255,0.1); padding:10px; border-radius:6px; font-size:12px">
              <strong style="color:#38bdf8">Door Construction:</strong><br>${c.featured.doors}
            </div>
            <div style="background:rgba(255,255,255,0.1); padding:10px; border-radius:6px; font-size:12px">
              <strong style="color:#38bdf8">Cabinet Box Core:</strong><br>${c.featured.box}
            </div>
            <div style="background:rgba(255,255,255,0.1); padding:10px; border-radius:6px; font-size:12px">
              <strong style="color:#38bdf8">Drawer & Slides:</strong><br>${c.featured.drawers}
            </div>
          </div>
        </div>

        <div style="text-align:center">
          <button onclick="nextCabellaCatalogPage()" style="background:#e11d48; color:#ffffff; font-weight:900; font-size:13.5px; border:0; padding:10px 24px; border-radius:6px; cursor:pointer; box-shadow:0 4px 12px rgba(225,29,72,0.3)">
            Browse Framed Shaker Colors (P.5) ➔
          </button>
        </div>
      </div>
    `;
  }

  // DUO SHOWCASE (Pages 5, 6, 7, 8, 9, 10, 12, 13)
  else if (page.type === 'duo_showcase') {
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:26px; min-height:560px">
        <div style="border-bottom:3px solid #e11d48; padding-bottom:10px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center">
          <div>
            <div style="font-size:12px; font-weight:800; color:#e11d48; text-transform:uppercase; letter-spacing:0.1em">Cabinet Collection</div>
            <h2 style="font-size:22px; font-weight:900; color:#0f172a; margin:4px 0">${page.title}</h2>
            <div style="font-size:13px; font-weight:700; color:#64748b">${page.subtitle}</div>
          </div>
          <span style="font-size:12px; font-weight:800; background:#f1f5f9; color:#475569; padding:4px 10px; border-radius:6px">Page ${page.pageNum}</span>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px">
          ${page.items.map(it => `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 2px 8px rgba(0,0,0,0.03)">
              <div>
                <!-- Texture swatch -->
                <div style="height:150px; border-radius:8px; background:${it.hex}; border:1px solid rgba(0,0,0,0.15); box-shadow:inset 0 2px 8px rgba(0,0,0,0.25); margin-bottom:14px; position:relative; display:flex; align-items:flex-end; padding:12px">
                  <div style="background:rgba(0,0,0,0.75); backdrop-filter:blur(4px); color:#ffffff; padding:4px 10px; border-radius:4px; font-size:11.5px; font-weight:800">
                    Finish: ${it.finish}
                  </div>
                </div>

                <h3 style="margin:0 0 6px; font-size:17px; font-weight:900; color:#0f172a">${it.name}</h3>
                <div style="font-size:12.5px; font-weight:800; color:#0284c7; margin-bottom:6px">Item Code: <strong>${it.code}</strong> • ${it.category}</div>
                <div style="font-size:12px; font-weight:700; color:#64748b; margin-bottom:10px">Box Structure: ${it.box}</div>
                <p style="font-size:13px; color:#475569; line-height:1.5; margin:0 0 16px">${it.desc}</p>
              </div>

              <!-- Client Presentation Action Strip -->
              <div style="display:flex; gap:8px; border-top:1px solid #e2e8f0; padding-top:12px">
                <button onclick="copyToClipboard('${it.name} (${it.code})'); showToast('📋 Copied ${it.name} (${it.code})!');" style="background:#ffffff; color:#334155; border:1px solid #cbd5e1; font-size:12px; font-weight:800; padding:7px 12px; border-radius:6px; cursor:pointer; flex:1">📋 Copy Name</button>
                <button onclick="openShowroomSwatchModal('${it.name}', '${it.code}', '${it.finish}', '${it.hex}', '${it.desc}', '${it.box}', 'Cabinetry')" style="background:#061a33; color:#fde047; border:0; font-size:12px; font-weight:900; padding:7px 14px; border-radius:6px; cursor:pointer; flex:1.4">🔍 Zoom & Details</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // FRAMELESS SPEC (Page 11)
  else if (page.type === 'frameless_spec') {
    const c = page.content;
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:26px; min-height:560px">
        <div style="border-bottom:3px solid #e11d48; padding-bottom:10px; margin-bottom:18px">
          <div style="font-size:12px; font-weight:800; color:#e11d48; text-transform:uppercase; letter-spacing:0.1em">Section 03 • European Frameless Series</div>
          <h2 style="font-size:22px; font-weight:900; color:#0f172a; margin:4px 0">${page.title}</h2>
          <div style="font-size:13px; font-weight:700; color:#64748b">${page.subtitle}</div>
        </div>

        <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:20px">
          <div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:14px">
              <h3 style="font-size:16px; font-weight:900; color:#0f172a; margin:0 0 6px">${c.headline}</h3>
              <p style="font-size:13px; color:#475569; line-height:1.55; margin:0">${c.desc}</p>
            </div>

            <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:10px; padding:16px">
              <div style="font-weight:900; font-size:13px; color:#0f172a; text-transform:uppercase; margin-bottom:10px">📐 3/4" Full Construction Anatomy</div>
              <ul style="margin:0; padding-left:20px; font-size:12.5px; color:#334155; line-height:1.7">
                ${c.specs.map(s => `<li>${s}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px; display:flex; flex-direction:column; justify-content:space-between">
            <div>
              <div style="height:150px; border-radius:8px; background:${c.featuredFinish.hex}; border:1px solid rgba(0,0,0,0.15); box-shadow:inset 0 2px 8px rgba(0,0,0,0.25); margin-bottom:14px; display:flex; align-items:flex-end; padding:12px">
                <span style="background:rgba(0,0,0,0.75); color:#fff; font-size:12px; font-weight:800; padding:3px 10px; border-radius:4px">${c.featuredFinish.name}</span>
              </div>
              <h3 style="margin:0 0 4px; font-size:17px; font-weight:900; color:#0f172a">${c.featuredFinish.name}</h3>
              <div style="font-size:12.5px; font-weight:700; color:#64748b; margin-bottom:4px">Doors: ${c.featuredFinish.doors}</div>
              <div style="font-size:12.5px; font-weight:700; color:#64748b; margin-bottom:14px">Box: ${c.featuredFinish.box}</div>
            </div>

            <div style="display:flex; gap:8px">
              <button onclick="copyToClipboard('${c.featuredFinish.name}'); showToast('📋 Copied ${c.featuredFinish.name}!');" style="background:#ffffff; color:#334155; border:1px solid #cbd5e1; font-size:12px; font-weight:800; padding:7px; border-radius:6px; cursor:pointer; flex:1">📋 Copy Name</button>
              <button onclick="openShowroomSwatchModal('${c.featuredFinish.name}', '${c.featuredFinish.code}', '${c.featuredFinish.doors}', '${c.featuredFinish.hex}', 'European Frameless Modern Slab with high gloss acrylic or matte textured surface.', '${c.featuredFinish.box}', 'Cabinetry')" style="background:#061a33; color:#fde047; border:0; font-size:12px; font-weight:900; padding:7px; border-radius:6px; cursor:pointer; flex:1.4">🔍 Zoom & Details</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // SWATCH GRID (Pages 14, 15, 16, 17)
  else if (page.type === 'swatch_grid') {
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:26px; min-height:560px">
        <div style="border-bottom:3px solid #e11d48; padding-bottom:10px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center">
          <div>
            <div style="font-size:12px; font-weight:800; color:#e11d48; text-transform:uppercase; letter-spacing:0.1em">Section 04 • 32 Door Swatches</div>
            <h2 style="font-size:22px; font-weight:900; color:#0f172a; margin:4px 0">${page.title}</h2>
            <div style="font-size:13px; font-weight:700; color:#64748b">${page.subtitle}</div>
          </div>
          <span style="font-size:12px; font-weight:800; background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:6px">Page ${page.pageNum} of 77</span>
        </div>

        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:14px">
          ${page.swatches.map(s => `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; text-align:center; box-shadow:0 1px 4px rgba(0,0,0,0.02); display:flex; flex-direction:column; justify-content:space-between">
              <div>
                <div style="height:90px; border-radius:8px; background:${s.hex}; border:1px solid rgba(0,0,0,0.15); box-shadow:inset 0 1px 5px rgba(0,0,0,0.2); margin-bottom:10px; cursor:pointer" onclick="openShowroomSwatchModal('${s.name}', '${s.code}', 'Cabinet Door Finish', '${s.hex}', '${s.desc}', '3/4 Solid Birch / Plywood Box', 'Cabinet Finish')"></div>
                <div style="font-weight:900; font-size:13px; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${s.name}">${s.name}</div>
                <div style="font-size:11px; font-weight:800; color:#0284c7; margin-top:2px">Code: ${s.code}</div>
                <div style="font-size:11.5px; font-weight:600; color:#64748b; margin:4px 0 10px">${s.desc}</div>
              </div>
              <div style="display:flex; gap:6px">
                <button onclick="copyToClipboard('${s.name}'); showToast('📋 Copied ${s.name}!');" style="background:#ffffff; color:#334155; border:1px solid #cbd5e1; font-size:11px; font-weight:800; padding:4px 8px; border-radius:4px; cursor:pointer; flex:1">📋 Copy</button>
                <button onclick="openShowroomSwatchModal('${s.name}', '${s.code}', 'Cabinet Door Finish', '${s.hex}', '${s.desc}', '3/4 Solid Birch / Plywood Box', 'Cabinet Finish')" style="background:#061a33; color:#fde047; border:0; font-size:11px; font-weight:900; padding:4px 8px; border-radius:4px; cursor:pointer; flex:1.2">🔍 View</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // CABINET CONSTRUCTION (Page 18)
  else if (page.type === 'construction_spec') {
    const c = page.content;
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:28px; min-height:560px">
        <div style="border-bottom:3px solid #e11d48; padding-bottom:10px; margin-bottom:20px">
          <div style="font-size:12px; font-weight:800; color:#e11d48; text-transform:uppercase; letter-spacing:0.1em">Section 05 • Construction Standards</div>
          <h2 style="font-size:24px; font-weight:900; color:#0f172a; margin:4px 0">${page.title}</h2>
          <div style="font-size:13px; font-weight:700; color:#64748b">${page.subtitle}</div>
        </div>

        <div style="margin-bottom:18px">
          <h3 style="margin:0 0 6px; font-size:17px; font-weight:900; color:#0f172a">${c.headline}</h3>
          <p style="margin:0; font-size:14px; color:#475569; line-height:1.6">${c.body}</p>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:12px; margin-bottom:20px">
          ${c.points.map(p => `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; display:flex; gap:12px">
              <div style="width:28px; height:28px; border-radius:50%; background:#e11d48; color:#ffffff; font-weight:900; font-size:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0">${p.code}</div>
              <div>
                <div style="font-weight:900; font-size:13.5px; color:#0f172a">${p.title}</div>
                <div style="font-size:12px; color:#64748b; margin-top:2px; line-height:1.5">${p.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="background:#fffbeb; border:1px solid #fef3c7; border-left:4px solid #d97706; padding:10px 14px; border-radius:6px; font-size:12px; color:#92400e">
          ⚠️ ${c.disclaimer}
        </div>
      </div>
    `;
  }

  // WORKFLOW (Page 19)
  else if (page.type === 'workflow') {
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:32px; min-height:560px">
        <div style="border-bottom:3px solid #e11d48; padding-bottom:10px; margin-bottom:24px">
          <div style="font-size:12px; font-weight:800; color:#e11d48; text-transform:uppercase; letter-spacing:0.1em">Section 06 • Project Workflow</div>
          <h2 style="font-size:24px; font-weight:900; color:#0f172a; margin:4px 0">${page.title}</h2>
          <div style="font-size:13px; font-weight:700; color:#64748b">${page.subtitle}</div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin:30px 0">
          ${page.steps.map(s => `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:22px 16px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.03)">
              <div style="width:52px; height:52px; border-radius:50%; background:#e11d48; color:#ffffff; font-weight:900; font-size:22px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; box-shadow:0 4px 10px rgba(225,29,72,0.3)">
                ${s.step}
              </div>
              <h3 style="margin:0 0 8px; font-size:16px; font-weight:900; color:#0f172a">${s.title}</h3>
              <p style="margin:0; font-size:13px; color:#64748b; line-height:1.55">${s.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // COMPARISON (Page 21)
  else if (page.type === 'comparison') {
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:32px; min-height:560px">
        <div style="border-bottom:3px solid #e11d48; padding-bottom:10px; margin-bottom:24px">
          <div style="font-size:12px; font-weight:800; color:#e11d48; text-transform:uppercase; letter-spacing:0.1em">Section 07 • Countertop Guide</div>
          <h2 style="font-size:24px; font-weight:900; color:#0f172a; margin:4px 0">${page.title}</h2>
          <div style="font-size:13px; font-weight:700; color:#64748b">${page.subtitle}</div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:22px">
            <h3 style="font-size:17px; font-weight:900; color:#0f172a; margin:0 0 14px">${page.col1.title}</h3>
            <ul style="margin:0; padding-left:20px; font-size:13.5px; color:#334155; line-height:1.8">
              ${page.col1.points.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>

          <div style="background:#fdf2f4; border:1px solid #fecdd3; border-radius:10px; padding:22px">
            <h3 style="font-size:17px; font-weight:900; color:#e11d48; margin:0 0 14px">${page.col2.title}</h3>
            <ul style="margin:0; padding-left:20px; font-size:13.5px; color:#881337; line-height:1.8">
              ${page.col2.points.map(p => `<li>🔴 ${p}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  // STONE GRID (Pages 22-61)
  else if (page.type === 'stone_grid') {
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:26px; min-height:560px">
        <div style="border-bottom:3px solid #e11d48; padding-bottom:10px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center">
          <div>
            <div style="font-size:12px; font-weight:800; color:#e11d48; text-transform:uppercase; letter-spacing:0.1em">Countertop & Stone Collection</div>
            <h2 style="font-size:22px; font-weight:900; color:#0f172a; margin:4px 0">${page.title}</h2>
            <div style="font-size:13px; font-weight:700; color:#64748b">${page.subtitle}</div>
          </div>
          <span style="font-size:12px; font-weight:800; background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:6px">Page ${page.pageNum} of 77</span>
        </div>

        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:14px">
          ${page.stones.map(st => `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; text-align:center; box-shadow:0 1px 4px rgba(0,0,0,0.02); display:flex; flex-direction:column; justify-content:space-between">
              <div>
                <div style="height:100px; border-radius:8px; background:${st.base}; border:1px solid rgba(0,0,0,0.15); box-shadow:inset 0 1px 5px rgba(0,0,0,0.25); margin-bottom:10px; position:relative; overflow:hidden; cursor:pointer" onclick="openShowroomSwatchModal('${st.name}', '${st.code || 'SLAB'}', '${page.title}', '${st.base}', '3cm Engineered Quartz / Natural Slab with eased or mitered edge options.', '126 x 63 Jumbo Slab or Prefabricated 108 x 26', 'Countertops')">
                  <div style="position:absolute; inset:0; background:radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0.15) 100%)"></div>
                </div>
                <div style="font-weight:900; font-size:13px; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${st.name}">${st.name}</div>
                <div style="font-size:11.5px; font-weight:800; color:#0284c7; margin-top:2px">${st.code || 'Slab'}</div>
              </div>
              <div style="display:flex; gap:6px; margin-top:10px">
                <button onclick="copyToClipboard('${st.name}'); showToast('📋 Copied ${st.name}!');" style="background:#ffffff; color:#334155; border:1px solid #cbd5e1; font-size:11px; font-weight:800; padding:4px 8px; border-radius:4px; cursor:pointer; flex:1">📋 Copy</button>
                <button onclick="openShowroomSwatchModal('${st.name}', '${st.code || 'SLAB'}', '${page.title}', '${st.base}', '3cm Engineered Quartz / Natural Slab with eased or mitered edge options.', '126 x 63 Jumbo Slab or Prefabricated 108 x 26', 'Countertops')" style="background:#061a33; color:#fde047; border:0; font-size:11px; font-weight:900; padding:4px 8px; border-radius:4px; cursor:pointer; flex:1.2">🔍 View</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // BUTCHER BLOCK (Page 62)
  else if (page.type === 'butcher_block') {
    const c = page.content;
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:26px; min-height:560px">
        <div style="border-bottom:3px solid #e11d48; padding-bottom:10px; margin-bottom:18px">
          <div style="font-size:12px; font-weight:800; color:#e11d48; text-transform:uppercase; letter-spacing:0.1em">Section 08 • Natural Hardwood Surfaces</div>
          <h2 style="font-size:24px; font-weight:900; color:#0f172a; margin:4px 0">${page.title}</h2>
          <div style="font-size:13px; font-weight:700; color:#64748b">${page.subtitle}</div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:14px; margin-bottom:20px">
          ${c.faces.map(f => `
            <div style="background:#fdf8f4; border:1px solid #fed7aa; border-radius:10px; padding:14px; text-align:center">
              <div style="height:90px; border-radius:8px; background:linear-gradient(135deg, #c29b68, #8b5a2b); margin-bottom:10px; border:1px solid rgba(0,0,0,0.15)"></div>
              <div style="font-weight:900; font-size:13.5px; color:#9a3412">${f.name}</div>
              <div style="font-size:12px; color:#78350f; font-weight:700; margin-top:2px">${f.species}</div>
              <div style="font-size:11.5px; color:#64748b; margin-top:4px">${f.desc}</div>
            </div>
          `).join('')}
        </div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:18px">
          <h3 style="font-size:16px; font-weight:900; color:#0f172a; margin:0 0 6px">${c.headline}</h3>
          <p style="font-size:13px; color:#475569; line-height:1.55; margin:0 0 12px">${c.body}</p>
          <div style="display:flex; gap:10px; flex-wrap:wrap">
            ${c.features.map(ft => `<span style="background:#e0f2fe; color:#0369a1; font-weight:800; font-size:11.5px; padding:4px 10px; border-radius:6px">${ft}</span>`).join('')}
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px">
          ${c.sizes.map(s => `
            <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:10px 14px; display:flex; justify-content:space-between; align-items:center">
              <div>
                <div style="font-weight:800; font-size:13px; color:#0f172a">${s.name}</div>
                <div style="font-size:12px; color:#64748b">${s.dims}</div>
              </div>
              <button onclick="copyToClipboard('${s.name} (${s.dims})'); showToast('📋 Copied ${s.name}!');" style="background:#f1f5f9; color:#0f172a; border:1px solid #cbd5e1; padding:4px 8px; font-size:11px; font-weight:800; border-radius:4px; cursor:pointer">📋 Copy</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // FLOORING GRID (Pages 64-69)
  else if (page.type === 'flooring_grid') {
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:26px; min-height:560px">
        <div style="border-bottom:3px solid #e11d48; padding-bottom:10px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center">
          <div>
            <div style="font-size:12px; font-weight:800; color:#e11d48; text-transform:uppercase; letter-spacing:0.1em">Section 09 • Luxury SPC Flooring</div>
            <h2 style="font-size:22px; font-weight:900; color:#0f172a; margin:4px 0">${page.title}</h2>
            <div style="font-size:13px; font-weight:700; color:#64748b">${page.subtitle}</div>
          </div>
          <span style="font-size:12px; font-weight:800; background:#dcfce7; color:#166534; padding:4px 10px; border-radius:6px">100% Waterproof Rigid Core</span>
        </div>

        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:14px">
          ${page.planks.map(pl => `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; text-align:center; box-shadow:0 1px 4px rgba(0,0,0,0.02); display:flex; flex-direction:column; justify-content:space-between">
              <div>
                <div style="height:85px; border-radius:8px; background:${pl.hex}; border:1px solid rgba(0,0,0,0.15); box-shadow:inset 0 1px 4px rgba(0,0,0,0.2); margin-bottom:10px; cursor:pointer" onclick="openShowroomSwatchModal('${pl.name}', 'SPC-RIGID', 'Luxury Vinyl Plank', '${pl.hex}', '100% Waterproof Rigid Core SPC with 20mil Commercial Wear Layer and Attached IXPE Underlayment pad.', '9 x 60 / 7 x 48 Planks', 'Flooring')"></div>
                <div style="font-weight:900; font-size:13px; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${pl.name}">${pl.name}</div>
                <div style="font-size:11.5px; font-weight:700; color:#64748b; margin-top:2px">20mil Wear Layer SPC</div>
              </div>
              <div style="display:flex; gap:6px; margin-top:10px">
                <button onclick="copyToClipboard('${pl.name}'); showToast('📋 Copied ${pl.name}!');" style="background:#ffffff; color:#334155; border:1px solid #cbd5e1; font-size:11px; font-weight:800; padding:4px 8px; border-radius:4px; cursor:pointer; flex:1">📋 Copy</button>
                <button onclick="openShowroomSwatchModal('${pl.name}', 'SPC-RIGID', 'Luxury Vinyl Plank', '${pl.hex}', '100% Waterproof Rigid Core SPC with 20mil Commercial Wear Layer and Attached IXPE Underlayment pad.', '9 x 60 / 7 x 48 Planks', 'Flooring')" style="background:#061a33; color:#fde047; border:0; font-size:11px; font-weight:900; padding:4px 8px; border-radius:4px; cursor:pointer; flex:1.2">🔍 View</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // SINK GRID (Pages 71-74)
  else if (page.type === 'sink_grid') {
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:26px; min-height:560px">
        <div style="border-bottom:3px solid #e11d48; padding-bottom:10px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center">
          <div>
            <div style="font-size:12px; font-weight:800; color:#e11d48; text-transform:uppercase; letter-spacing:0.1em">Section 10 • Kitchen & Bath Sinks</div>
            <h2 style="font-size:22px; font-weight:900; color:#0f172a; margin:4px 0">${page.title}</h2>
            <div style="font-size:13px; font-weight:700; color:#64748b">${page.subtitle}</div>
          </div>
          <span style="font-size:12px; font-weight:800; background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:6px">Page ${page.pageNum} of 77</span>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:14px">
          ${page.sinks.map(sk => `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 4px rgba(0,0,0,0.02)">
              <div>
                <div style="font-weight:900; font-size:14px; color:#0f172a; margin-bottom:4px">${sk.name}</div>
                <div style="font-size:12px; color:#64748b; line-height:1.45; margin-bottom:12px">${sk.spec}</div>
              </div>
              <div style="display:flex; gap:6px; border-top:1px solid #e2e8f0; padding-top:10px">
                <button onclick="copyToClipboard('${sk.name}'); showToast('📋 Copied ${sk.name}!');" style="background:#ffffff; color:#334155; border:1px solid #cbd5e1; font-size:11px; font-weight:800; padding:5px 8px; border-radius:4px; cursor:pointer; flex:1">📋 Copy Name</button>
                <button onclick="openShowroomSwatchModal('${sk.name}', 'SINK', 'Architectural Sink', '#94a3b8', '${sk.spec}', 'Undermount / Farmhouse installation with sound-dampening pads and strainer.', 'Sinks')" style="background:#061a33; color:#fde047; border:0; font-size:11px; font-weight:900; padding:5px 8px; border-radius:4px; cursor:pointer; flex:1.2">🔍 Inspect Spec</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // CONTRACTOR PROGRAM (Page 75)
  else if (page.type === 'contractor_program') {
    const c = page.content;
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:32px; min-height:560px">
        <div style="border-bottom:3px solid #e11d48; padding-bottom:10px; margin-bottom:20px">
          <div style="font-size:12px; font-weight:800; color:#e11d48; text-transform:uppercase; letter-spacing:0.1em">Section 11 • Dealer & Contractor Support</div>
          <h2 style="font-size:24px; font-weight:900; color:#0f172a; margin:4px 0">${page.title}</h2>
          <div style="font-size:13px; font-weight:700; color:#64748b">${page.subtitle}</div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:22px">
            <h3 style="font-size:17px; font-weight:900; color:#e11d48; margin:0 0 14px">${c.headline}</h3>
            <ul style="margin:0; padding-left:20px; font-size:13.5px; color:#334155; line-height:1.8">
              ${c.benefits.map(b => `<li>🔴 ${b}</li>`).join('')}
            </ul>
          </div>

          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:22px">
            <h3 style="font-size:17px; font-weight:900; color:#166534; margin:0 0 14px">WHO CAN JOIN?</h3>
            <p style="font-size:13.5px; color:#14532d; line-height:1.6; margin:0 0 16px">${c.whoCanJoin}</p>
            <div style="font-size:13px; font-weight:800; color:#166534">Direct Consultation: <strong style="color:#0f172a">${c.applyUrl}</strong></div>
          </div>
        </div>
      </div>
    `;
  }

  // REGIONAL SERVICE (Page 76)
  else if (page.type === 'regional_service') {
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:32px; min-height:560px">
        <div style="border-bottom:3px solid #e11d48; padding-bottom:10px; margin-bottom:24px">
          <div style="font-size:12px; font-weight:800; color:#e11d48; text-transform:uppercase; letter-spacing:0.1em">Section 12 • Regional Warehousing & Logistics</div>
          <h2 style="font-size:24px; font-weight:900; color:#0f172a; margin:4px 0">${page.title}</h2>
          <div style="font-size:13px; font-weight:700; color:#64748b">${page.subtitle}</div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:18px">
          ${page.regions.map(r => `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:26px; text-align:center">
              <h3 style="font-size:22px; font-weight:900; color:#e11d48; margin:0 0 8px">${r.state}</h3>
              <div style="font-size:22px; font-weight:900; color:#0f172a; margin-bottom:8px">📞 ${r.phone}</div>
              <div style="font-size:13.5px; color:#64748b; font-weight:700">${r.sub}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // BACK COVER (Page 77)
  else if (page.type === 'back_cover') {
    const c = page.content;
    pageInner = `
      <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:40px 30px; text-align:center; min-height:560px; display:flex; flex-direction:column; justify-content:space-between; background:linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)">
        <div>
          <div style="margin-bottom:24px">
            <h1 style="font-size:40px; font-weight:950; letter-spacing:0.06em; margin:0 0 4px; color:#111827">
              <span style="color:#e11d48">CABELLA</span> Collections
            </h1>
            <div style="width:90px; height:4px; background:#e11d48; margin:8px auto 0; border-radius:2px"></div>
          </div>

          <h2 style="font-size:24px; font-weight:900; color:#0f172a; margin:24px 0 10px">${c.tagline}</h2>
          <div style="font-size:16px; font-weight:800; color:#e11d48; margin-bottom:32px">${c.products}</div>

          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:22px; max-width:560px; margin:0 auto; box-shadow:0 4px 16px rgba(0,0,0,0.04)">
            <div style="font-size:16px; font-weight:900; color:#0f172a; margin-bottom:6px">${c.address}</div>
            <div style="font-size:18px; font-weight:900; color:#e11d48; margin-bottom:6px">📞 ${c.phone}</div>
            <div style="font-size:14px; font-weight:700; color:#0284c7">✉️ ${c.email}</div>
            <div style="font-size:14px; font-weight:700; color:#0284c7; margin-top:2px">🌐 ${c.website}</div>
          </div>
        </div>

        <div style="font-size:11.5px; color:#94a3b8; line-height:1.6; border-top:1px solid #e2e8f0; padding-top:18px; max-width:720px; margin:0 auto">
          ${c.disclaimer}
        </div>
      </div>
    `;
  }

  // Page Frame with official header & footer
  return `
    <div style="background:#ffffff; border:2px solid #e2e8f0; border-radius:12px; padding:18px; box-shadow:0 8px 30px rgba(0,0,0,0.06); position:relative">
      
      <!-- Top Running Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:8px; margin-bottom:14px; font-size:11.5px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em">
        <span><strong style="color:#e11d48">CABELLA</strong> COLLECTIONS • 2026 EDITION</span>
        <span>${pSec} • PAGE ${pNum}</span>
      </div>

      <!-- Main Page Content -->
      ${pageInner}

      <!-- Bottom Running Footer -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #f1f5f9; padding-top:10px; margin-top:16px; font-size:11px; font-weight:800; color:#64748b">
        <span>CABELLA CABINETS • STONE • FLOORING</span>
        <span>${pSec}</span>
        <span style="color:#e11d48; font-weight:900">PAGE ${pNum} / 77</span>
      </div>

    </div>
  `;
}

// --------------------------------------------------------------------------
// RENDER SPEC & PRODUCT SEARCH FINDER (CLIENT FACING)
// --------------------------------------------------------------------------
function renderCabellaCatalogSearchContent(pages) {
  const q = cabellaCatalogSearchQuery;
  const filter = cabellaCatalogFilterCategory;

  let allItems = [];

  pages.forEach(p => {
    if (p.swatches) {
      p.swatches.forEach(s => allItems.push({ type: 'Cabinet Door Swatch', name: s.name, code: s.code, desc: s.desc, page: p.pageNum, sec: p.section, cat: 'cabinets', hex: s.hex }));
    }
    if (p.items) {
      p.items.forEach(i => allItems.push({ type: 'Solid Wood Cabinet Series', name: i.name, code: i.code, desc: i.desc || i.finish, page: p.pageNum, sec: p.section, cat: 'cabinets', hex: i.hex }));
    }
    if (p.stones) {
      p.stones.forEach(st => allItems.push({ type: `${p.title}`, name: st.name, code: st.code || 'SLAB', desc: `Material: ${p.title}`, page: p.pageNum, sec: p.section, cat: 'stone', hex: st.base }));
    }
    if (p.planks) {
      p.planks.forEach(pl => allItems.push({ type: 'SPC Luxury Vinyl Flooring', name: pl.name, code: 'SPC-RIGID', desc: '100% Waterproof Rigid Core', page: p.pageNum, sec: p.section, cat: 'flooring', hex: pl.hex }));
    }
    if (p.sinks) {
      p.sinks.forEach(sk => allItems.push({ type: 'Kitchen & Bath Sink', name: sk.name, code: 'SINK', desc: sk.spec, page: p.pageNum, sec: p.section, cat: 'sinks', hex: '#cbd5e1' }));
    }
  });

  let filtered = allItems;
  if (filter !== 'all') {
    filtered = filtered.filter(it => it.cat === filter);
  }
  if (q) {
    filtered = filtered.filter(it => it.name.toLowerCase().includes(q) || (it.code && it.code.toLowerCase().includes(q)) || (it.desc && it.desc.toLowerCase().includes(q)) || it.type.toLowerCase().includes(q));
  }

  return `
    <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:22px">
      
      <!-- Search Input & Filters -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px">
        <div style="display:flex; gap:8px; flex-wrap:wrap">
          <button onclick="filterCabellaCategory('all')" style="padding:6px 14px; font-size:12px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${filter==='all'?'#061a33':'#fff'}; color:${filter==='all'?'#fff':'#334155'}">All Products (${allItems.length})</button>
          <button onclick="filterCabellaCategory('cabinets')" style="padding:6px 14px; font-size:12px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${filter==='cabinets'?'#061a33':'#fff'}; color:${filter==='cabinets'?'#fff':'#334155'}">🪵 Cabinets & Doors</button>
          <button onclick="filterCabellaCategory('stone')" style="padding:6px 14px; font-size:12px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${filter==='stone'?'#061a33':'#fff'}; color:${filter==='stone'?'#fff':'#334155'}">⛰️ Quartz & Natural Stone</button>
          <button onclick="filterCabellaCategory('flooring')" style="padding:6px 14px; font-size:12px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${filter==='flooring'?'#061a33':'#fff'}; color:${filter==='flooring'?'#fff':'#334155'}">🪴 SPC Flooring</button>
          <button onclick="filterCabellaCategory('sinks')" style="padding:6px 14px; font-size:12px; font-weight:800; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${filter==='sinks'?'#061a33':'#fff'}; color:${filter==='sinks'?'#fff':'#334155'}">🚰 Sinks & Hardware</button>
        </div>

        <div style="flex:1; min-width:240px; max-width:340px">
          <input type="text" placeholder="🔍 Search color, finish, code or style..." value="${q}" oninput="handleCabellaSearchInput(this.value)" style="width:100%; padding:8px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px">
        </div>
      </div>

      <div style="font-size:12.5px; font-weight:800; color:#64748b; margin-bottom:14px">
        Showing ${filtered.length} matching showroom items across all 77 catalog pages
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:14px; max-height:500px; overflow-y:auto; padding-right:4px">
        ${filtered.map(it => `
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 4px rgba(0,0,0,0.02)">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px">
                <span style="font-size:10.5px; font-weight:800; color:#0284c7; background:#e0f2fe; padding:2px 6px; border-radius:4px">${it.type}</span>
                <span onclick="setCabellaCatalogPage(${it.page})" style="font-size:11.5px; font-weight:800; color:#e11d48; cursor:pointer" title="View in 77-Page Booklet">Page ${it.page} ↗</span>
              </div>
              <div style="font-weight:900; font-size:14px; color:#0f172a; margin-bottom:2px">${it.name}</div>
              <div style="font-size:12px; color:#64748b; margin-bottom:12px">${it.desc}</div>
            </div>

            <div style="display:flex; gap:6px; border-top:1px solid #e2e8f0; padding-top:10px">
              <button onclick="copyToClipboard('${it.name}'); showToast('📋 Copied ${it.name}!');" style="background:#ffffff; color:#334155; border:1px solid #cbd5e1; font-size:11.5px; font-weight:800; padding:5px 8px; border-radius:4px; cursor:pointer; flex:1">📋 Copy</button>
              <button onclick="openShowroomSwatchModal('${it.name}', '${it.code}', '${it.type}', '${it.hex || '#cbd5e1'}', '${it.desc}', 'Refer to Page ${it.page} in the 2026 Cabella Product Catalog.', '${it.type}')" style="background:#061a33; color:#fde047; border:0; font-size:11.5px; font-weight:900; padding:5px 10px; border-radius:4px; cursor:pointer; flex:1.3">🔍 Inspect Spec</button>
            </div>
          </div>
        `).join('')}
      </div>

    </div>
  `;
}

// --------------------------------------------------------------------------
// RENDER 77-PAGE THUMBNAIL GALLERY
// --------------------------------------------------------------------------
function renderCabellaCatalogThumbnailGallery(pages) {
  return `
    <div style="background:#ffffff; border-radius:12px; border:1px solid #cbd5e1; padding:22px">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
        <div>
          <h3 style="margin:0; font-size:17px; font-weight:900; color:#0f172a">77-Page Visual Booklet Gallery</h3>
          <div style="font-size:12px; color:#64748b">Click any page thumbnail below to open and present it immediately</div>
        </div>
        <span style="font-size:12px; font-weight:800; background:#f1f5f9; padding:4px 10px; border-radius:6px">Total 77 Pages</span>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:12px; max-height:500px; overflow-y:auto; padding-right:4px">
        ${pages.map(p => `
          <div onclick="setCabellaCatalogPage(${p.pageNum})" style="background:#f8fafc; border:2px solid ${p.pageNum === cabellaCatalogCurrentPage ? '#e11d48' : '#e2e8f0'}; border-radius:8px; padding:10px; text-align:center; cursor:pointer; transition:all 0.15s" onmouseover="this.style.borderColor='#e11d48'" onmouseout="if(${p.pageNum} !== cabellaCatalogCurrentPage){ this.style.borderColor='#e2e8f0'; }">
            <div style="font-size:16px; margin-bottom:4px">
              ${p.pageNum<=3?'📕':(p.pageNum<=19?'🪵':(p.pageNum<=61?'⛰️':(p.pageNum<=69?'🪴':(p.pageNum<=74?'🚰':'🤝'))))}
            </div>
            <div style="font-size:13px; font-weight:900; color:#0f172a">Page ${p.pageNum}</div>
            <div style="font-size:10.5px; font-weight:800; color:#e11d48; text-transform:uppercase; margin-top:2px">${p.section}</div>
            <div style="font-size:10px; color:#64748b; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${p.title}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// SHOWROOM SWATCH & SPEC INSPECTION MODAL (CLIENT FACING)
// --------------------------------------------------------------------------
function openShowroomSwatchModal(name, code, finishType, colorHex, desc, structureSpec, category) {
  const swatchHtml = `
    <div style="display:flex; flex-direction:column; gap:16px; font-family:system-ui, sans-serif; color:#0f172a">
      
      <!-- Top Hero Swatch Card -->
      <div style="height:220px; border-radius:12px; background:${colorHex || '#1e293b'}; border:2px solid rgba(0,0,0,0.15); box-shadow:inset 0 4px 16px rgba(0,0,0,0.3); position:relative; display:flex; align-items:flex-end; padding:20px; overflow:hidden">
        <div style="background:rgba(0,0,0,0.8); backdrop-filter:blur(6px); color:#ffffff; padding:8px 16px; border-radius:8px; display:flex; align-items:center; justify-content:space-between; width:100%; box-shadow:0 4px 12px rgba(0,0,0,0.3)">
          <div>
            <div style="font-size:11px; font-weight:800; color:#fde047; text-transform:uppercase; letter-spacing:0.5px">Cabella Showroom Specimen</div>
            <div style="font-size:18px; font-weight:900">${name}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px; color:#cbd5e1">Item Code</div>
            <div style="font-size:14px; font-weight:900; color:#38bdf8">${code || 'STANDARD'}</div>
          </div>
        </div>
      </div>

      <!-- Spec Details Grid -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px">
          <div style="font-size:11.5px; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:6px">Finish & Style Classification</div>
          <div style="font-size:14px; font-weight:900; color:#0f172a">${finishType || name}</div>
          <p style="font-size:12.5px; color:#475569; margin:8px 0 0; line-height:1.5">${desc || 'Standard commercial and residential architectural specification.'}</p>
        </div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px">
          <div style="font-size:11.5px; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:6px">Construction / Dimensions</div>
          <div style="font-size:13.5px; font-weight:800; color:#0284c7">${structureSpec || 'Architectural grade'}</div>
          <div style="font-size:12px; color:#64748b; margin-top:6px">Category: <strong style="color:#0f172a">${category || 'In-House Material'}</strong></div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:14px; margin-top:4px">
        <button onclick="copyToClipboard('${name} (${code})'); showToast('📋 Copied ${name} to clipboard!');" style="background:#ffffff; color:#334155; border:1px solid #cbd5e1; font-size:12.5px; font-weight:800; padding:8px 16px; border-radius:6px; cursor:pointer">
          📋 Copy Finish Name & Code
        </button>
        <button onclick="closeShowroomSwatchModal()" style="background:#061a33; color:#ffffff; font-size:12.5px; font-weight:800; border:0; padding:8px 20px; border-radius:6px; cursor:pointer">
          Back to Catalog
        </button>
      </div>

    </div>
  `;

  const swatchContainer = document.createElement('div');
  swatchContainer.id = 'showroomSwatchOverlayModal';
  swatchContainer.style.position = 'fixed';
  swatchContainer.style.inset = '0';
  swatchContainer.style.background = 'rgba(15,23,42,0.75)';
  swatchContainer.style.backdropFilter = 'blur(4px)';
  swatchContainer.style.zIndex = '99999';
  swatchContainer.style.display = 'flex';
  swatchContainer.style.alignItems = 'center';
  swatchContainer.style.justifyContent = 'center';
  swatchContainer.style.padding = '20px';

  swatchContainer.innerHTML = `
    <div style="background:#ffffff; width:100%; max-width:620px; border-radius:14px; padding:24px; box-shadow:0 20px 40px rgba(0,0,0,0.3); border:1px solid #cbd5e1">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
        <h3 style="margin:0; font-size:16px; font-weight:900; color:#0f172a">Showroom Material Inspector</h3>
        <button onclick="closeShowroomSwatchModal()" style="background:transparent; border:0; font-size:22px; cursor:pointer; line-height:1">✕</button>
      </div>
      ${swatchHtml}
    </div>
  `;

  document.body.appendChild(swatchContainer);
}

function closeShowroomSwatchModal() {
  const modal = document.getElementById('showroomSwatchOverlayModal');
  if (modal) modal.remove();
}

// Safety fallbacks
if (typeof window.copyToClipboard !== 'function') {
  window.copyToClipboard = function(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  };
}

// Global hooks
window.openCabellaCatalogModal = openCabellaCatalogModal;
window.renderCabellaMasterCatalogModal = renderCabellaMasterCatalogModal;
window.setCabellaCatalogPage = setCabellaCatalogPage;
window.nextCabellaCatalogPage = nextCabellaCatalogPage;
window.prevCabellaCatalogPage = prevCabellaCatalogPage;
window.setCabellaCatalogViewMode = setCabellaCatalogViewMode;
window.handleCabellaSearchInput = handleCabellaSearchInput;
window.filterCabellaCategory = filterCabellaCategory;
window.openShowroomSwatchModal = openShowroomSwatchModal;
window.closeShowroomSwatchModal = closeShowroomSwatchModal;
