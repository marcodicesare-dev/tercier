const PptxGenJs = require("pptxgenjs");
const pres = new PptxGenJs();
pres.layout = "LAYOUT_16x9";

// ── Design tokens (from backup PDF) ──
const C = {
  bg:      "0A0E1A",  // dark navy main
  bg2:     "0C1220",  // slightly lighter alt
  card:    "111D30",  // card background
  gold:    "E8A84C",  // accent gold
  white:   "FFFFFF",
  body:    "B0C0D0",  // light gray-blue body text
  muted:   "6A7A8A",  // muted gray
  green:   "2ECC71",  // positive numbers
  red:     "E74C3C",  // negative numbers / alerts
  teal:    "1ABC9C",  // teal accent
  cyan:    "3498DB",  // cyan accent
  purple:  "9B59B6",  // purple accent
  pink:    "E8567F",  // pink accent
  orange:  "E67E22",  // orange accent
  yellow:  "F1C40F",  // yellow accent
  dkGreen: "27AE60",
};

// Helper: dark slide background + gold bar on right
function darkSlide() {
  const s = pres.addSlide();
  s.background = { color: C.bg };
  // Gold accent bar right edge
  s.addShape(pres.ShapeType.rect, { x: 9.92, y: 0, w: 0.08, h: 5.625, fill: { color: C.gold } });
  return s;
}

// Helper: slide title with gold underline
function slideTitle(s, text, opts = {}) {
  const y = opts.y || 0.25;
  s.addText(text, {
    x: 0.5, y, w: 9, h: 0.6, fontSize: 32, fontFace: "Georgia",
    bold: true, color: C.white, margin: 0,
  });
  s.addShape(pres.ShapeType.rect, {
    x: 0.5, y: y + 0.62, w: 1.2, h: 0.04, fill: { color: C.gold }
  });
}

// Helper: card with colored top accent
function card(s, x, y, w, h, topColor) {
  s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: C.card } });
  if (topColor) {
    s.addShape(pres.ShapeType.rect, { x, y, w, h: 0.04, fill: { color: topColor } });
  }
}

// Helper: section header (colored uppercase)
function sectionHead(s, x, y, text, color) {
  s.addText(text, {
    x, y, w: 4, h: 0.3, fontSize: 10, fontFace: "Calibri",
    bold: true, color: color || C.gold, margin: 0,
  });
}

// ══════════════════════════════════════════════════
// SLIDE 1: Title
// ══════════════════════════════════════════════════
const s1 = pres.addSlide();
s1.background = { color: C.bg };
s1.addShape(pres.ShapeType.rect, { x: 9.92, y: 0, w: 0.08, h: 5.625, fill: { color: C.gold } });

s1.addText("T E R C I E R", {
  x: 0.6, y: 1.0, w: 8, h: 1.2, fontSize: 54, fontFace: "Georgia",
  bold: true, color: C.white, margin: 0,
});
s1.addText("Vertical AI for premium hospitality", {
  x: 0.6, y: 2.2, w: 8, h: 0.5, fontSize: 20, fontFace: "Georgia",
  italic: true, color: C.gold, margin: 0,
});
s1.addText("tercier.ai  |  March 22, 2026  |  Marco Di Cesare, Founder", {
  x: 0.6, y: 4.6, w: 8, h: 0.4, fontSize: 12, fontFace: "Calibri",
  color: C.muted, margin: 0, bold: true,
});

// ══════════════════════════════════════════════════
// SLIDE 2: What got built in 9 days
// ══════════════════════════════════════════════════
const s2 = darkSlide();
s2.addText("What got built in 9 days", {
  x: 0.5, y: 0.2, w: 9, h: 0.6, fontSize: 32, fontFace: "Georgia",
  bold: true, color: C.white, margin: 0,
});
s2.addText("March 10: founding call. March 19: all of this exists.", {
  x: 0.5, y: 0.8, w: 9, h: 0.3, fontSize: 12, fontFace: "Calibri",
  color: C.body, margin: 0,
});

const sections = [
  { title: "DATA PIPELINE", color: C.red, x: 0.5, y: 1.25, items: [
    "2,069 HotellerieSuisse member rows scraped",
    "718 dossiers selected + enriched with external data",
    "272 ICP hotels filtered (4-5★, ADR ≥ CHF 250)",
    "148 named GMs identified, 99% contact emails",
  ]},
  { title: "SYNTHETIC BUYER SURVEY", color: C.red, x: 0.5, y: 2.75, items: [
    "1,632 interview simulations (272 hotels × 2 roles × 3 reps)",
    "Adversarial critique + judge normalization",
    "Pricing curves, proof-package rankings extracted",
    "37% avg buy likelihood at CHF 3,000/mo",
  ]},
  { title: "FINANCIAL MODELING", color: C.red, x: 0.5, y: 4.15, items: [
    "Monte Carlo: 10,000 sims, two non-VC scenarios",
    "Month-by-month cash flow projection",
    "Breakeven analysis: 5-7 hotels",       // ← CORRECTED from 5-6
    "Exit valuation model (separate global-expansion lens)",
  ]},
  { title: "MARKET & COMPETITIVE", color: C.teal, x: 5.1, y: 1.25, items: [
    "Global TAM / European SAM / Swiss beachhead sized",
    "Competitive landscape: Mews, Canary, Lighthouse, TrustYou",
    "Current pricing + funding on all major players",
    "Top 10 target hotels ranked by buy likelihood",
  ]},
  { title: "CORPORATE & LEGAL", color: C.teal, x: 5.1, y: 2.75, items: [
    "AG in Zug structure (11.8% tax vs 19.6% Zurich)",
    "Cap table framework designed",
    "Tranche structure: 3-stage milestone-based",
    "tercier.ai secured, tercier.com available (CHF 1,200)",
  ]},
  { title: "DELIVERABLES", color: C.teal, x: 5.1, y: 4.15, items: [
    "Business plan v1 → v4 in 5 days",
    "Product one-pager",
    "This pitch deck + interactive financial simulator",
    "2,295 commits, 6 repos, 82 days — one person",
  ]},
];

sections.forEach(sec => {
  sectionHead(s2, sec.x, sec.y, sec.title, sec.color);
  const bullets = sec.items.map((t, i) => ({
    text: t, options: { bullet: true, breakLine: i < sec.items.length - 1, fontSize: 10, fontFace: "Calibri", color: C.body }
  }));
  s2.addText(bullets, { x: sec.x, y: sec.y + 0.25, w: 4.3, h: 1.2, margin: 0, valign: "top" });
});

// ══════════════════════════════════════════════════
// SLIDE 3: Context
// ══════════════════════════════════════════════════
const s3 = darkSlide();
slideTitle(s3, "Context");
s3.addText("You called on March 10. Nine days later, this exists:", {
  x: 0.5, y: 1.0, w: 9, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.body, margin: 0,
});

// Pipeline boxes
const pipe = [
  { n: "2,069", label: "HotellerieSuisse\nrows scraped" },
  { n: "718", label: "dossiers\nselected" },
  { n: "272", label: "ICP hotels\n4-5★, ADR ≥ 250" },
  { n: "1,632", label: "synthetic\ninterviews" },
];
pipe.forEach((p, i) => {
  const px = 0.5 + i * 2.35;
  card(s3, px, 1.5, 2.0, 1.1, C.teal);
  s3.addText(p.n, { x: px, y: 1.55, w: 2.0, h: 0.5, fontSize: 28, fontFace: "Consolas",
    bold: true, color: i >= 2 ? C.gold : C.white, align: "center", margin: 0 });
  s3.addText(p.label, { x: px, y: 2.05, w: 2.0, h: 0.5, fontSize: 10, fontFace: "Calibri",
    color: C.muted, align: "center", margin: 0 });
  if (i < 3) {
    s3.addText("→", { x: px + 2.0, y: 1.7, w: 0.35, h: 0.3, fontSize: 16,
      color: C.muted, align: "center", margin: 0 });
  }
});

