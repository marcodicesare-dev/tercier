# Employer Cost Comparison: Hiring Remote Employees from a Swiss AG (Zug)

> Deep research for Tercier AG / Lumina -- April 2026
> Covers Italy, Portugal, Spain, Switzerland, EOR pricing, contractor vs employee

---

## Executive Summary

A Swiss AG in Zug hiring remote employees in EU countries faces three fundamental choices: (1) set up a local entity, (2) use an Employer of Record (EOR), or (3) engage contractors. Each country adds 25-45% on top of gross salary in mandatory employer contributions. Italy is the most expensive EU option at ~40-45% overhead; Portugal the cheapest at ~27%; Spain sits at ~31%. Switzerland itself costs ~15-20% in social charges but salaries are 2-3x higher. An EOR adds $199-$699/month per employee on top of all statutory costs.

**Bottom line for Lumina's planned team (7 roles, EUR 37,000/month gross):**
- Hiring in Italy via EOR: ~EUR 57,000-60,000/month total (gross + contributions + EOR fees)
- Hiring in Portugal via EOR: ~EUR 50,000-53,000/month total
- Hiring in Spain via EOR: ~EUR 52,000-55,000/month total
- Using contractors (if legally viable): ~EUR 37,000-39,000/month (gross only + contractor mgmt fees)

---

## 1. HIRING IN ITALY (Milan)

### 1.1 Italian Employer Social Contributions Breakdown

Italy has one of the highest employer contribution burdens in Europe. The exact rate depends on the applicable CCNL (Contratto Collettivo Nazionale di Lavoro -- the national collective bargaining agreement) and company characteristics, but the standard breakdown is:

| Component | Rate (% of gross) | Notes |
|-----------|-------------------|-------|
| **INPS pension (IVS)** | 23.81% | Core pension contribution |
| **INPS other** (unemployment, sickness, maternity, CIG, mobility) | ~6-8% | Varies by sector and company size |
| **INAIL** (workplace accident insurance) | 0.3-1.0% | Office workers ~0.4%, varies by CNAE risk class |
| **TFR accrual** (severance -- Trattamento di Fine Rapporto) | ~6.91% | Accrued monthly, paid at termination |
| **Total INPS + INAIL employer share** | **~29-32%** | Standard range for services/tech sector |
| **Total including TFR** | **~36-39%** | The real employer burden |

**Key clarification on 13th and 14th month salary:**

- **Tredicesima (13th month):** MANDATORY for all employees in Italy. Paid in December. It equals one month's gross salary divided across 12 months (already factored into annual RAL).
- **Quattordicesima (14th month):** NOT universally mandatory. Depends on the CCNL. The CCNL Commercio (retail/services) and CCNL Turismo mandate it. CCNL Metalmeccanico (engineering/IT) does NOT. If Lumina's employees fall under CCNL Commercio (likely for a SaaS company), the 14th month IS mandatory and is typically paid in June/July.

**Important:** When an Italian quotes "EUR 4,000/month gross" this is typically the RAL (Retribuzione Annua Lorda) divided by 13 or 14. If you agree EUR 4,000/month gross as a 12-month figure, the annual RAL = EUR 48,000, and the 13th month adds another EUR 4,000 (total payout = EUR 52,000 over the year). If CCNL requires 14th month, add another EUR 4,000 (total = EUR 56,000 payout, spread as 14 payslips).

### 1.2 Actual Employer Cost Calculations for Italy

**For EUR 4,000/month gross (e.g., Developer or PM):**

| Item | Monthly | Annual |
|------|---------|--------|
| Gross salary (12 months) | EUR 4,000 | EUR 48,000 |
| 13th month (mandatory) | EUR 333 | EUR 4,000 |
| 14th month (if CCNL requires) | EUR 333 | EUR 4,000 |
| **Adjusted monthly gross** | **EUR 4,667** | **EUR 56,000** |
| INPS employer (~30%) | EUR 1,400 | EUR 16,800 |
| INAIL (~0.4%) | EUR 19 | EUR 224 |
| TFR accrual (~6.91%) | EUR 322 | EUR 3,869 |
| **Total employer cost** | **~EUR 6,408** | **~EUR 76,893** |
| **Overhead vs base gross** | **~60%** | |
| **Overhead vs 12-month gross** | **~37-40%** (excl. 14th) | |

