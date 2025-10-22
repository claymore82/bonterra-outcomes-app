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

**Style**: [Monolith / Microservices / Serverless / Event-Driven]

**Key Characteristics**:
- [Defining characteristic 1]
- [Defining characteristic 2]
- [Defining characteristic 3]

## Components

### [Component Name]

[Brief description of what it does, the tech stack, and key responsibilities]

**Related Decisions**: [Compelling sentence] → [Link to ITD]

[Repeat for each component]

**Key Interactions**:
1. [Pattern 1 - what triggers it, what's exchanged]
2. [Pattern 2 - sync vs async, protocol]

## Data & State Management

[What are the main data stores, files, or state? How does data flow through the system?]

**Data Stores**: [Databases, file systems, caches, message queues—anything that persists or transfers data]

**Data Flow**:
- [Input → Processing → Storage → Output]

**Related Decisions**: [Interesting sentence about data choices] → [Link to ITD]

## APIs / Interfaces

**[Primary API/Interface Name]**: [Brief description]
- [Authentication method]
- [Key endpoints or operations]
- [Data format]

**External Integrations**: [What external systems? Auth providers, payment gateways, etc.]

**Related Decisions**: [Interesting sentence about API choices] → [Link to ITD]

## Key Technical Decisions

**[Decision Name]**: [One compelling sentence that makes someone curious to read the ITD] → [Link to ITD](../[category]/[FILE].md)

**[Decision Name]**: [Another compelling sentence] → [Link to ITD](../[category]/[FILE].md)

[Repeat for each major decision]

## Constraints & Trade-offs

[List key constraints and conscious trade-offs as bullets - mix technical, business, and architectural choices]

- [Technical constraint or limitation]
- [Business requirement that constrained choices]
- [Conscious trade-off - what was sacrificed vs gained]