const contextBullets = [
  "Monte Carlo financial model: 10,000 simulations, two scenarios, no VC",
  "Competitive analysis with current pricing, funding, and category moves",
  "Corporate structure: AG in Zug, 11.8% corporate tax",
  "tercier.ai secured, tercier.com available (CHF 1,200)",
  "2,295 commits across 6 repositories in 82 days — one person",
];
const cBullets = contextBullets.map((t, i) => ({
  text: t, options: { bullet: true, breakLine: i < contextBullets.length - 1, fontSize: 12, fontFace: "Calibri", color: C.body }
}));
s3.addText(cBullets, { x: 0.5, y: 2.9, w: 9, h: 2.2, margin: 0, valign: "top" });

// ══════════════════════════════════════════════════
// SLIDE 4: The problem
// ══════════════════════════════════════════════════
const s4 = darkSlide();
slideTitle(s4, "The problem");

s4.addText([
  { text: "A premium hotel doing EUR 15-70M in revenue has a marketing team of one person who speaks two languages.", options: { bold: true, fontSize: 14, color: C.white, breakLine: true } },
  { text: "", options: { breakLine: true, fontSize: 8 } },
  { text: "That person handles everything from Instagram to the TV welcome screen. Agencies deliver generic content for EUR 3-8K/month that reads the same for every property.", options: { fontSize: 12, color: C.body, breakLine: true } },
  { text: "", options: { breakLine: true, fontSize: 8 } },
  { text: "Meanwhile, 37% of travelers now use AI to plan trips (BCG/NYU, March 2026). 55% of hotel citations in AI answers come from OTAs — not from the hotel itself.", options: { fontSize: 12, color: C.body, breakLine: true } },
  { text: "", options: { breakLine: true, fontSize: 8 } },
  { text: "The hotel is losing control of its own story at exactly the moment travelers are making decisions.", options: { italic: true, fontSize: 13, color: C.red, breakLine: false } },
], { x: 0.5, y: 1.1, w: 5.0, h: 3.8, margin: 0, valign: "top" });

// Stat cards right side
const stats4 = [
  { big: "37%", label: "of travelers use AI\nto plan trips", src: "BCG/NYU 2026", color: C.gold },
  { big: "55%", label: "of AI hotel citations\ncome from OTAs", src: "Cloudbeds", color: C.green },
  { big: "1", label: "marketing person\nper EUR 15-70M hotel", src: "Industry avg", color: C.white },
];
stats4.forEach((st, i) => {
  const sy = 1.1 + i * 1.35;
  card(s4, 6.0, sy, 3.5, 1.15, null);
  s4.addText(st.big, { x: 6.1, y: sy + 0.1, w: 1.3, h: 0.7, fontSize: 36, fontFace: "Consolas",
    bold: true, color: st.color, margin: 0, valign: "middle" });
  s4.addText(st.label, { x: 7.4, y: sy + 0.1, w: 2.0, h: 0.5, fontSize: 12, fontFace: "Calibri",
    bold: true, color: C.white, margin: 0 });
  s4.addText(st.src, { x: 7.4, y: sy + 0.65, w: 2.0, h: 0.3, fontSize: 9, fontFace: "Calibri",
    color: C.muted, margin: 0 });
});

// ══════════════════════════════════════════════════
// SLIDE 5: The opportunity
// ══════════════════════════════════════════════════
const s5 = darkSlide();
slideTitle(s5, "The opportunity");
s5.addText("No vertical AI platform exists for premium hospitality. Generic tools handle pieces — reviews, pricing, content — but nobody orchestrates the full commercial picture for a single property.", {
  x: 0.5, y: 1.0, w: 9, h: 0.6, fontSize: 12, fontFace: "Calibri", color: C.body, margin: 0,
});

const mktRows = [
  { label: "Global TAM", bar: "55-75K hotels", val: "EUR 1.3–2.7B", w: 8.5 },
  { label: "European SAM", bar: "6-8K hotels", val: "EUR 144–288M", w: 5.5 },
  { label: "Swiss beachhead", bar: "272 ICP hotels", val: "EUR 9.8M", w: 3.0 },
];
mktRows.forEach((r, i) => {
  const ry = 1.85 + i * 1.05;
  s5.addText(r.label, { x: 0.5, y: ry, w: 2.0, h: 0.5, fontSize: 12, fontFace: "Calibri",
    color: C.muted, margin: 0, valign: "middle" });
  // Bar
  s5.addShape(pres.ShapeType.rect, { x: 2.5, y: ry + 0.05, w: r.w, h: 0.45, fill: { color: C.card } });
  s5.addShape(pres.ShapeType.rect, { x: 2.5, y: ry + 0.05, w: r.w, h: 0.04, fill: { color: C.teal } });
  s5.addText(r.bar, { x: 2.6, y: ry + 0.05, w: 3, h: 0.45, fontSize: 12, fontFace: "Calibri",
    bold: true, color: C.white, margin: 0, valign: "middle" });
  s5.addText(r.val, { x: 2.5 + r.w - 3, y: ry + 0.05, w: 2.9, h: 0.45, fontSize: 14,
    fontFace: "Consolas", bold: true, color: C.gold, align: "right", margin: [0, 8, 0, 0], valign: "middle" });
});

// Expansion path box
card(s5, 0.5, 4.35, 9.0, 0.9, C.gold);
s5.addText("Expansion path", { x: 0.7, y: 4.4, w: 3, h: 0.3, fontSize: 11, fontFace: "Calibri",
  bold: true, color: C.gold, margin: 0 });
s5.addText("Start in Switzerland — dense, multilingual, reachable. By M18: Northern Italy + DACH. By M36: 115-154 hotels across the region. The Swiss beachhead is where we prove it. Europe is where we grow it.", {
  x: 0.7, y: 4.7, w: 8.5, h: 0.45, fontSize: 11, fontFace: "Calibri", color: C.body, margin: 0,
});

// ══════════════════════════════════════════════════
// SLIDE 6: What Tercier does: 7-layer AI stack
// ══════════════════════════════════════════════════
const s6 = darkSlide();
slideTitle(s6, "What Tercier does: the 7-layer AI stack");