**For EUR 7,000/month gross (e.g., Senior Engineer):**

| Item | Monthly | Annual |
|------|---------|--------|
| Gross salary (12 months) | EUR 7,000 | EUR 84,000 |
| 13th month (mandatory) | EUR 583 | EUR 7,000 |
| 14th month (if CCNL requires) | EUR 583 | EUR 7,000 |
| **Adjusted monthly gross** | **EUR 8,167** | **EUR 98,000** |
| INPS employer (~30%) | EUR 2,450 | EUR 29,400 |
| INAIL (~0.4%) | EUR 33 | EUR 392 |
| TFR accrual (~6.91%) | EUR 564 | EUR 6,772 |
| **Total employer cost** | **~EUR 11,214** | **~EUR 134,564** |
| **Overhead vs base gross** | **~60%** | |

**CRITICAL NOTE:** The INPS/INAIL/TFR contributions are calculated on the FULL annual compensation including 13th and 14th months, not just the 12-month base. This is why the effective overhead is higher than the nominal 30-32%.

### 1.3 Can a Swiss AG Hire Directly in Italy?

**Short answer: Technically yes, but extremely risky without local infrastructure.**

A Swiss AG can technically hire an employee in Italy without a local entity, but this creates several serious problems:

1. **Permanent establishment (PE) risk:** Having an employee physically working in Italy, especially one who enters into contracts or acts on behalf of the company, can trigger a "fixed place of business" or "dependent agent" PE under the Italy-Switzerland DTA. If triggered, the Swiss AG becomes liable for Italian corporate taxes (IRES at 24% + IRAP at ~3.9%) on profits attributable to the Italian PE.

2. **Social security registration:** The Swiss AG must register with INPS as a foreign employer and remit Italian social security contributions. This requires obtaining an Italian fiscal code (codice fiscale) and registering as a "datore di lavoro."

3. **Employment law compliance:** Italian employment contracts must comply with Italian law, the applicable CCNL, and specific rules on dismissal protections (which are very strong in Italy).

4. **Practical recommendation:** For 1-3 employees, use an EOR. For 4+ employees with long-term plans, consider establishing an Italian SRL (limited liability company), which costs ~EUR 5,000-10,000 to set up and ~EUR 3,000-5,000/year in maintenance/accounting.

---

## 2. EMPLOYER OF RECORD (EOR) OPTIONS

### 2.1 Pricing Comparison (as of 2026)

| Provider | EOR Fee (per employee/month) | Contractor Mgmt | Setup Fee | Notes |
|----------|------------------------------|-----------------|-----------|-------|
| **RemoFirst** | **$199** | Free (or $25 for auto-pay) | None | Cheapest option. Covers 180+ countries. Basic but functional. |
| **Deel** | **$599** | $49/contractor/month | None | Market leader. Enterprise features. Misclassification shield. |
| **Remote.com** | **$599** | $29/contractor/month | None | Owns its own entities (no subcontracting). Strong IP protection. |
| **Papaya Global** | **$599** | $25+/contractor/month | None | Enterprise-focused. Strong analytics/reporting. |
| **Oyster HR** | **$699** | Free (limited plan) | None | Scale plan reduces to ~$550 for 3+ employees. Good UX. |
| **Playroll** | **$399** | $29/contractor/month | None | Mid-range option. |
| **Multiplier** | **$400** | $40/contractor/month | None | Good Asia-Pacific coverage. |
| **Globalization Partners (G-P)** | **~$599-$899** | Custom | Custom | Enterprise. Percentage-based in some cases. |

### 2.2 What's Included in EOR Fees

Standard EOR service fee typically includes:
- Legal employment in the target country (EOR is the legal employer)
- Locally compliant employment contracts
- Monthly payroll processing + tax withholding + social security remittance
- Statutory benefits administration (pension, health insurance as required by law)
- Payslip generation
- Employment law compliance
- Onboarding/offboarding support
- 24/7 platform access

