const PptxGenJs = require("pptxgenjs");

const pres = new PptxGenJs();
pres.layout = "LAYOUT_16x9";
pres.defineLayout({ name: "LAYOUT_16x9", width: 10, height: 5.625 });

// Color palette
const colors = {
  darkBg: "0F1B2D",
  altBg: "0A1628",
  accent: "D4A853",
  white: "FFFFFF",
  bodyText: "B8C4D4",
  muted: "7A8BA0",
  cardBg: "162236",
};

// Slide 1: Title
const slide1 = pres.addSlide();
slide1.background = { color: colors.altBg };

slide1.addText("TERCIER", {
  x: 0.5,
  y: 1.8,
  w: 9,
  h: 1,
  fontSize: 48,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.white,
  charSpacing: 8,
  align: "center",
});

slide1.addText("Vertical AI for Premium Hospitality", {
  x: 0.5,
  y: 2.9,
  w: 9,
  h: 0.6,
  fontSize: 20,
  fontFace: "Trebuchet MS",
  color: colors.accent,
  align: "center",
});

slide1.addText("tercier.ai | March 22, 2026 | Marco Di Cesare, Founder", {
  x: 0.5,
  y: 5,
  w: 9,
  h: 0.4,
  fontSize: 12,
  fontFace: "Calibri",
  color: colors.muted,
  align: "center",
});

// Slide 2: Credibility + Context
const slide2 = pres.addSlide();
slide2.background = { color: colors.darkBg };

slide2.addText("9 Days of Work", {
  x: 0.5,
  y: 0.4,
  w: 9,
  h: 0.5,
  fontSize: 36,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.white,
  align: "left",
});

// Pipeline boxes
const boxWidth = 1.8;
const boxHeight = 0.9;
const boxY = 1.2;
const startX = 0.5;
const spacing = 0.15;

const pipelineData = [
  { label: "2,069", desc: "raw HotellerieSuisse rows" },
  { label: "718", desc: "selected dossiers" },
  { label: "272", desc: "ICP hotels" },
  { label: "1,632", desc: "survey simulations" },
];

pipelineData.forEach((item, idx) => {
  const xPos = startX + idx * (boxWidth + spacing);

  // Amber box for number
  slide2.addShape(pres.ShapeType.rect, {
    x: xPos,
    y: boxY,
    w: boxWidth,
    h: boxHeight * 0.6,
    fill: { color: colors.accent },
    line: { color: colors.accent, width: 0 },
  });

  slide2.addText(item.label, {
    x: xPos,
    y: boxY,
    w: boxWidth,
    h: boxHeight * 0.6,
    fontSize: 28,
    fontFace: "Trebuchet MS",
    bold: true,
    color: colors.altBg,
    align: "center",
    valign: "middle",
  });

  slide2.addText(item.desc, {
    x: xPos,
    y: boxY + boxHeight * 0.65,
    w: boxWidth,
    h: 0.35,
    fontSize: 11,
    fontFace: "Calibri Light",
    color: colors.bodyText,
    align: "center",
    valign: "top",
  });
});

// Bullet points
const bulletY = 2.4;
const bullets = [
  "Monte Carlo financial model: 10,000 simulations",
  "Competitive landscape with current pricing and funding",
  "Tax-optimized Zug AG structure (11.8% corporate tax)",
  "tercier.ai secured, tercier.com available (CHF 1,200)",
];

const bulletText = bullets
  .map((b) => b)
  .join("\n");

slide2.addText(bulletText, {
  x: 0.5,
  y: bulletY,
  w: 9,
  h: 2.5,
  fontSize: 14,
  fontFace: "Calibri",
  color: colors.bodyText,
  bullet: true,
  breakLine: true,
});

slide2.addText("2,295 authored commits across 6 repos in 82 days", {
  x: 0.5,
  y: 5,
  w: 9,
  h: 0.4,
  fontSize: 12,
  fontFace: "Calibri Light",
  color: colors.accent,
  italic: true,
  align: "left",
});

// Slide 3: Market Opportunity
const slide3 = pres.addSlide();
slide3.background = { color: colors.darkBg };

slide3.addText("The Market", {
  x: 0.5,
  y: 0.4,
  w: 9,
  h: 0.5,
  fontSize: 36,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.white,
  align: "left",
});

// Left column: stats
const leftX = 0.5;
const leftStatY = 1.1;

