# Scenarios Overview

The exam draws **4 of these 6 scenarios at random** for any given sitting. Every question in the exam is framed around one of the four you get. Studying the domains alone isn't enough — you also need to be able to recognize which domain(s) a scenario is really probing, because scenarios often blend two or three.

| # | Scenario | Primary domains |
|---|---|---|
| 1 | Customer Support Resolution Agent | Agentic Architecture, Tool Design & MCP, Context & Reliability |
| 2 | Code Generation with Claude Code | Claude Code Workflows, Context & Reliability |
| 3 | Multi-Agent Research System | Agentic Architecture, Tool Design & MCP, Context & Reliability |
| 4 | Developer Productivity with Claude | Tool Design & MCP, Claude Code Workflows, Agentic Architecture |
| 5 | Claude Code for Continuous Integration | Claude Code Workflows, Prompt Engineering |
| 6 | Structured Data Extraction | Prompt Engineering, Context & Reliability |

## 1. Customer Support Resolution Agent

You're building a resolution agent for returns, billing disputes, and account issues, backed by MCP tools (`get_customer`, `lookup_order`, `process_refund`, `escalate_to_human`), targeting 80%+ first-contact resolution.

**What it really tests:** hooks and prerequisite enforcement ([Domain 1](domain-1-agentic-architecture.md#14-hooks-posttooluse-and-tool-interception)), tool description quality for near-duplicate tools ([Domain 2](domain-2-tool-design-mcp.md#21-tool-description-quality-is-the-1-selection-lever)), and escalation calibration ([Domain 5](domain-5-context-reliability.md#escalation-ambiguity-resolution)). This is the scenario where "structural fix beats prompt fix" shows up most literally — refund-before-verification bugs are the exam's signature example.

## 2. Code Generation with Claude Code

Using Claude Code for generation, refactoring, debugging, and docs, with custom slash commands, `CLAUDE.md` configuration, and plan mode vs. direct execution decisions.

**What it really tests:** the `CLAUDE.md` hierarchy and `.claude/rules/` glob scoping, iterative refinement techniques, and knowing when architectural complexity justifies plan mode ([Domain 3](domain-3-claude-code-workflows.md)).

## 3. Multi-Agent Research System

A coordinator delegates to specialized subagents (search, document analysis, synthesis, report generation) to produce comprehensive, cited reports.

**What it really tests:** coordinator task decomposition and parallel spawning ([Domain 1](domain-1-agentic-architecture.md#1213-coordinatorsubagent-hub-and-spoke-pattern)), scoped cross-role tools ([Domain 2](domain-2-tool-design-mcp.md#23-tool-distribution-tool_choice-across-agents)), and provenance/conflict-handling in synthesis ([Domain 5](domain-5-context-reliability.md#human-review-confidence-calibration-provenance)). The classic trap here: a report with narrow coverage despite every subagent "succeeding" — the bug is almost always upstream in the coordinator's decomposition.

## 4. Developer Productivity with Claude

An agent that helps engineers explore unfamiliar codebases, understand legacy systems, and automate repetitive tasks, using built-in tools (`Read`, `Write`, `Bash`, `Grep`, `Glob`) plus MCP servers.

**What it really tests:** built-in tool selection (`Grep` vs. `Glob`), MCP-vs-built-in description competition ([Domain 2](domain-2-tool-design-mcp.md#26-mcp-tool-descriptions-vs-built-in-tool-preference)), and context management during long exploration sessions ([Domain 5](domain-5-context-reliability.md#large-codebase-exploration-crash-recovery)).

## 5. Claude Code for Continuous Integration

Automated code reviews, test generation, and PR feedback wired into CI/CD, designed to minimize false positives.

**What it really tests:** the `-p`/`--print` flag and JSON output flags ([Domain 3](domain-3-claude-code-workflows.md#36-cicd-integration)), explicit-criteria false-positive reduction, and independent-instance review architecture ([Domain 4](domain-4-prompt-engineering.md#reducing-false-positives-explicit-criteria-vague-instructions)).

## 6. Structured Data Extraction

Extracting information from unstructured documents, validating against JSON schemas, handling edge cases gracefully.

**What it really tests:** `tool_use` + JSON schema design, nullable fields to prevent fabrication, validation-retry loops, and knowing when retry won't help ([Domain 4](domain-4-prompt-engineering.md#validation-retry-feedback-loops-for-extraction-quality)), plus confidence-based human review routing ([Domain 5](domain-5-context-reliability.md#human-review-confidence-calibration-provenance)).

## How to use this page

Before the exam, pick any scenario above and try to predict, from memory, which 3–5 concepts it's most likely to test — then check yourself against the domain links. If you can do this cold for all 6, you're in good shape regardless of which 4 you actually draw.

