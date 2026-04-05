'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/financial/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/financial/ui/tabs';
import { Badge } from '@/components/financial/ui/badge';
import { Separator } from '@/components/financial/ui/separator';
import { MetricCard } from '@/components/financial/metric-card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { calcScenarios, calcPreExitSavings, getLifestyle, getTravelExamples } from '@/lib/post-exit';
import { fmtChf } from '@/lib/format';

const SCENARIOS = calcScenarios();
const SAVINGS = calcPreExitSavings();
const COLORS = ['#8B4A2B', '#C17F59', '#C9A96E', '#6B8E5A', '#5B7FB5'];
const LABELS = ['CHF 5M', 'CHF 10M', 'CHF 20M', 'CHF 30M', 'CHF 40M'];

export default function PostExitPage() {
  const [active, setActive] = useState(2); // default to Scenario C (20M)
  const s = SCENARIOS[active];
  const lifestyle = getLifestyle(s.exitProceeds);
  const travel = getTravelExamples(s.exitProceeds);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-cream)]">Post-Exit Reality Check</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Marco Di Cesare, 38, Zurich Wiedikon. Just exited Tercier AG. What does life actually look like?
        </p>
      </div>

      {/* Scenario selector */}
      <div className="flex gap-2">
        {SCENARIOS.map((sc, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`flex-1 py-3 px-2 rounded-lg text-center transition-all duration-200 border ${
              active === i
                ? 'border-[var(--color-terracotta)] bg-[var(--card)] shadow-lg shadow-[var(--color-terracotta)]/10'
                : 'border-[var(--border)] bg-[var(--color-ink)] hover:border-[var(--color-deep-terracotta)]'
            }`}
          >
            <div className="text-xs text-[var(--color-muted-foreground)]">Scenario {sc.label}</div>
            <div className={`text-lg font-bold ${active === i ? 'text-[var(--color-terracotta)]' : 'text-[var(--color-cream)]'}`}>
              {LABELS[i]}
            </div>
          </button>
        ))}
      </div>

      {/* Numbers Dashboard */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-gold)]">The Numbers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {[
              ['Exit proceeds', fmtChf(s.exitProceeds), 'text-[var(--color-terracotta)]'],
              ['+ Pre-exit savings', fmtChf(SAVINGS.total), ''],
              ['= Total liquid net worth', fmtChf(s.totalLiquid), 'text-[var(--color-gold)] text-lg font-bold'],
              ['Annual wealth tax (Zurich)', fmtChf(s.wealthTaxAnnual), 'text-red-400'],
              ['Passive income @ 3% (bonds)', `${fmtChf(s.passive3pct)}/yr`, ''],
              ['Passive income @ 5% (ETF)', `${fmtChf(s.passive5pct)}/yr`, 'text-green-400'],
              ['Passive income @ 7% (growth)', `${fmtChf(s.passive7pct)}/yr`, 'text-green-400'],
              ['Wife\'s net salary', `${fmtChf(s.wifeNetSalary)}/yr`, ''],
              ['Total annual (5% + wife)', `${fmtChf(s.totalAnnual5pct)}/yr`, 'text-[var(--color-gold)] text-lg font-bold'],
            ].map(([label, value, cls], i) => (
              <div key={i} className={`flex justify-between py-1 ${i === 2 || i === 8 ? 'border-t border-[var(--border)] pt-2' : ''}`}>
                <span className="text-sm text-[var(--color-muted-foreground)]">{label}</span>
                <span className={`text-sm font-mono tabular-nums ${cls || 'text-[var(--color-cream)]'}`}>{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Passive income comparison */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Annual Passive Income by Scenario (5% return)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={SCENARIOS.map((sc, i) => ({ name: LABELS[i], income: sc.passive5pct, active: i === active }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3A3028" />
              <XAxis dataKey="name" tick={{ fill: '#A89A8C', fontSize: 12 }} />
              <YAxis tick={{ fill: '#A89A8C', fontSize: 11 }} tickFormatter={v => fmtChf(v)} />
              <Tooltip contentStyle={{ background: '#2A2018', border: '1px solid #3A3028', borderRadius: 8 }} formatter={(v: any) => fmtChf(Number(v))} />
              <Bar dataKey="income" name="Passive income">
                {SCENARIOS.map((_, i) => (
                  <Cell key={i} fill={i === active ? '#C17F59' : '#3A3028'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* What Life ACTUALLY Looks Like */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-[var(--color-gold)]">What Does Life Actually Look Like?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* The Feel */}
          <div className="bg-[var(--color-ink)] rounded-lg p-4 border border-[var(--color-deep-terracotta)]">
            <p className="text-sm leading-relaxed text-[var(--color-cream)]">{lifestyle.feel}</p>
          </div>

          {/* Travel */}
          <div>
            <h3 className="text-sm font-bold text-[var(--color-terracotta)] mb-3">Travel — {fmtChf(lifestyle.travel)}/year</h3>
            <div className="space-y-2">
              {travel.map((t, i) => (
                <div key={i} className="flex justify-between items-start py-2 border-b border-[var(--border)]">
                  <div>
                    <span className="text-sm font-medium text-[var(--color-cream)]">{t.trip}</span>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{t.details}</p>
                  </div>
                  <span className="text-sm font-mono text-[var(--color-gold)] whitespace-nowrap ml-4">{fmtChf(t.cost)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold">
                <span className="text-sm text-[var(--color-cream)]">Total travel budget</span>
                <span className="text-sm font-mono text-[var(--color-terracotta)]">{fmtChf(travel.reduce((s, t) => s + t.cost, 0))}</span>
              </div>
            </div>
          </div>

          {/* Daily Life */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-terracotta)] mb-2">Dining — {fmtChf(lifestyle.dining)}/year</h3>
              <div className="text-xs text-[var(--color-muted-foreground)] space-y-1">
                <p>Casual lunch: CHF 30-40pp (Hiltl buffet CHF 28-38, bistro lunch CHF 25-35)</p>
                <p>Nice dinner out: CHF 200-300/couple (Kronenhalle mains CHF 45-65 + wine ~CHF 150pp, Brasserie Lipp ~CHF 130pp)</p>
                <p>Fine dining: CHF 600-900/couple (The Restaurant tasting CHF 320 + wine pairing CHF 180, Widder tasting CHF 280 + pairing CHF 160)</p>
                <p>Frequency: {s.exitProceeds >= 20_000_000 ? '2-3 nice dinners/week, fine dining monthly' : s.exitProceeds >= 10_000_000 ? '1-2 nice dinners/week, fine dining every few months' : 'Nice dinner weekly, fine dining for occasions'}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-terracotta)] mb-2">Car</h3>
              <p className="text-xs text-[var(--color-muted-foreground)]">{lifestyle.car}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-terracotta)] mb-2">Spontaneity</h3>
              <p className="text-xs text-[var(--color-muted-foreground)]">{lifestyle.spontaneity}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-terracotta)] mb-2">Giving & Generosity</h3>
              <p className="text-xs text-[var(--color-muted-foreground)]">{lifestyle.giving}</p>
            </div>
          </div>

          {/* Wellness */}
          <div>
            <h3 className="text-sm font-bold text-[var(--color-terracotta)] mb-2">Wellness & Fitness</h3>
            <div className="text-xs text-[var(--color-muted-foreground)] space-y-0.5">
              <p>Personal trainer: CHF 120-180/session. 2x/week = ~CHF 15,600/yr</p>
              <p>Premium gym (David Lloyd/Aspria tier): CHF 250-350/mo = ~CHF 3,300/yr</p>
              <p>Dolder Grand Spa day: CHF 290 (weekday) / CHF 460 (weekend)</p>
              <p>{s.exitProceeds >= 20_000_000 ? 'At your level: PT 2x/week, premium gym, quarterly spa days. Total ~CHF 21K/yr. Feels like nothing.' : s.exitProceeds >= 10_000_000 ? 'PT 2x/week and premium gym. Total ~CHF 19K/yr. Comfortable spend.' : 'PT 1-2x/week, regular gym. Total ~CHF 10-15K/yr. Budget consciously.'}</p>
            </div>
          </div>

          {/* Real Estate */}
          <div>
            <h3 className="text-sm font-bold text-[var(--color-terracotta)] mb-2">The Apartment Question</h3>
            <p className="text-sm text-[var(--color-cream)]">{lifestyle.realEstate}</p>
            {lifestyle.realEstateBudget > 0 && (
              <div className="mt-2 text-xs text-[var(--color-muted-foreground)]">
                <p>Zurich property reference prices (2026):</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Wiedikon 120m2: CHF 2.1-3.0M (avg CHF 21,300/m2)</li>
                  <li>Enge 120m2: CHF 2.2-3.1M (avg CHF 21,400/m2)</li>
                  <li>Seefeld 120m2: CHF 2.3-3.2M (avg CHF 22,500/m2)</li>
                  <li>Zürichberg 150m2: CHF 3.1-5M (avg CHF 20,600-23,500/m2)</li>
                  <li>St. Moritz: CHF 2.4-3.2M (CHF 20-27K/m2)</li>
                  <li>Pontresina: CHF 1.7-2.4M (CHF 14-20K/m2)</li>
                  <li>Ascona (Ticino): CHF 1.1-1.6M (avg CHF 10,900/m2)</li>
                  <li>Lake Como waterfront: EUR 600K-1.2M (EUR 10-15K/m2)</li>
                  <li>Liguria: EUR 420-720K (EUR 3.5-6K/m2, Portofino 8-15K)</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* What the Fuck Do I Do Next */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-[var(--color-gold)]">What the Fuck Do I Do Next?</CardTitle>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Marco is 38. Technical, analytical, wired to build. Not going to sit on a beach.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Clear recommendation */}
          <div className="bg-[var(--color-deep-terracotta)]/30 border border-[var(--color-terracotta)] rounded-lg p-4">
            <h3 className="text-sm font-bold text-[var(--color-terracotta)] mb-2">Recommendation at {LABELS[active]}</h3>
            <p className="text-sm text-[var(--color-cream)] leading-relaxed">{lifestyle.recommendation}</p>
          </div>

          {/* Paths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Take a Year Off */}
            <div className="bg-[var(--color-ink-light)] rounded-lg p-4">
              <h4 className="text-sm font-bold text-[var(--color-cream)] mb-2">Take a Year Off</h4>
              <p className="text-xs text-[var(--color-muted-foreground)] mb-2">
                Sabbatical budget: {fmtChf(lifestyle.travel + lifestyle.dining + 30000)} (travel + dining + hobbies/courses)
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Reality: most founders go crazy after 3 months. Plan for "structured freedom" — travel for 2-3 months, then have a project (writing, advising, learning something new). {s.exitProceeds >= 20_000_000 ? 'At your level, the year off is a genuine luxury — take it.' : 'Financially fine for a year, but you\'ll want income by month 12-18.'}
              </p>
            </div>

            {/* Angel Investor */}
            <div className="bg-[var(--color-ink-light)] rounded-lg p-4">
              <h4 className="text-sm font-bold text-[var(--color-cream)] mb-2">Angel Investor / Advisor</h4>
              <p className="text-xs text-[var(--color-muted-foreground)] mb-2">
                Angel budget (10% of NW): {fmtChf(lifestyle.angelBudget)} → {Math.round(lifestyle.angelBudget / 100000)} deals at CHF 100K each
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Advisory boards: CHF 30-80K/yr each, 2-4 days/month. Expected angel returns: most lose money. 1 in 10 returns 10x. Net ~2x over 7 years IF you're good. {lifestyle.angelBudget >= 2_000_000 ? 'You\'re a serious angel at this level — enough deals for portfolio theory to work.' : 'Small portfolio — high variance. Don\'t rely on this for returns.'}
              </p>
            </div>

            {/* Build Again */}
            <div className="bg-[var(--color-ink-light)] rounded-lg p-4">
              <h4 className="text-sm font-bold text-[var(--color-cream)] mb-2">Build Again</h4>
              <p className="text-xs text-[var(--color-muted-foreground)] mb-2">
                Self-fund seed: {fmtChf(Math.min(s.exitProceeds * 0.05, 2_000_000))} (5% of NW, capped at CHF 2M)
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Post-exit credibility is 10x higher. Fundraising is trivial. Another 4-5 years all-in = exit at 42-43. {s.exitProceeds >= 20_000_000 ? 'Building again is a CHOICE, not a necessity. That changes the psychology completely — you can take bigger swings, be more patient, and walk away if it\'s not working.' : 'You should build again — this is where the real wealth comes from. Use the Tercier exit as proof you can execute.'}
              </p>
            </div>

            {/* Join Something */}
            <div className="bg-[var(--color-ink-light)] rounded-lg p-4">
              <h4 className="text-sm font-bold text-[var(--color-cream)] mb-2">Join Something</h4>
              <p className="text-xs text-[var(--color-muted-foreground)] mb-2">
                VP/C-level: CHF 250-400K + equity. Best fits: CPO, CTO, "Head of AI" at Series B/C.
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                The ego question: can you work FOR someone after being CEO? {s.exitProceeds >= 10_000_000 ? 'At your wealth level, this only makes sense if the mission excites you or the equity upside is massive. Don\'t do it for the salary.' : 'This preserves optionality while keeping you sharp. Best option if you want steady income + structure.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wealth Preservation */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-[var(--color-gold)]">Wealth Preservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-bold text-[var(--color-terracotta)] mb-1">How to invest</h4>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {s.exitProceeds >= 20_000_000
                  ? 'At CHF 20M+, a private bank (Lombard Odier, Julius Baer, Pictet) makes sense — you get access to PE/VC co-investments, tax-loss harvesting, and structured products. Fee: 0.5-0.8%/yr on AUM. Below that, a simple ETF portfolio (60% MSCI World, 25% bonds, 15% Swiss equities) at a digital bank (Swissquote, Interactive Brokers) at 0.1-0.2% cost.'
                  : 'Keep it simple. 80% in a global ETF portfolio (VT or MSCI ACWI), 20% in Swiss government bonds. Total cost: 0.1-0.2%/yr. Rebalance annually. Don\'t pay 1%+ to a wealth manager for CHF 5-10M — the math doesn\'t work.'}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-[var(--color-terracotta)] mb-1">Wealth tax drag</h4>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Annual wealth tax: {fmtChf(s.wealthTaxAnnual)} ({((s.wealthTaxAnnual / s.totalLiquid) * 100).toFixed(2)}% effective rate). {s.wealthTaxAnnual > 50000 ? 'Worth optimizing with a Treuhand — pension buy-ins, real estate structuring, and charitable vehicles can reduce this.' : 'Not worth aggressive optimization at this level. Just pay it.'}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-[var(--color-terracotta)] mb-1">Pay off the mortgage?</h4>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Math says no — mortgage rate ~1.5-2% is less than investment returns (5-7%). Tax deductibility of mortgage interest makes it even better to keep it. But: {s.exitProceeds >= 10_000_000 ? '"zero debt" has psychological value post-exit. At your level, pay it off. The CHF 300-400K is noise. Sleep better.' : 'Keep the mortgage. The interest deduction reduces your income tax, and the freed-up capital earns more invested.'}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-[var(--color-terracotta)] mb-1">Capital gains — TAX FREE</h4>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Confirmed: Swiss private capital gains exemption. The exit proceeds are not taxed as income. This is Switzerland's gift to founders. The only tax is wealth tax on the assets going forward (~0.3-0.5%/yr in Zurich).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The Identity Question */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-[var(--color-gold)]">The Identity Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--color-cream)] leading-relaxed">
            After 4 years of "I'm the CEO of Tercier, we're disrupting hotel intelligence" — who is Marco at 38 with money in the bank and no title?
          </p>

          <div className="space-y-3">
            <div className="bg-[var(--color-ink)] rounded-lg p-4 border-l-2 border-[var(--color-terracotta)]">
              <h4 className="text-sm font-bold text-[var(--color-terracotta)]">The dinner party problem</h4>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                {s.exitProceeds <= 5_000_000
                  ? '"I\'m between things, exploring" — which in Zurich means "unemployed but doesn\'t want to say it." You need a project title within 6 months or the social pressure gets uncomfortable.'
                  : s.exitProceeds <= 10_000_000
                  ? '"I\'m an investor and advisor" — acceptable in Zurich, especially if you can name 2-3 companies. But it feels thin after being a builder.'
                  : '"I invest in and build companies" — which is what every rich person with no job says. But at CHF 20M+ with a real exit behind you, it carries weight. People will ask about Tercier, and the story tells itself.'}
              </p>
            </div>

            <div className="bg-[var(--color-ink)] rounded-lg p-4 border-l-2 border-[var(--color-gold)]">
              <h4 className="text-sm font-bold text-[var(--color-gold)]">The relationship with ambition</h4>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                Is the next thing about money, impact, status, or just needing to build? At {LABELS[active]}, the answer shifts: {s.exitProceeds <= 10_000_000
                  ? 'it\'s still partly about money. You\'re comfortable but not "set for generations" comfortable. The financial incentive to build again is real.'
                  : 'money isn\'t the driver anymore. The next thing is about impact, proving you can do it again, and honestly — because sitting still makes you miserable. That\'s okay. Channel it.'}
              </p>
            </div>

            <div className="bg-[var(--color-ink)] rounded-lg p-4 border-l-2 border-[var(--color-cream)]">
              <h4 className="text-sm font-bold text-[var(--color-cream)]">The fact that 38 is young as hell</h4>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                There are probably 2-3 more big professional chapters ahead. Bezos founded Amazon at 30. Reed Hastings pivoted Netflix to streaming at 47. Marc Benioff started Salesforce at 35. At 38 with a successful exit, capital, network, and technical chops — you're just getting started. The best founders often peak on their second or third company. This exit was the warm-up.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pre-exit savings breakdown */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Pre-Exit Savings Calculation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {SAVINGS.breakdown.map((line, i) => (
              <p key={i} className="text-xs text-[var(--color-muted-foreground)] font-mono">{line}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