slide3.addText("272", {
  x: leftX,
  y: leftStatY,
  w: 4,
  h: 0.7,
  fontSize: 48,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.accent,
  align: "left",
});

slide3.addText("addressable Swiss hotels", {
  x: leftX,
  y: leftStatY + 0.7,
  w: 4,
  h: 0.3,
  fontSize: 14,
  fontFace: "Calibri",
  color: colors.bodyText,
  align: "left",
});

slide3.addText("4-5 star, ADR >= CHF 250", {
  x: leftX,
  y: leftStatY + 1.05,
  w: 4,
  h: 0.3,
  fontSize: 12,
  fontFace: "Calibri Light",
  color: colors.muted,
  align: "left",
});

const tamY = leftStatY + 1.6;
slide3.addText("EUR 9.8M", {
  x: leftX,
  y: tamY,
  w: 4,
  h: 0.7,
  fontSize: 36,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.accent,
  align: "left",
});

slide3.addText("TAM at EUR 3K/mo ARPU", {
  x: leftX,
  y: tamY + 0.7,
  w: 4,
  h: 0.3,
  fontSize: 14,
  fontFace: "Calibri",
  color: colors.bodyText,
  align: "left",
});

// Right column: text block
const rightX = 5.2;
const rightTexts = [
  "A premium hotel generating EUR 15-70M in revenue has a marketing department of one person who speaks two languages.",
  "37% of travelers now use AI to plan trips. 55% of AI hotel citations come from OTAs, not from the hotel.",
  "No vertical AI platform exists for this segment.",
];

const rightText = rightTexts.join("\n\n");

slide3.addText(rightText, {
  x: rightX,
  y: 1.1,
  w: 4.3,
  h: 4.2,
  fontSize: 14,
  fontFace: "Calibri",
  color: colors.bodyText,
  breakLine: true,
});

// Slide 4: Survey Headlines
const slide4 = pres.addSlide();
slide4.background = { color: colors.darkBg };

slide4.addText("What 1,632 Synthetic Buyer Interviews Say", {
  x: 0.5,
  y: 0.4,
  w: 9,
  h: 0.5,
  fontSize: 36,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.white,
  align: "left",
});

slide4.addText("272 hotels x 2 roles x 3 replications, adversarial + judge pass", {
  x: 0.5,
  y: 1.0,
  w: 9,
  h: 0.3,
  fontSize: 12,
  fontFace: "Calibri Light",
  color: colors.muted,
  italic: true,
});

// 2x2 grid of stat cards
const cardData = [
  { stat: "37%", desc: "buy at CHF 3K/mo" },
  { stat: "15%", desc: "buy at CHF 5K/mo" },
  { stat: "79%", desc: "say no-PMS-integration is a deal killer" },
  { stat: "#1", desc: "proof need: PMS/CRM integration" },
];

const cardWidth = 4.2;
const cardHeight = 1.6;
const cardSpacingH = 0.4;
const cardSpacingV = 0.3;
const gridStartX = 0.5;
const gridStartY = 1.5;

cardData.forEach((card, idx) => {
  const row = Math.floor(idx / 2);
  const col = idx % 2;
  const cardX = gridStartX + col * (cardWidth + cardSpacingH);
  const cardY = gridStartY + row * (cardHeight + cardSpacingV);

  // Card background
  slide4.addShape(pres.ShapeType.rect, {
    x: cardX,
    y: cardY,
    w: cardWidth,
    h: cardHeight,
    fill: { color: colors.cardBg },
    line: { color: colors.muted, width: 1 },
  });

  // Stat number
  slide4.addText(card.stat, {
    x: cardX,
    y: cardY + 0.2,
    w: cardWidth,
    h: 0.7,
    fontSize: 44,
    fontFace: "Trebuchet MS",
    bold: true,
    color: colors.accent,
    align: "center",
  });

  // Description
  slide4.addText(card.desc, {
    x: cardX + 0.2,
    y: cardY + 1.0,
    w: cardWidth - 0.4,
    h: 0.5,
    fontSize: 13,
    fontFace: "Calibri",
    color: colors.bodyText,
    align: "center",
    valign: "middle",
  });
});

// Slide 5: Top 10 ICP Hotels
const slide5 = pres.addSlide();
slide5.background = { color: colors.darkBg };