**What's usually NOT included (paid separately):**
- The employee's gross salary (you fund this)
- All mandatory employer social contributions (you fund this)
- Supplementary benefits (private health insurance, meal vouchers)
- Equipment/hardware
- Visa/work permit processing (may cost extra $500-2,000)
- Equity/stock option administration (some charge extra)
- Termination/severance costs (if triggered by law)

### 2.3 EOR Cost Impact on Lumina's Team

For a team of 7 employees:

| EOR Provider | Monthly fee x 7 | Annual EOR cost |
|--------------|------------------|-----------------|
| RemoFirst | $1,393 (~EUR 1,280) | $16,716 (~EUR 15,360) |
| Deel | $4,193 (~EUR 3,853) | $50,316 (~EUR 46,240) |
| Remote.com | $4,193 (~EUR 3,853) | $50,316 (~EUR 46,240) |
| Oyster | $4,893 (~EUR 4,497) | $58,716 (~EUR 53,960) |

**At Deel rates, the EOR overhead alone is ~EUR 46K/year for 7 people.** RemoFirst saves ~EUR 31K/year vs Deel -- significant for a startup.

---

## 3. HIRING IN PORTUGAL

### 3.1 Portuguese Employer Contributions

Portugal has lower employer contributions than Italy or Spain:

| Component | Rate (% of gross) | Notes |
|-----------|-------------------|-------|
| **Seguranca Social (employer share)** | **23.75%** | Covers pensions, unemployment, sickness |
| Labour Accident Insurance | ~1.0-1.75% | Mandatory, via private insurer |
| Compensation Fund (Fundo de Compensacao) | 1.0% | For termination indemnities |
| Wage Guarantee Fund | 0.5% | Insolvency protection |
| **Total employer burden** | **~26-27%** | |

**Holiday/Christmas subsidy:** Portuguese law mandates a "subsidio de Natal" (Christmas subsidy) and "subsidio de ferias" (holiday subsidy), each equal to one month's salary. These are effectively 2 extra months, similar to Italy's 13th/14th.

### 3.2 Portugal Cost Calculations

**For EUR 4,000/month gross:**

| Item | Monthly | Annual |
|------|---------|--------|
| Gross salary (12 months) | EUR 4,000 | EUR 48,000 |
| Holiday subsidy (1 month) | EUR 333 | EUR 4,000 |
| Christmas subsidy (1 month) | EUR 333 | EUR 4,000 |
| **Adjusted monthly gross** | **EUR 4,667** | **EUR 56,000** |
| Seguranca Social employer (23.75%) | EUR 1,108 | EUR 13,300 |
| Accident insurance (~1.25%) | EUR 58 | EUR 700 |
| Compensation + guarantee funds (1.5%) | EUR 70 | EUR 840 |
| **Total employer cost** | **~EUR 5,904** | **~EUR 70,840** |
| **Overhead vs base gross** | **~48%** | |

**For EUR 7,000/month gross:**

| Item | Monthly | Annual |
|------|---------|--------|
| Gross salary (12 months) | EUR 7,000 | EUR 84,000 |
| Holiday + Christmas subsidies | EUR 1,167 | EUR 14,000 |
| **Adjusted monthly gross** | **EUR 8,167** | **EUR 98,000** |
| Seguranca Social employer (23.75%) | EUR 1,940 | EUR 23,275 |
| Accident insurance (~1.25%) | EUR 102 | EUR 1,225 |
| Compensation + guarantee funds (1.5%) | EUR 122 | EUR 1,470 |
| **Total employer cost** | **~EUR 10,331** | **~EUR 123,970** |
| **Overhead vs base gross** | **~48%** | |

### 3.3 Portugal Tax Advantages for Remote Workers

**The original NHR (Non-Habitual Resident) regime is CLOSED as of April 1, 2025.**

