# [CATEGORY]-XXX: [Decision Title]

> **Category Examples**: GENERAL, AUTH, API, DATA, INFRA
> **Naming**: Use lowercase with hyphens (e.g., `GENERAL-001-framework-selection.md`)

## Context

*(Optional)* Background information and situational context. Why is this decision needed?

Example:
- What problem are we trying to solve?
- What's the current state?
- What constraints do we have?

## Problem

Frame as a clear, answerable question:
- "How should we implement authentication across multiple client types?"
- "Which database should we use for high-volume event storage?"
- "What framework should we use for building our web application?"

## Options Considered

List all options you evaluated. Mark the selected option in bold:

1. **[Selected Option]**: Brief description of this approach
2. [Alternative Option 1]: Brief description of this approach
3. [Alternative Option 2]: Brief description of this approach
4. [Alternative Option 3]: Brief description of this approach

## Reasoning

Explain why the selected option was chosen AND why each alternative was rejected. This is the heart of the ITD - focus on comparative analysis rather than just listing pros/cons.

[Start by explaining why you chose the selected option:]
- [Key advantage 1 - with specific technical reasons]
- [Key advantage 2 - performance/cost/maintainability]
- [Evidence: benchmarks, prior experience, team expertise]
- [How it fits your specific context/constraints]

[Then address each alternative you rejected:]

*[Alternative Option 1]:* [Specific reason it didn't fit your needs and technical limitations or constraints]

*[Alternative Option 2]:* [Specific reason it didn't fit your needs and trade-offs that weren't acceptable]

*[Alternative Option 3]:* [Specific reason it didn't fit your needs and why selected option is better for your use case]

## Implications

- [Actionable consequence 1 - what must be done]
- [Actionable consequence 2 - what changes are required]
- [Constraint or requirement]
- [Cost or resource impact]
- [Training or documentation needs]

## References

- [Link to supporting documentation]
- [Related ITDs or data structure docs]
- [External articles or benchmarks]

---

## Tips for Writing Good ITDs

### Context Section (Optional)
- Explain the "why now" - what triggered this decision?
- Include relevant constraints (timeline, budget, team size)
- Keep it brief - detailed analysis goes in Reasoning

### Problem Section
- Frame as a specific, answerable question
- Avoid solution hints in the problem statement
- Make it clear what decision needs to be made

### Options Considered Section
- List ALL options you seriously evaluated (not just 2)
- Mark the selected option in **bold**
- Give each option a brief, neutral description
- Present options on equal footing (no bias in descriptions)

### Reasoning Section
- This is the heart of the ITD - take your time here
- Explain why the winner was chosen with specific technical reasons
- Address each rejected alternative explicitly
- Include evidence when possible (benchmarks, metrics, references)
- Explain why this fits your specific context
- Be honest about trade-offs
- Avoid just listing pros/cons - focus on comparative analysis

### Implications Section (Optional)
- Focus on actionable items
- Include costs, risks, and dependencies
- Mention training/documentation needs
- Note any technical debt or future work required

### References Section (Optional)
- Link to supporting documentation
- Include benchmarks, articles, or prior experience
- Reference related ITDs or architectural decisions

