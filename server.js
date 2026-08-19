const http = require('http');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const ringcentral = require('./ringcentral');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const ROOT = __dirname;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.json': 'application/json; charset=utf-8'
};

const CABELLA_CORE_KNOWLEDGE = `
COMPANY PROFILE & OPERATIONS:
- Company Name: Cabella Cabinets Stone & Flooring, Las Vegas NV.
- Business Model: Wholesale & trade direct distributor of solid wood cabinetry, prefabricated quartz & natural stone countertops, waterproof SPC/LVP flooring, sinks, and hardware for general contractors, homebuilders, flippers, property managers, and remodelers.
- Main Phone: (702) 879-2549 | Showroom & Warehouse: Las Vegas, NV.

FOUNDERS & EXECUTIVE LEADERSHIP:
- Thomas "Tom" Eder (Co-Founder & Logistics/Fleet Partner):
  * Role: Co-Founder of Cabella Cabinets Stone & Flooring alongside Gil Sirimarco and Edwin Portillo. Also operates expedited fleet logistics and Hotshot jobsite delivery across the Vegas valley.
  * Contact: Ext. 102 / Main (702) 879-2549
- Gil Sirimarco (Chief Financial Officer / Owner / CFO / Co-Founder):
  * Email: gil@cabellacollections.com | Direct Phone: (702) 679-2715 | Ext. 101
  * Role: Oversees company finances, vendor quotes, executive approvals, merchant processing, billing/charging policies, QuickBooks, customer payment terms, and business operations.
- Edwin Portillo (Chief Executive Officer / CEO / Co-Founder):
  * Email: edwin@cabellacollections.com | Direct Phone: (702) 679-2070 | Ext. 103
  * Role: Leads company strategy, sales growth, major contractor trade relationships, and overall operations.

KEY STAFF DIRECTORY & CONTACTS:
- Alexis Rivera (Purchaser & JIT Procurement Specialist):
  * Email: purchasing@cabellacollections.com | Phone: (702) 679-2810 | Ext. 108
- Jerry Maza (Head Project Manager):
  * Email: jerry@cabellacollections.com | Phone: (702) 679-2239 | Ext 104
- Mayra Rodriguez (Orders Coordinator & Logistics Desk):
  * Email: orders@cabellacollections.com | Main: (702) 879-2549 | Ext. 106
- Margie Caro (Project Manager & Sales):
  * Email: pm@cabellacollections.com | Phone: (725) 255-2835 | Ext. 107
- Jesus "Chuy" (Warehouse Manager & Logistics Lead):
  * Email: inbox@cabellacollections.com | Phone: (702) 555-0144 / (702) 879-2549 | Warehouse Dock 1

WHAT DOES CABELLA SELL & SUPPLY? (FULL PRODUCT CATALOG):
1. RTA & Pre-Assembled Solid Wood Cabinets & Vanities:
   - Cabinet lines: Framed Shaker and Euro Frameless flat panel.
   - Popular colors/finishes: White Shaker, Navy Blue Shaker, Light Grey (LDG/SLG), Charcoal/Dark Grey, Espresso, Natural White Oak, Antique White, Forest Green, Black.
   - Sizes & Configurations: Full 42" upper wall cabinets (Grandwood/Central), 40" uppers (HomeCo), 30" & 36" uppers, base cabinets (9" to 36"), drawer bases, lazy susans, diagonal corner wall cabinets, tall pantry towers, oven cabinets, refrigerator end panels (24"x96"), base & wall skin panels, dishwasher return panels, trash pullouts, spice racks, roll-out trays, and bathroom vanity suites (24" to 72").
   - Moldings & Trim: Scribe molding, outside corner molding (OCM), crown molding, light rail molding, toe kick boards, filler strips.
2. Prefabricated Quartz, Granite & Porcelain Countertops:
   - Standard Prefab Sizes: 26" x 110" counter slabs, 36" x 110", 42" x 110", and 52" x 110" kitchen island slabs (with 1.5" laminated eased/bullnose edge profile & matching 6" backsplash).
   - Varieties: Calacatta Gold, Calacatta Laza, Calacatta Ultra, Statuario, Pure White, Sparkling White, Sparkling Grey, Taj Mahal Quartzite, Nero Marquina, and Porcelain jumbo slabs.
3. 100% Waterproof SPC Rigid Core & LVP Flooring:
   - Thicknesses: 5.5mm, 6.0mm, 7.0mm, and 8.0mm SPC with pre-attached IXPE acoustic padding.
   - Wear Layers: 20mil heavy commercial wear layer with UV ceramic bead coating.
   - Accessories: Flush and overlapping stair noses, T-moldings, reducers, end caps, and quarter rounds.
4. Sinks, Faucets & Hardware:
   - Undermount kitchen sinks: 16-gauge and 18-gauge heavy-duty SUS304 stainless steel (single bowl 30"/32", double 50/50 and 60/40 bowl) and workstation sinks with bottom grids and cutting boards.
   - Vanity bowls: White ceramic/porcelain undermount rectangular and oval sinks.
   - Hardware: Soft-close 6-way adjustable DTC European concealed hinges, full extension soft-close undermount ball-bearing drawer slides, stainless steel bar pulls (Matte Black, Brushed Brass/Gold, Satin Nickel).

HOW TO CHARGE A CLIENT & PAYMENT WORKFLOW (STEP-BY-STEP):
1. Step 1 - Calculate the Customer Price:
   - Confirm customer pricing tier:
     * Tier 1 / Select (+18% / 1.18x multiplier): High-volume repeat homebuilders and framing/licensed contractors.
     * Tier 2 / Plus (+28% / 1.28x multiplier): Consistent remodelers, house flippers, property managers.
     * Tier 3 / Premier (+38% / 1.38x multiplier): Walk-in trade, custom one-off clients.
2. Step 2 - Collect Payment or Deposit:
   - Deposit Requirement: Minimum 50% deposit required before any purchase orders are released to vendors. 100% paid in full prior to release from Cabella warehouse or truck delivery.
   - Accepted Payment Methods & Rules:
     * Credit Card (Visa, MasterCard, Amex, Discover): Process via the Cabella Virtual Terminal or QuickBooks Online payment link. NOTE: A 3.0% merchant surcharge is automatically applied to all credit card transactions.
     * ACH / Bank Transfer: Process via QuickBooks Online Invoicing. (0% surcharge, $0 fee).
     * Company Check / Cashier's Check / Wire: (0% surcharge). Give physical checks to Gil Sirimarco (CFO / Ext. 101) for immediate deposit and QBO posting.
     * 30-Day Net Terms: Only permitted for pre-approved builder accounts with an active credit agreement signed by Gil Sirimarco (CFO).
3. Step 3 - Record in QuickBooks & Send Receipt:
   - Generate invoice in QuickBooks Online (QBO).
   - Apply payment/deposit to the open invoice.
   - Email paid receipt to customer and forward order confirmation to orders@cabellacollections.com (Mayra Rodriguez).

VENDOR DIRECTORY & PRIMARY SUPPLIER CONTACTS:
- Grandwood Cabinetry LLC (Rancho Cucamonga, CA):
  * Primary Contacts We Speak To: Jerry (Direct Phone: (626) 620-0633) & Gary (Direct Phone: (616) 632-5084)
  * Email / Orders: garyyin82@gmail.com / orders@gwcabinetryllc.com
  * Main Office Phone: (626) 632-5084 / (909) 816-7905
  * Address: 9190 Hyssop Dr, Rancho Cucamonga, CA 91730
  * Website: http://www.gwcabinetryllc.com/products.html
  * Payment / Terms: Zelle to garyyin82@gmail.com
  * Products & Rules: Full 42" upper cabinets in stock, Navy Blue Shaker, White Shaker, 7mm SPC flooring ($1.55/sqft). Friday 5:00 PM PST cutoff for Tuesday 7:00 AM delivery.
- HomeCo / HC Stone (El Monte, CA):
  * Primary Contact: Erik (Direct Phone: (626) 745-9827 | Email: erik@homecoonline.com / homecoonline@gmail.com)
  * Main Phone: (626) 448-8889
  * Address: 3160 Rosemead Blvd, El Monte, CA 91731
  * Rules: Only sells 40" tall uppers (does not make 42"). Calacatta quartz countertops, $1.12/sqft LVP. Paid every 15 days on account.
- Central Cabinets Direct (Las Vegas, NV):
  * Primary Contact: Ryan (Direct Phone: (702) 860-2443 | Office: (702) 998-9000 | Email: ryan@centralcabinetsdirect.com)
  * Address: 6630 Arroyo Springs St, Ste 300, Las Vegas, NV 89113 (Local Las Vegas Stock)
- Galaxy Flooring & Cabinets (Las Vegas, NV & Walnut, CA):
  * Primary Contact: Kimberly (Phone: (702) 550-2888 / (626) 424-1888 | Email: sales@galaxycustoms.com / galaxyconstruction19844@gmail.com)
- Achilles Stone / Quartz (Las Vegas & Ontario, CA):
  * Primary Contact: Maria - Office Manager (Phone: (702) 901-4400 / 951-232-5207 | Email: orders@achillesstone.com)
- Raphael Stone Collection (Las Vegas & Los Angeles):
  * Primary Contacts: David (Shalom) & Tanya (Phone: (702) 555-0133 / (702) 556-6750 | Email: orders@raphaelstoneusa.com)

PURCHASE ORDER (PO / ePO) WORKFLOW & ROUTING:
- Question: "After I make a purchase order where do I send it?" or "Do I send the ePO to the vendor?"
- Answer:
  1. SEND TO VENDOR: Yes! Dispatch the electronic Purchase Order (ePO) directly to the manufacturer/supplier representative (e.g. Grandwood, HomeCo, Central Cabinets, MSI, Galaxy) via the built-in Gmail Vendor Quote & PO Composer or through the vendor's dealer order portal. This reserves the inventory and locks in wholesale pricing.
  2. INTERNAL ROUTING: Send a copy to the Orders Desk (orders@cabellacollections.com / Mayra Rodriguez) and Purchasing (purchasing@cabellacollections.com / Alexis Rivera) so it is logged in QuickBooks and tracking.
  3. LOGISTICS / WAREHOUSE: If inbound freight is required from Southern California manufacturers, notify Chuy for truck space before the strict Friday 5:00 PM PST cutoff.

CALIFORNIA TRUCK LOGISTICS SCHEDULE:
- Order Lock Cutoff: Strict Friday 5:00 PM PST deadline for all Southern California manufacturer POs (Grandwood & HomeCo).
- Inbound Arrival: Loaded Monday, arrives Tuesday 7:00 AM at Las Vegas Dock 1.
- Warehouse Lead & Driver: Chuy (702-555-0144).

WAREHOUSE RECEIVING PROTOCOL (DOCK 1):
1. 100% physical count of boxes against vendor packing slip before releasing carrier.
2. Inspect pallet corners for forklift puncture damage or pallet crush.
3. Take minimum 2 timestamped photos on Dock 1.
4. Complete inspection sign-off in the Inbound PO Receiving tool.

SATURDAY TRUCK DELIVERIES & INBOUND DISPATCH MANIFEST (DATE: AUGUST 15, 2026):
Summary: 21 Total Stops / POs arrived and delivered to Cabella Las Vegas Dock 1 across 3 carriers (13 on ALL IN, 7 on Chavez, 1 on Tom Eder's Hotshot). All orders have been inspected, checked in, and assigned to warehouse staging bins.

1. ALL IN Transport (Driver: ALL IN Dispatch, Phone: (626) 555-0199, 53ft Freight Carrier) - 13 Stops / POs Delivered & Checked In:
   - Stop 1: HomeCo · PO #3188 (Vendor Inv #142205) · Standard pickup · Status: Delivered & Checked In
   - Stop 2: Grandwood · PO #3190 · White Shaker Cabinet Boxes · Status: Delivered & Staged in Bin A-02
   - Stop 3: Impress · PO #3150 (Vendor Inv #22066) · Order 1 of 4 · Status: Delivered & Checked In
   - Stop 4: Impress · PO #3151 (Vendor Inv #22085) · Order 2 of 4 · Status: Delivered & Checked In
   - Stop 5: Impress · PO #3165 (Vendor Inv #22111) · Order 3 of 4 · Status: Delivered & Checked In
   - Stop 6: Grandwood · PO #3186 · Cabinet Order · Status: Delivered & Checked In
   - Stop 7: HomeCo · PO #3194 · 5 Prefab Countertop Stones · Status: Delivered & Checked In
   - Stop 8: Impress · PO #3197 · Order 4 of 4 · Status: Delivered & Checked In
   - Stop 9: Grandwood · PO #3198 · Cabinet Accessories & Trim · Status: Delivered & Checked In
   - Stop 10: Grandwood · PO #3199 (Customer Inv #8419) · Status: Delivered & Checked In
   - Stop 11: Grandwood · PO #3200 (Customer Inv #8445) · Status: Delivered & Checked In
   - Stop 12: Evergreen · PO #3202 · Evergreen Cabinets package · Status: Delivered & Checked In
   - Stop 13: Achilles · PO #3204 · 1 Prefab Quartz Countertop Slab · Status: Delivered & Checked In

2. Chavez Delivery (Driver: Juan Chavez, Phone: (702) 555-0188, Flatbed / Freight Truck) - 7 Stops / POs Delivered & Checked In:
   - Stop 1: Duko · PO #3192 (Vendor Inv #166472) · Duko Kitchen & Bath · Status: Delivered & Checked In
   - Stop 2: Elite · PO #3187 · Elite Stone pickup · Status: Delivered & Checked In
   - Stop 3: Evergreen · PO #3193 · Cabinet boxes · Status: Delivered & Checked In
   - Stop 4: Sandp (S&P) · PO #3195 · S&P Cabinet Hardware/Parts · Status: Delivered & Checked In
   - Stop 5: Elite · PO #3196 · 4 Prefab Stone Countertops · Status: Delivered & Checked In
   - Stop 6: Duko · PO #3201 · Duko Vanity & Bases · Status: Delivered & Checked In
   - Stop 7: HomeCo · PO #3203 · 4 Prefab Quartz Stones · Status: Delivered & Checked In

3. Tom's Vehicle (Driver: Tom Eder - Co-Founder & Hotshot Dispatch) - 1 Urgent Stop Delivered & Checked In:
   - Stop 1: Central Cabinets Direct · PO #3209 (Vendor Inv #CCD-9921, Customer Inv #8450) · 2 Base Cabs (B36 & DB24 White Shaker) · Status: Checked In & Staged in Bin B-04
`;

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', d => {
      b += d;
      if (b.length > 1e6) req.destroy();
    });
    req.on('end', () => resolve(b));
    req.on('error', reject);
  });
}

