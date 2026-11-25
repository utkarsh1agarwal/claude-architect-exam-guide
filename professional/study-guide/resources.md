# Resources — CCAR-P (Professional, v1.1)

Official sources first. The exam guide names product areas, not URLs — the domain mapping below is this guide's, chosen so each v1.1 skill has a primary doc to read. All links checked November 2026.

## Official Anthropic exam resources

| Resource | Notes |
|---|---|
| [CCAR-P Exam Guide v1.1 (PDF, effective Dec 7, 2026)](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946420/Claude_Certified_Architect_-_Professional_Exam_Guide_Updated_Dec_7.pdf) | The source of truth: format, weights, the 39 skills, 3 sample questions |
| [CCAR-P certification page](https://anthropic-partners.skilljar.com/claude-certified-architect-professional-certification) | Registration (Claude Partner Network members) |
| [Certification FAQ](https://anthropic-partners.skilljar.com/page/faq-certifications) | Eligibility, discounts, retakes, languages |
| [Official CCAR-P prep course](https://anthropic-partners.skilljar.com/path/claude-certified-architect-professional) | Free for partners; 5 modules (~12 h) |
| [CCAR-F Exam Guide (PDF)](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946250/Claude_Certified_Architect_-_Foundations_Exam_Guide.pdf) | Foundations scope is assumed knowledge for CCAR-P |
| [Anthropic Academy](https://anthropic.skilljar.com/) | Public courses: Building with the Claude API, Claude Code in Action, Introduction to MCP, Agent Skills |

## Must-read engineering posts

| Post | Domains |
|---|---|
| [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | D1 pattern selection — read this first |
| [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) | D1 orchestrator/subagent decomposition |
| [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | D2 context, D3 progressive discovery |
| [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) | D2 context lifecycle |
| [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) | D1 Skills pattern, D2 packaging |
| [Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents) | D3 least privilege, tool design |
| [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) | D3 keeping data out of context |
| [Advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use) | D3 tool search, programmatic tool calling |
| [Introducing Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) | D3 retrieval architecture |
| [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) | D4 |
| [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) | D1 runtime, D7 |
| [Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices) | D7 |

## Claude Developer Platform docs, by domain

**D1 — Solution Design**
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) · [Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/overview)
- Deployment surfaces: [Amazon Bedrock](https://platform.claude.com/docs/en/build-with-claude/claude-in-amazon-bedrock) · [Google Vertex AI](https://platform.claude.com/docs/en/build-with-claude/claude-on-vertex-ai) · [Microsoft Foundry](https://platform.claude.com/docs/en/build-with-claude/claude-in-microsoft-foundry)

**D2 — Models, Prompting, Context**
- [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) · [Choosing a model](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model)
- [Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview)
- [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Effort](https://platform.claude.com/docs/en/build-with-claude/effort) · [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
- [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing) · [Compaction](https://platform.claude.com/docs/en/build-with-claude/compaction) · [Memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)
- [Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)

**D3 — Integration**
- [Tool search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool) · [MCP connector](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector)
- [Rate limits](https://platform.claude.com/docs/en/api/rate-limits) · [Errors](https://platform.claude.com/docs/en/api/errors)
- [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
- [MCP specification](https://modelcontextprotocol.io/specification/2025-11-25) · [MCP authorization](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)

**D4 — Evaluation**
- [Define success criteria](https://platform.claude.com/docs/en/test-and-evaluate/define-success) · [Develop test cases](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests)
- [Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations)

**D5 — Governance**
- [Mitigate jailbreaks and prompt injections](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks) · [Reduce hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations)
- [Zero data retention](https://platform.claude.com/docs/en/build-with-claude/zero-data-retention) · [Data residency](https://platform.claude.com/docs/en/build-with-claude/data-residency)
- [Agent SDK permissions](https://platform.claude.com/docs/en/agent-sdk/permissions)

**D7 — Claude Code**
- [Plugins](https://code.claude.com/docs/en/plugins) · [Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Settings & managed settings](https://code.claude.com/docs/en/settings) · [Identity and access management](https://code.claude.com/docs/en/iam)
- [Permission modes](https://code.claude.com/docs/en/permission-modes) · [Hooks](https://code.claude.com/docs/en/hooks) · [Subagents](https://code.claude.com/docs/en/sub-agents)
- [Headless mode](https://code.claude.com/docs/en/headless) · [GitHub Actions](https://code.claude.com/docs/en/github-actions) · [Monitoring (OpenTelemetry)](https://code.claude.com/docs/en/monitoring-usage)

## Hands-on is the best resource

The v1.1 guide recommends delivering at least one end-to-end production solution. A weekend version that touches every domain:

1. A Messages API agent with 3 tools, one of them side-effecting (D1, D3)
2. A cached system prompt — confirm cache reads in the usage block (D2)
3. An MCP server added to Claude Code with an allowlist of tools (D3, D7)
4. A 30-case eval with a code grader and an LLM judge; run 3 trials per case (D4)
5. A PreToolUse hook that blocks the side-effecting tool above a threshold (D5, D7)
6. A one-page ADR for one decision you made, with residual risk (D6)

<!-- support-footer -->
---

> Created by **Utkarsh Agarwal** — certified Claude Certified Architect (Foundations & Professional).
> Found this useful? [⭐ Star the repo on GitHub](https://github.com/utkarsh1agarwal/claude-architect-exam-guide) · [💼 Follow me on LinkedIn](https://www.linkedin.com/in/utkarsh-agarwal-ua0235/) · [☕ Buy me a coffee](https://utkarsh1agarwal.github.io/claude-architect-exam-guide/#support)