slide5.addText("Top 10 Target Hotels", {
  x: 0.5,
  y: 0.4,
  w: 9,
  h: 0.5,
  fontSize: 36,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.white,
  align: "left",
});

const tableData = [
  [
    "Rank",
    "Hotel",
    "Location",
    "Stars",
    "Rooms",
    "ADR (CHF)",
    "Buy@3K",
  ],
  ["1", "Hotel Schweizerhof Zürich", "Zürich", "5★", "95", "784", "51%"],
  ["2", "Hotel Suvretta House", "St. Moritz", "5★", "176", "780", "50%"],
  ["3", "Victoria-Jungfrau Grand Hotel", "Interlaken", "5★", "216", "725", "48%"],
  ["4", "Hotel Bellevue Palace", "Bern", "5★", "126", "434", "46%"],
  ["5", "Hotel Schweizerhof Bern", "Bern", "5★", "99", "434", "47%"],
  ["6", "AlpenGold Davos", "Davos", "5★", "216", "348", "47%"],
  ["7", "Beau-Rivage Palace", "Lausanne", "5★", "168", "661", "48%"],
  ["8", "Grand Hotel Les Trois Rois", "Basel", "5★", "82", "510", "48%"],
  ["9", "Hôtel Métropole Genève", "Genève", "5★", "102", "621", "47%"],
  ["10", "Hotel Schweizerhof Luzern", "Luzern", "5★", "101", "388", "45%"],
];

const tableOpts = {
  x: 0.3,
  y: 1.1,
  w: 9.4,
  h: 3.8,
  border: { pt: 1, color: colors.muted },
  rowH: 0.35,
  fontSize: 11,
  fontFace: "Calibri",
  align: "center",
  valign: "middle",
  colW: [0.8, 2.5, 1.5, 0.7, 0.8, 1.0, 0.9],
};

// Style header row - FIXED: amber background with dark text
const headerRowOpts = {
  fill: { color: colors.accent },
  color: colors.altBg,
  fontFace: "Trebuchet MS",
  bold: true,
  fontSize: 11,
};

const rows = [];
tableData.forEach((rowData, rowIdx) => {
  const row = [];
  rowData.forEach((cellData) => {
    if (rowIdx === 0) {
      row.push({
        text: cellData,
        ...headerRowOpts,
      });
    } else {
      // FIXED: WHITE text on alternating dark backgrounds
      row.push({
        text: cellData,
        color: colors.white,
        fill:
          rowIdx % 2 === 0
            ? { color: colors.cardBg }
            : { color: "1A2840" },
      });
    }
  });
  rows.push(row);
});

slide5.addTable(rows, tableOpts);

slide5.addText("Real hotels. Real data. Real signals.", {
  x: 0.5,
  y: 5.1,
  w: 9,
  h: 0.4,
  fontSize: 12,
  fontFace: "Calibri Light",
  color: colors.accent,
  italic: true,
  align: "center",
});

// Slide 6: Business Model Canvas
const slide6 = pres.addSlide();
slide6.background = { color: colors.darkBg };

slide6.addText("Business Model Canvas", {
  x: 0.5,
  y: 0.4,
  w: 9,
  h: 0.5,
  fontSize: 36,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.white,
  align: "left",
});

const canvasBoxWidth = 2.8;
const canvasBoxHeight = 1.8;
const canvasStartX = 0.5;
const canvasStartY = 1.1;
const canvasSpacingH = 0.25;
const canvasSpacingV = 0.2;

