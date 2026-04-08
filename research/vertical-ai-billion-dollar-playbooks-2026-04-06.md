# VERTICAL AI: BILLION-DOLLAR PLAYBOOKS
## Deep Research — How the Best Companies Were Built from 0 to $1B+

**Date:** April 6, 2026
**Purpose:** Extract real tactics, real timelines, real numbers from the companies that actually did it. Zero platitudes.

---

## TABLE OF CONTENTS

1. [EvolutionIQ — $730M Exit, 2 Years with One Customer](#1-evolutioniq)
2. [Veeva Systems — $40B+ Market Cap, Pharma's Operating System](#2-veeva-systems)
3. [Toast — $13B, Vertical for Restaurants](#3-toast)
4. [ServiceTitan — $9.5B, Home Services Operating System](#4-servicetitan)
5. [Procore — $12B, Construction System of Record](#5-procore)
6. [Ramp — $13B, AI-Native Finance Platform](#6-ramp)
7. [Midjourney — $200M+ Revenue, ~40 People](#7-midjourney)
8. [Medvi — $401M First Year, 2 People](#8-medvi)
9. [Frameworks: Bessemer, First Round, YC, Paul Graham](#9-frameworks)
10. [What Separates $100M Exits from $1B+ Exits](#10-what-separates)
11. [Implications for Tercier](#11-implications-for-tercier)

---

## 1. EVOLUTIONIQ
**$730M acquisition by CCC Intelligent Solutions (Q1 2025)**
**Vertical: Insurance claims management (disability + injury)**
**Founded: 2019 | First paying customer: ~2020 | Exit: 2025**

### The Founding Thesis

Co-founders Michael Saltzman and Tomas Vykruta built AI guidance for disability and injury claims examiners. Not a dashboard. Not a report. A system that tells a claims examiner what to do next on each claim, in real time, trained on the carrier's own data.

The chicken-and-egg problem was brutal: they needed carrier data to prove the AI worked, but no carrier would share data until the AI was proven. They heard "no" approximately 100 times.

### First 90 Days

The team focused entirely on finding one design partner willing to share their dataset. This was not product building — it was relationship building and trust building. They needed someone brave enough to be customer #1 for an unproven AI company in a regulated, conservative industry.

### The Reliance Matrix Story (2 Years with One Customer)

Reliance Matrix became their first and only customer for roughly two years. Here is exactly how they operated:

**The Weekly Cadence:**
- **Wednesday:** Receive new data dump from Reliance Matrix
- **Thursday-Friday:** Evaluate data, retrain models, re-score all claims, make recommendations available to frontline examiners
- **Tuesday (following week):** Examiners review recommendations and provide feedback — "Was this recommendation correct? Yes/No/Partially?"
- **Goal:** Improve acceptance rate by 10% every single week

They started at roughly 40% acceptance rate. After 5 weeks of this cadence, they hit 90%+ acceptance. At that point, the model was reliable enough that examiners could actually use it for day-to-day decision-making, not just evaluation.

### What the Founder Did Daily

Saltzman and Vykruta were embedded with the claims team. Not on a Zoom call. Not getting quarterly updates. They were in the operational workflow, watching examiners work, understanding why recommendations were rejected, and feeding that back into the model within days.

### The Integration Problem

Every insurance carrier's data is different. There is no standard schema for claims data. EvolutionIQ had to build an interface layer to normalize inputs across wildly inconsistent data stacks. This is directly analogous to hotel data — every PMS, every review source, every booking engine structures data differently.

### Key Metrics They Obsessed Over

1. **Examiner acceptance rate** — the percentage of AI recommendations that frontline examiners actually followed
2. **Time-to-value** — how quickly the first module showed measurable ROI (had to be under 12 months to justify the next module sale)
3. **Data quality** — garbage in, garbage out. They spent enormous effort on data normalization

### What They Said NO To

- Multiple customers before the product was proven
- Horizontal expansion (they stayed in disability/injury claims only)
- Feature requests that didn't improve the core recommendation engine
- Premature scaling before the weekly feedback loop was dialed in

### The Inflection Point

When they could demonstrate to Reliance Matrix that claims examiners using EvolutionIQ were making materurably better decisions — faster resolutions, fewer overpayments, better claimant outcomes — they had their first case study. One real case study with real numbers was worth more than any pitch deck. That single reference customer unlocked the next 5-10 carriers.

### Revenue Timeline

- Year 1: One design partner, ~$50K total revenue
- Exit: 8-figure ARR, $730M acquisition by CCC

### The Deployment Model That Mattered

Product and engineering were deeply involved in every deployment — not just customer success. Value only shows up when the tool actually changes day-to-day behavior. This is not a "ship and forget" SaaS product. It requires changing how people work.

---

## 2. VEEVA SYSTEMS
**$40B+ market cap | $3.2B revenue (FY2026)**
**Vertical: Life sciences (pharma + biotech)**
**Founded: January 2007 | First product: 2008 | IPO: 2013**

### The Founding Thesis

Peter Gassner spent 4 years at Salesforce, where he literally helped architect the Force.com platform. He understood multi-tenant cloud architecture better than almost anyone outside Salesforce. Co-founder Matt Wallach had been the GM of Siebel Systems' pharma division, where he established Siebel as the market leader in pharma CRM before Oracle's acquisition.

The insight: pharma sales reps were using generic CRM software that didn't understand compliance, sample tracking, call reporting, or regulatory requirements. A purpose-built cloud CRM for life sciences would be vastly superior.

### First 90 Days

Gassner and Wallach combined two unfair advantages:
1. **Gassner:** Deep technical knowledge of the Salesforce platform they would build on
2. **Wallach:** Existing relationships with pharma companies from his Siebel years — he knew exactly who the buyers were and what they needed

They incorporated as "Verticals onDemand, Inc." (renamed to Veeva in 2009). The founding team was tiny: Gassner, Wallach, and Doug Ostler.

### How They Got the First 10 Customers

**The Pfizer Story:** When a Pfizer executive asked why they should buy from a tiny, unproven company, Gassner's response: *"We're your only shot at greatness."* Pfizer bought. That single multimillion-dollar deal essentially funded continued product development without additional dilution.

This is the most important lesson: they didn't start with small customers. They went straight to the biggest pharma company on earth and won because they had the domain credibility (Wallach's Siebel track record) and the technical credibility (Gassner's Salesforce architecture experience).

### Funding Timeline

- **Series A (June 2008):** $4M from Emergence Capital Partners — that's it. Just $4M.
- **Revenue growth:** The scarcity of capital focused everything — sales, deals, team building. They couldn't afford to waste a dollar.
- **IPO (October 2013):** $261M raised. By then, Veeva CRM was already the standard for pharma sales teams.

### Building the Data Moat: The Vault Expansion

Veeva's genius was not stopping at CRM. They built **Veeva Vault** — a cloud-based content management platform that became the system of record for:
- Regulatory submissions
- Clinical trial management
- Quality management
- Safety reporting
- Commercial content (PromoMats)

Each new Vault application shared a **common data model**. Once a pharma company put their regulatory documents, clinical data, and commercial content into Veeva Vault, they were locked in. The switching costs became astronomical because Veeva held the company's most critical regulated data.

**Revenue composition today:** 84% subscription revenue, 17% YoY growth, $3.2B total revenue (FY2026).

### What They Said NO To

- Expanding beyond life sciences for the first 15+ years
- Building their own infrastructure (they built on Salesforce initially, then migrated Vault to their own platform)
- Competing on price — they competed on regulatory compliance and domain depth

### Key Metrics

- **Net revenue retention:** Consistently above 120% — existing customers buy more Vault applications every year
- **Customer concentration:** Top pharma companies generate massive ARR per customer

### The Inflection Point

The launch of Vault (2012) was the inflection. CRM was a wedge. Vault turned Veeva from a point solution into the operating system for life sciences. Every new Vault module increased switching costs and data gravity.

### Hiring: Person #2 and #3

Wallach was effectively person #2 from day 1 — the industry expert and go-to-market leader. Person #3 (Ostler) handled operations. The early team was a small group of Silicon Valley engineers who understood multi-tenancy, combined with life sciences domain experts recruited from pharma companies.

---

## 3. TOAST
**$13B market cap**
**Vertical: Restaurant management**
**Founded: December 2011 | Pivot to POS: 2013 | IPO: September 2021**

### The Founding Thesis

Three MIT graduates — Steve Fredette, Aman Narang, and Jonathan Grimm — all from Endeca (acquired by Oracle). They noticed how little technology had penetrated the restaurant industry. The initial idea was wrong: a consumer-facing mobile payment app.

### First 90 Days: The Wrong Product

In 2012, Toast launched its first app at Firebrand Saints in Cambridge, MA — a consumer app for mobile payments, loyalty, promotions. Customers could manage tabs, split bills, view orders, set tips.

It flopped. Not because it didn't work, but because the real pain point wasn't consumer payments — it was the restaurant's entire operational stack.

### The Pivot (2013): From Consumer App to Restaurant OS

Toast pivoted to a cloud-based POS + restaurant management platform, bundling POS, payment processing, gift cards, loyalty, and kitchen display systems as one integrated solution on Android tablets. This was the moment everything changed.

### First 100 Customers Playbook

**The 24/7 Support Story:** In one early sales meeting, the prospect asked about support. Aman told them Toast had 24/7 support. The prospect called the support number right then — it was a Google Voice number that rang every employee's phone. Aman answered from his pocket while sitting next to the prospect: *"I told you, we have 24/7 support."*

**Customer qualification criteria (from their ISV playbook):**
1. The restaurant had to have a certain level of scalability — revenue, employee count, menu complexity
2. A prospect couldn't be larger than twice the size of Toast's current biggest customer

This second rule is critical. It prevents you from selling to a customer whose complexity will crush your team. You can only stretch 2x at a time.

### The "Suicide Mission" — Defying Silicon Valley

A VC called Toast's plan "a suicide mission" that would take five years to build something viable. Toast's response: they deliberately stayed out of Silicon Valley. As long as competitors didn't see the product in action, they could continue dismissing it.

Instead, Toast's team traveled to places like Grand Rapids, Michigan — home to Gordon Food Service, a food distributor that became a critical distribution partner. They focused on the middle of America, which Silicon Valley VCs were ignoring.

### Growth Timeline

- **Late 2015:** 170 employees, millions in revenue, thousands of restaurant customers
- **Early customers:** Restaurants that were ditching Square and Micros (the incumbents) for Toast's integrated platform
- **Chain wins:** Costa Vida (75 locations), Beach Hut Deli (40 locations)

### What They Said NO To

- Staying with the consumer app (killed their first product)
- Selling in Silicon Valley (went to Middle America instead)
- Selling to customers too large for their current capability (the 2x rule)
- Building features that didn't serve the core restaurant workflow

### The Inflection Point

The pivot from consumer app to restaurant POS in 2013. And then the partnership with Gordon Food Service, which gave them distribution into thousands of restaurants they couldn't have reached with direct sales alone.

### Person #2 and #3

All three co-founders were equal from day 1:
- **Aman Narang:** CEO, sales, customer relationships
- **Steve Fredette:** Product and strategy
- **Jonathan Grimm:** CTO, engineering

The first hires were sales reps who went door-to-door in Boston restaurants. Not engineers. The product was good enough; they needed distribution.

---

## 4. SERVICETITAN
**$9.5B valuation at IPO (December 2024) | $772M annual revenue**
**Vertical: Home services (HVAC, plumbing, electrical, etc.)**
**Founded: 2007 (side project) | Cloud platform launch: 2012 | IPO: December 2024**

### The Founding Thesis

Ara Mahdessian and Vahe Kuzoyan met on a college ski trip for Armenian students in 2004. Ara was studying software engineering at Stanford, Vahe at USC. They discovered both their fathers were contractors — tradesmen who ran their businesses on paper, whiteboards, and phone calls. The software available to them was terrible.

They started ServiceTitan as a side project to help their own fathers. It took 5 years of nights-and-weekends building before they launched the cloud platform in 2012.

### How Two Software Engineers Built Trust with Plumbers

They were NOT outsiders. Their fathers were in the trades. They grew up watching the daily chaos of running a contracting business — missed appointments, lost invoices, technicians driving to the wrong address. They understood the pain viscerally, even though they personally had no industry operating experience.

Ara was described as being so obsessively customer-focused that an ICONIQ investor "nearly had to pretend to be an electrician" just to get a meeting with him in 2016, because Ara was always with customers.

### First 90 Days with Real Customers (2012-2013)

The founding insight was that their fathers' businesses needed:
- Scheduling and dispatch
- Call booking (phone is everything in home services)
- Invoicing and payment
- Technician mobile app
- Customer communication

They built for their fathers first, then expanded to their fathers' peers — local contractors in the Los Angeles area who knew and trusted the families.

### The Bessemer Story

In his first phone call with a Bessemer investor, Ara "quickly seized control of the conversation and grilled them about how other companies ran their go-to-market strategies, hired teams, and planned product releases. After an hour and a half, he thanked them for the time and signed off to talk to a customer."

This is the founder behavior that gets funded: caring more about the customer than the investor.

### Revenue Growth Timeline

- **2014:** Seed round (undisclosed amount)
- **2015:** $18M Series A led by Bessemer at ~$100M post-money valuation
- **2015-2016:** Revenue grew 700%+
- **2018:** Crossed $100M ARR (6 years after platform launch)
- **2020:** $200M ARR
- **2021:** $250M+ ARR, 7,500+ customers
- **December 2024:** IPO at $71/share, 42% first-day pop to $101
- **FY2025:** $772M annual revenue, 3,049 employees

### What They Said NO To

- Horizontal expansion (stayed in home services trades only)
- Moving fast before the product was ready (5 years of side-project building before launch)
- Putting investors before customers (the Bessemer call story)
- Hiring outside the culture ("Grateful for everything, entitled to nothing")

### The Inflection Point

The Bessemer Series A in 2015 at $100M valuation, which gave them the capital to build a real sales team. Combined with 700% revenue growth in one year, this proved the market was enormous and the product was working.

### The Moat

ServiceTitan became the operating system for trades businesses. Once a plumber's entire operation — scheduling, dispatch, invoicing, marketing, payroll, customer database — runs on ServiceTitan, switching costs are extreme. The data gravity locks them in.

---

## 5. PROCORE
**$12B market cap | $1B+ ARR**
**Vertical: Construction management**
**Founded: 2002 | First product: ~2003 | IPO: May 2021**

### The Founding Thesis

Craig "Tooey" Courtemanche started as a carpenter, became a real estate developer, then founded a tech company in Silicon Valley. When building his own home in Santa Barbara, he realized that construction project management was complete chaos — paper drawings, phone tag, missed change orders, budget overruns.

This is 23 years of building one company. The longest journey on this list by far.

### First 90 Days (and First Years)

Procore started as a niche tool for high-net-worth residential builders in places like Aspen and Beverly Hills.

*"Our first customers were building homes for Eddie Murphy, Barbara Streisand, and Ben Stiller."* — Tooey Courtemanche

The initial pricing: **$195/month.** Capital-efficient, but not a venture-scale business yet.

### Building the System of Record Moat

Procore's genius was the **unlimited user model.** Unlike competitors who charged per user (which incentivizes limiting access), Procore let every person on a construction project — general contractor, subcontractor, architect, owner — join for free. This created a network effect:

1. The GC buys Procore for project management
2. All subcontractors get invited to the platform (free)
3. Subcontractors learn the tool on GC's projects
4. When subs start their own projects, they buy Procore because they already know it
5. The network grows

**Current scale:** Over $1 trillion in annual construction volume is contracted on Procore.

### The "Layer Cake" Expansion

Procore didn't seriously implement multi-product strategy until **years 14-15** (around 2016-2017). Before that, they were singularly focused on construction project management.

**The "Act Two" product:** Financial management — because it gave them access to larger budgets and more strategic decision-makers within customer organizations.

**Result:** 60% of customers now buy 3+ products.

Procore's Chief Product Officer Wyatt Jenkins grew up on construction sites — his parents were in the industry. He describes the expansion strategy:

1. **Nail the first product** (project management, years 1-14)
2. **Expand into adjacent high-value workflows** (financial management, year 14-15)
3. **Build an ecosystem** (400+ marketplace partners, financial services products)

### What They Said NO To

- Expanding beyond residential construction too early
- Multi-product strategy before year 14 (extreme discipline)
- Charging per user (chose unlimited users for network effects instead)
- Raising VC for years (bootstrapped initially)

### The Inflection Point

Two moments:
1. **Moving from residential to commercial construction** — massively larger TAM
2. **Financial management as "Act Two"** — proved Procore could be the platform, not just a tool

### Key Metrics

- **$1B+ ARR**
- **400+ marketplace partners**
- **$1 trillion+ construction volume on platform**
- **60% of customers on 3+ products**

---

## 6. RAMP
**$13B valuation (2024) | $100M ARR in ~3 years from launch**
**Vertical: Corporate finance / expense management**
**Founded: March 2019 | First customer: August 2019 | Public launch: February 2020**

### The Founding Thesis

Eric Glyman and Karim Atiyeh left Capital One to build "the corporate card that helps you spend less." In a market where every competitor (Brex, Divvy) was trying to help companies spend more (because card companies make money on interchange), Ramp's pitch was contrarian: we'll help you spend less.

Glyman's prior company Paribus (acquired by Capital One) saved consumers money on price drops. Same DNA.

### Timeline: 0 to $100M ARR

- **March 2019:** Incorporated
- **August 2019:** First customer
- **February 2020:** Public launch
- **2020:** 12,059 customers signed up. Only 8 churned. (99.93% retention.)
- **~2022:** $100M ARR reached (approximately 3 years from launch)
- **275 employees** at $100M ARR = **$363,636 ARR per employee**

### What the Founders Did Differently

**Hiring contrarians:** Ramp hired Stanford freshmen with zero fintech experience who had built companies or were extraordinarily fast builders. They threw out the "5 years of fintech experience" checklist. They optimized for 10x performers, not safe hires.

**Message-market fit before product-market fit:** Ramp focused obsessively on the message — "the card that helps you spend less" — because in a commoditized market (corporate cards), the differentiation was the positioning, not the feature set.

**Never needed to raise, but chose to:** Because Ramp didn't burn excessive capital, they raised on their own terms, typically doubling their valuation each round without desperation.

### Key Metrics They Obsessed Over

- **Customer churn:** 8 out of 12,059 in year 1 — nearly zero
- **ARR per employee:** $363K (exceptional efficiency)
- **Burn multiple:** Extremely low because they weren't subsidizing growth

### What They Said NO To

- Competing on rewards (the Brex playbook)
- Traditional fintech hiring criteria
- Burning cash to acquire customers

### The Inflection Point

COVID-19 (February 2020 launch). Every company suddenly needed to control spend. Ramp's "help you spend less" message was perfectly timed for the downturn.

Then: AI-native features for expense categorization, receipt matching, and spend analysis — which competitors couldn't match because Ramp was built AI-first from day 1.

---

## 7. MIDJOURNEY
**$200M+ revenue | ~40 employees | No venture capital**
**Vertical: AI image generation**
**Founded: August 2021 | Public launch: February 2022 | Profitable: August 2022**

### The Operating Model

David Holz (previously co-founded Leap Motion) recruited 10 engineers and started training diffusion models. The entire company operates with:
- No board of directors
- Few managers
- Small, independent teams
- Employees receive profit shares, not stock packages
- No VC funding ever taken

### Timeline

- **August 2021:** Founded, private demo in September
- **February 2022:** Public launch as a Discord bot
- **August 2022:** Profitable (6 months after public launch), ~1 million community members
- **2024:** $200M+ revenue, ~40 employees

### The Discord-First Strategy

This is the most important tactical decision Midjourney made. By hosting the product inside Discord:

1. **Users could see each other's creations in real time** — built-in social proof
2. **Users learned from each other's prompts** — community-driven education
3. **Every creation was inherently shareable** — viral distribution
4. **No marketing spend required** — the product marketed itself

Holz never did marketing. No press releases. Every update was announced in the Discord server. Word of mouth and social media virality drove all growth.

### Revenue Per Employee

$200M revenue / 40 employees = **$5M revenue per employee.** (The often-cited "11 employees" figure was from the earliest days; the team has grown to ~40.)

### What They Said NO To

- Venture capital (preserving full control and profit distribution)
- Traditional marketing
- Traditional management hierarchy
- Building a web app initially (Discord-first for virality)
- Enterprise sales (pure self-serve subscription: $10-60/month)

### The Moat

Community + brand + model quality. Midjourney's 21M+ Discord community is itself a moat — the collective knowledge of prompting, styles, and techniques creates a learning environment no competitor can replicate.

---

## 8. MEDVI
**$401M revenue (2025, first full year) | 2 employees | $20K starting capital**
**Vertical: GLP-1 telehealth**
**Founded: 2024 | Launched: September 2024**

### The Operating Model

Matthew Gallagher started Medvi with $20K and his brother Elliot. Their operating principle: **every dependency is a service, not a hire.**

**The AI stack:**
- **ChatGPT, Claude, Grok:** Code, website copy, AI agents
- **Midjourney, Runway:** Ad images and videos
- **ElevenLabs:** AI voice for customer communication

**The outsourced stack:**
- **CareValidate:** Doctor network, prescription compliance, telehealth infrastructure
- **OpenLoop Health:** Pharmacy fulfillment, shipping, patient management

**The product:** GLP-1 weight loss prescriptions at $179/month — cheaper than competitors, smoother checkout, no doctor visit required.

### Financial Performance

- **2025 (first full year):** $401M revenue, 16.2% net margin (~$65M profit), 250,000+ customers
- **2026 projection:** $1.8B revenue
- **Comparison:** Hims & Hers had 2,400+ employees and a 5.5% net margin the same year

### What This Means

Medvi is not a SaaS company. It's an AI-native services arbitrage: using AI to eliminate the labor cost of what is fundamentally a simple, repetitive medical workflow (GLP-1 prescribing), while outsourcing all regulated infrastructure to specialists.

### Caveat

The FDA has issued a warning letter to Medvi. The sustainability and regulatory risk of this model is unproven. This is relevant context: the "AI replaces everything" narrative has real-world constraints in regulated industries.

### The Lesson for Tercier

The architecture is instructive even if the specific business model isn't replicable: identify which parts of your value chain can be outsourced as services, which can be automated with AI, and which require your proprietary intelligence. Only build what creates the moat.

---

## 9. FRAMEWORKS

### 9A. Bessemer's "Building Vertical AI" Playbook (January 2026)

Bessemer's conviction: **Vertical AI will eclipse even the most successful vertical SaaS markets.** The reason: vertical AI accesses the **labor line of the P&L**, not just the IT software budget. This is exponentially larger.

**Three business models for vertical AI:**

| Model | Description | Example |
|-------|-------------|---------|
| **Copilot** | AI assists human worker, human stays in the loop | EvolutionIQ (claims examiner copilot) |
| **Agent** | AI performs the task autonomously, human supervises | Ramp's automated expense categorization |
| **AI-enabled Service** | AI replaces the entire service delivery | Medvi's autonomous prescription flow |

**The Ten Principles:**

**Functional Value (Principles 1-3):**
1. Build only where automation aligns with customer needs and context — not just because you can
2. Avoid commoditized features — integrated workflows beat standalone capabilities
3. Leverage AI for superhuman tasks — operate at scales or speeds humans cannot match

**Economic Value (Principles 4-5):**
4. Demonstrate quantifiable ROI — revenue gains or cost reductions that justify the price
5. Innovate on business models — new pricing and delivery enabled by AI (usage-based, outcome-based, etc.)

**Competitive Position (Principles 6-7):**
6. Target niche, underserved markets first — the overlooked segments with highest ROI
7. Customize for nuanced requirements — compliance, security, regulatory complexity as defensive barriers

**Defensibility (Principles 8-10):**
8. Build technical moat from multimodality — combining data types and workflow integrations, not proprietary models
9. Build modular, adaptable systems — flexibly incorporate the best models as AI evolves
10. Prioritize data quality over quantity — high-quality, relevant data compounds in value

**The "Good > Better > Best" Framework:**

- **Good:** Copilot that assists a single workflow
- **Better:** Agent that automates end-to-end workflow
- **Best:** Platform that becomes the system of record, with AI running continuous intelligence across all workflows

### 9B. First Round Capital: What the Best Founders Do in Months 1-6

From 20+ years and 500+ pre-PMF investments, First Round's findings:

1. **Develop profound insights BEFORE chasing the first customer.** The best founders First Round backed took time to understand the market deeply before building. They didn't start with "let me build a product" — they started with "let me understand this industry's pain at a level no one else has."

2. **Be outlier-good at 1-2 things, not well-rounded.** First Round doesn't back well-rounded founders. They seek people with one or two abilities where they have a shot at being the best in the world. That asymmetry lets them see opportunities others miss and solve problems others can't crack.

3. **Take beginnings unreasonably seriously.** The best founders "go unreasonably deep to get their beginnings right." They slow down to speed up — spending more time on the first customer, the first hire, the first product decision than seems rational.

4. **Creative go-to-market matters as much as product.** Not just "build a great product" — the best startups think deeply about distribution from day 1.

### 9C. YC: "Do Things That Don't Scale" Applied to Vertical AI

Paul Graham's core principle remains the single most important early-stage advice:

> *"The most common unscalable thing founders have to do at the start is recruit users manually."*

**Applied to vertical AI in 2025-2026:**

The median YC startup now follows this playbook: "Pick a market, deeply understand the workflows, build simple software to model the workflows, and use AI to augment the human judgment."

**Historical examples of unscalable founder behavior that worked:**
- **Airbnb:** Founders personally photographed listings in New York — this simple change significantly increased bookings
- **Seamless:** Founders personally contacted law firms, took lunch orders, placed orders at restaurants, and oversaw delivery
- **Stripe:** Collison brothers would say "let me install Stripe for you right now" during conversations with developers — "Collison installation"

**For vertical AI, "unscalable" means:**
- Sitting next to your pilot customer's employees and watching them work
- Manually correcting AI outputs until the model learns
- Building custom integrations for your first customer that you'll later productize
- Being the AI yourself before the AI can do it alone (the "Wizard of Oz" approach)

### 9D. Paul Graham's "Default Alive" Framework

The question every startup at 8-9 months should answer:

> *"Assuming expenses remain constant and revenue growth continues at its current rate over the last several months, do you make it to profitability on the money you have left?"*

If yes: **default alive.** You have leverage. You can negotiate with VCs. You can take risks.

If no: **default dead.** You are dependent on external capital to survive. Every decision is constrained.

**The key insight:** This is about trajectory, not runway. A startup growing 10%/month has a fundamentally different path than one growing 3%/month, even with the same burn rate.

**Application to Tercier:** At CHF 54,649 lowest cash point (from the financial model), Tercier is default alive only if Kempinski or equivalent revenue materializes on schedule. The margin for error is razor-thin.

### 9E. The Burn Multiple (David Sacks, Craft Ventures)

**Formula:** Burn Multiple = Net Burn / Net New ARR

| Burn Multiple | Rating |
|---------------|--------|
| < 1x | Amazing |
| 1x - 1.5x | Great |
| 1.5x - 2x | Good |
| 2x - 3x | Suspect |
| > 3x | Bad |

**What the best companies achieve:**
- Ramp: Very low burn multiple because they weren't subsidizing growth
- Veeva: $4M Series A funded the entire journey to profitability
- Midjourney: Negative burn (profitable from month 6)

**For capital-constrained startups:** The burn multiple should be the North Star metric. Every CHF spent should generate more than CHF 1 in new ARR. If you're burning CHF 3 for every CHF 1 of new ARR, you're destroying value.

---

## 10. WHAT SEPARATES $100M EXITS FROM $1B+ EXITS

After analyzing all 8 companies above, the pattern is clear:

### $100M exits have:
- A good product in a niche market
- Switching costs from data lock-in
- Linear growth (more salespeople = more customers)
- A feature advantage that competitors can eventually copy

### $1B+ exits have:
- **System of record status** — the customer's most critical data lives in your platform
- **Network effects** — every new user makes the product more valuable for all users (Procore's unlimited user model, Midjourney's Discord community)
- **Data gravity** — the more data you accumulate, the better your AI/intelligence becomes, which attracts more data (EvolutionIQ's claims data, Veeva's regulatory data, Tercier's review corpus)
- **The "Second Act"** — expansion from initial wedge product into adjacent workflows that increase ARPU and switching costs (Veeva CRM > Vault, Procore PM > Financial, Toast POS > Payroll > Marketing)
- **Workflow embedding** — you don't just store data, you change how people work every day. The workflow becomes dependent on your product.

### The Three Moat Tiers

**Tier 1: Product moat (weakest)**
- Better features, better UX
- Competitors can copy in 12-18 months
- Supports $50-200M exits

**Tier 2: Data + switching cost moat (medium)**
- Customer data creates lock-in
- Integrations with other systems create friction to leave
- Supports $200M-1B exits

**Tier 3: Network + intelligence moat (strongest)**
- Every customer makes the product smarter for all customers
- Network effects make the platform more valuable with scale
- Intelligence compounds over time (more data = better AI = better outcomes = more customers = more data)
- Supports $1B+ exits and $10B+ market caps

---

## 11. IMPLICATIONS FOR TERCIER

### Where Tercier Maps to These Playbooks

| Company | Parallel to Tercier | Key Lesson |
|---------|---------------------|------------|
| **EvolutionIQ** | Most direct analog. AI copilot for domain experts (claims examiners = hotel marketers). Same chicken-and-egg problem (need hotel data to prove value, need to prove value to get data). | Spend 6-12 months embedded with Kempinski. Weekly iteration cadence. 10% improvement per week. Don't scale until acceptance rate is 90%+. |
| **Veeva** | Industry operating system built by someone who understood the platform architecture + someone who knew the buyers. Gassner + Wallach = Marco + Amedeo. | Go straight to premium hotels. Don't start small. The big customer validates you faster than 100 small ones. $4M was enough to reach profitability. |
| **Toast** | Pivot from wrong initial product to the right one. Door-to-door in the field, not Silicon Valley. The 2x customer size rule. | Stay away from tech conferences. Be in hotels. Never sell to a customer more than 2x the complexity of your current biggest. |
| **ServiceTitan** | Sons of tradesmen building software for their fathers' industry. Deep cultural authenticity. Obsessive customer focus over investor relations. | The trust comes from authenticity. Marco's operator background IS the credential. Grill investors about their portfolio companies' go-to-market strategies. |
| **Procore** | 23-year journey, $195/month starting price, unlimited user model for network effects. "Act Two" at year 14. | Don't rush the multi-product expansion. Nail the intelligence layer first. Consider unlimited users per hotel (the entire marketing team, the GM, the revenue manager) as a network strategy. |
| **Ramp** | Contrarian positioning ("help you spend less" vs. the market). AI-native from day 1. Extreme efficiency ($363K ARR/employee). | Position Tercier as "the platform that replaces your agency" — contrarian to the agency model that dominates hotel marketing. Target $300K+ ARR per employee from the start. |
| **Midjourney** | Community-driven growth. No VC. No marketing. Product virality. $5M revenue per employee. | The hotel intelligence cards ARE the viral product. If a GM shares their competitive intelligence card with a peer, that peer wants one too. Build the Midjourney of hotel intelligence. |
| **Medvi** | Every dependency is a service, not a hire. AI eliminates labor costs. 2 people, $401M. | Map every Tercier function: what's AI (content generation, review analysis), what's outsourced (infrastructure, compliance), what's proprietary (the dataset, the intelligence layer). Only hire for what creates the moat. |

### The Tercier Playbook — Synthesized

**Months 1-3 (Now through July 2026):**
- Be EvolutionIQ with Kempinski. Embed with their team. Weekly cadence. Measure acceptance rate of every recommendation.
- Be ServiceTitan — care more about the Kempinski pilot than about investor conversations.
- Be Medvi — treat every function as a service unless it's the moat. AI for content. Outsourced infrastructure. Only build the intelligence layer in-house.

**Months 4-6 (July-October 2026):**
- Be Veeva — one case study with real numbers from Kempinski is worth more than any pitch deck. Use it to land 3-5 more luxury properties.
- Be Toast — never sell to a hotel more than 2x the complexity of Kempinski. Scale gradually.
- Monitor burn multiple religiously. Stay under 2x.

**Months 7-12 (October 2026-April 2027):**
- Be Procore — start building the network effect. Unlimited users per property. Let the entire hotel commercial team use the platform.
- Be Ramp — position against the agency model. "Tercier replaces your EUR 200K/year agency. And it gets smarter every day."

**Months 13-48 (The Path to $500M):**
- Be Veeva — build the "Vault" (the Second Act). The intelligence layer is the CRM. The content generation engine is the Vault. Each new module increases switching costs.
- Be Midjourney — let the data speak. No sales deck needed when a hotel GM sees their competitor's intelligence card and realizes they don't have one.

### The One Metric That Matters

From EvolutionIQ: **acceptance rate.** What percentage of Lumina's recommendations does the hotel marketing person actually act on? If it's below 50%, the product isn't working. If it's above 80%, you have PMF. Track it weekly. Improve it 10% per week. That's the entire game.

---

## SOURCES

- [EvolutionIQ Just Got Acquired for $730M — Here's Their Playbook (First Round Review)](https://review.firstround.com/evolutioniq-path-to-pmf/)
- [EvolutionIQ's Path to Product-Market Fit (First Round Review)](https://review.firstround.com/how-evolutioniq-turned-an-early-vertical-ai-idea-into-a-730m-acquisition/)
- [Lessons from a $750M Vertical AI Exit (Euclid VC)](https://insights.euclid.vc/p/verticals-15-evolutioniq-750m-vertical-ai-exit)
- [One Industry, Owned Completely: The Origin Story of Veeva (Stacksync)](https://www.stacksync.com/blog/one-industry-owned-completely-the-origin-story-of-veeva)
- [Peter Gassner: Veeva's Vertical SaaS Strategy (IntuitionLabs)](https://intuitionlabs.ai/articles/peter-gassner-veeva-founder-profile)
- [Toast Built a $30B Business by Defying Silicon Valley (CNBC)](https://www.cnbc.com/2021/09/25/toast-built-a-30-billion-business-by-defying-silicon-valley-vcs.html)
- [The Scrappy Origin Story of Toast (Entrepreneur)](https://www.entrepreneur.com/starting-a-business/how-toast-transformed-the-way-restaurants-do-business/474003)
- [ServiceTitan: A Values-Driven Company's Path to IPO (Bessemer)](https://www.bvp.com/atlas/servicetitan-a-values-driven-companys-path-to-ipo)
- [What Made ServiceTitan a Rocket Ship? (Allison Pickens)](https://allisonpickens.substack.com/p/what-made-servicetitan-a-rocket-ship)
- [How ServiceTitan's Humble Origins (Built In LA)](https://www.builtinla.com/articles/silicon-hills-servicetitans-humble-origins)
- [Going Long: How Procore's Tooey Courtemanche Built a $10B SaaS Empire (SaaStr)](https://www.saastr.com/going-long-how-procores-founder-tooey-courtemanche-built-a-10b-saas-empire-over-23-years/)
- [The $10M to $1B Vertical SaaS Playbook: Procore's Wyatt Jenkins (SaaStr)](https://www.saastr.com/the-10m-to-1b-vertical-saas-playbook-key-lessons-from-procores-chief-product-officer-wyatt-jenkins/)
- [The First $100M ARR at Ramp (SaaStr)](https://www.saastr.com/the-first-100000000-arr-at-ramp-how-ceo-eric-glyman-and-cto-karim-atiyah-built-a-finance-platform-through-asymmetric-bets/)
- [How the F*ck Did Ramp Grow So Fast? (The Moat)](https://www.themoatnewsletter.com/p/how-the-f-ck-did-ramp-grow-so-fast)
- [Ramp: Lessons from One of the Fastest Growing Startups (Next Play)](https://nextplayso.substack.com/p/lessons-from-ramp-one-of-the-fastest)
- [Midjourney Business Breakdown (Contrary Research)](https://research.contrary.com/company/midjourney)
- [How Midjourney Built a $200M+ AI Business Through Discord-First Strategy (IdeaPlan)](https://www.ideaplan.io/case-studies/midjourney-community-driven-ai)
- [Midjourney Founder Story: No VC (AI Invest Brief)](https://aiinvestbrief.com/midjourney-founder-story/)
- [The One-Person Billion-Dollar Company Is Here (PYMNTS)](https://www.pymnts.com/artificial-intelligence-2/2026/the-one-person-billion-dollar-company-is-here/)
- [He Built a $1.8 Billion Company Alone with AI (Scortier)](https://scortier.substack.com/p/how-one-man-built-a-18-billion-company)
- [Building Vertical AI: An Early Stage Playbook for Founders (Bessemer)](https://www.bvp.com/atlas/building-vertical-ai-an-early-stage-playbook-for-founders)
- [Part IV: Ten Principles for Building Strong Vertical AI Businesses (Bessemer)](https://www.bvp.com/atlas/part-iv-ten-principles-for-building-strong-vertical-ai-businesses)
- [Bessemer Vertical AI Full Playbook PDF (January 2026)](https://www.bvp.com/assets/uploads/2026/01/BUILDING-VERTICAL-AI_PDF_BESSEMER_VENTURE_PARTNERS_BOOK_JANUARY_2026.pdf)
- [Default Alive or Default Dead? (Paul Graham)](https://paulgraham.com/aord.html)
- [Do Things That Don't Scale (Paul Graham)](https://paulgraham.com/ds.html)
- [The SaaS Metrics That Matter — Burn Multiple (David Sacks)](https://sacks.substack.com/p/the-saas-metrics-that-matter)
- [The Founder's Guide to Vertical AI (Euclid VC)](https://insights.euclid.vc/p/founders-guide-to-vertical-ai)
- [Data and Defensibility (Abraham Thomas)](https://pivotal.substack.com/p/data-and-defensibility)