The replacement "IFICI" (NHR 2.0) regime offers:
- 20% flat income tax rate (for the employee, not employer savings)
- But eligibility is very restrictive: requires university degree (EQF Level 6+), work in science, technology, healthcare, green energy, or R&D sectors
- Applicant must not have been a Portuguese tax resident in the prior 5 years
- Benefits last 10 years

This benefits the *employee's* take-home pay (they pay 20% flat tax instead of progressive rates up to 48%), but does NOT reduce employer costs. It can help Lumina attract talent to Portugal at lower gross salaries since the net pay is higher.

---

## 4. HIRING IN SPAIN

### 4.1 Spanish Employer Contributions

Spain has the highest baseline employer contribution rate in Western Europe at approximately 30.57% of gross salary:

| Component | Rate (% of gross) | Notes |
|-----------|-------------------|-------|
| **Common contingencies** (healthcare + pensions) | 23.60% | Core contribution |
| **Unemployment** (permanent contract) | 5.50% | Higher for temporary: 7.05% |
| **Professional training** | 0.60% | |
| **FOGASA** (wage guarantee fund) | 0.20% | |
| **MEI** (Intergenerational Equity Mechanism) | 0.67% | Rising to 1.2% by 2029 |
| **Occupational accident insurance** | 1.0-3.0% | Varies by CNAE activity code; office work ~1.5% |
| **Total employer burden** | **~31-33%** | |

**Important Spanish specifics:**
- Spain mandates 14 salary payments per year (12 + 2 "pagas extraordinarias"). These are typically split: one in June, one in December.
- The maximum contribution base for 2025 is EUR 4,909.50/month. Salaries above this cap only pay contributions on the cap amount (plus a solidarity surcharge of ~0.83% on the excess).
- For EUR 7,000/month gross, the contribution base is effectively capped at EUR 4,909.50. This means the employer contribution rate effectively decreases as a percentage of total salary for high earners.

### 4.2 Spain Cost Calculations

**For EUR 4,000/month gross (under the contribution ceiling):**

| Item | Monthly | Annual |
|------|---------|--------|
| Gross salary (12 months) | EUR 4,000 | EUR 48,000 |
| 2 extra pagas | EUR 667 | EUR 8,000 |
| **Adjusted monthly gross** | **EUR 4,667** | **EUR 56,000** |
| Employer social security (~31%) | EUR 1,447 | EUR 17,360 |
| **Total employer cost** | **~EUR 6,113** | **~EUR 73,360** |
| **Overhead vs base gross** | **~53%** | |

**For EUR 7,000/month gross (above the contribution ceiling):**

| Item | Monthly | Annual |
|------|---------|--------|
| Gross salary (12 months) | EUR 7,000 | EUR 84,000 |
| 2 extra pagas | EUR 1,167 | EUR 14,000 |
| **Adjusted monthly gross** | **EUR 8,167** | **EUR 98,000** |
| Employer SS on capped base (~31% on EUR 4,909.50) | EUR 1,522 | EUR 18,264 |
| Solidarity surcharge on excess (~0.83%) | EUR 17 | EUR 208 |
| **Total employer cost** | **~EUR 9,706** | **~EUR 116,472** |
| **Overhead vs base gross** | **~39%** | The cap helps high earners |

**Note:** The contribution ceiling makes Spain more competitive for high-salary roles than Italy (which has a much higher ceiling of ~EUR 120,607/year).

---

## 5. CONTRACTORS vs. EMPLOYEES

### 5.1 Can Lumina Hire as Contractors?

**The short answer: it depends on the role, but full-time dedicated roles are extremely risky.**

### 5.2 Legal Risk by Country

**Italy -- VERY HIGH RISK:**
- Italy applies a "substance over form" test. If a contractor works exclusively for one client, uses company tools, follows company schedules, and is integrated into the organization, Italian authorities will reclassify them as an employee.
- Penalties: retroactive employer + employee social security contributions (back to day 1), 90% penalty on inaccurate tax returns, 20% penalty on improper tax withholding, and potential criminal penalties (fines up to EUR 50,000 and/or up to 3 years imprisonment for unpaid social security).
- The 2021 enforcement against gig platforms in Milan resulted in EUR 733M in fines for 60,000 misclassified workers.

