# [System Name] Architecture

## System Overview

**Purpose**: [What does this system do? What business problem does it solve?]

**Key Stakeholders**: [Who are the primary users? Who maintains it?]

## Whiteboard Diagram

[Visual architecture showing major components, data flow, and system boundaries]

```mermaid
[Create diagram with:
- Major components/services (10 boxes max)
- Data flow between them
- External dependencies
- System boundary (dashed box around what's "inside")]
```

## Architecture Overview

**Architecture Style**: [Monolith / Microservices / Serverless / Event-Driven / etc.]

**Key Characteristics**:
- [Defining characteristic 1]
- [Defining characteristic 2]
- [Defining characteristic 3]

**Design Philosophy**: [What principles guided the architectural decisions?]

## Component Architecture

### Component: [Name]

**Responsibility**: [What does this component do? What problems does it solve?]

**Technology**: [Tech stack, runtime, framework]

**Key Interfaces**:
- Exposes: [What APIs/interfaces?]
- Consumes: [What does it depend on?]

**ITD References**: [Link to relevant ITDs]

[Repeat for each major component]

### Component Interactions

```mermaid
[Diagram showing how components interact]
```

**Key Interaction Patterns**:
1. [Pattern 1 - what triggers it, what's exchanged]
2. [Pattern 2 - sync vs async, protocol]

## Data Architecture

[What are the main data stores and entities? How does data flow through the system?]

```mermaid
erDiagram
    [If helpful, add ER diagram of core entities]
```

**Data Flow**:
- [Input → Processing → Storage → Output]

**ITD References**: [Link to data modeling ITDs]

## APIs / Interfaces

**[Primary API/Interface Name]**: [Brief description]
- [Authentication method]
- [Key endpoints or operations]
- [Data format]

**External Integrations**: [What external systems? Auth providers, payment gateways, etc.]

**ITD References**: [Link to API design ITDs]

## Key Technical Decisions

[List major architectural decisions with links to ITDs. Each decision should include brief context.]

### [CATEGORY]-[NUMBER]: [Decision Title]
**Decision**: [One sentence]  
→ [Link to ITD](../[category]/[FILE].md)

[Repeat for each major decision]

## Constraints & Trade-offs

**Technical Constraints**: [What limitations does the architecture have?]

**Business Constraints**: [What business requirements constrained choices?]

**Key Trade-offs**: [What was deliberately sacrificed and what was gained?]

## References

### Documentation
- [Link to main README]
- [Link to docs README]

### Related ITDs
- [List all ITDs]

### Code Repositories
- [Main repo]

### External Resources
- [Technology docs]
- [Inspirations]
