# Phase 0 Research — Unified Demonlist MVP

## Decisions

### 1. Delivery order: frontend-first with a mock API

**Decision**: Build the complete React client first against a Node.js mock service backed
by `json-server`, then replace the mock with the production Node.js/TypeScript backend.

**Rationale**: The clarification session explicitly chose a frontend-first delivery.
The Penpot design and all user flows can be validated before authentication and live
source synchronization exist. `json-server` keeps the mock data editable as plain JSON.

**Alternatives considered**:

- Backend-first with live Pointercrate/AREDL/GDDL calls — rejected: authentication and
  source normalization would delay UI validation.
- Static in-memory fixtures only — rejected: progress and completion writes would not
  behave like the eventual API.

### 2. Frontend stack

**Decision**: React 19 with Vite, strict TypeScript, Radix UI primitives, and plain CSS
custom properties derived from `docs/design.md`.

**Rationale**: Matches the constitution and the approved UI stack. No second component
or styling library is introduced. Design tokens stay in one CSS layer.

**Alternatives considered**:

- Next.js — rejected: the MVP has no SSR or routing requirements that justify it.
- Tailwind or a component kit — rejected: duplicates the approved design system and adds
  an unapproved dependency.
- Custom dialogs/dropdowns — rejected by the Radix-first constitution.

### 3. Guest identity

**Decision**: A temporary guest profile is created on first write action and stored in
the browser with a generated identifier and display name. No password, email, or
external identity provider is part of this delivery.

**Rationale**: Matches the clarification decision. It keeps the leaderboard local and
makes the data-loss boundary explicit.

**Alternatives considered**:

- Discord OAuth now — deferred; real authentication is explicitly later.
- Server-side anonymous sessions — rejected for the mock phase; no session backend yet.

### 4. Ranking rule

**Decision**: Points follow a monotonic power curve:

```text
points(globalRank) = max(1, round(5000 / globalRank^0.55))
```

Status thresholds:

| Status | Points |
|---|---:|
| ROOKIE | 0–999 |
| PLAYER | 1,000–4,999 |
| SKILLED | 5,000–14,999 |
| EXTREME | 15,000–29,999 |
| LEGEND | 30,000+ |

**Rationale**: One rule satisfies the top-heavy requirement: the drop from rank 1 to 10
is larger than the drop from rank 1,000 to 10,000, and the curve stays deterministic and
easy to test. Thresholds give every status a concrete acceptance boundary.

**Alternatives considered**:

- Linear decay — rejected: contradicts the top-heavy clarification.
- Zone-fixed points — rejected: hides difficulty differences inside a zone.
- Exponential decay — viable, but harder to explain and tune; the power curve has the
  same ordering behavior with fewer parameters.

### 5. Completion and progress semantics

**Decision**: A completion is a local record at 100%; progress is the best value below
100%. Imported community records are read-only, carry a source label, and never
contribute points or leaderboard placement. Local records are immutable to the player;
administrators can correct them outside the player UI.

**Rationale**: Implements the clarification answers and prevents double counting.

**Alternatives considered**:

- Merging imported records into local profiles by name — rejected: unreliable identity
  matching would corrupt the leaderboard.
- Player self-service deletion — rejected by the correction clarification.

### 6. Mock API shape

**Decision**: Use a thin Node.js/TypeScript mock server built on `json-server` with a
small custom router for computed leaderboard and nested completion responses. The
contract mirrors the production endpoints so the frontend client changes only its base
URL later.

**Rationale**: `json-server` supplies CRUD and JSON persistence; the thin adapter adds
the few computed routes the UI needs. This avoids a second mock framework.

**Alternatives considered**:

- Raw `json-server` only — rejected: no computed points or nested routes.
- MSW in the browser — rejected: does not persist writes across reloads.
- A full backend now — rejected: conflicts with frontend-first delivery.

### 7. Penpot design source

**Decision**: The Penpot page `GDUnitedList · UX/UI` is the visual reference for all
screens and components. It contains the design-system board, catalog, zone view, level
dialog, profile, leaderboard, guest onboarding, state gallery, and mobile screens.

**Rationale**: Gives implementation a concrete visual target that follows
`docs/design.md`.

**Font substitution note**: Penpot does not expose Helvetica Neue or Courier New.
The approved fallback stacks are recorded in the `Approved Font Stacks` section of
`docs/design.md`: Inter for Helvetica Neue and Courier Prime for Courier New, with
Georgia available. The web implementation uses those approved stacks.

### 8. Testing strategy

**Decision**: Vitest + React Testing Library for units and feature tests, Playwright for
end-to-end flows against the mock API, and TypeScript `tsc --noEmit` plus ESLint in CI.

**Rationale**: Standard, lightweight, and covers the user stories without a new test
framework category.

**Alternatives considered**:

- Jest — rejected: slower and requires extra transform configuration with Vite.
- Cypress — rejected: Playwright already covers the browser flows with less setup.