**Spain -- VERY HIGH RISK:**
- Spain's "Inspection de Trabajo" is aggressive. The 2022 "Rider Law" introduced a presumption of employment for platform workers.
- Penalties: retroactive social security + interest + surcharges (30-150% penalty on unpaid contributions).

**Portugal -- HIGH RISK:**
- Similar substance-over-form approach. Single-client dependency is a major red flag.

**EU-wide: The EU Platform Worker Directive (transposition deadline 2026) will further strengthen worker protections and make misclassification enforcement stricter across all member states.**

### 5.3 When Contractors CAN Work

Contractors are legally defensible when:
- They serve multiple clients (not exclusively Lumina)
- They set their own hours and work methods
- They provide their own tools/equipment
- They bear business risk (fixed-price deliverables, not hourly)
- They have their own business entity (partita IVA in Italy, autonomo in Spain)
- The engagement is project-based with defined scope and end date

**Roles from Lumina's plan where contractor status is questionable:**
- Developer (full-time, dedicated): EMPLOYEE -- Cannot be a contractor
- PM (part-time): MAYBE contractor if they serve other clients
- CS/Implementation: EMPLOYEE -- Integrated into operations
- Senior Engineer: EMPLOYEE -- Full-time dedicated
- Sales/BD: EMPLOYEE -- Acts on behalf of the company
- Engineer: EMPLOYEE -- Full-time dedicated
- Marketing: MAYBE contractor if project-based deliverables

### 5.4 Cost Difference: Contractor vs Employee (Italy)

| Scenario | EUR 4,000/month | EUR 7,000/month |
|----------|-----------------|-----------------|
| **As employee (total employer cost)** | ~EUR 6,408/month | ~EUR 11,214/month |
| **As contractor (invoice only)** | EUR 4,000/month | EUR 7,000/month |
| **Savings** | ~EUR 2,408/month (38%) | ~EUR 4,214/month (38%) |
| **Risk if reclassified** | Backpay all contributions + penalties | Could be 2-3x the "savings" |

The contractor pays their own social security (~26% of income via "gestione separata INPS") and handles their own taxes. However, the company faces severe reclassification risk if the engagement looks like employment.

---

## 6. HIRING IN SWITZERLAND (for Comparison)

### 6.1 Swiss Employer Social Contributions

Swiss employer costs are much lower as a percentage, but salaries are 2-3x higher:

| Component | Rate (% of gross) | Notes |
|-----------|-------------------|-------|
| **AHV/IV/EO** (old-age, disability, income compensation) | 5.30% | Half of 10.6% total |
| **ALV** (unemployment insurance) | 1.10% | On salary up to CHF 148,200; +0.5% above |
| **BVG/LPP** (occupational pension, 2nd pillar) | 3.5-9.0% | Age-dependent: 7% for 25-34, 10% for 35-44, 15% for 45-54, 18% for 55-64. Employer pays min. 50% |
| **UVG** (accident insurance -- occupational) | 0.1-2.0% | Employer-paid. Office work ~0.5% |
| **FAK** (family allowances) | 1.7-3.5% | Canton-dependent. Zug ~1.7% |
| **Daily sickness insurance** (KTG) | 0.5-1.5% | Optional but common, often 50/50 |
| **Total employer burden** | **~13-18%** | Depending on age and pension plan |

### 6.2 Swiss Cost Calculations

**A developer in Zurich at market rate: CHF 100,000/year (CHF 8,333/month):**

| Item | Monthly | Annual |
|------|---------|--------|
| Gross salary | CHF 8,333 | CHF 100,000 |
| 13th month salary (common but not legally mandatory) | CHF 694 | CHF 8,333 |
| AHV/IV/EO (5.3%) | CHF 478 | CHF 5,730 |
| ALV (1.1%) | CHF 99 | CHF 1,192 |
| BVG employer share (~6% avg) | CHF 542 | CHF 6,500 |
| UVG BU (~0.5%) | CHF 45 | CHF 542 |
| FAK Zug (~1.7%) | CHF 153 | CHF 1,842 |
| KTG (~0.75% employer share) | CHF 68 | CHF 812 |
| **Total employer cost** | **~CHF 10,412** | **~CHF 124,951** |
| **Overhead vs gross** | **~25%** (incl. 13th month) | |