const canvasItems = [
  {
    title: "Key Partners",
    content:
      "HotellerieSuisse, PMS vendors (Mews, Canary), Tourism boards, JAKALA network",
    x: canvasStartX,
    y: canvasStartY,
  },
  {
    title: "Key Activities",
    content:
      "AI platform dev, Hotel onboarding, Data pipeline ops, Synthetic research",
    x: canvasStartX + canvasBoxWidth + canvasSpacingH,
    y: canvasStartY,
  },
  {
    title: "Value Proposition",
    content:
      "7-layer AI stack replacing 4-5 point solutions. One platform: read the market, understand guests, draft content.",
    x: canvasStartX + (canvasBoxWidth + canvasSpacingH) * 2,
    y: canvasStartY,
  },
  {
    title: "Customer Segments",
    content:
      "Swiss 4-5 star independents, Small luxury chains, Commercial directors + GMs",
    x: canvasStartX,
    y: canvasStartY + canvasBoxHeight + canvasSpacingV,
  },
  {
    title: "Revenue Streams",
    content:
      "SaaS EUR 1-5K/mo per property, Onboarding EUR 3-5K, Group rollout deals",
    x: canvasStartX + canvasBoxWidth + canvasSpacingH,
    y: canvasStartY + canvasBoxHeight + canvasSpacingV,
  },
  {
    title: "Channels",
    content:
      "Direct (Amedeo/Corsaro network), Association partnerships, Events + conferences",
    x: canvasStartX + (canvasBoxWidth + canvasSpacingH) * 2,
    y: canvasStartY + canvasBoxHeight + canvasSpacingV,
  },
  {
    title: "Cost Structure",
    content:
      "Cloud infra EUR 15-50/hotel/mo, Team (founder only Y1), Sales travel + events",
    x: canvasStartX,
    y: canvasStartY + (canvasBoxHeight + canvasSpacingV) * 2,
  },
];

canvasItems.forEach((item) => {
  // Box background
  slide6.addShape(pres.ShapeType.rect, {
    x: item.x,
    y: item.y,
    w: canvasBoxWidth,
    h: canvasBoxHeight,
    fill: { color: colors.cardBg },
    line: { color: colors.muted, width: 1 },
  });

  // Title
  slide6.addText(item.title, {
    x: item.x + 0.15,
    y: item.y + 0.1,
    w: canvasBoxWidth - 0.3,
    h: 0.35,
    fontSize: 12,
    fontFace: "Trebuchet MS",
    bold: true,
    color: colors.accent,
    align: "center",
  });

  // Content
  slide6.addText(item.content, {
    x: item.x + 0.15,
    y: item.y + 0.5,
    w: canvasBoxWidth - 0.3,
    h: canvasBoxHeight - 0.65,
    fontSize: 10,
    fontFace: "Calibri",
    color: colors.bodyText,
    align: "center",
    valign: "middle",
    breakLine: true,
  });
});

// Slide 7: Product Architecture - 7-Layer Stack
const slide7 = pres.addSlide();
slide7.background = { color: colors.darkBg };

slide7.addText("The 7-Layer AI Stack", {
  x: 0.5,
  y: 0.4,
  w: 9,
  h: 0.5,
  fontSize: 36,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.white,
  align: "left",
});

const layers = [
  { num: 1, title: "Market Intelligence", desc: "Comp set pricing, events, booking windows" },
  { num: 2, title: "Voice of Customer", desc: "Reviews across 6 languages, 4 platforms" },
  { num: 3, title: "Persona & Intent", desc: "Who books, why, what they expect" },
  { num: 4, title: "Competitive Reading", desc: "Your hotel vs. comp set, through guest eyes" },
  { num: 5, title: "AI Discovery", desc: "How ChatGPT/Gemini/Perplexity see you" },
  { num: 6, title: "Decision Engine", desc: "What matters this month, ranked" },
  { num: 7, title: "Content Engine", desc: "Pages, campaigns, multilingual assets" },
];

const layerHeight = 0.5;
const layerWidth = 8.5;
const layerStartX = 1;
const layerStartY = 1.1;
const layerSpacing = 0.1;

const shades = [
  "1A3A52",
  "1D4460",
  "204E6E",
  "23587C",
  "26628A",
  "296C98",
  "2C76A6",
];

layers.forEach((layer, idx) => {
  const yPos = layerStartY + idx * (layerHeight + layerSpacing);
  const bgColor = shades[idx];

  slide7.addShape(pres.ShapeType.rect, {
    x: layerStartX,
    y: yPos,
    w: layerWidth,
    h: layerHeight,
    fill: { color: bgColor },
    line: { color: colors.muted, width: 1 },
  });

  slide7.addText(`${layer.num}. ${layer.title}`, {
    x: layerStartX + 0.2,
    y: yPos + 0.05,
    w: 2.5,
    h: layerHeight - 0.1,
    fontSize: 12,
    fontFace: "Trebuchet MS",
    bold: true,
    color: colors.accent,
    valign: "middle",
  });

  slide7.addText(layer.desc, {
    x: layerStartX + 2.8,
    y: yPos + 0.05,
    w: layerWidth - 3,
    h: layerHeight - 0.1,
    fontSize: 11,
    fontFace: "Calibri",
    color: colors.bodyText,
    valign: "middle",
  });
});

