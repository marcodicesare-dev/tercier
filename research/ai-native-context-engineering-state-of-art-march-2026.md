# AI-Native Context Engineering: State of the Art (March 2026)

## Executive Summary

Context engineering has replaced prompt engineering as the defining discipline for building AI-native systems. The field is evolving through three waves: **prompt engineering** (2022-24), **context engineering** (2025), and **harness engineering** (2026). The companies building "Jarvis-level" AI systems are treating context as a first-class engineering artifact -- version-controlled, tested, progressively disclosed, and designed for autonomous agent consumption.

Key findings:

1. **Agent Skills are now an open standard** adopted by 30+ tools (Claude Code, Cursor, VS Code/Copilot, OpenAI Codex, Gemini CLI, Databricks, JetBrains Junie, and more via agentskills.io)
2. **The ETH Zurich bombshell**: LLM-generated context files *reduce* agent performance by 3% while adding 20%+ to costs. Only human-written, minimal context files help (+4%)
3. **Manus (now acquired by Meta) published the canonical context engineering playbook** with principles around KV-cache optimization, early constraints, and todo-list steering
4. **"Context as code" is emerging** -- Letta's Context Repositories use git-based memory, CodevOS treats specs as version-controlled code, SudoCode makes requirements first-class artifacts
5. **Harness engineering** is the March 2026 frontier: designing the *environment* around agents (constraints, feedback loops, scaffolding, recovery mechanisms)
6. **Your existing skills system is already best-in-class** but can be sharpened with specific patterns from the latest research

---

## 1. Claude Code's Skill System: What the Community Has Figured Out

### The Open Standard (AgentSkills.io)

Agent Skills graduated from a Claude-specific feature to an **open standard** at agentskills.io. Adoption includes:

- **Claude Code & Claude API** (Anthropic)
- **Cursor** (cursor.com/docs/context/skills)
- **VS Code / GitHub Copilot** (code.visualstudio.com/docs/copilot/customization/agent-skills)
- **OpenAI Codex** (developers.openai.com/codex/skills/)
- **Gemini CLI** (geminicli.com/docs/cli/skills/)
- **JetBrains Junie**, **Letta**, **Databricks**, **Snowflake**, **Spring AI**, **Roo Code**, **Factory.ai**, **Kiro**, **Laravel Boost**, **Goose (Block)**, **Mistral Vibe**, and 15+ more

**Strategic implication: skills you write today for Claude Code are portable across the entire ecosystem.**

### Anthropic's Official Best Practices (platform.claude.com/docs)

**Progressive Disclosure Architecture:**
- At startup, only metadata (name + description) from ALL skills is pre-loaded
- SKILL.md body is loaded only when triggered
- Reference files loaded only as needed
- Skills have **zero context cost until triggered**

**Hard Constraints:**
- SKILL.md body: **under 500 lines**
- Name: max 64 chars, lowercase + hyphens only
- Description: max 1024 chars, **third person** voice, must describe both what the skill does AND when to use it
- Reference files: **one level deep** from SKILL.md only (Claude partially reads nested references)
- Reference files over 100 lines: must include a table of contents

**Naming:** Gerund form preferred (`processing-pdfs`, `analyzing-spreadsheets`). Avoid `helper`, `utils`, `tools`.

**The 5 Official Skill Patterns:**
1. **Template** -- output format templates
2. **Examples** -- input/output pairs (few-shot in a file)
3. **Conditional workflow** -- decision trees
4. **High-level guide with references** -- SKILL.md as TOC
5. **Domain-specific organization** -- content split by domain

**Degrees of Freedom Model:**
- Low freedom (exact scripts): fragile operations like DB migrations
- Medium freedom (pseudocode with params): preferred patterns with variation
- High freedom (text instructions): context-dependent decisions

**Evaluation-Driven Development:**
- Build evaluations BEFORE documentation
- 3+ test scenarios per skill
- Test across Haiku, Sonnet, AND Opus
- "Claude A / Claude B" pattern: one instance writes skills, another tests them

**The anthropics/skills repo hit 87,000+ stars.** Community learnings: slash commands with `disable-model-invocation: true` for workflows with side effects, eval hooks push reliability to ~84%.

---

## 2. Context Engineering Patterns for AI-Native Companies

### Anthropic's Framework

**Core Principle:** "The smallest set of high-signal tokens that maximize the likelihood of your desired outcome."

**"Right Altitude" for System Prompts:** Not too specific (brittle), not too vague (unhelpful). Specific enough to guide, flexible enough for heuristics.

**Three Strategies for Long-Horizon Tasks:**

| Strategy | When | How |
|----------|------|-----|
| **Compaction** | Extensive dialogue | Summarize history, preserve decisions + bugs + implementation details |
| **Structured Note-Taking** | Iterative work with milestones | Persistent notes outside context, pulled back later |
| **Sub-Agent Architecture** | Complex research/parallel work | Specialized sub-agents return 1K-2K token summaries |