const layers = [
  { n: "1", name: "Market Intelligence", desc: "Comp set pricing, events, booking windows", color: C.dkGreen },
  { n: "2", name: "Voice of Customer", desc: "Reviews across 6 languages, 4 platforms", color: C.teal },
  { n: "3", name: "Persona & Intent", desc: "Who books, why, what they expect", color: C.cyan },
  { n: "4", name: "Competitive Reading", desc: "Your hotel vs. comp set, through guest eyes", color: C.yellow },
  { n: "5", name: "AI Discovery", desc: "How ChatGPT / Gemini / Perplexity see you", color: C.orange },
  { n: "6", name: "Decision Engine", desc: "What matters this month, ranked by priority", color: C.pink },
  { n: "7", name: "Content Engine", desc: "Pages, campaigns, multilingual assets — ready to publish", color: C.purple },
];
layers.forEach((l, i) => {
  const ly = 1.15 + i * 0.58;
  // Number box
  s6.addShape(pres.ShapeType.rect, { x: 0.5, y: ly, w: 0.45, h: 0.42, fill: { color: l.color } });
  s6.addText(l.n, { x: 0.5, y: ly, w: 0.45, h: 0.42, fontSize: 14, fontFace: "Calibri",
    bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
  // Name
  s6.addText(l.name, { x: 1.15, y: ly, w: 3.0, h: 0.42, fontSize: 14, fontFace: "Calibri",
    bold: true, color: C.white, valign: "middle", margin: 0 });
  // Desc
  s6.addText(l.desc, { x: 4.3, y: ly, w: 5.2, h: 0.42, fontSize: 12, fontFace: "Calibri",
    color: C.body, valign: "middle", margin: 0 });
});

s6.addText("The AI reads, analyzes, decides, drafts. The human reviews, adjusts, approves, publishes.", {
  x: 0.5, y: 5.1, w: 9, h: 0.3, fontSize: 11, fontFace: "Georgia", italic: true,
  color: C.gold, align: "center", margin: 0,
});

// ══════════════════════════════════════════════════
// SLIDE 7: How the sale works
// ══════════════════════════════════════════════════
const s7 = darkSlide();
slideTitle(s7, "How the sale works");
s7.addText("We don't show dashboards. We show the hotel its own website through the eyes of its most valuable guest — side by side with the competitor that's beating them for that guest.", {
  x: 0.5, y: 1.0, w: 9, h: 0.6, fontSize: 12, fontFace: "Calibri", color: C.body, margin: 0,
});

const saleCards = [
  { title: "Pick the guest", color: C.teal, desc: "German business traveler.\nChinese honeymooner.\nItalian family." },
  { title: "Show the gap", color: C.dkGreen, desc: "Where they under-explain what that guest cares about. Where the competitor is clearer. Which proof points from their own reviews they're not using." },
  { title: "That's the moment", color: C.pink, desc: "She sees her hotel has no Chinese content. The competitor does. She leans forward.\n15 minutes. If she doesn't see something new, we stop." },
];
saleCards.forEach((sc, i) => {
  const sx = 0.5 + i * 3.15;
  card(s7, sx, 1.75, 2.85, 2.3, sc.color);
  s7.addText(sc.title, { x: sx + 0.15, y: 1.9, w: 2.55, h: 0.35, fontSize: 14, fontFace: "Calibri",
    bold: true, color: sc.color, margin: 0 });
  s7.addText(sc.desc, { x: sx + 0.15, y: 2.35, w: 2.55, h: 1.5, fontSize: 11, fontFace: "Calibri",
    color: C.body, margin: 0, valign: "top" });
});

s7.addText('"We show you your hotel through your guest\'s eyes, next to the hotel beating you for that guest."', {
  x: 0.5, y: 4.5, w: 9, h: 0.4, fontSize: 11, fontFace: "Georgia", italic: true,
  color: C.gold, align: "center", margin: 0,
});

// ══════════════════════════════════════════════════
// SLIDE 8: Top 10 hotel targets
// ══════════════════════════════════════════════════
const s8 = darkSlide();
slideTitle(s8, "Top 10 hotel targets");

const hotelHeader = [
  [
    { text: "#", options: { bold: true, color: C.gold, fontSize: 10, fontFace: "Calibri" } },
    { text: "Hotel", options: { bold: true, color: C.gold, fontSize: 10, fontFace: "Calibri" } },
    { text: "City", options: { bold: true, color: C.gold, fontSize: 10, align: "center", fontFace: "Calibri" } },
    { text: "Stars", options: { bold: true, color: C.gold, fontSize: 10, align: "center", fontFace: "Calibri" } },
    { text: "Rooms", options: { bold: true, color: C.gold, fontSize: 10, align: "center", fontFace: "Calibri" } },
    { text: "ADR (CHF)", options: { bold: true, color: C.gold, fontSize: 10, align: "center", fontFace: "Calibri" } },
    { text: "Buy@3K", options: { bold: true, color: C.gold, fontSize: 10, align: "center", fontFace: "Calibri" } },
  ],
];
const hotels = [
  ["1","Hotel Schweizerhof Zurich","Zurich","5★","95","784","51%"],
  ["2","Hotel Suvretta House","St. Moritz","5★","176","780","50%"],
  ["3","Victoria-Jungfrau Grand Hotel","Interlaken","5★","216","725","48%"],
  ["4","Hotel Bellevue Palace","Bern","5★","126","434","46%"],
  ["5","Hotel Schweizerhof Bern","Bern","5★","---","434","47%"],
  ["6","AlpenGold Davos","Davos","5★","216","348","47%"],
  ["7","Beau-Rivage Palace","Lausanne","5★","168","661","48%"],
  ["8","Grand Hotel Les Trois Rois","Basel","5★","82","510","48%"],
  ["9","Hotel Metropole Geneve","Geneva","5★","102","621","47%"],
  ["10","Hotel Schweizerhof Luzern","Lucerne","5★","101","388","45%"],
];

const hotelRows = hotels.map(h => h.map((v, ci) => ({
  text: v,
  options: {
    fontSize: 10, fontFace: "Calibri",
    color: ci === 6 ? C.green : C.body,
    bold: ci === 6,
    align: ci >= 2 ? "center" : "left",
  }
})));

s8.addTable([...hotelHeader, ...hotelRows], {
  x: 0.3, y: 1.1, w: 9.2,
  colW: [0.4, 2.8, 1.2, 0.7, 0.8, 1.0, 0.8],
  border: { type: "none" },
  rowH: [0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35],
  autoPage: false,
});

s8.addText("Real hotels. Real data. Real buy signals from the synthetic survey. These are the first prospects.", {
  x: 0.5, y: 5.0, w: 9, h: 0.35, fontSize: 10, fontFace: "Georgia", italic: true,
  color: C.gold, align: "center", margin: 0,
});

// ══════════════════════════════════════════════════
// SLIDE 9: The evidence: synthetic buyer survey
// ══════════════════════════════════════════════════
const s9 = darkSlide();
slideTitle(s9, "The evidence: synthetic buyer survey");
s9.addText("272 premium Swiss hotels × 2 buyer roles × 3 replications = 1,632 simulated buying conversations. Adversarial critique + judge normalization. Hypothesis-grade, not ground truth — but directionally strong.", {
  x: 0.5, y: 0.95, w: 9, h: 0.5, fontSize: 11, fontFace: "Calibri", color: C.body, margin: 0,
});

const ev3 = [
  { big: "37%", label: "average buy likelihood\nat CHF 3,000/mo", color: C.gold },
  { big: "79%", label: "say PMS/CRM integration\nis the top deal killer", color: C.green },
  { big: "CHF\n2–3.5K", label: "sweet spot monthly\npricing range", color: C.red },
];
ev3.forEach((e, i) => {
  const ex = 0.5 + i * 3.15;
  card(s9, ex, 1.6, 2.85, 1.3, null);
  s9.addText(e.big, { x: ex, y: 1.7, w: 2.85, h: 0.7, fontSize: 30, fontFace: "Consolas",
    bold: true, color: e.color, align: "center", margin: 0 });
  s9.addText(e.label, { x: ex, y: 2.4, w: 2.85, h: 0.4, fontSize: 10, fontFace: "Calibri",
    color: C.muted, align: "center", margin: 0 });
});

s9.addText("What hotels need to say yes:", {
  x: 0.5, y: 3.2, w: 9, h: 0.35, fontSize: 13, fontFace: "Calibri", bold: true, color: C.white, margin: 0 });
const proofList = [
  "PMS/CRM integration path (even if roadmap, not day 1)",
  "Swiss reference or case study",
  "60-day pilot option with clear success metrics",
  "Swiss/GDPR-compliant hosting",
];
const pBullets = proofList.map((t, i) => ({
  text: t, options: { bullet: { type: "number" }, breakLine: i < proofList.length - 1,
    fontSize: 11, fontFace: "Calibri", color: C.body }
}));
s9.addText(pBullets, { x: 0.5, y: 3.55, w: 9, h: 1.5, margin: 0, valign: "top" });

// ══════════════════════════════════════════════════
// SLIDE 10: Business model
// ══════════════════════════════════════════════════
const s10 = darkSlide();
slideTitle(s10, "Business model");

const tiers = [
  { name: "Proof of Value", price: "EUR 1,000–1,500/\nmo", sub: "90 days", desc: "Market signals, personas,\ncompetitive reading, AI discovery\naudit", color: C.teal },
  { name: "Intelligence", price: "EUR 1,500–2,500/\nmo", sub: "Annual", desc: "Full platform access,\nmonthly commercial brief", color: C.cyan },
  { name: "Intel + Content", price: "EUR 2,500–5,000/\nmo", sub: "Annual", desc: "All above + multilingual\ncontent engine, campaign assets", color: C.green },
  { name: "Group rollout", price: "EUR 2,000–4,000/\nprop", sub: "5+ properties", desc: "Portfolio reporting,\ncross-property benchmarking", color: C.purple },
];
tiers.forEach((t, i) => {
  const tx = 0.35 + i * 2.4;
  card(s10, tx, 1.1, 2.2, 2.3, t.color);
  s10.addText(t.name, { x: tx, y: 1.2, w: 2.2, h: 0.3, fontSize: 11, fontFace: "Calibri",
    bold: true, color: t.color, align: "center", margin: 0 });
  s10.addText(t.price, { x: tx, y: 1.5, w: 2.2, h: 0.55, fontSize: 13, fontFace: "Consolas",
    bold: true, color: C.white, align: "center", margin: 0 });
  s10.addText(t.sub, { x: tx, y: 2.05, w: 2.2, h: 0.25, fontSize: 9, fontFace: "Calibri",
    color: C.muted, align: "center", margin: 0 });
  s10.addText(t.desc, { x: tx + 0.1, y: 2.35, w: 2.0, h: 0.9, fontSize: 10, fontFace: "Calibri",
    color: C.body, align: "center", margin: 0 });
});

// Why hotels pay this
s10.addText("Why hotels pay this", { x: 0.5, y: 3.6, w: 9, h: 0.35, fontSize: 14,
  fontFace: "Calibri", bold: true, color: C.white, margin: 0 });

const whyPay = [
  { label: "vs. Agency:", text: "EUR 2.5-5K/mo for better, faster output vs. EUR 3-8K/mo for generic work", color: C.gold },
  { label: "vs. Hiring:", text: "Platform = EUR 30-60K/yr. Equivalent team = EUR 180-300K/yr.", color: C.teal },
  { label: "vs. OTAs:", text: "Shifting 5% of bookings to direct at a EUR 25M hotel saves EUR 112K/yr. Platform costs EUR 30-60K/yr.", color: C.green },
];
whyPay.forEach((w, i) => {
  s10.addText([
    { text: w.label, options: { bold: true, italic: true, color: w.color, fontSize: 11, fontFace: "Calibri" } },
    { text: " " + w.text, options: { color: C.body, fontSize: 11, fontFace: "Calibri" } },
  ], { x: 0.7, y: 4.0 + i * 0.35, w: 8.5, h: 0.3, margin: 0 });
});

// ══════════════════════════════════════════════════
// SLIDE 11: Unit economics
// ══════════════════════════════════════════════════
const s11 = darkSlide();
slideTitle(s11, "Unit economics");

const ueCards = [
  { label: "ARPU", big: "EUR 2,900\n/month", sub: "ACV EUR 34-35K (MC v2)", topColor: C.gold },
  { label: "COGS / hotel", big: "EUR 15–50\n/month", sub: "LLM inference + data + APIs", topColor: C.teal },
  { label: "Gross margin", big: ">95%", sub: "AI-native: near-zero marginal cost", topColor: C.green },
  { label: "Monthly burn", big: "CHF 8,850", sub: "All-in incl. CHF 4K founder salary", topColor: C.red },
  { label: "Breakeven", big: "5–7\nhotels", sub: "At EUR 2K/mo proof-of-value pricing", topColor: C.dkGreen },  // ← CORRECTED
  { label: "Peak deficit", big: "CHF 60K", sub: "Month 7-9. Repaid by month 15.", topColor: C.pink },  // ← CORRECTED
];
ueCards.forEach((u, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const ux = 0.5 + col * 3.1;
  const uy = 1.1 + row * 1.75;
  card(s11, ux, uy, 2.8, 1.5, u.topColor);
  s11.addText(u.label, { x: ux + 0.15, y: uy + 0.12, w: 2.5, h: 0.25, fontSize: 10,
    fontFace: "Calibri", color: u.topColor, margin: 0 });
  s11.addText(u.big, { x: ux + 0.15, y: uy + 0.35, w: 2.5, h: 0.75, fontSize: 28,
    fontFace: "Consolas", bold: true, color: C.white, margin: 0, valign: "middle" });
  s11.addText(u.sub, { x: ux + 0.15, y: uy + 1.1, w: 2.5, h: 0.3, fontSize: 9,
    fontFace: "Calibri", color: C.muted, margin: 0 });
});

s11.addText("At 10 hotels: CHF 9,350/mo surplus.  At 20 hotels: CHF 27,550/mo.  The seed capital is barely touched.", {
  x: 0.5, y: 5.0, w: 9, h: 0.35, fontSize: 11, fontFace: "Georgia", italic: true,
  color: C.gold, align: "center", margin: 0,
});  // ← CORRECTED surplus numbers

// ══════════════════════════════════════════════════
// SLIDE 12: The money: CHF 120-150K is enough
// ══════════════════════════════════════════════════
const s12 = darkSlide();
slideTitle(s12, "The money: CHF 120-150K is enough");
s12.addText("The company costs CHF 8,850/month to run. Peak cash deficit before revenue catches up: CHF ~60,000 at month 7-9. Add share capital (CHF 100K, legally required). Add buffer. That's CHF 120-150K.", {
  x: 0.5, y: 0.95, w: 9, h: 0.5, fontSize: 11, fontFace: "Calibri", color: C.body, margin: 0,
});  // ← CORRECTED peak deficit

// Cost table
const costHeader = [
  [
    { text: "Category", options: { bold: true, color: C.gold, fontSize: 10 } },
    { text: "Monthly (CHF)", options: { bold: true, color: C.gold, fontSize: 10, align: "right" } },
    { text: "Annual (CHF)", options: { bold: true, color: C.gold, fontSize: 10, align: "right" } },
  ]
];
const costRows = [
  ["Admin & legal (Treuhand, insurance, governance)", "1,625", "19,500"],
  ["Office (coworking Zurich + internet)", "625", "7,500"],
  ["Tech infrastructure (hosting, DB, monitoring)", "390", "4,680"],
  ["AI dev tooling (Claude Code, Codex, Cursor)", "540", "6,480"],
  ["Marketing (LinkedIn, travel, events, CRM)", "1,350", "16,200"],
].map(r => r.map((v, ci) => ({
  text: v, options: { fontSize: 10, fontFace: "Calibri", color: C.body, align: ci > 0 ? "right" : "left" }
})));
const costTotals = [
  ["Total OPEX (no salary)", "4,530", "54,360"],
  ["Founder salary (CHF 4,000/mo gross)", "4,320", "51,840"],
  ["Total monthly burn", "8,850", "106,200"],
].map(r => r.map((v, ci) => ({
  text: v, options: { fontSize: 10, fontFace: "Calibri", bold: true, color: C.white, align: ci > 0 ? "right" : "left" }
})));

s12.addTable([...costHeader, ...costRows, ...costTotals], {
  x: 0.5, y: 1.55, w: 5.0, colW: [2.8, 1.1, 1.1],
  border: { type: "none" }, rowH: [0.3, 0.28, 0.28, 0.28, 0.28, 0.28, 0.28, 0.28, 0.28],
  autoPage: false,
});

// Tranche structure
s12.addText("Tranche structure", { x: 6.0, y: 1.55, w: 3.5, h: 0.3, fontSize: 13,
  fontFace: "Calibri", bold: true, color: C.white, margin: 0 });

const tranches = [
  { n: "1", title: "T1: Day 0", amount: "CHF 100–150K", desc: "Share capital + runway to 10 hotels", color: C.teal },
  { n: "2", title: "T2: At 10 hotels", amount: "CHF 100–200K", desc: "Pre-money CHF 1.5-2.5M. First hires.", color: C.gold },
  { n: "3", title: "T3: At 25 hotels", amount: "CHF 200–500K", desc: "Pre-money CHF 5-10M. Team + geo.", color: C.green },
];
tranches.forEach((tr, i) => {
  const ty = 2.05 + i * 1.1;
  // Circle number
  s12.addShape(pres.ShapeType.oval, { x: 6.0, y: ty, w: 0.4, h: 0.4, fill: { color: tr.color } });
  s12.addText(tr.n, { x: 6.0, y: ty, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Calibri",
    bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
  s12.addText(tr.title, { x: 6.55, y: ty - 0.05, w: 3.0, h: 0.25, fontSize: 11,
    fontFace: "Calibri", bold: true, color: C.white, margin: 0 });
  s12.addText(tr.amount, { x: 6.55, y: ty + 0.2, w: 3.0, h: 0.25, fontSize: 13,
    fontFace: "Consolas", bold: true, color: tr.color, margin: 0 });
  s12.addText(tr.desc, { x: 6.55, y: ty + 0.45, w: 3.0, h: 0.25, fontSize: 9,
    fontFace: "Calibri", color: C.muted, margin: 0 });
});

// ══════════════════════════════════════════════════
// SLIDE 13: Runway & P/L — the math that matters
// ══════════════════════════════════════════════════
const s13 = darkSlide();
slideTitle(s13, "Runway & P/L — the math that matters");

// ── P&L table (left side) ──
card(s13, 0.35, 1.1, 4.6, 3.6, null);
s13.addText("Monthly P&L by hotel count", {
  x: 0.5, y: 1.15, w: 4.3, h: 0.25, fontSize: 12, fontFace: "Calibri", bold: true, color: C.white, margin: 0,
});
s13.addText("Fixed costs: CHF 8,850/mo  |  Revenue per hotel: ~CHF 1,820/mo (EUR 2K at 0.91)", {
  x: 0.5, y: 1.4, w: 4.3, h: 0.25, fontSize: 8, fontFace: "Calibri", color: C.muted, margin: 0,
});  // ← CORRECTED FX

const plHeader = [["Hotels", "Revenue", "Costs", "Net P&L"].map(h => ({
  text: h, options: { bold: true, color: C.muted, fontSize: 9, fontFace: "Calibri", align: "right" }
}))];
// Revenue per hotel = EUR 2,000 × 0.91 = CHF 1,820  ← CORRECTED
const plData = [
  [0, 0, -8850], [2, 3640, -8850], [4, 7280, -8850],
  [5, 9100, -8850], [6, 10920, -8850], [10, 18200, -8850],
  [15, 27300, -8850], [20, 36400, -8850],
];
const plRows = plData.map(([h, rev, cost]) => {
  const net = rev + cost;
  return [
    { text: String(h), options: { fontSize: 10, fontFace: "Consolas", color: C.white, align: "right" } },
    { text: rev.toLocaleString("en"), options: { fontSize: 10, fontFace: "Consolas", color: C.body, align: "right" } },
    { text: cost.toLocaleString("en"), options: { fontSize: 10, fontFace: "Consolas", color: C.body, align: "right" } },
    { text: (net >= 0 ? "+" : "") + net.toLocaleString("en"), options: {
      fontSize: 10, fontFace: "Consolas", bold: true, color: net >= 0 ? C.green : C.red, align: "right"
    }},
  ];
});

s13.addTable([...plHeader, ...plRows], {
  x: 0.45, y: 1.7, w: 4.3, colW: [0.8, 1.1, 1.1, 1.1],
  border: { type: "none" }, rowH: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
  autoPage: false,
});

s13.addText("Breakeven = 5 hotels. Every hotel after that adds ~CHF 1,820/mo profit.", {
  x: 0.5, y: 4.15, w: 4.3, h: 0.3, fontSize: 9, fontFace: "Georgia", italic: true,
  color: C.gold, margin: 0,
});  // ← CORRECTED

// ── Cash position over time (right side, horizontal bar chart) ──
card(s13, 5.15, 1.1, 4.5, 2.2, null);
s13.addText("Cash position over time", {
  x: 5.3, y: 1.15, w: 4.2, h: 0.25, fontSize: 12, fontFace: "Calibri", bold: true, color: C.white, margin: 0,
});

// Corrected cash data with FX=0.91 (CHF 1,820/hotel)
const cashData = [
  { m: "M1", val: -17700 }, { m: "M3", val: -35400 },
  { m: "M5", val: -49500 }, { m: "M7", val: -59900 },
  { m: "M9", val: -60000 }, { m: "M11", val: -53700 },
  { m: "M13", val: -38500 }, { m: "M15", val: -12400 },
  { m: "M17", val: 0 },
];
const maxDef = 60000;
cashData.forEach((cd, i) => {
  const cy = 1.5 + i * 0.19;
  const absVal = Math.abs(cd.val);
  const barW = (absVal / maxDef) * 2.8;
  s13.addText(cd.m, { x: 5.3, y: cy, w: 0.4, h: 0.17, fontSize: 8, fontFace: "Consolas",
    color: C.muted, margin: 0, valign: "middle" });
  if (barW > 0.01) {
    const barColor = cd.val < -55000 ? C.red : (cd.val < 0 ? C.gold : C.green);
    s13.addShape(pres.ShapeType.rect, { x: 5.75, y: cy + 0.02, w: barW, h: 0.13, fill: { color: barColor } });
  }
  const valStr = cd.val === 0 ? "~0" : (cd.val > 0 ? "+" : "") + (cd.val / 1000).toFixed(0).replace("-", "−") + (cd.val !== 0 ? ",000" : "");
  const displayVal = cd.val === 0 ? "~0" : cd.val < 0 ? "−" + Math.abs(cd.val).toLocaleString("en") : "+" + cd.val.toLocaleString("en");
  s13.addText(displayVal, {
    x: 5.75 + barW + 0.1, y: cy, w: 1.2, h: 0.17, fontSize: 8, fontFace: "Consolas",
    color: cd.val < -55000 ? C.red : (cd.val < 0 ? C.gold : C.green), margin: 0, valign: "middle",
  });
});

// ── Salary escalation (right side, lower) ──
card(s13, 5.15, 3.5, 4.5, 1.7, null);
s13.addText("Salary escalation (revenue-triggered)", {
  x: 5.3, y: 3.55, w: 4.2, h: 0.25, fontSize: 11, fontFace: "Calibri", bold: true, color: C.white, margin: 0,
});

const salarySteps = [
  { hotels: "0-9 hotels", sal: "CHF 4,000/mo", note: "Below market. Sacrifice = investment." },
  { hotels: "10 hotels", sal: "CHF 8,000/mo", note: "Company profitable. Auto-escalation." },
  { hotels: "25 hotels", sal: "CHF 12,000/mo", note: "+ 2% MRR revenue share" },
  { hotels: "50 hotels", sal: "CHF 15,000/mo", note: "+ 2% MRR revenue share" },
];
salarySteps.forEach((ss, i) => {
  const sy = 3.9 + i * 0.3;
  s13.addText(ss.hotels, { x: 5.3, y: sy, w: 1.2, h: 0.25, fontSize: 9, fontFace: "Calibri",
    color: C.body, margin: 0, valign: "middle" });
  s13.addText(ss.sal, { x: 6.55, y: sy, w: 1.5, h: 0.25, fontSize: 10, fontFace: "Consolas",
    bold: true, color: C.gold, margin: 0, valign: "middle" });
  s13.addText(ss.note, { x: 8.1, y: sy, w: 1.5, h: 0.25, fontSize: 8, fontFace: "Calibri",
    color: C.muted, margin: 0, valign: "middle" });
});

// ══════════════════════════════════════════════════
// SLIDE 14: Financial projections (MC v2)
// ══════════════════════════════════════════════════
const s14 = darkSlide();
slideTitle(s14, "Financial projections (MC v2)");
s14.addText("10,000 simulations. Two non-VC paths. All numbers in EUR.", {
  x: 0.5, y: 0.9, w: 9, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.body, margin: 0,
});

// Operator-seeded table (left)
card(s14, 0.35, 1.3, 4.55, 3.0, C.gold);
s14.addText("Operator-seeded (CHF 120-150K seed)", {
  x: 0.5, y: 1.38, w: 4.2, h: 0.25, fontSize: 11, fontFace: "Calibri", bold: true, color: C.gold, margin: 0,
});

const opHeader = [["", "P10", "P50", "P90"].map(h => ({
  text: h, options: { bold: true, color: C.muted, fontSize: 9, fontFace: "Calibri", align: h === "" ? "left" : "center" }
}))];
const opData = [
  ["Hotels M12", "22", "30", "39"],
  ["Hotels M18", "36", "47", "60"],
  ["Hotels M36", "92", "115", "140"],
  ["ARR M36", "3.11M", "3.99M", "4.94M"],
  ["ARR M60", "7.05M", "9.21M", "11.85M"],
  ["Exit M60", "34.50M", "45.86M", "60.17M"],
];
const opRows = opData.map(r => r.map((v, ci) => ({
  text: v, options: { fontSize: 10, fontFace: ci === 0 ? "Calibri" : "Consolas",
    color: ci === 2 ? C.white : C.body, bold: ci === 2, align: ci === 0 ? "left" : "center" }
})));

s14.addTable([...opHeader, ...opRows], {
  x: 0.5, y: 1.75, w: 4.2, colW: [1.2, 0.9, 1.0, 0.9],
  border: { type: "none" }, rowH: [0.28, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
  autoPage: false,
});

// Follow-on angel table (right)
card(s14, 5.1, 1.3, 4.55, 3.0, C.teal);
s14.addText("Follow-on angel (+CHF 150-300K tranche)", {
  x: 5.25, y: 1.38, w: 4.2, h: 0.25, fontSize: 11, fontFace: "Calibri", bold: true, color: C.teal, margin: 0,
});

const anData = [
  ["Hotels M12", "26", "35", "45"],
  ["Hotels M18", "45", "58", "73"],
  ["Hotels M36", "124", "154", "187"],
  ["ARR M36", "4.24M", "5.33M", "6.63M"],
  ["ARR M60", "10.21M", "13.22M", "17.12M"],
  ["Exit M60", "50.69M", "67.39M", "88.41M"],
];
const anRows = anData.map(r => r.map((v, ci) => ({
  text: v, options: { fontSize: 10, fontFace: ci === 0 ? "Calibri" : "Consolas",
    color: ci === 2 ? C.white : C.body, bold: ci === 2, align: ci === 0 ? "left" : "center" }
})));

s14.addTable([...opHeader, ...anRows], {
  x: 5.25, y: 1.75, w: 4.2, colW: [1.2, 0.9, 1.0, 0.9],
  border: { type: "none" }, rowH: [0.28, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
  autoPage: false,
});

// P50 hotel comparison bar
s14.addText("P50 hotel comparison at key milestones", {
  x: 0.5, y: 4.5, w: 9, h: 0.25, fontSize: 10, fontFace: "Calibri", bold: true, color: C.white, margin: 0,
});

const milestones = [
  { label: "M12", op: 30, an: 35 }, { label: "M18", op: 47, an: 58 },
  { label: "M36", op: 115, an: 154 },
];
const barStartX = 0.8;
milestones.forEach((ms, i) => {
  const mx = i < 2 ? barStartX + i * 2.5 : 5.8;
  const barScale = i < 2 ? 0.035 : 0.018;
  const my = 4.85;
  s14.addText(ms.label, { x: mx - 0.5, y: my, w: 0.5, h: 0.5, fontSize: 10,
    fontFace: "Consolas", color: C.muted, align: "right", valign: "middle", margin: 0 });
  // Operator bar (gold)
  s14.addShape(pres.ShapeType.rect, { x: mx + 0.05, y: my + 0.05, w: ms.op * barScale, h: 0.18, fill: { color: C.gold } });
  s14.addText(String(ms.op), { x: mx + 0.05 + ms.op * barScale + 0.1, y: my, w: 0.5, h: 0.25,
    fontSize: 9, fontFace: "Consolas", color: C.gold, margin: 0 });
  // Angel bar (teal)
  s14.addShape(pres.ShapeType.rect, { x: mx + 0.05, y: my + 0.28, w: ms.an * barScale, h: 0.18, fill: { color: C.teal } });
  s14.addText(String(ms.an), { x: mx + 0.05 + ms.an * barScale + 0.1, y: my + 0.23, w: 0.5, h: 0.25,
    fontSize: 9, fontFace: "Consolas", color: C.teal, margin: 0 });
  if (i === 2) {
    s14.addText("M60", { x: mx + 2.2, y: my, w: 0.5, h: 0.25, fontSize: 9, fontFace: "Consolas", color: C.muted, margin: 0 });
  }
});

// Legend
s14.addText([
  { text: "■ ", options: { color: C.gold, fontSize: 9 } },
  { text: "Operator-seeded  ", options: { color: C.body, fontSize: 9 } },
  { text: "■ ", options: { color: C.teal, fontSize: 9 } },
  { text: "Follow-on angel", options: { color: C.body, fontSize: 9 } },
], { x: 0.5, y: 5.25, w: 4, h: 0.2, fontFace: "Calibri", margin: 0 });

s14.addText("All values in EUR. 3.1% probability of exit > EUR 100M in follow-on angel scenario.", {
  x: 0.5, y: 5.35, w: 9, h: 0.2, fontSize: 8, fontFace: "Calibri", color: C.muted, align: "center", margin: 0,
});

// ══════════════════════════════════════════════════
// SLIDE 15: Competitive landscape
// ══════════════════════════════════════════════════
const s15 = darkSlide();
slideTitle(s15, "Competitive landscape");
s15.addText("Nobody does what Tercier does. Competitors own pieces — nobody orchestrates the full commercial picture.", {
  x: 0.5, y: 0.95, w: 9, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.body, margin: 0,
});

const compHeader = [["Player", "Scale / Price", "What they do", "Gap or advantage"].map(h => ({
  text: h, options: { bold: true, color: C.gold, fontSize: 10, fontFace: "Calibri" }
}))];
const compData = [
  ["Mews", "$2.5B, 15K hotels", "Cloud PMS, payments", "Operations-focused. Different buyer, different budget."],
  ["Canary", "$600M, 20K+ hotels", "AI guest management", "PMS-centric. No content, no commercial intelligence."],
  ["Lighthouse", "65K hotels", "Rate intel, revenue mgmt", "Pricing and ranking. No content execution."],
  ["TrustYou", "$115-350/mo", "Review aggregation", "Gives a 4.3 score. Doesn't tell you what to do about it."],
  ["Agencies", "EUR 3-8K/mo", "Generic content, social", "Late, monolingual, same for every property."],
  ["Tercier", "EUR 1.5-5K/mo", "Full commercial AI stack", "Property-level intelligence + content in one system."],
];
const compRows = compData.map((r, ri) => r.map((v, ci) => ({
  text: v, options: {
    fontSize: 10, fontFace: "Calibri",
    color: ri === 5 ? (ci === 0 ? C.gold : C.white) : C.body,
    bold: ri === 5 || ci === 0,
  }
})));

// Highlight Tercier row
const compAllRows = [...compHeader, ...compRows];
s15.addTable(compAllRows, {
  x: 0.3, y: 1.4, w: 9.2, colW: [1.2, 1.8, 2.5, 3.5],
  border: { type: "none" }, rowH: [0.35, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
  autoPage: false,
});

s15.addText("Tercier's wedge: property-level commercial intelligence + content execution in one system. The value is in the orchestration.", {
  x: 0.5, y: 5.0, w: 9, h: 0.35, fontSize: 10, fontFace: "Georgia", italic: true,
  color: C.gold, align: "center", margin: 0,
});

// ══════════════════════════════════════════════════
// SLIDE 16: Execution roadmap
// ══════════════════════════════════════════════════
const s16 = darkSlide();
slideTitle(s16, "Execution roadmap");

const phases = [
  { title: "Solo Founder", sub: "M1–12  |  1 → 30 hotels", color: C.gold, items: [
    "M1-2: Concierge MVP, 1-3 high-touch hotels",
    "M3-5: Core loop automated, 3-5 paying",
    "M6-9: Cash-flow breakeven at 5-7 hotels",
    "M10-12: 15-30 hotels, CTO search active",
  ]},
  { title: "First Hires", sub: "M12–18  |  30 → 58 hotels", color: C.teal, items: [
    "CS lead + CTO join when revenue justifies it",
    "Founder freed from day-to-day support",
    "Group deals begin",
    "Northern Italy + DACH expansion starts",
  ]},
  { title: "Scale", sub: "M18–36  |  58 → 115–154\nhotels", color: C.pink, items: [
    "5-person team by M24, 8 by M36",
    "Engineer + Sales/BD hire",
    "EUR 175-375K MRR at M36",
    "Series A positioning",
  ]},
];
phases.forEach((ph, i) => {
  const px = 0.35 + i * 3.2;
  card(s16, px, 1.1, 2.95, 3.5, ph.color);
  s16.addText(ph.title, { x: px + 0.15, y: 1.2, w: 2.65, h: 0.3, fontSize: 14,
    fontFace: "Calibri", bold: true, color: ph.color, margin: 0 });
  s16.addText(ph.sub, { x: px + 0.15, y: 1.5, w: 2.65, h: 0.35, fontSize: 10,
    fontFace: "Consolas", color: C.muted, margin: 0 });
  const phBullets = ph.items.map((t, j) => ({
    text: t, options: { bullet: true, breakLine: j < ph.items.length - 1,
      fontSize: 10, fontFace: "Calibri", color: C.body }
  }));
  s16.addText(phBullets, { x: px + 0.15, y: 1.95, w: 2.65, h: 2.4, margin: 0, valign: "top" });
});

s16.addText("Hiring is revenue-triggered, not calendar-triggered. Every hire earns its seat by solving a bottleneck AI cannot.", {
  x: 0.5, y: 4.9, w: 9, h: 0.35, fontSize: 10, fontFace: "Georgia", italic: true,
  color: C.gold, align: "center", margin: 0,
});

// ══════════════════════════════════════════════════
// SLIDE 17: How I operate
// ══════════════════════════════════════════════════
const s17 = darkSlide();
slideTitle(s17, "How I operate");

const opPrinciples = [
  { n: "1", title: "AI-Native = Iron Man Suit", desc: "The suit alone does nothing. But a good engineer wearing it becomes a superhero. Me + AI = the output of a team of 5, because I know how to use these tools extremely well. The proof: 2,295 commits across 6 repos in 82 days, one person.", color: C.gold },
  { n: "2", title: "Revenue drives hiring", desc: "Don't hire until revenue forces it. Solo founder until bottlenecks justify a first external hire at ~15 hotels / CHF 30K MRR. Every person added must multiply output, not just add capacity.", color: C.teal },
  { n: "3", title: "Daily iteration", desc: "I ship and fix in hours, not sprints. If you can iterate from mistakes at 20x speed, the cost of a mistake drops to near zero. This business plan went from v0 to v4 in five days.", color: C.green },
  { n: "4", title: "Clients over capital", desc: "10 paying hotels from your network are worth more than CHF 100K in cash. Clients = validation + revenue + feedback + references. Capital without clients is just a slower death.", color: C.cyan },
];
opPrinciples.forEach((p, i) => {
  const oy = 1.1 + i * 1.05;
  // Number circle
  s17.addShape(pres.ShapeType.oval, { x: 0.5, y: oy + 0.05, w: 0.45, h: 0.45, fill: { color: p.color } });
  s17.addText(p.n, { x: 0.5, y: oy + 0.05, w: 0.45, h: 0.45, fontSize: 16, fontFace: "Calibri",
    bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
  // Title + desc
  s17.addText(p.title, { x: 1.15, y: oy, w: 8.3, h: 0.3, fontSize: 14, fontFace: "Calibri",
    bold: true, color: C.white, margin: 0 });
  s17.addText(p.desc, { x: 1.15, y: oy + 0.3, w: 8.3, h: 0.6, fontSize: 11, fontFace: "Calibri",
    color: C.body, margin: 0 });
});

// ══════════════════════════════════════════════════
// SLIDE 18: The partnership
// ══════════════════════════════════════════════════
const s18 = darkSlide();
slideTitle(s18, "The partnership");
s18.addText("This isn't a capital raise. It's a founding partnership where both sides invest differently.", {
  x: 0.5, y: 0.95, w: 9, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.body, margin: 0,
});

// What I bring (left)
card(s18, 0.35, 1.4, 4.55, 3.3, C.gold);
s18.addText("What I bring", { x: 0.5, y: 1.5, w: 4.2, h: 0.3, fontSize: 14, fontFace: "Calibri",
  bold: true, color: C.gold, margin: 0 });

const myBring = [
  { h: "Salary: CHF 4K/mo", t: "Below market by CHF 152K/yr. That sacrifice is my investment." },
  { h: "Escalation built in", t: "10 hotels = CHF 8K. 25 hotels = CHF 12K. 50 hotels = CHF 15K." },
  { h: "2% MRR revenue share", t: "Aligned to growth. Costs nothing until there's meaningful revenue." },
  { h: "Full-time builder", t: "Product, engineering, AI, sales, onboarding — 3 years committed." },
  { h: "IP + dataset + research", t: "Everything in this repo. The pipeline, the survey, the models." },
];
myBring.forEach((mb, i) => {
  const my = 1.85 + i * 0.55;
  s18.addText(mb.h, { x: 0.5, y: my, w: 4.2, h: 0.2, fontSize: 11, fontFace: "Calibri",
    bold: true, color: C.white, margin: 0 });
  s18.addText(mb.t, { x: 0.5, y: my + 0.2, w: 4.2, h: 0.25, fontSize: 10, fontFace: "Calibri",
    color: C.muted, margin: 0 });
});

// What you bring (right)
card(s18, 5.1, 1.4, 4.55, 3.3, C.teal);
s18.addText("What you bring", { x: 5.25, y: 1.5, w: 4.2, h: 0.3, fontSize: 14, fontFace: "Calibri",
  bold: true, color: C.teal, margin: 0 });

const yourBring = [
  { h: "CHF 120-150K seed capital", t: "Covers share capital + runway to breakeven. Not more than the math requires." },
  { h: "Hotel network access", t: "3-4 warm intros/month to commercial directors. The single most valuable thing." },
  { h: "The pipeline you mentioned", t: "The hotel chain that's already interested — let's get the pilot started." },
  { h: "Commercial credibility", t: "JAKALA's track record opens doors I can't open alone." },
  { h: "SEO/GEO expertise", t: "Marco Corsaro's knowledge feeds directly into our AI Discovery layer." },
];
yourBring.forEach((yb, i) => {
  const yy = 1.85 + i * 0.55;
  s18.addText(yb.h, { x: 5.25, y: yy, w: 4.2, h: 0.2, fontSize: 11, fontFace: "Calibri",
    bold: true, color: C.white, margin: 0 });
  s18.addText(yb.t, { x: 5.25, y: yy + 0.2, w: 4.2, h: 0.25, fontSize: 10, fontFace: "Calibri",
    color: C.muted, margin: 0 });
});

s18.addText("Equity: contribution-based. Target: 38% of distributable pool. Vesting 4yr, 1yr cliff. 10-15% ESOP reserved for future hires.", {
  x: 0.5, y: 4.95, w: 9, h: 0.35, fontSize: 10, fontFace: "Calibri", color: C.body, align: "center", margin: 0,
});

// ══════════════════════════════════════════════════
// SLIDE 19: Risks — stated plainly
// ══════════════════════════════════════════════════
const s19 = darkSlide();
slideTitle(s19, "Risks — stated plainly");

const risks = [
  { risk: "Hotels won't pay EUR 1,500+ for software", response: "Proof-of-value tier (EUR 1,000-1,500) tests this before full commitment. Kill at 90 days if 3/5 pilots cancel.", dot: C.red },
  { risk: "Major PMS vendor builds this layer", response: "They're operations-focused — different buyer, budget, workflow. Speed is our hedge.", dot: C.gold },
  { risk: "Solo founder can't scale past 10 hotels", response: "CS hire accelerates to M8 if needed. Your network handles sales pipeline — I never cold-sell.", dot: C.dkGreen },
  { risk: "Content quality not good enough for luxury", response: "Human-in-the-loop. AI drafts, human approves. Quality improves per interaction.", dot: C.teal },
  { risk: "AI discovery trend slows", response: "Content problem and OTA pressure exist independently. Discovery layer is additive, not essential.", dot: C.cyan },
];
risks.forEach((rk, i) => {
  const ry = 1.1 + i * 0.82;
  // Dot
  s19.addShape(pres.ShapeType.rect, { x: 0.5, y: ry + 0.05, w: 0.12, h: 0.12, fill: { color: rk.dot } });
  // Risk text (left)
  s19.addText(rk.risk, { x: 0.75, y: ry, w: 3.8, h: 0.65, fontSize: 12, fontFace: "Calibri",
    bold: true, color: C.white, margin: 0, valign: "middle" });
  // Response (right)
  s19.addText(rk.response, { x: 4.7, y: ry, w: 4.8, h: 0.65, fontSize: 11, fontFace: "Calibri",
    color: C.body, margin: 0, valign: "middle" });
});

s19.addText("Kill criteria: 3/5 pilots cancel within 90 days  |  Zero conversion to EUR 1,500+ tier  |  Content requires >30% human editing consistently", {
  x: 0.5, y: 5.1, w: 9, h: 0.3, fontSize: 9, fontFace: "Calibri", color: C.muted, align: "center", margin: 0,
});

// ══════════════════════════════════════════════════
// SLIDE 20: Open questions + next steps
// ══════════════════════════════════════════════════
const s20 = darkSlide();
slideTitle(s20, "Open questions + next steps");

// Things to decide (left)
card(s20, 0.35, 1.1, 4.55, 3.5, C.gold);
s20.addText("Things to decide together", { x: 0.5, y: 1.2, w: 4.2, h: 0.3, fontSize: 13,
  fontFace: "Calibri", bold: true, color: C.gold, margin: 0 });

const questions = [
  "What's your target outcome? Timeline? Multiple?",
  "How do you see your operational role in the first 12 months?",
  "The hotel chain you mentioned on the call — when can we start the pilot?",
  "When do you leave Felfel? I need a date to plan around.",
  "Any potential conflicts with JAKALA to address upfront?",
  "How do you want to structure the equity conversation?",
];
const qBullets = questions.map((q, i) => ({
  text: q, options: { bullet: { type: "number" }, breakLine: i < questions.length - 1,
    fontSize: 11, fontFace: "Calibri", color: C.body }
}));
s20.addText(qBullets, { x: 0.5, y: 1.6, w: 4.2, h: 2.8, margin: 0, valign: "top" });

// Next steps (right)
card(s20, 5.1, 1.1, 4.55, 3.5, C.teal);
s20.addText("Next steps", { x: 5.25, y: 1.2, w: 4.2, h: 0.3, fontSize: 13,
  fontFace: "Calibri", bold: true, color: C.teal, margin: 0 });

const steps = [
  { when: "This week", what: "Assess MVP + review existing team" },
  { when: "Week 2", what: "First hotel pilot, onboarding" },
  { when: "Weeks 3-4", what: "Feedback loop + iteration" },
  { when: "Month 2", what: "SHA, incorporate AG in Zug" },
  { when: "Month 3", what: "3-5 hotels, product stabilized" },
];
steps.forEach((st, i) => {
  const sy = 1.65 + i * 0.55;
  s20.addShape(pres.ShapeType.rect, { x: 5.25, y: sy + 0.05, w: 0.1, h: 0.1, fill: { color: C.teal } });
  s20.addText(st.when, { x: 5.45, y: sy, w: 1.5, h: 0.25, fontSize: 11, fontFace: "Calibri",
    bold: true, color: C.white, margin: 0 });
  s20.addText(st.what, { x: 5.45, y: sy + 0.25, w: 3.5, h: 0.25, fontSize: 10, fontFace: "Calibri",
    color: C.body, margin: 0 });
});

// Footer
s20.addShape(pres.ShapeType.rect, { x: 0, y: 5.1, w: 10, h: 0.525, fill: { color: "080C16" } });
s20.addText("T E R C I E R", { x: 0.5, y: 5.15, w: 3, h: 0.4, fontSize: 18, fontFace: "Georgia",
  bold: true, color: C.white, margin: 0, valign: "middle" });
s20.addText("tercier.ai", { x: 7.5, y: 5.15, w: 2, h: 0.4, fontSize: 12, fontFace: "Calibri",
  bold: true, color: C.white, align: "right", margin: 0, valign: "middle" });

// ── Save ──
const outPath = "/sessions/sleepy-inspiring-hopper/mnt/tercier/tercier-deck-march-2026.pptx";
pres.writeFile({ fileName: outPath }).then(() => {
  console.log("Deck saved to", outPath);
}).catch(err => {
  console.error("Error:", err);
});