slide7.addText(
  "The AI reads, analyzes, decides, drafts. The human reviews, adjusts, approves, publishes.",
  {
    x: 0.5,
    y: 5.0,
    w: 9,
    h: 0.5,
    fontSize: 12,
    fontFace: "Calibri Light",
    color: colors.muted,
    italic: true,
    align: "center",
  }
);

// Slide 8: Unit Economics
const slide8 = pres.addSlide();
slide8.background = { color: colors.darkBg };

slide8.addText("Unit Economics", {
  x: 0.5,
  y: 0.4,
  w: 9,
  h: 0.5,
  fontSize: 36,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.white,
  align: "left",
});

const kpiData = [
  { label: "Full pricing", value: "EUR 2,000/mo" },
  { label: "PoV tier", value: "EUR 1-1.5K" },
  { label: "Gross Margin", value: "97%+" },
  { label: "Monthly burn", value: "CHF 8,850" },
  { label: "Breakeven", value: "5-7 hotels" },
  { label: "Seed need", value: "CHF 120-150K" },
];

const kpiWidth = 2.8;
const kpiHeight = 1.2;
const kpiStartX = 0.5;
const kpiStartY = 1.2;
const kpiSpacingH = 0.3;
const kpiSpacingV = 0.3;

kpiData.forEach((kpi, idx) => {
  const row = Math.floor(idx / 3);
  const col = idx % 3;
  const kpiX = kpiStartX + col * (kpiWidth + kpiSpacingH);
  const kpiY = kpiStartY + row * (kpiHeight + kpiSpacingV);

  slide8.addShape(pres.ShapeType.rect, {
    x: kpiX,
    y: kpiY,
    w: kpiWidth,
    h: kpiHeight,
    fill: { color: colors.cardBg },
    line: { color: colors.muted, width: 1 },
  });

  slide8.addText(kpi.label, {
    x: kpiX,
    y: kpiY + 0.15,
    w: kpiWidth,
    h: 0.35,
    fontSize: 12,
    fontFace: "Trebuchet MS",
    bold: true,
    color: colors.accent,
    align: "center",
  });

  slide8.addText(kpi.value, {
    x: kpiX,
    y: kpiY + 0.5,
    w: kpiWidth,
    h: 0.55,
    fontSize: 14,
    fontFace: "Calibri",
    bold: true,
    color: colors.white,
    align: "center",
    valign: "middle",
  });
});

slide8.addText(
  "Annual logo churn: 5-10%. COGS per hotel: EUR 15-50/mo (LLM inference + data).",
  {
    x: 0.5,
    y: 3.5,
    w: 9,
    h: 0.4,
    fontSize: 13,
    fontFace: "Calibri",
    color: colors.bodyText,
    align: "center",
  }
);

slide8.addText(
  "Breakeven at 5-7 hotels. At 10 hotels: CHF 9,350/mo surplus. At 20 hotels: CHF 27,550/mo.",
  {
    x: 0.5,
    y: 4.8,
    w: 9,
    h: 0.4,
    fontSize: 12,
    fontFace: "Calibri Light",
    color: colors.accent,
    italic: true,
    align: "center",
  }
);

// Slide 9: Financial Projections - Operator-Seeded
const slide9 = pres.addSlide();
slide9.background = { color: colors.darkBg };

slide9.addText("Operator-Seeded Scenario", {
  x: 0.5,
  y: 0.4,
  w: 9,
  h: 0.5,
  fontSize: 36,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.white,
  align: "left",
});

slide9.addText(
  "CHF 120-150K seed. No institutional VC. 10,000 Monte Carlo simulations.",
  {
    x: 0.5,
    y: 0.95,
    w: 9,
    h: 0.35,
    fontSize: 12,
    fontFace: "Calibri Light",
    color: colors.muted,
    italic: true,
  }
);

const projTable1 = [
  ["Metric", "P10", "P50", "P90"],
  ["Hotels M12", "22", "30", "39"],
  ["Hotels M18", "36", "47", "60"],
  ["Hotels M36", "92", "115", "140"],
  ["ARR M36", "EUR 3.11M", "EUR 3.99M", "EUR 4.94M"],
  ["ARR M60", "EUR 7.05M", "EUR 9.21M", "EUR 11.85M"],
  ["Exit M60", "EUR 34.50M", "EUR 45.86M", "EUR 60.17M"],
];

