# Implementation Plan: Real Account Authentication

**Branch**: `002-real-account-auth` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-real-account-auth/spec.md`

## Summary

Replace the temporary guest-profile flow with durable, server-backed accounts. Visitors
register and sign in with an email address, a unique display name, and a password. The
backend stores accounts and revocable sessions in SQLite, hashes passwords with Node's
built-in `scrypt`, and authorizes every progress and completion write from the session.
The frontend replaces the guest provider and dialogs with an auth provider, sign-in and
registration dialogs, a signed-in header, and signed-out states. Existing guest players
and their records stay visible as read-only legacy data; no new guest profiles or guest
token writes are accepted.

## Technical Context

**Language/Version**: TypeScript 5.7, strict mode; Node.js 22; React 19

**Primary Dependencies**: Express 4, better-sqlite3, Zod, Radix UI, React Router; no new
runtime dependencies are planned

**Storage**: SQLite (WAL) for accounts, sessions, players, progress, and completions;
level catalog remains in memory from `data/levels.json`

**Testing**: Vitest + Supertest for backend unit/integration/contract tests; Vitest +
Testing Library for frontend; Playwright for end-to-end tests against both the mock and
the real backend

**Target Platform**: Linux server for the API; current desktop and mobile browsers for
the React frontend

**Project Type**: Web application monorepo (`backend/`, `frontend/`, `shared/`, `mock/`)

**Performance Goals**: Registration and sign-in complete in under 300 ms locally,
excluding client rendering; authenticated writes add one indexed session lookup and no
extra round trips; public catalog/profile reads keep their current performance

**Constraints**: Opaque bearer session tokens with 30-day sliding expiry; passwords
8–128 characters; blocked for 15 minutes after 5 failed sign-ins in 15 minutes; additive
database migration; no account data in browser storage beyond the session token and
public profile snapshot; existing guest records preserved; no new dependencies

**Scale/Scope**: Single backend instance with SQLite single-writer semantics, a community
site with thousands of accounts, and the existing 10k+ level catalog; auth must not
regress catalog browsing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment | Evidence |
|-----------|------------|----------|
| I. Design System Source of Truth | PASS | Auth dialogs, forms, field states, and header controls reuse existing classes and tokens from `docs/design.md`; no new colors, spacing, or visual patterns |
| II. TypeScript & Minimal Dependencies | PASS | Strict TypeScript on backend and frontend; password hashing and tokens use Node's `node:crypto`; no new runtime packages |
| III. Radix UI First | PASS | Sign-in/registration uses the existing Radix `Dialog`, `Tabs`, `DropdownMenu`, and `Toast` wrappers from `frontend/src/components/ui` |
| IV. UX, Accessibility & Responsiveness | PASS | Plan includes loading, error, success, and signed-out states; keyboard/focus behavior; mobile layout; generic credential errors and retry feedback |
| V. Modularity, Reuse & Compliance | PASS | One auth provider, one reusable auth dialog, and existing `Dialog`/`Toast`/`Button` styles; no duplicated guest logic; compliance review includes `design.md`, Radix, and accessibility checks |

**Result**: No violations; `Complexity Tracking` stays empty.

**Post-design re-check**: PASS. The Phase 1 artifacts keep the same gates: auth UI uses
existing Radix wrappers and design tokens; the backend adds no runtime dependency; the
data model is an additive migration; and the quickstart proves loading, error,
unauthorized, keyboard, and mobile states.

## Project Structure

### Documentation (this feature)

```text
specs/002-real-account-auth/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-api.md
├── checklists/
│   └── requirements.md
└── tasks.md              # created by /speckit.tasks, not this command
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config.ts                         # no new required variables expected
│   ├── app.ts                            # mount auth router + auth rate limit + log redaction
│   ├── db/
│   │   ├── migrate.ts                    # unchanged runner
│   │   └── migrations/007_accounts.sql   # accounts + account_sessions
│   ├── domain/
│   │   ├── accounts.ts                   # registration, login, session issue/verify/revoke
│   │   ├── password.ts                   # scrypt hash/verify
│   │   └── players.ts                    # keep public player reads; remove guest creation
│   ├── http/
│   │   ├── middleware/auth.ts            # requireAccount replaces requireGuestToken
│   │   ├── middleware/login-rate-limit.ts
│   │   ├── routes/auth.ts
│   │   ├── routes/players.ts             # remove POST /api/players
│   │   ├── routes/records.ts             # requireAccount
│   │   └── schemas.ts                    # register/login schemas
│   └── http/types.d.ts                   # request player/session context
└── tests/
    ├── integration/auth.test.ts
    ├── integration/session-authorization.test.ts
    ├── integration/migrations.test.ts
    ├── integration/players.test.ts       # updated helpers
    └── contract/auth.test.ts

frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx                       # unchanged routes
│   │   └── providers.tsx                 # AuthProvider replaces GuestProvider
│   ├── lib/
│   │   ├── api/client.ts                 # register/login/logout/me + token writes
│   │   └── auth/session.ts               # session storage + guest-key cleanup
│   ├── features/
│   │   ├── auth/AuthDialog.tsx           # sign in / create account
│   │   ├── onboarding/OnboardingDialogs.tsx # auth gate (replaces guest dialogs)
│   │   ├── profile/ProfilePage.tsx       # account profile + signed-out state
│   │   ├── catalog/CatalogPage.tsx       # auth-aware status filter copy
│   │   └── level/LevelDialog.tsx         # account writes + 401 handling
│   └── components/layout/AppChrome.tsx   # signed-in name + sign-out menu
└── tests/
    ├── e2e/profile-flow.spec.ts          # account flow
    ├── e2e/backend.spec.ts               # real-backend account flow
    ├── e2e/a11y.spec.ts                  # account session setup
    ├── e2e/leaderboard.spec.ts           # authenticated setup
    └── e2e/catalog-profile.spec.ts       # updated copy/gating