**However, the same role in Milan might cost EUR 50,000-60,000 gross** (not CHF 100,000), making Italy dramatically cheaper even with higher contribution rates.

### 6.3 Italy vs Switzerland Cost Comparison (Same Role)

| Metric | Italy (Milan) | Switzerland (Zurich) |
|--------|---------------|----------------------|
| Gross annual salary | EUR 60,000 | CHF 100,000 (~EUR 103,000) |
| Employer contribution rate | ~40% | ~15-18% |
| Total employer cost | ~EUR 84,000 | ~CHF 118,000 (~EUR 121,500) |
| **Difference** | | **+45% more expensive** |

**Conclusion:** Even though Swiss contribution rates are lower, Swiss salaries for equivalent roles are 1.7-2.5x higher, making the total cost significantly higher. A senior developer that costs EUR 11,000/month total in Italy would cost CHF 13,000-15,000/month in Switzerland.

---

## 7. SWISS AG EMPLOYING EU WORKERS -- LEGAL FRAMEWORK

### 7.1 Permanent Establishment Risk

**This is the #1 legal risk for Tercier/Lumina.**

Under Article 5 of the OECD Model Tax Convention (and the Italy-Switzerland DTA), a permanent establishment can be created by:

1. **Fixed place PE:** An employee working from home in Italy can constitute a "fixed place of business" if they work there regularly and the space is at the employer's disposal. Italian tax authorities have taken aggressive positions on this.

2. **Agent PE:** An employee who "habitually concludes contracts" or "plays the principal role leading to the conclusion of contracts" in Italy on behalf of the Swiss company creates an agent PE. Sales/BD roles are particularly dangerous.

3. **Threshold:** There is no safe harbor for number of employees. Even one employee can trigger PE risk depending on their activities.

**Consequences of PE creation:**
- Italian corporate tax (IRES 24% + IRAP ~3.9%) on profits attributable to Italian operations
- Italian VAT registration obligations
- Transfer pricing documentation requirements
- Italian accounting/filing obligations

### 7.2 Social Security -- Where to Pay?

**EU-Switzerland bilateral agreement on social security:**

- As a general rule, social security contributions are paid in the country where the work is physically performed (lex loci laboris).
- If an employee lives in Italy and works remotely for a Swiss AG, Italian social security applies. The Swiss AG must register with Italian INPS and pay Italian contributions.
- **A1 certificate exception:** Under the EU-Swiss bilateral agreement, a posted worker can remain under Swiss social security for up to 24 months if they were previously working in Switzerland and are "posted" temporarily. This does NOT apply to someone hired directly in Italy to work in Italy.
- **Multi-state workers:** If an employee works partly in Switzerland and partly in Italy (e.g., travels to Zug for meetings), social security depends on the split. If 25%+ of work is in the residence country (Italy), Italian social security applies.

### 7.3 Framework Agreement on Telework

A framework agreement signed by Switzerland and multiple EU countries (including Italy, effective since 2023) allows an employee to work up to 49.9% of their time from home in another country while remaining under the employer's country's social security, IF:
- An A1 certificate is obtained
- The employee works at least 50.1% in the employer's country

**This does NOT help Lumina's case** since the employees would be working 100% from Italy (not commuting to Zug).

### 7.4 Posted Worker Rules

Italy's implementation of the EU Posted Workers Directive requires:
- Prior notification to the Italian Labor Inspectorate
- Compliance with Italian minimum employment conditions (working time, minimum rest, holidays, health and safety)
- Application of Italian minimum pay standards
- Posted worker status is limited to 12 months (extendable to 18 months)

**Again, this applies to temporary assignments, not to permanently remote employees.**

### 7.5 Practical Recommendation for Lumina

**For hiring remote employees in Italy who will work 100% from Italy:**

