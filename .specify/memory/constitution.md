<!--
Sync Impact Report
- Version change: none (template) → 1.0.0
- Modified principles: template placeholders → I. Design System Source of Truth;
  II. TypeScript & Minimal Dependencies; III. Radix UI First;
  IV. UX, Accessibility & Responsiveness; V. Modularity, Reuse & Compliance
- Added sections: Technology Stack; Development Workflow & Compliance
- Removed sections: none
- Follow-up TODOs: none
-->

# GD United List Constitution

## Core Principles

### I. Design System Source of Truth

All visual decisions — colors, spacing, typography, grids, component states, and user
flows — MUST strictly follow `design.md`. When a request conflicts with `design.md`,
`design.md` takes priority unless the change is explicitly approved. Inventing visual
patterns, colors, or spacing outside the documented system is prohibited.

Rationale: a single visual source of truth keeps the product consistent and prevents
ad-hoc styling from fragmenting the interface.

### II. TypeScript & Minimal Dependencies

All server code, APIs, build scripts, and utilities MUST be written in Node.js with
strict TypeScript. All client code MUST use React with functional components and hooks.
Third-party libraries MAY be added only when the task cannot be solved with Node.js,
React, or the approved UI stack; each addition requires an explicit justification.

Rationale: strict typing prevents whole classes of defects, while a minimal dependency
surface reduces maintenance, supply-chain, and upgrade risk.

### III. Radix UI First

Every interactive UI element — dialogs, dropdowns, tooltips, tabs, accordions,
switches, popovers, and similar controls — MUST use Radix UI primitives. Custom
implementations of controls whose behavior and accessibility are already covered by
Radix UI are prohibited. Radix primitives MUST be styled strictly with the
specifications and tokens defined in `design.md`.

Rationale: Radix UI provides accessible, battle-tested behavior; reimplementing it
duplicates effort and introduces accessibility regressions.

### IV. UX, Accessibility & Responsiveness

Every user action MUST produce immediate, understandable feedback, including loading,
empty, error, and success states and confirmation for destructive actions. Interfaces
MUST support full keyboard navigation, correct focus management, and ARIA attributes
(provided by Radix UI where applicable). Layouts MUST adapt to different screen sizes
without losing functionality or readability. Cognitive load MUST be minimized through
clear hierarchy and consistent patterns.

Rationale: predictable feedback and accessibility are functional requirements, not
optional polish.

### V. Modularity, Reuse & Compliance

Reusable UI wrappers over Radix UI MUST live in the project's shared component library
and be reused instead of duplicated. Before completing any task, the implementer MUST
verify compliance with `design.md`, Radix UI usage, and the UX and accessibility rules
in this constitution. Non-compliant work MUST be fixed before the task is considered
complete.

Rationale: shared primitives keep behavior and styling consistent, and a mandatory
compliance check prevents rules from being bypassed under delivery pressure.

## Technology Stack

- Backend, APIs, build tooling, and utilities: Node.js with strict TypeScript.
- Frontend: React using functional components and hooks.
- Interactive UI primitives: Radix UI.
- Styling and visual tokens: `design.md`.
- Additional dependencies: allowed only when Node.js, React, or Radix UI cannot
  reasonably solve the problem; the justification MUST be recorded in the change.

## Development Workflow & Compliance

1. Read `design.md` and the relevant architecture documentation before changing UI or
   user-facing behavior.
2. Use existing shared components before creating new ones; new reusable wrappers over
   Radix UI belong in the shared component library.
3. Verify keyboard access, focus management, ARIA attributes, loading and empty states,
   error messages, confirmations, and responsive behavior.
4. Check every visual decision against `design.md`; do not introduce unapproved tokens
   or patterns.
5. Document any new dependency and why the standard stack is insufficient.
6. Review changes against this constitution. A violation blocks completion until it is
   corrected or an explicit exception is approved.

## Governance

This constitution supersedes conflicting practices and conventions. Amendments MUST be
proposed as a documented change to this file, include the rationale, and be approved by
the project maintainer before taking effect. The Sync Impact Report MUST accompany each
amendment and be removed before the amended constitution is committed.

Versioning follows semantic versioning:

- MAJOR: removing or redefining governance rules or principles in a backward-incompatible
  way.
- MINOR: adding a principle, section, or materially expanded guidance.
- PATCH: clarifying wording, fixing typos, or other non-semantic refinements.

Every review MUST verify compliance with this constitution. Unjustified complexity,
unapproved dependencies, and visual deviations MUST be rejected. Runtime guidance lives
in `design.md` and `docs/ARCHITECTURE.md`.

**Version**: 1.0.0 | **Ratified**: 2026-11-19 | **Last Amended**: 2026-11-19
