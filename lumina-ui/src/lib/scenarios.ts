import type { Scenario } from './financial-types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'bootstrapped',
    name: 'Bootstrapped',
    description: 'CHF 200K initial capital only. All growth funded from revenue. No dilution.',
    fundingRounds: [],
    growthModifier: 1.0,
    teamAccelerator: 0,
  },
  {
    id: 'series_a',
    name: 'Series A',
    description: 'CHF 200K initial + Series A at ~M18-24. Accelerated hiring and marketing.',
    fundingRounds: [
      {
        name: 'Series A',
        timingMonth: 21,
        amountChf: 6_000_000,
        preMoneyMultiple: 15,
        dilution: 0.20,
      },
    ],
    growthModifier: 1.3,
    teamAccelerator: 3,
  },
  {
    id: 'series_ab',
    name: 'Series A + B',
    description: 'Series A at ~M18-24, Series B at ~M36-42. International expansion.',
    fundingRounds: [
      {
        name: 'Series A',
        timingMonth: 21,
        amountChf: 6_000_000,
        preMoneyMultiple: 15,
        dilution: 0.20,
      },
      {
        name: 'Series B',
        timingMonth: 39,
        amountChf: 20_000_000,
        preMoneyMultiple: 12,
        dilution: 0.18,
      },
    ],
    growthModifier: 1.5,
    teamAccelerator: 6,
  },
  {
    id: 'full_vc',
    name: 'Full VC (A+B+C)',
    description: 'Series A → B → C. Targeting CHF 500M+ valuation at M48-60.',
    fundingRounds: [
      {
        name: 'Series A',
        timingMonth: 21,
        amountChf: 6_000_000,
        preMoneyMultiple: 15,
        dilution: 0.20,
      },
      {
        name: 'Series B',
        timingMonth: 39,
        amountChf: 20_000_000,
        preMoneyMultiple: 12,
        dilution: 0.18,
      },
      {
        name: 'Series C',
        timingMonth: 51,
        amountChf: 50_000_000,
        preMoneyMultiple: 10,
        dilution: 0.15,
      },
    ],
    growthModifier: 2.0,
    teamAccelerator: 9,
  },
];
