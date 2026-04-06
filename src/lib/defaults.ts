import type { Assumptions, MonthData } from './types';

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  months: 48,
  eurChf: 0.9224,
  usdChf: 0.80,
  capital: 200_000,

  chainArpu: { 1: 1000, 2: 1400, 3: 1800 },
  indieArpu: { 1: 1000, 2: 1500, 3: 2000 },

  phase2Start: 24,
  phase3Start: 37,

  chains: [
    { name: 'Kempinski', startMonth: 1, totalHotels: 82 },
    { name: 'Radisson', startMonth: 12, totalHotels: 95 },
    { name: 'Barceló', startMonth: 16, totalHotels: 70 },
    { name: 'Mandarin Oriental', startMonth: 20, totalHotels: 36 },
    { name: 'Hyatt Luxury', startMonth: 24, totalHotels: 45 },
    { name: 'Jumeirah', startMonth: 28, totalHotels: 26 },
    { name: 'Meliá', startMonth: 32, totalHotels: 80 },
    { name: 'Rosewood', startMonth: 36, totalHotels: 30 },
    { name: 'Minor Hotels', startMonth: 40, totalHotels: 55 },
    { name: 'Rotana', startMonth: 44, totalHotels: 42 },
  ],
  trialMonths: 3,

  indieStartMonth: 7,
  indieBaseRate: 2,
  indieGrowthYoY: 0.20,
  indieChurnAnnual: 0.15, // 15% more realistic for SMB SaaS (was 12%)

  ceoBaseSalary: 106080,
  ceoSocialRates: {
    106080: 9737,
    150000: 13689,
    185000: 16817,
    220000: 19945,
  },
  ceoStepUps: [
    { arrThresholdEur: 300000, salary: 150000 },
    { arrThresholdEur: 1500000, salary: 185000 },
    { arrThresholdEur: 3000000, salary: 220000 },
  ],

  team: [
    // M1: Elise (dev, remote) + Person #2 (PM or dev, remote) — €4K each, within budget
    { key: 'dev', label: 'Elise — Dev FT remote (€4K/mo)', eurCost: 4000, startMonth: 1 },
    { key: 'pm', label: 'Person #2 — remote (€4K/mo)', eurCost: 4000, startMonth: 1 },
    // M12+: Hire #3 in Zurich — dev or product eng (CHF 8.5K ≈ €9.2K total company cost)
    { key: 'eng_zh', label: 'Engineer Zurich (CHF 8.5K/mo)', eurCost: 9200, startMonth: 12 },
    // M18+: Hire #4 in Zurich — senior eng or sales eng
    { key: 'seneng_zh', label: 'Senior Eng Zurich (CHF 10K/mo)', eurCost: 10800, startMonth: 18 },
    // M24+: Hire #5 — sales/BD, can be remote or Zurich
    { key: 'sales', label: 'Sales/BD (€6K/mo or CHF ~8K)', eurCost: 6000, startMonth: 24 },
    // M30+: Hire #6 in Zurich
    { key: 'eng2_zh', label: 'Engineer #2 Zurich (CHF 8.5K/mo)', eurCost: 9200, startMonth: 30 },
    // M36+: Hire #7 — marketing/growth
    { key: 'mktg', label: 'Marketing/Growth (€5K/mo)', eurCost: 5000, startMonth: 36 },
  ],

  aiCogsPerHotelEur: 50,

  devTooling: [
    { key: 'tool_claude', label: 'Claude Code Max 20x ($200)', usdCost: 200 },
    { key: 'tool_codex', label: 'OpenAI Codex Pro ($200)', usdCost: 200 },
    { key: 'tool_perplexity', label: 'Perplexity Max ($200)', usdCost: 200 },
  ],

  infrastructure: [
    { key: 'supabase', label: 'Supabase Pro + compute', tiers: [75, 110, 150, 200] },
    { key: 'vercel', label: 'Vercel Pro', tiers: [150, 200, 300, 400] },
    { key: 'dataforseo', label: 'DataForSEO usage', tiers: [75, 150, 200, 250] },
    { key: 'serpapi', label: 'SerpApi Developer', tiers: [75, 75, 150, 150] },
    { key: 'firecrawl', label: 'Firecrawl', tiers: [47, 47, 47, 47] },
    { key: 'google_ws', label: 'Google Workspace', tiers: [35, 50, 70, 70] },
    { key: 'domain_renew', label: 'Domain .ai renewal', tiers: [7, 7, 7, 7] },
    { key: 'onepassword', label: '1Password Business', tiers: [24, 40, 56, 64] },
    { key: 'canva', label: 'Canva Pro', tiers: [13, 13, 13, 13] },
    { key: 'sentry', label: 'Sentry monitoring', tiers: [26, 26, 26, 26] },
    { key: 'resend', label: 'Resend email', tiers: [20, 20, 20, 20] },
    { key: 'notion', label: 'Notion', tiers: [20, 30, 30, 30] },
    { key: 'cloudflare', label: 'Cloudflare Pro', tiers: [20, 20, 20, 20] },
    { key: 'slack', label: 'Slack Pro', tiers: [25, 40, 56, 64] },
    { key: 'github_actions', label: 'GitHub Actions (CI/CD)', tiers: [15, 20, 30, 40] },
    { key: 'upstash_redis', label: 'Upstash Redis (caching)', tiers: [10, 20, 30, 30] },
    { key: 'posthog', label: 'PostHog analytics', tiers: [0, 25, 50, 50] },
    { key: 'misc_overages', label: 'Misc SaaS + overages', tiers: [25, 30, 40, 50] },
  ],

  admin: [
    { key: 'treuhand', label: 'Treuhand / accounting', tiers: [300, 300, 500, 700] },
    { key: 'legal', label: 'Legal retainer', tiers: [250, 250, 300, 400] },
    { key: 'd_o', label: 'D&O insurance (CHF 1M cover)', tiers: [167, 167, 200, 250] },
    { key: 'cyber', label: 'Cyber insurance', tiers: [34, 34, 50, 75] },
    { key: 'liability', label: 'General liability insurance', tiers: [100, 100, 100, 100] },
    { key: 'banking', label: 'Banking + FX (UBS/Wise)', tiers: [30, 30, 50, 50] },
  ],

  wsInternet: 40,
  wsCoworking: [0, 350, 500, 700],

  smTravel: [400, 1000, 1500, 2000],
  smMarketing: [500, 1500, 2500, 3500],

  processingRate: 0.03,
  contingency: 300,

  oneTimeCosts: [
    { key: 'ot_nexova', label: 'Nexova AG Plus formation', amount: 690 },
    { key: 'ot_register', label: 'Commercial register entry', amount: 650 },
    { key: 'ot_notary_zh', label: 'Notary fee (Zurich tariff)', amount: 1500 },
    { key: 'ot_capital_dep', label: 'Capital deposit account', amount: 250 },
    { key: 'ot_signatures', label: 'Signature certifications', amount: 100 },
    { key: 'ot_macbook', label: 'MacBook Pro 16" M5 Pro 64GB/2TB', amount: 3700 },
    { key: 'ot_display', label: 'Apple Studio Display 2026', amount: 1290 },
    { key: 'ot_keyboard', label: 'Logitech MX Keys S', amount: 83 },
    { key: 'ot_mouse', label: 'Logitech MX Master 3S', amount: 69 },
    { key: 'ot_monitor_arm', label: 'Ergotron LX monitor arm', amount: 165 },
    { key: 'ot_legal', label: 'Legal (SHA, PSOP, contracts)', amount: 4000 },
    { key: 'ot_domain', label: 'Domain .ai (2yr reg)', amount: 128 },
  ],

  equity: {
    amedeo: 0.40,
    corsaro: 0.40,
    marcoBase: 0, // Marco starts at 0%, earns through vesting
    psopCap: 0.05, // off cap table (phantom)
  },

  // Exit kicker: Marco's PRE-DILUTION share at exit. Under €30M he gets his vested %.
  // Above thresholds, his share increases (pre-dilution, A/C/M relative split stays fixed).
  kicker: [
    { thresholdEur: 0, percentage: 0 }, // no kicker below €30M — just vested equity
    { thresholdEur: 30_000_000, percentage: 0.23 },
    { thresholdEur: 50_000_000, percentage: 0.25 },
    { thresholdEur: 100_000_000, percentage: 0.30 },
  ],

  vesting: [
    {
      month: 12,
      additionalPct: 0.05,
      condition: '15+ paying hotels',
      check: (d: MonthData) => d.totalPaying >= 15,
    },
    {
      month: 24,
      additionalPct: 0.07,
      condition: 'ARR ≥ €500K',
      check: (d: MonthData) => d.arrEur >= 500000,
    },
    {
      month: 36,
      additionalPct: 0.08,
      condition: 'ARR ≥ €1.5M',
      check: (d: MonthData) => d.arrEur >= 1500000,
    },
  ],

  zugTaxRate: 0.1959, // Incorporating in Zurich now, not Zug
  zurichTaxRate: 0.1959,
};