1. **Best option:** Use an EOR (Deel, Remote.com, or RemoFirst). The EOR is the legal employer in Italy, handles all social security registration, payroll, and compliance. No PE risk for the Swiss AG.

2. **Medium-term option (if hiring 4+ in Italy):** Establish an Italian SRL subsidiary. This formally creates a presence in Italy, but it's controlled and predictable -- you file Italian taxes on the SRL, not on the parent AG.

3. **Avoid:** Directly employing Italian residents from the Swiss AG without any local structure. The PE risk is too high, especially with Sales/BD roles.

---

## 8. MASTER COST COMPARISON TABLE

### 8.1 Per-Role Cost Comparison Across Countries

All figures in EUR/month. "Total" = gross salary + employer contributions + extra months + EOR fee (at Deel $599 = ~EUR 550/month rate).

| Role | Gross/mo | Italy Total | Portugal Total | Spain Total | Switzerland Total |
|------|----------|-------------|----------------|-------------|-------------------|
| Developer (FT) | 4,000 | 6,958 | 6,454 | 6,663 | N/A (would be ~10,400) |
| PM (PT) | 4,000 | 6,958 | 6,454 | 6,663 | N/A |
| CS/Implementation | 5,000 | 8,547 | 7,918 | 8,179 | N/A |
| Senior Engineer | 7,000 | 11,764 | 10,881 | 10,256* | N/A (would be ~14,500) |
| Sales/BD | 6,000 | 10,156 | 9,399 | 9,218* | N/A |
| Engineer | 6,000 | 10,156 | 9,399 | 9,218* | N/A |
| Marketing | 5,000 | 8,547 | 7,918 | 8,179 | N/A |
| **TOTAL (7 roles)** | **37,000** | **~63,086** | **~58,423** | **~59,376** | -- |

*Spain figures for EUR 6K+ roles benefit from the contribution ceiling cap at EUR 4,909.50/month.

### 8.2 Annual Cost Summary with Different EOR Providers

| Scenario | Annual Cost (EUR) | Notes |
|----------|-------------------|-------|
| **All in Italy, Deel EOR** | ~EUR 756,000 | Highest statutory costs + premium EOR |
| **All in Italy, RemoFirst EOR** | ~EUR 726,000 | Highest statutory costs + budget EOR |
| **All in Portugal, Deel EOR** | ~EUR 701,000 | Lower statutory costs + premium EOR |
| **All in Portugal, RemoFirst EOR** | ~EUR 671,000 | Lowest realistic option |
| **All in Spain, Deel EOR** | ~EUR 712,000 | Spain ceiling helps for high earners |
| **Mixed (cheapest realistic)** | ~EUR 660,000 | Portugal for most, contractors where viable |
| **All as contractors** | ~EUR 444,000 | ILLEGAL for most roles -- listed for reference only |

### 8.3 Key Takeaways by Salary Level

**EUR 4,000/month gross employee:**

| Country | Total employer cost/month | Overhead % |
|---------|--------------------------|------------|
| Italy | EUR 6,408 | +60% |
| Portugal | EUR 5,904 | +48% |
| Spain | EUR 6,113 | +53% |
| Switzerland (at local rate ~CHF 7K) | CHF 8,200 (~EUR 8,450) | +21% on Swiss gross |

**EUR 7,000/month gross employee:**

| Country | Total employer cost/month | Overhead % |
|---------|--------------------------|------------|
| Italy | EUR 11,214 | +60% |
| Portugal | EUR 10,331 | +48% |
| Spain | EUR 9,706 | +39% (ceiling effect) |
| Switzerland (at local rate ~CHF 12K) | CHF 14,200 (~EUR 14,630) | +22% on Swiss gross |

---

## 9. STRATEGIC RECOMMENDATIONS FOR LUMINA

### 9.1 Recommended Hiring Structure

1. **Use an EOR for the first 12-18 months.** RemoFirst ($199/employee/month) or Deel ($599/employee/month) are the best options. The cost savings of RemoFirst (~EUR 31K/year for 7 employees) may be worth the slightly less polished platform.

