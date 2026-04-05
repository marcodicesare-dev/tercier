// Currency conversion helpers
// EUR/CHF = 0.9224 means 1 EUR = 0.9224 CHF (EUR is weaker, number gets SMALLER)
// USD/CHF = 0.80 means 1 USD = 0.80 CHF (USD is weaker, number gets SMALLER)

export function eurToChf(eur: number, rate: number): number {
  return Math.round(eur * rate);
}

export function usdToChf(usd: number, rate: number): number {
  return Math.round(usd * rate);
}

export function chfToEur(chf: number, rate: number): number {
  return chf / rate;
}

export function chfToUsd(chf: number, rate: number): number {
  return chf / rate;
}