### Manus's Principles (now Meta)

The most-cited context engineering blog post of 2025-26:

1. **Design Around the KV-Cache** -- stable parts (system prompt, skills, tools) first, volatile parts (conversation, outputs) last, to maximize cache hits
2. **Constrain Early, Expand Late** -- front-load constraints; earlier rules bind more strongly
3. **Todo-List as Steering Mechanism** -- persistent, mutable todo list the agent updates across turns
4. **Never Waste Tokens on What the Model Knows** -- only provide what cannot be inferred from training data

### ThoughtWorks' 5 Building Blocks (March 18, 2026)

"Beyond Vibe Coding" defines the AI-native engineering stack: Agent + Model + Methodology + Spec + Context. Their conclusion: context engineering is building block #5, and it is the one most teams underinvest in.

### The New Stack

"Context is AI Coding's Real Bottleneck in 2026" -- the gap between 10x and 2x productivity from AI is almost entirely explained by context engineering quality.

---

## 3. CLAUDE.md / llms.txt / AGENTS.md -- The Three Standards

### CLAUDE.md

**Include:** Non-guessable bash commands, non-default code style rules, test instructions, repo etiquette, architectural decisions, env quirks, gotchas.

**Exclude:** Anything inferable from code, standard language conventions, detailed API docs (link instead), frequently-changing info, tutorials, file-by-file descriptions.

**Critical insight from Anthropic:** "If Claude keeps doing something you don't want despite having a rule against it, the file is probably too long and the rule is getting lost."

**Hierarchy:** `~/.claude/CLAUDE.md` (global) > `./CLAUDE.md` (project) > parent dirs > child dirs (on demand). Import syntax: `@path/to/file`.

### AGENTS.md + The ETH Zurich Study

**ETH Zurich (arXiv:2602.11988, February 2026) found:**
- LLM-generated AGENTS.md files **reduce task success by 3%** while increasing costs 19-23%
- Human-written files improve success by only 4% and still increase costs
- Agents rigidly follow instructions, making unnecessary requirements counterproductive

**Addy Osmani's response:** Stop using `/init` for auto-generated context files. Only include what agents genuinely cannot infer: specific tooling, custom build commands, non-obvious architectural patterns. Everything else should be discoverable from the codebase itself.

### llms.txt

Jeremy Howard's standard for websites (like robots.txt for LLMs). 844,000+ sites use it. Different problem than CLAUDE.md -- it's for external AI consumption, not internal agent tooling.

---

## 4. "Context as Code" -- The Emerging Paradigm

### Letta's Context Repositories (February 2026)

The MemGPT team introduced **git-based memory for agents:**
- Context stored in git repositories agents can read AND write to
- Agents programmatically self-manage their own context
- Full version history of context changes
- Multiple agents share context through the same repository

### CodevOS (Waleed Kadous, ex-Google)

Natural language context IS code:
- Specs and plans version-controlled alongside source
- Reviewed with same rigor as code changes
- "Instead of writing code first and documenting later, you start with clear specs"

### SudoCode

Makes it explicit: "Your context and designs are just as valuable as the code being written. Code is often over-specified, while your actual requirements are under-specified."

### The Convergence

The best AI-native companies treat their natural-language context artifacts (specs, skills, plans, domain knowledge) with the same engineering discipline as code -- versioned in git, reviewed in PRs, tested against agent behavior, pruned regularly.

---

## 5. March 2026 Discourse

### X/Twitter

- **@levie (Box CEO):** "The force multiplier of the agent harness right now is crazy."
- **@heynavtoor:** "Context engineering was the skill of 2025. Harness engineering is the skill of 2026."
- **@ihtesham2005:** "Prompt engineering is dead. The new king is Context engineering."
- **@arscontexta:** "This isn't slop anymore, it's context engineering -> harness engineering. Build FOR agents, not WITH them."
- **@nycdiscovery:** "Context engineering is the skill of being the operating system for agents."
- **@mem0ai (March 27):** Publishing "In Context" blog series on agent memory and context engineering.

### Key March 2026 Publications

- **Forbes:** Jensen Huang names 103 AI-Native companies at GTC 2026
- **Meta Context Engineering (arXiv, Jan 2026):** Bi-level optimization framework where agents co-evolve their own skills
- **Every (Dan Shipper):** Full strategy video on building a truly AI-native company where agents hold complete financial context

---

## 6. Skills vs Agents vs Memory vs Context Files

### The Claude Code Taxonomy

| Feature | Purpose | Context Cost | When |
|---------|---------|-------------|------|
| **CLAUDE.md** | Persistent project context | Every token, every session | Rules for ALL sessions |
| **Skills** | Domain knowledge + workflows | Zero until triggered | Sometimes-relevant info |
| **Sub-agents** | Isolated specialized tasks | Zero (separate window) | Research, review, validation |
| **Hooks** | Deterministic actions | Zero (scripts, not AI) | Must happen every time |
| **MCP Servers** | External tool connections | Minimal (tool definitions) | External service interaction |
| **Plugins** | Bundled extensions | Varies | Pre-packaged capabilities |