2. **Concentrate hires in Portugal if possible.** Portugal offers the lowest employer burden (27% vs Italy's 37-40%) and has a strong tech talent pool in Lisbon and Porto. The savings vs Italy are ~EUR 55K/year for the full 7-person team.

3. **If hiring in Italy is required** (due to talent availability or co-founder location), avoid giving Sales/BD roles to Italian employees if possible -- these create the highest PE risk due to contract-signing authority.

4. **Part-time PM could be a contractor** -- IF they genuinely serve multiple clients and invoice independently. This is the one role where contractor status may be defensible.

5. **Plan for entity formation at 4+ Italian employees.** If Lumina grows to 4+ employees in Italy, the cost of an Italian SRL (~EUR 8-15K setup + EUR 5K/year maintenance) will be cheaper than EOR fees (~EUR 26-34K/year for 4 employees at Deel rates).

### 9.2 Budget Impact vs Business Plan

If the business plan assumes EUR 37,000/month in gross salaries, the actual cash outflow will be:

| Scenario | Monthly cash need | Annual | Delta vs gross |
|----------|-------------------|--------|----------------|
| Gross salaries only | EUR 37,000 | EUR 444,000 | -- |
| + Italy contributions (no EOR) | EUR 53,000 | EUR 636,000 | +43% |
| + Deel EOR fees | EUR 56,850 | EUR 682,200 | +54% |
| + Portugal contributions + Deel | EUR 52,000 | EUR 624,000 | +41% |
| + Portugal contributions + RemoFirst | EUR 49,500 | EUR 594,000 | +34% |

**The business plan should budget 1.4-1.6x gross salaries for total employer cost.**

---

## Sources

- [PEO Italy -- Employer Costs in Italy](https://peoitaly.com/what-are-the-employer-costs-in-italy/)
- [Italian Employer of Record -- Payroll Taxes](https://www.employerofrecorditaly.com/payroll-taxes-and-employer-contributions-italy/)
- [Taxing.It -- Italian Social Security Contributions](https://taxing.it/italian-social-security-contributions/)
- [PWC Tax Summaries -- Italy Individual Other Taxes](https://taxsummaries.pwc.com/italy/individual/other-taxes)
- [Centre Gestor -- Spain Employer Social Security Contributions 2025](https://centregestor.es/en/employer-social-security-contributions-spain/)
- [PWC Portugal -- Social Security 2025 Tax Guide](https://www.pwc.pt/en/pwcinforfisco/tax-guide/2025/social-security.html)
- [Findea.ch -- Swiss Social Security Contributions 2025](https://www.findea.ch/en/faq-fiduciary/social-security-contributions-switzerland-employers)
- [Deel Pricing](https://www.deel.com/pricing/)
- [Remote.com Pricing](https://remote.com/pricing)
- [Oyster HR Pricing](https://www.oysterhr.com/pricing)
- [RemoFirst Pricing](https://www.remofirst.com/price)
- [RemotePeople -- EOR Cost Comparison 2026](https://remotepeople.com/employer-of-record-eor-cost-pricing/)
- [Taxing.It -- Working in Italy for a Foreign Company](https://taxing.it/working-in-italy-for-a-foreign-company/)
- [Kluwer Tax Blog -- Swiss-Italian Frontier Workers](https://legalblogs.wolterskluwer.com/international-tax-law-blog/frontier-workers-and-remote-working-a-swiss-italian-tax-perspective/)
- [Global Citizen Solutions -- Portugal NHR 2.0 / IFICI](https://www.globalcitizensolutions.com/new-nhr/)
- [INPS Official -- Contribution Rates](https://www.inps.it/it/en/inps-comunica/diritti-e-obblighi-in-materia-di-sicurezza-sociale-nell-unione-e/per-le-imprese/aliquote-contributive.html)
- [Globalization Partners -- Contractor Misclassification in Europe 2026](https://www.globalization-partners.com/blog/contractor-misclassification-in-europe-what-you-need-to-know/)
- [PEO Italy -- Top 10 Misclassification Risks](https://peoitaly.com/top-10-misclassification-risks-in-italy-and-penalties/)