const projRows1 = [];
projTable1.forEach((rowData, rowIdx) => {
  const row = [];
  rowData.forEach((cellData, cellIdx) => {
    if (rowIdx === 0) {
      row.push({
        text: cellData,
        fill: { color: colors.accent },
        color: colors.altBg,
        fontFace: "Trebuchet MS",
        bold: true,
        fontSize: 11,
      });
    } else {
      const cellColor =
        cellIdx === 2 ? colors.accent : colors.bodyText;
      row.push({
        text: cellData,
        color: cellColor,
        fill:
          rowIdx % 2 === 0
            ? { color: colors.cardBg }
            : { color: "0D1219" },
        fontSize: 11,
      });
    }
  });
  projRows1.push(row);
});

slide9.addTable(projRows1, {
  x: 1.5,
  y: 1.45,
  w: 7,
  h: 2.8,
  border: { pt: 1, color: colors.muted },
  rowH: 0.43,
  align: "center",
  valign: "middle",
  fontFace: "Calibri",
});

// Slide 10: Financial Projections - Follow-On Angel
const slide10 = pres.addSlide();
slide10.background = { color: colors.darkBg };

slide10.addText("Follow-On Angel Scenario", {
  x: 0.5,
  y: 0.4,
  w: 9,
  h: 0.5,
  fontSize: 36,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.white,
  align: "left",
});

slide10.addText(
  "Same seed + milestone-based angel tranche. CHF 150-300K follow-on.",
  {
    x: 0.5,
    y: 0.95,
    w: 9,
    h: 0.35,
    fontSize: 12,
    fontFace: "Calibri Light",
    color: colors.muted,
    italic: true,
  }
);

const projTable2 = [
  ["Metric", "P10", "P50", "P90"],
  ["Hotels M12", "26", "35", "45"],
  ["Hotels M18", "45", "58", "73"],
  ["Hotels M36", "124", "154", "187"],
  ["ARR M36", "EUR 4.24M", "EUR 5.33M", "EUR 6.63M"],
  ["ARR M60", "EUR 10.21M", "EUR 13.22M", "EUR 17.12M"],
  ["Exit M60", "EUR 50.69M", "EUR 67.39M", "EUR 88.41M"],
];

const projRows2 = [];
projTable2.forEach((rowData, rowIdx) => {
  const row = [];
  rowData.forEach((cellData, cellIdx) => {
    if (rowIdx === 0) {
      row.push({
        text: cellData,
        fill: { color: colors.accent },
        color: colors.altBg,
        fontFace: "Trebuchet MS",
        bold: true,
        fontSize: 11,
      });
    } else {
      const cellColor =
        cellIdx === 2 ? colors.accent : colors.bodyText;
      row.push({
        text: cellData,
        color: cellColor,
        fill:
          rowIdx % 2 === 0
            ? { color: colors.cardBg }
            : { color: "0D1219" },
        fontSize: 11,
      });
    }
  });
  projRows2.push(row);
});

slide10.addTable(projRows2, {
  x: 1.5,
  y: 1.45,
  w: 7,
  h: 2.8,
  border: { pt: 1, color: colors.muted },
  rowH: 0.43,
  align: "center",
  valign: "middle",
  fontFace: "Calibri",
});

slide10.addText(
  "3.1% probability of EUR 100M+ exit at month 60",
  {
    x: 0.5,
    y: 5.0,
    w: 9,
    h: 0.4,
    fontSize: 12,
    fontFace: "Calibri Light",
    color: colors.accent,
    italic: true,
    align: "center",
  }
);

// Slide 11: The Ask
const slide11 = pres.addSlide();
slide11.background = { color: colors.darkBg };

slide11.addText("The Ask", {
  x: 0.5,
  y: 0.4,
  w: 9,
  h: 0.5,
  fontSize: 36,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.white,
  align: "left",
});

// Left column: What I commit
slide11.addText("What I commit", {
  x: 0.5,
  y: 1.1,
  w: 4.2,
  h: 0.4,
  fontSize: 14,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.accent,
});

const commitments = [
  "Salary: CHF 4K/mo to start",
  "Escalation: 10 hotels = CHF 8K, 25 = CHF 12K, 50 = CHF 15K",
  "Full-time operator commitment from day one",
  "Lean company setup: burn stays disciplined until revenue scales",
  "Swiss AG in Zug (11.8% corporate tax)",
];