async function askGemini(question, context) {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  const system = `You are Cabella AI Assistant & Operations Knowledge Engine for Cabella Cabinets Stone & Flooring in Las Vegas, NV.
Your primary role is to give direct, accurate, professional, plain-English answers to Cabella employees, project managers, and executives.

Follow these strict rules:
1. Always give specific, directly helpful answers based on Cabella company procedures and staff directory.
2. For PO / ePO questions: Explain clearly where to send the PO (send directly to vendor rep/portal to confirm inventory, forward copy to Orders Desk Mayra Rodriguez/Alexis Rivera, and log for Chuy's Friday 5 PM CA freight cutoff).
3. For contacting Gil (CFO): State Gil Sirimarco's email (gil@cabellacollections.com), extension (Ext. 101), phone ((702) 679-2715), and role.
4. Keep the answer structured with clear bullet points or short paragraphs, actionable, and free of vague filler.

CABELLA OPERATIONAL DATABASE:
${CABELLA_CORE_KNOWLEDGE}
`;
  const input = `QUESTION:\n${question}\n\nADDITIONAL CONTEXT:\n${JSON.stringify(context || {})}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `${system}\n\n${input}`
  });

  const answer = response.text || '';
  return { title: 'Cabella Operations Knowledge', answer, source: 'cabella' };
}

async function askOpenAI(question, context) {
  const system = `You are Cabella AI Assistant & Operations Knowledge Engine for Cabella Cabinets Stone & Flooring in Las Vegas, NV.
Always give direct, specific, accurate answers based on Cabella company procedures, contacts, and pricing rules.

CABELLA OPERATIONAL DATABASE:
${CABELLA_CORE_KNOWLEDGE}
`;
  const input = `QUESTION:\n${question}\n\nADDITIONAL CONTEXT:\n${JSON.stringify(context || {})}`;
  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, instructions: system, input, max_output_tokens: 700 })
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const answer = j.output_text || '';
  return { title: 'Cabella Operations Knowledge', answer, source: 'cabella' };
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (u.pathname === '/api/status') {
      return send(res, 200, JSON.stringify({ openai: Boolean(OPENAI_API_KEY || GEMINI_API_KEY), model: GEMINI_API_KEY ? 'gemini-3.6-flash' : MODEL }));
    }
    // RingCentral Integration Endpoints
    if (u.pathname === '/api/integrations/ringcentral/connect' && req.method === 'GET') {
      return await ringcentral.handleConnect(req, res);
    }
    if (u.pathname === '/api/integrations/ringcentral/callback' && req.method === 'GET') {
      return await ringcentral.handleCallback(req, res);
    }
    if (u.pathname === '/api/integrations/ringcentral/status' && req.method === 'GET') {
      return await ringcentral.handleStatus(req, res);
    }
    if (u.pathname === '/api/integrations/ringcentral/disconnect' && req.method === 'POST') {
      return await ringcentral.handleDisconnect(req, res);
    }
    if (u.pathname === '/api/ask' && req.method === 'POST') {
      if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
        return send(res, 503, JSON.stringify({ error: 'Neither GEMINI_API_KEY nor OPENAI_API_KEY is configured' }));
      }
      const data = JSON.parse(await readBody(req) || '{}');
      const q = String(data.question || '');
      const ctx = data.context || {};
      const out = GEMINI_API_KEY ? await askGemini(q, ctx) : await askOpenAI(q, ctx);
      return send(res, 200, JSON.stringify(out));
    }
    let file = u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname.slice(1));
    file = path.normalize(file).replace(/^([.][.][/\\])+/, '');
    let full = path.join(ROOT, file);
    if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
      // SPA Fallback: if non-file path, fall back to index.html
      full = path.join(ROOT, 'index.html');
      if (!fs.existsSync(full)) {
        return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
      }
    }
    send(res, 200, fs.readFileSync(full), mime[path.extname(full).toLowerCase()] || 'text/html; charset=utf-8');
  } catch (e) {
    send(res, 500, JSON.stringify({ error: e.message }));
  }
});

server.listen(PORT, HOST, () => console.log(`CSE running at http://${HOST}:${PORT}`));
