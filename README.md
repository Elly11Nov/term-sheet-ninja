# Deal Compass

**AI-assisted term sheet analysis and negotiation support for startup founders.**

Deal Compass is a prototype designed to help founders structure and assess key terms in a proposed seed investment.

The application translates complex investment terms into a structured deal assessment, combining financial modelling, requirements analysis and decision-support workflows.

## The problem

Early-stage term sheets combine financial, ownership and governance provisions that need to be assessed together.

A change to one term can affect other aspects of the deal — for example, investment amount, post-money valuation, founder ownership, liquidation preferences or control rights.

Deal Compass explores how these relationships can be represented in a structured model and presented through a clearer decision-support experience.

## Core workflow

```text
Term sheet inputs
       ↓
Structured deal model
       ↓
Financial calculations
       ↓
Ownership & dilution analysis
       ↓
Governance / control analysis
       ↓
Scenario modelling
       ↓
Deal assessment
       ↓
Founder decision support
```

The application separates the underlying deal logic from the user interface so that the model can be extended with additional scenarios and AI capabilities.

## Key capabilities

### Financial modelling

* Post-money valuation
* Implied investor ownership
* Founder ownership after investment
* Funding gap analysis
* Dilution scenarios
* Tranche and milestone scenarios
* Optional exit-value modelling

### Term analysis

The prototype captures and structures terms including:

* Liquidation preference
* Founder vesting
* Board provisions
* Control rights
* Anti-dilution structures
* Investment tranches
* Milestones

### Scenario analysis

Users can explore how changes to investment terms or exit assumptions affect the overall deal.

This supports comparison rather than treating the term sheet as a collection of independent clauses.

## AI-assisted capability

The project explores how AI could support the interpretation and analysis of complex investment information.

A future AI workflow could:

```text
Term sheet
    ↓
Term extraction
    ↓
Structured deal representation
    ↓
Financial / ownership analysis
    ↓
Risk and negotiation-point identification
    ↓
Scenario generation
    ↓
Founder review
```

The current prototype focuses on the structured modelling and decision-support layer rather than claiming that AI currently performs the complete analysis.

## My role

I defined and designed:

* Product concept
* Requirements
* Information architecture
* Data and interaction model
* UX and content structure
* Financial logic
* Scenario logic
* Decision-support workflow
* AI-assisted application development

The project demonstrates the intersection of **requirements engineering, information architecture, structured data, financial modelling and AI-assisted product development**.

## Architecture

The prototype currently uses local application state and does not require authentication, a database or external APIs.

The architecture separates the presentation layer from the underlying deal logic, allowing future integration with external data or AI services.

Potential future integrations include:

* AI-assisted term extraction
* Automated term-sheet classification
* Deal comparison
* Negotiation-point identification
* Scenario generation
* External financial or company data

## Technology

* React 19
* TypeScript
* TanStack Start
* TanStack Router
* Vite
* Tailwind CSS
* React Hook Form
* Zod
* Recharts
* Radix UI
* Lovable for AI-assisted application development

## Why I built it

The project explores how complex business and financial requirements can be transformed into a structured model and a usable decision-support tool.

It also demonstrates how AI-assisted development can be combined with **requirements engineering, information architecture and domain modelling** rather than treated simply as code generation.

## Disclaimer

Deal Compass is a prototype for exploration and educational purposes. It does not provide legal, financial or investment advice. Users should consult qualified professional advisers before making investment or financing decisions.

## Live prototype

**[View Deal Compass](https://term-sheet-ninja.lovable.app)**
