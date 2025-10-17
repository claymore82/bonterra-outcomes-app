# Architecture Documentation

This directory contains Implementation/Technical Decisions (ITDs) and data structure documentation for architectural decisions made in this project.

## Quick Start

1. **Document a decision**: Use the [ITD Template](templates/itd-template.md)
2. **Document a data model**: Use the [Data Structure Template](templates/data-structure-template.md)
3. **Name your file**: Use category prefix (e.g., `GENERAL-001-framework-choice.md`, `AUTH-001-jwt-strategy.md`)
4. **Share for review**: Get team feedback before implementation

## Document Types

### Implementation/Technical Decisions (ITDs)
Document significant technical choices with full context, alternatives, and reasoning.

**Template**: [ITD Template](templates/itd-template.md)  
**Example**: [Example ITD](examples/itd-example.md)

### Data Structure Documentation
Define data models, schemas, and architectural data decisions with ERD diagrams.

**Template**: [Data Structure Template](templates/data-structure-template.md)

## Organization Structure

```
docs/
├── README.md                    # This file
├── templates/                   # Templates for new docs
├── examples/                    # Example documentation
├── 01-general/                  # System-wide decisions
│   └── GENERAL-001-example.md
├── 02-auth/                     # Authentication decisions
│   └── AUTH-001-example.md
└── core-data-structures/        # Data models
    └── DS-001-example.md
```

## Naming Convention

Use **category prefix** to avoid numbering confusion across folders:

- `GENERAL-XXX` - System-wide architectural decisions
- `AUTH-XXX` - Authentication and authorization
- `API-XXX` - API design decisions
- `DATA-XXX` - Data modeling and storage
- `INFRA-XXX` - Infrastructure and deployment
- `DS-XXX` - Data structure documentation

**Examples:**
- `GENERAL-001-framework-selection.md`
- `AUTH-001-jwt-based-access.md`
- `API-001-rest-conventions.md`
- `DS-001-user-events-table.md`

## Quality Standards

- ✅ Every significant technical decision gets an ITD
- ✅ All data structures have ERD diagrams
- ✅ Cross-reference related documents
- ✅ Include implementation examples in TypeScript
- ✅ Document alternatives and why they were rejected
- ✅ Add new ITDs when decisions change (don't edit old ones)

## Getting Started

1. Copy a template from `templates/`
2. Fill in the sections with your decision context
3. Create PR for team review
4. Save approved ITD in appropriate category folder

## AI-Assisted Documentation

**Using AI is encouraged** to help draft ITDs. AI can help with:
- Structuring reasoning and alternatives
- Generating code examples and schemas
- Improving clarity and completeness

**Authors and reviewers remain fully accountable** for all technical decisions and content accuracy.