shared/
└── types.ts                              # AccountSession/AuthMe types; remove PlayerSession

mock/
└── server.ts                             # account/session parity; remove body playerId fallback

scripts/
└── seed-mock.ts                          # seed accounts arrays (no guest creation)

docs/
└── ARCHITECTURE.md                       # auth section and resolved open decision
```

**Structure Decision**: Use the existing frontend/backend split and domain/HTTP layers.
Account persistence and session verification live in `backend/src/domain`; the HTTP layer
only parses input and maps errors. The frontend keeps one auth provider and reuses the
existing Radix wrappers. The mock mirrors the auth contract so frontend-only development
and the default Playwright suite exercise signed-in behavior, while the real backend
remains the source of truth for security tests.

## Implementation Notes

### Backend

1. **Migration 007** adds `accounts` and `account_sessions` without altering existing
   tables. It is additive and leaves legacy guest players, tokens, progress, and
   completions intact.
2. **Password module** hashes with `node:crypto.scryptSync` using a per-account 16-byte
   salt, N=32768, r=8, p=1, key length 64, and `maxmem` 64 MB. Verification parses the
   stored parameters and compares with `timingSafeEqual`.
3. **Account domain** creates the player row, account row, and first session in one
   transaction. Unique indexes on normalized email and display-name key make concurrent
   duplicates impossible; constraint failures map to `EMAIL_TAKEN` or
   `DISPLAY_NAME_TAKEN`.
4. **Session domain** issues a 32-byte random token, stores only its SHA-256 hash, and
   looks up active sessions with `expires_at > now AND revoked_at IS NULL`. Successful
   use extends `expires_at` by 30 days. Sign-out sets `revoked_at` for the current token.
5. **Auth middleware** returns `401 TOKEN_REQUIRED` / `TOKEN_INVALID` and sets
   `req.playerId` from the session. `recordsRouter` uses it instead of the guest-token
   middleware. The body never chooses the player.
6. **Login protection** uses a per-app in-memory fixed window keyed by normalized email
   plus request IP, plus the existing `express-rate-limit` package on `/api/auth`.
   Successful sign-in clears the counter. Both limiters use a custom handler that emits
   the standard `429 RATE_LIMITED` JSON envelope. The per-app scope keeps tests
   independent. The limitation to one backend instance is documented in `research.md` and
   `backend/README.md`.
7. **Logging** redacts `req.headers.authorization` and `req.headers.cookie` in Pino;
   request bodies are not logged. Auth responses never include password hashes.
8. **Legacy behavior**: `POST /api/players` is removed; guest tokens remain in the
   existing `player_tokens` table but no code path accepts them for writes. Public
   player/profile/leaderboard reads keep working for legacy players.

### Frontend

1. `AuthProvider` stores `{ token, expiresAt, player }` under `gdul.session`, removes the
   old `gdul.guest` key on startup, and validates the stored token with `GET /api/auth/me`.
   While validation runs, actions are disabled and profile content shows a loading state.
2. `AuthDialog` uses Radix `Dialog` + `Tabs` with "SIGN IN" and "CREATE ACCOUNT" tabs,
   inline field validation, server errors, and a disabled/submitting state. It reuses the
   existing brutalist field, button, and dialog classes.
3. `ProfileGateDialog` becomes an auth gate with "SIGN IN" and "CREATE ACCOUNT" paths;
   `LevelDialog`, `CatalogPage`, and `ProfilePage` call it when signed out.
4. `AppHeader` shows `PLAYER / <displayName>` for signed-in users and a Radix
   `DropdownMenu` with profile and sign-out actions. Signed-out users see a sign-in entry.
5. `ProfilePage` keeps the existing stats and tabs but reads the account's player id and
   removes every "guest", "local only", and "no cross-device recovery" label.
6. A `401` on any write clears the local session, closes stale dialogs, and opens the auth
   gate. Successful sign-in or sign-up closes the dialog, shows a toast, returns focus to
   the trigger, and refreshes profile/level data.
7. All new controls follow `docs/design.md`, keyboard navigation, focus return, and
   mobile layout rules.

### Mock and Tests

1. The mock adds `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, and
   `/api/auth/me`, stores account/session rows in `data/mock-db.json`, hashes mock
   passwords with the same Node crypto primitive, and rejects writes without a valid
   session. It no longer accepts a `playerId` from the body.
2. `scripts/seed-mock.ts` seeds accounts and sessions arrays alongside players. Seeded
   legacy players remain for leaderboard/read-only coverage.
3. Backend tests cover registration, login, duplicate normalization, validation, session
   persistence/expiry/revocation, rates, unauthorized/cross-account writes, public email
   secrecy, legacy data preservation, and the additive migration.
4. Playwright tests cover account creation, reload persistence, sign-out, second-device
   sign-in, duplicate errors, signed-out gates, and real-backend authorization. The
   existing accessibility audit adds the auth dialog and signed-in profile.
5. Verification commands: `npm run typecheck`, `npm run lint`, `npm test`,
   `npm run test:e2e:backend`, and `npm run test:e2e`.

## Complexity Tracking

*No constitution violations; nothing to justify.*
