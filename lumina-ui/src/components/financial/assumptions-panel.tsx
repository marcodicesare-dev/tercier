'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/financial/ui/sheet';
import { ScrollArea } from '@/components/financial/ui/scroll-area';
import { Separator } from '@/components/financial/ui/separator';
import { Button } from '@/components/financial/ui/button';
import { Badge } from '@/components/financial/ui/badge';
import { Settings2, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { AssumptionSlider } from './assumption-slider';
import { useModel } from '@/components/financial/model-context';
import { DEFAULT_ASSUMPTIONS } from '@/lib/defaults';
import type { Assumptions } from '@/lib/financial-types';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1.5 text-[10px] font-medium uppercase tracking-widest text-[var(--mediterranean-gold)] hover:text-[var(--terracotta)]"
      >
        {title}
        <span className="text-stone-500">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="space-y-3 pb-3">{children}</div>}
    </div>
  );
}

export function AssumptionsPanel() {
  const { assumptions, setAssumptions, updateAssumption } = useModel();
  const [open, setOpen] = useState(false);

  const isDirty = JSON.stringify(assumptions) !== JSON.stringify(DEFAULT_ASSUMPTIONS);

  const reset = () => setAssumptions(DEFAULT_ASSUMPTIONS);

  const updateChain = (index: number, field: 'startMonth' | 'totalHotels', value: number) => {
    const chains = [...assumptions.chains];
    chains[index] = { ...chains[index], [field]: value };
    updateAssumption('chains', chains);
  };

  const updateTeam = (index: number, field: 'eurCost' | 'startMonth', value: number) => {
    const team = [...assumptions.team];
    team[index] = { ...team[index], [field]: value };
    updateAssumption('team', team);
  };

  const updateInfra = (index: number, tierIndex: number, value: number) => {
    const infra = [...assumptions.infrastructure];
    const tiers = [...infra[index].tiers] as [number, number, number, number];
    tiers[tierIndex] = value;
    infra[index] = { ...infra[index], tiers };
    updateAssumption('infrastructure', infra);
  };

  const updateAdmin = (index: number, tierIndex: number, value: number) => {
    const admin = [...assumptions.admin];
    const tiers = [...admin[index].tiers] as [number, number, number, number];
    tiers[tierIndex] = value;
    admin[index] = { ...admin[index], tiers };
    updateAssumption('admin', admin);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="fixed right-6 bottom-6 z-50 cursor-pointer rounded-full bg-[var(--terracotta)] p-3 text-white shadow-lg transition-colors hover:bg-[var(--deep-terracotta)]">
        <Settings2 className="h-5 w-5" />
        {isDirty && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />}
      </SheetTrigger>
      <SheetContent side="right" className="w-[420px] border-l border-stone-200 bg-[var(--warm-cream)] p-0">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--lumina-ink)]">Assumptions</h2>
            <p className="text-[10px] text-stone-500">Adjust any parameter — model recalculates instantly</p>
          </div>
          {isDirty && (
            <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs text-stone-500 hover:text-[var(--lumina-ink)]">
              <RotateCcw className="h-3 w-3 mr-1" /> Reset
            </Button>
          )}
        </div>
        <ScrollArea className="h-[calc(100vh-60px)]">
          <div className="px-4 py-3 space-y-1">

            {/* FX & Capital */}
            <Section title="FX Rates & Capital">
              <AssumptionSlider label="EUR/CHF" value={assumptions.eurChf} onChange={v => updateAssumption('eurChf', v)} min={0.80} max={1.10} step={0.0001} format={v => v.toFixed(4)} />
              <AssumptionSlider label="USD/CHF" value={assumptions.usdChf} onChange={v => updateAssumption('usdChf', v)} min={0.60} max={1.00} step={0.01} format={v => v.toFixed(2)} />
              <AssumptionSlider label="Initial Capital (CHF)" value={assumptions.capital} onChange={v => updateAssumption('capital', v)} min={100000} max={500000} step={10000} prefix="CHF " />
              <AssumptionSlider label="Model Duration (months)" value={assumptions.months} onChange={v => updateAssumption('months', v)} min={24} max={72} suffix=" mo" />
            </Section>
            <Separator className="bg-stone-200" />

            {/* ARPU */}
            <Section title="ARPU (EUR/hotel/month)">
              <div className="mb-1 text-[10px] text-stone-500">Chain ARPU</div>
              <AssumptionSlider label="Phase 1 (M1-23)" value={assumptions.chainArpu[1]} onChange={v => updateAssumption('chainArpu', { ...assumptions.chainArpu, 1: v })} min={500} max={2000} step={50} prefix="€" />
              <AssumptionSlider label="Phase 2 (M24-36)" value={assumptions.chainArpu[2]} onChange={v => updateAssumption('chainArpu', { ...assumptions.chainArpu, 2: v })} min={800} max={3000} step={50} prefix="€" />
              <AssumptionSlider label="Phase 3 (M37+)" value={assumptions.chainArpu[3]} onChange={v => updateAssumption('chainArpu', { ...assumptions.chainArpu, 3: v })} min={1000} max={4000} step={50} prefix="€" />
              <div className="mt-2 mb-1 text-[10px] text-stone-500">Indie ARPU</div>
              <AssumptionSlider label="Phase 1" value={assumptions.indieArpu[1]} onChange={v => updateAssumption('indieArpu', { ...assumptions.indieArpu, 1: v })} min={500} max={2500} step={50} prefix="€" />
              <AssumptionSlider label="Phase 2" value={assumptions.indieArpu[2]} onChange={v => updateAssumption('indieArpu', { ...assumptions.indieArpu, 2: v })} min={800} max={3500} step={50} prefix="€" />
              <AssumptionSlider label="Phase 3" value={assumptions.indieArpu[3]} onChange={v => updateAssumption('indieArpu', { ...assumptions.indieArpu, 3: v })} min={1000} max={5000} step={50} prefix="€" />
              <Separator className="my-2 bg-stone-200" />
              <AssumptionSlider label="Phase 2 starts at month" value={assumptions.phase2Start} onChange={v => updateAssumption('phase2Start', v)} min={12} max={36} suffix=" mo" />
              <AssumptionSlider label="Phase 3 starts at month" value={assumptions.phase3Start} onChange={v => updateAssumption('phase3Start', v)} min={24} max={48} suffix=" mo" />
            </Section>
            <Separator className="bg-stone-200" />

            {/* Chains */}
            <Section title="Chain Schedule">
              {assumptions.chains.map((chain, i) => (
                <div key={i} className="space-y-2 rounded-2xl border border-stone-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[var(--lumina-ink)]">{chain.name}</span>
                    <Badge variant="secondary" className="text-[9px] h-4">{chain.totalHotels} hotels</Badge>
                  </div>
                  <AssumptionSlider label="Start month" value={chain.startMonth} onChange={v => updateChain(i, 'startMonth', v)} min={1} max={48} suffix="" />
                  <AssumptionSlider label="Total hotels" value={chain.totalHotels} onChange={v => updateChain(i, 'totalHotels', v)} min={10} max={200} />
                </div>
              ))}
            </Section>
            <Separator className="bg-stone-200" />

            {/* Indies */}
            <Section title="Independent Hotels">
              <AssumptionSlider label="Start month" value={assumptions.indieStartMonth} onChange={v => updateAssumption('indieStartMonth', v)} min={1} max={18} suffix=" mo" />
              <AssumptionSlider label="Base acquisition rate" value={assumptions.indieBaseRate} onChange={v => updateAssumption('indieBaseRate', v)} min={1} max={10} suffix="/mo" />
              <AssumptionSlider label="YoY growth rate" value={assumptions.indieGrowthYoY} onChange={v => updateAssumption('indieGrowthYoY', v)} min={0} max={0.50} step={0.01} format={v => `${(v * 100).toFixed(0)}%`} />
              <AssumptionSlider label="Annual churn rate" value={assumptions.indieChurnAnnual} onChange={v => updateAssumption('indieChurnAnnual', v)} min={0.02} max={0.30} step={0.01} format={v => `${(v * 100).toFixed(0)}%`} />
            </Section>
            <Separator className="bg-stone-200" />

            {/* CEO */}
            <Section title="CEO Salary & Step-ups">
              <AssumptionSlider label="Base salary (CHF/yr)" value={assumptions.ceoBaseSalary} onChange={v => updateAssumption('ceoBaseSalary', v)} min={80000} max={200000} step={1000} prefix="CHF " />
              {assumptions.ceoStepUps.map((su, i) => (
                <div key={i} className="space-y-2 rounded-2xl border border-stone-200 bg-white p-3">
                  <span className="text-[10px] text-stone-500">Step-up {i + 1}</span>
                  <AssumptionSlider label="ARR threshold (EUR)" value={su.arrThresholdEur} onChange={v => {
                    const stepUps = [...assumptions.ceoStepUps];
                    stepUps[i] = { ...stepUps[i], arrThresholdEur: v };
                    updateAssumption('ceoStepUps', stepUps);
                  }} min={100000} max={5000000} step={50000} prefix="€" />
                  <AssumptionSlider label="New salary (CHF/yr)" value={su.salary} onChange={v => {
                    const stepUps = [...assumptions.ceoStepUps];
                    stepUps[i] = { ...stepUps[i], salary: v };
                    updateAssumption('ceoStepUps', stepUps);
                  }} min={100000} max={300000} step={5000} prefix="CHF " />
                </div>
              ))}
            </Section>
            <Separator className="bg-stone-200" />

            {/* Team */}
            <Section title="Team">
              {assumptions.team.map((member, i) => (
                <div key={i} className="space-y-2 rounded-2xl border border-stone-200 bg-white p-3">
                  <span className="text-[11px] font-medium text-[var(--lumina-ink)]">{member.label.split('(')[0].trim()}</span>
                  <AssumptionSlider label="EUR/month" value={member.eurCost} onChange={v => updateTeam(i, 'eurCost', v)} min={1000} max={15000} step={500} prefix="€" />
                  <AssumptionSlider label="Start month" value={member.startMonth} onChange={v => updateTeam(i, 'startMonth', v)} min={1} max={48} />
                </div>
              ))}
            </Section>
            <Separator className="bg-stone-200" />

            {/* AI & Infra */}
            <Section title="AI COGS & Dev Tooling">
              <AssumptionSlider label="AI COGS (EUR/hotel/month)" value={assumptions.aiCogsPerHotelEur} onChange={v => updateAssumption('aiCogsPerHotelEur', v)} min={10} max={150} step={5} prefix="€" />
              {assumptions.devTooling.map((tool, i) => (
                <AssumptionSlider key={i} label={tool.label} value={tool.usdCost} onChange={v => {
                  const devTooling = [...assumptions.devTooling];
                  devTooling[i] = { ...devTooling[i], usdCost: v };
                  updateAssumption('devTooling', devTooling);
                }} min={0} max={500} step={10} prefix="$" />
              ))}
            </Section>
            <Separator className="bg-stone-200" />

            {/* Infrastructure SaaS */}
            <Section title="Infrastructure (USD/mo by tier)">
              {assumptions.infrastructure.map((infra, i) => (
                <div key={i} className="space-y-1">
                  <span className="text-[10px] text-stone-500">{infra.label}</span>
                  <div className="grid grid-cols-4 gap-1">
                    {infra.tiers.map((tier, ti) => (
                      <div key={ti} className="text-center">
                        <span className="block text-[8px] text-stone-500">T{ti + 1}</span>
                        <input
                          type="number"
                          value={tier}
                          onChange={e => updateInfra(i, ti, Number(e.target.value))}
                          className="h-6 w-full rounded border border-stone-200 bg-white text-center text-[10px] text-[var(--lumina-ink)] tabular-nums"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Section>
            <Separator className="bg-stone-200" />

            {/* Admin */}
            <Section title="Admin & Professional (CHF/mo by tier)">
              {assumptions.admin.map((adm, i) => (
                <div key={i} className="space-y-1">
                  <span className="text-[10px] text-stone-500">{adm.label}</span>
                  <div className="grid grid-cols-4 gap-1">
                    {adm.tiers.map((tier, ti) => (
                      <div key={ti} className="text-center">
                        <span className="block text-[8px] text-stone-500">T{ti + 1}</span>
                        <input
                          type="number"
                          value={tier}
                          onChange={e => updateAdmin(i, ti, Number(e.target.value))}
                          className="h-6 w-full rounded border border-stone-200 bg-white text-center text-[10px] text-[var(--lumina-ink)] tabular-nums"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Section>
            <Separator className="bg-stone-200" />

            {/* Workspace */}
            <Section title="Workspace (CHF)">
              <AssumptionSlider label="Internet (CHF/mo)" value={assumptions.wsInternet} onChange={v => updateAssumption('wsInternet', v)} min={0} max={200} step={10} prefix="CHF " />
              {['M1-12', 'M13-24', 'M25-36', 'M37+'].map((lbl, ti) => (
                <AssumptionSlider key={ti} label={`Coworking ${lbl}`} value={assumptions.wsCoworking[ti]} onChange={v => {
                  const ws = [...assumptions.wsCoworking] as [number, number, number, number];
                  ws[ti] = v;
                  updateAssumption('wsCoworking', ws);
                }} min={0} max={2000} step={50} prefix="CHF " />
              ))}
            </Section>
            <Separator className="bg-stone-200" />

            {/* S&M */}
            <Section title="Sales & Marketing (CHF)">
              {['M1-12', 'M13-24', 'M25-36', 'M37+'].map((lbl, ti) => (
                <div key={ti}>
                  <AssumptionSlider label={`Travel ${lbl}`} value={assumptions.smTravel[ti]} onChange={v => {
                    const t = [...assumptions.smTravel] as [number, number, number, number];
                    t[ti] = v;
                    updateAssumption('smTravel', t);
                  }} min={0} max={5000} step={100} prefix="CHF " />
                  <AssumptionSlider label={`Marketing ${lbl}`} value={assumptions.smMarketing[ti]} onChange={v => {
                    const t = [...assumptions.smMarketing] as [number, number, number, number];
                    t[ti] = v;
                    updateAssumption('smMarketing', t);
                  }} min={0} max={10000} step={100} prefix="CHF " />
                </div>
              ))}
            </Section>
            <Separator className="bg-stone-200" />

            {/* Variable */}
            <Section title="Variable Costs">
              <AssumptionSlider label="Processing rate (Stripe)" value={assumptions.processingRate} onChange={v => updateAssumption('processingRate', v)} min={0.01} max={0.05} step={0.005} format={v => `${(v * 100).toFixed(1)}%`} />
              <AssumptionSlider label="Contingency (CHF/mo)" value={assumptions.contingency} onChange={v => updateAssumption('contingency', v)} min={0} max={1000} step={50} prefix="CHF " />
            </Section>
            <Separator className="bg-stone-200" />

            {/* One-time */}
            <Section title="One-Time Costs (M1, CHF)">
              {assumptions.oneTimeCosts.map((ot, i) => (
                <AssumptionSlider key={i} label={ot.label} value={ot.amount} onChange={v => {
                  const costs = [...assumptions.oneTimeCosts];
                  costs[i] = { ...costs[i], amount: v };
                  updateAssumption('oneTimeCosts', costs);
                }} min={0} max={ot.amount * 3} step={50} prefix="CHF " />
              ))}
            </Section>

            <div className="h-8" />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
