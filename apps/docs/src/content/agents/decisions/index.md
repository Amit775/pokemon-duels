---
title: Decisions
slug: decisions
description: Architecture Decision Records
category: agents
---

# Architecture Decisions

This section documents significant architecture decisions using a lightweight ADR (Architecture Decision Record) format.

## Documents

*No decisions recorded yet.*

---

## How to Document a Decision

When making a significant technical choice, create a doc at `decisions/<decision-name>.md`.

### Template

```yaml
---
title: Decision Title
slug: decisions/decision-name
description: One-line summary
category: agents
date: YYYY-MM-DD
status: proposed | accepted | deprecated | superseded
---
```

### Structure

```markdown
# Decision Title

## Status
Accepted / Proposed / Deprecated / Superseded by [link]

## Context
What is the issue or question we're addressing?

## Options Considered
1. **Option A** - Pros/cons
2. **Option B** - Pros/cons
3. **Option C** - Pros/cons

## Decision
What did we decide and why?

## Consequences
- Positive outcomes
- Trade-offs accepted
- Follow-up work needed
```

---

## When to Write a Decision Doc

- Choosing between technologies (e.g., SignalR vs. WebSockets)
- Establishing patterns (e.g., state management approach)
- Making trade-offs (e.g., performance vs. simplicity)
- Changing direction from a previous decision
