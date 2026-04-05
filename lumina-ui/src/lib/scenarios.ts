import type { Scenario } from './financial-types';

// Chain schedule logic:
// Bootstrapped: 10 chains from Amedeo/Corsaro JAKALA network only (limited by Marco being solo sales)
// Series A: +8 chains — hire 2 sales people, unlock lifestyle chains (citizenM, 25hours, Mama Shelter, etc.)
//           + faster rollout within existing chains (dedicated CS team)
// Series A+B: +15 chains — dedicated sales org, brand becomes "the standard", Middle East expansion
//             + data flywheel kicks in (more hotels = better AI = easier to sell)
// Full VC: +25 chains — category winner, 200+ countries, platform = operating system for hotel intelligence
//          + marketplace dynamics, network effects compound

export const SCENARIOS: Scenario[] = [
  {
    id: 'bootstrapped',
    name: 'Bootstrapped',
    description: 'CHF 200K seed. 10 chains from JAKALA network. Marco + small team. Profitable but growth-capped by sales capacity.',
    fundingRounds: [],
    growthModifier: 1.0,
    teamAccelerator: 0,
    additionalChains: [], // only the 10 base chains
    rolloutSpeedMultiplier: 1.0,
    arpuMultiplier: 1.0,
  },
  {
    id: 'series_a',
    name: 'Series A',
    description: 'Hire sales team → unlock lifestyle chains. Dedicated CS → faster rollouts. Phase 2 ARPU earlier.',
    fundingRounds: [
      { name: 'Series A', timingMonth: 21, amountChf: 6_000_000, preMoneyMultiple: 15, dilution: 0.20 },
    ],
    growthModifier: 2.0, // 2x indie rate (marketing + brand)
    teamAccelerator: 3,
    additionalChains: [
      // Lifestyle chains unlocked by sales team + brand credibility
      { name: 'citizenM', startMonth: 24, totalHotels: 28 },
      { name: '25hours Hotels', startMonth: 26, totalHotels: 14 },
      { name: 'Mama Shelter', startMonth: 28, totalHotels: 14 },
      { name: 'The Hoxton', startMonth: 30, totalHotels: 8 },
      // Premium chains from expanded JAKALA network
      { name: 'Aman', startMonth: 32, totalHotels: 34 },
      { name: 'Belmond', startMonth: 34, totalHotels: 46 },
      { name: 'Four Seasons', startMonth: 36, totalHotels: 55 },
      { name: 'Dorchester Collection', startMonth: 38, totalHotels: 10 },
    ],
    rolloutSpeedMultiplier: 1.2, // 20% faster rollout (dedicated CS)
    arpuMultiplier: 1.05, // slightly higher ARPU (better product from more eng investment)
  },
  {
    id: 'series_ab',
    name: 'Series A + B',
    description: 'Sales org + brand = "the standard." Data flywheel. Middle East + Asia expansion. 25+ chains.',
    fundingRounds: [
      { name: 'Series A', timingMonth: 21, amountChf: 6_000_000, preMoneyMultiple: 15, dilution: 0.20 },
      { name: 'Series B', timingMonth: 39, amountChf: 20_000_000, preMoneyMultiple: 12, dilution: 0.18 },
    ],
    growthModifier: 3.0, // 3x indie (brand + data flywheel + marketing budget)
    teamAccelerator: 6,
    additionalChains: [
      // Same as Series A
      { name: 'citizenM', startMonth: 24, totalHotels: 28 },
      { name: '25hours Hotels', startMonth: 26, totalHotels: 14 },
      { name: 'Mama Shelter', startMonth: 28, totalHotels: 14 },
      { name: 'The Hoxton', startMonth: 30, totalHotels: 8 },
      { name: 'Aman', startMonth: 32, totalHotels: 34 },
      { name: 'Belmond', startMonth: 34, totalHotels: 46 },
      { name: 'Four Seasons', startMonth: 36, totalHotels: 55 },
      { name: 'Dorchester Collection', startMonth: 38, totalHotels: 10 },
      // Post Series B — brand is established, inbound demand
      { name: 'Accor Luxury (Fairmont/Raffles/Sofitel)', startMonth: 40, totalHotels: 120 },
      { name: 'Minor Hotels (Anantara/NH)', startMonth: 42, totalHotels: 55 },
      { name: 'IHG Luxury (Regent/Kimpton)', startMonth: 44, totalHotels: 40 },
      { name: 'Marriott Luxury (Ritz-Carlton/W/Edition)', startMonth: 46, totalHotels: 80 },
      { name: 'Hilton Luxury (Waldorf/Conrad/LXR)', startMonth: 48, totalHotels: 60 },
      { name: 'Emaar Hospitality (Address/Vida)', startMonth: 50, totalHotels: 25 },
      { name: 'Banyan Tree', startMonth: 52, totalHotels: 35 },
    ],
    rolloutSpeedMultiplier: 1.4, // 40% faster (dedicated CS + proven playbook)
    arpuMultiplier: 1.10, // 10% higher ARPU (platform maturity + more features)
  },
  {
    id: 'full_vc',
    name: 'Full VC (A+B+C)',
    description: 'Category winner. Gold standard for hotel AI. 40+ chains. Platform = the operating system.',
    fundingRounds: [
      { name: 'Series A', timingMonth: 21, amountChf: 6_000_000, preMoneyMultiple: 15, dilution: 0.20 },
      { name: 'Series B', timingMonth: 39, amountChf: 20_000_000, preMoneyMultiple: 12, dilution: 0.18 },
      { name: 'Series C', timingMonth: 51, amountChf: 50_000_000, preMoneyMultiple: 10, dilution: 0.15 },
    ],
    growthModifier: 5.0, // 5x indie (category winner, inbound demand, data flywheel at scale)
    teamAccelerator: 9,
    additionalChains: [
      // All from Series A+B
      { name: 'citizenM', startMonth: 24, totalHotels: 28 },
      { name: '25hours Hotels', startMonth: 26, totalHotels: 14 },
      { name: 'Mama Shelter', startMonth: 28, totalHotels: 14 },
      { name: 'The Hoxton', startMonth: 30, totalHotels: 8 },
      { name: 'Aman', startMonth: 32, totalHotels: 34 },
      { name: 'Belmond', startMonth: 34, totalHotels: 46 },
      { name: 'Four Seasons', startMonth: 36, totalHotels: 55 },
      { name: 'Dorchester Collection', startMonth: 38, totalHotels: 10 },
      { name: 'Accor Luxury', startMonth: 40, totalHotels: 120 },
      { name: 'Minor Hotels', startMonth: 42, totalHotels: 55 },
      { name: 'IHG Luxury', startMonth: 44, totalHotels: 40 },
      { name: 'Marriott Luxury', startMonth: 46, totalHotels: 80 },
      { name: 'Hilton Luxury', startMonth: 48, totalHotels: 60 },
      { name: 'Emaar Hospitality', startMonth: 50, totalHotels: 25 },
      { name: 'Banyan Tree', startMonth: 52, totalHotels: 35 },
      // Post Series C — global expansion, 200+ countries
      { name: 'Hyatt full portfolio', startMonth: 52, totalHotels: 120 },
      { name: 'Pan Pacific / Parkroyal', startMonth: 54, totalHotels: 30 },
      { name: 'Langham', startMonth: 54, totalHotels: 20 },
      { name: 'Oberoi', startMonth: 56, totalHotels: 30 },
      { name: 'Taj Hotels', startMonth: 56, totalHotels: 60 },
      { name: 'Leela', startMonth: 58, totalHotels: 12 },
      { name: 'Oetker Collection', startMonth: 58, totalHotels: 12 },
      { name: 'Capella', startMonth: 60, totalHotels: 8 },
      { name: 'One&Only', startMonth: 60, totalHotels: 12 },
      { name: 'Six Senses', startMonth: 60, totalHotels: 18 },
    ],
    rolloutSpeedMultiplier: 1.6, // 60% faster (proven at scale + automated onboarding)
    arpuMultiplier: 1.15, // 15% higher ARPU (platform is the gold standard, pricing power)
  },
];