const commitmentText = commitments.join("\n");

slide11.addText(commitmentText, {
  x: 0.5,
  y: 1.55,
  w: 4.2,
  h: 3.5,
  fontSize: 12,
  fontFace: "Calibri",
  color: colors.bodyText,
  bullet: true,
  breakLine: true,
});

// Right column: What I need
slide11.addText("What I need", {
  x: 5.3,
  y: 1.1,
  w: 4.2,
  h: 0.4,
  fontSize: 14,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.accent,
});

const needs = [
  "1. CHF 120-150K seed capital",
  "2. Target access: 3-4 warm intros/month to hotel chains",
  "3. 60-day pilot commitment with one chain",
];

const needsText = needs.join("\n");

slide11.addText(needsText, {
  x: 5.3,
  y: 1.55,
  w: 4.2,
  h: 3.5,
  fontSize: 12,
  fontFace: "Calibri",
  color: colors.bodyText,
  bullet: true,
  breakLine: true,
});

slide11.addText(
  "Capital without clients is just a slower death. Your network IS the GTM.",
  {
    x: 0.5,
    y: 5.1,
    w: 9,
    h: 0.4,
    fontSize: 12,
    fontFace: "Calibri Light",
    color: colors.muted,
    italic: true,
    align: "center",
  }
);

// Slide 12: Next Steps + Closing
const slide12 = pres.addSlide();
slide12.background = { color: colors.altBg };

slide12.addText("Next Steps", {
  x: 0.5,
  y: 0.4,
  w: 9,
  h: 0.5,
  fontSize: 36,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.white,
  align: "left",
});

const milestones = [
  { week: "Week 1", action: "Evaluate MVP + existing team" },
  { week: "Week 2", action: "First pilot hotel onboarding" },
  { week: "Week 3-4", action: "Feedback loop + iterate" },
];

const milestoneBlockWidth = 2.8;
const milestoneBlockHeight = 1.2;
const milestoneStartX = 0.7;
const milestoneStartY = 1.3;
const milestoneSpacingH = 0.4;

milestones.forEach((m, idx) => {
  const mX = milestoneStartX + idx * (milestoneBlockWidth + milestoneSpacingH);

  slide12.addShape(pres.ShapeType.rect, {
    x: mX,
    y: milestoneStartY,
    w: milestoneBlockWidth,
    h: milestoneBlockHeight,
    fill: { color: colors.cardBg },
    line: { color: colors.accent, width: 2 },
  });

  slide12.addText(m.week, {
    x: mX,
    y: milestoneStartY + 0.1,
    w: milestoneBlockWidth,
    h: 0.35,
    fontSize: 12,
    fontFace: "Trebuchet MS",
    bold: true,
    color: colors.accent,
    align: "center",
  });

  slide12.addText(m.action, {
    x: mX + 0.15,
    y: milestoneStartY + 0.5,
    w: milestoneBlockWidth - 0.3,
    h: 0.6,
    fontSize: 11,
    fontFace: "Calibri",
    color: colors.bodyText,
    align: "center",
    valign: "middle",
    breakLine: true,
  });
});

slide12.addText("Quando incorporiamo? Quando incontro la catena pilota?", {
  x: 0.5,
  y: 2.8,
  w: 9,
  h: 0.4,
  fontSize: 14,
  fontFace: "Calibri",
  color: colors.accent,
  italic: true,
  align: "center",
});

slide12.addText("TERCIER", {
  x: 0.5,
  y: 3.4,
  w: 9,
  h: 0.6,
  fontSize: 36,
  fontFace: "Trebuchet MS",
  bold: true,
  color: colors.white,
  align: "center",
});

slide12.addText("tercier.ai", {
  x: 0.5,
  y: 4.0,
  w: 9,
  h: 0.35,
  fontSize: 16,
  fontFace: "Calibri",
  color: colors.accent,
  align: "center",
});

slide12.addText("Io sono pronto. Ci sono.", {
  x: 0.5,
  y: 4.5,
  w: 9,
  h: 0.5,
  fontSize: 14,
  fontFace: "Calibri",
  color: colors.muted,
  italic: true,
  align: "center",
});

// Write the file
pres.writeFile("tercier-deck-march-2026.pptx");
console.log("Presentation created successfully!");