**Cost hierarchy:**
```
CLAUDE.md        -> costs tokens in EVERY session
Skills metadata  -> ~100 tokens per skill, always loaded
Skills body      -> loaded only when triggered
Sub-agents       -> zero main-context cost
Hooks            -> zero context cost
```

### MindStudio's "Agentic OS" Four Patterns

1. **Fresh Context** -- clean, task-specific context per interaction
2. **Shared Brand Memory** -- persistent company/domain knowledge
3. **Skill Collaboration** -- multiple skills on complex tasks
4. **Self-Learning** -- agents improving their own skills and memory

---

## 7. The "Jarvis" Paradigm

### Harness Engineering (March 2026 Frontier)

The evolution:
- **Prompt Engineering (2022-24):** How do I ask better questions?
- **Context Engineering (2025):** How do I provide the right information?
- **Harness Engineering (2026):** How do I design the system so agents succeed autonomously?

Harness engineering encompasses:
- **Constraints** -- permission boundaries, sandbox isolation
- **Feedback loops** -- tests, validators, screenshots for self-verification
- **Scaffolding** -- skills, sub-agents, hooks
- **Recovery** -- rewind, checkpoints, fallback
- **Orchestration** -- agent teams, writer/reviewer patterns

### The Pattern Across Jarvis-Level Companies

1. **All knowledge is machine-readable** -- structured files, not heads or unstructured docs
2. **Context is layered** -- always-loaded, on-demand, and isolated tiers
3. **Knowledge compounds** -- every interaction makes context better
4. **Agents operate autonomously** -- enough context enables multi-step workflows without humans
5. **The repo IS the brain** -- repository structure is the knowledge architecture

---

## 8. Assessment of Tercier's Current System

### Already Best-in-Class
- 3→6 skill architecture with dependency graph
- CLAUDE.md as master context with skill routing
- Reference files one level deep
- Domain-specific organization
- Non-negotiable rules in CLAUDE.md
- Version-controlled in git

### Specific Refinements to Consider
1. Switch skill descriptions to **third person**
2. Add **table of contents** to reference files over 100 lines
3. **Prune CLAUDE.md** -- move "What Lives Where" tree and "Current Status" to a skill or `.context/` (costs tokens every session)
4. Add **sub-agents** -- data-validator, research-analyst, security-reviewer
5. Add **hooks** -- auto-validate data against intelligence schema, auto-check rate limits
6. Add **skill evaluations** -- 3+ test scenarios per skill
7. Move volatile info (dates, counts) out of CLAUDE.md into `.context/notes.md`
8. Add **slash command workflows** -- `/enrich-hotel`, `/run-pipeline`

### Frontier: What to Build Next
1. Self-updating context -- agents write back to `.context/notes.md` after tasks
2. Agent teams for pipeline work -- writer enriches, reviewer validates, coordinator summarizes
3. Harness-level design -- permission boundaries for API calls, sandboxed data processing
4. Context repositories (Letta-style) -- git-backed memory for processed hotel intelligence

---

## Sources

- [Anthropic: Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Anthropic: Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Claude Code: Best Practices](https://code.claude.com/docs/en/best-practices)
- [AgentSkills.io: The Open Standard](https://agentskills.io/home)
- [Anthropic: Official Skills Repository](https://github.com/anthropics/skills)
- [Manus: Context Engineering for AI Agents](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)
- [ETH Zurich: Evaluating AGENTS.md (arXiv:2602.11988)](https://arxiv.org/abs/2602.11988)
- [InfoQ: Reassessing AGENTS.md Files](https://www.infoq.com/news/2026/03/agents-context-file-value-review/)
- [ThoughtWorks: Beyond Vibe Coding](https://www.thoughtworks.com/en-us/insights/blog/generative-ai/beyond-vibe-coding-the-five-building-blocks-of-aI-native-engineering)
- [MindStudio: Agentic OS Architecture](https://www.mindstudio.ai/blog/agentic-os-architecture-four-patterns-claude-code/)
- [The New Stack: Context is AI Coding's Real Bottleneck](https://thenewstack.io/context-is-ai-codings-real-bottleneck-in-2026/)
- [Letta: Context Repositories](https://www.letta.com/blog/context-repositories)
- [Marcel Castro: Skills and Progressive Disclosure](https://marcelcastrobr.github.io/posts/2026-01-29-Skills-Context-Engineering.html)
- [Epsilla: Harness Engineering](https://www.epsilla.com/blogs/harness-engineering-evolution-prompt-context-autonomous-agents)
- [Addy Osmani: Stop Using /init for AGENTS.md](https://medium.com/@addyosmani/stop-using-init-for-agents-md-3086a333f380)

*Research compiled March 28, 2026 by parallel research agent. All sources verified as of compilation date.*
