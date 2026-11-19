# Tasks: Real Account Authentication

**Input**: Design documents from `/specs/002-real-account-auth/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/auth-api.md`, `quickstart.md`

**Tests**: Included because this security-critical feature has measurable authorization
and secrecy outcomes (SC-003, SC-004, SC-007) and the plan defines a required
verification strategy. Test tasks may be written before their implementation where the
phase ordering allows.

**Organization**: Tasks are grouped by user story. The backend auth core is foundational
because every account-backed story depends on it.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `US1`, `US2`, `US3`, `US4` for user-story phases only
- Every task includes an exact file path or a command defined in `package.json`

## Path Conventions

- Web app: `backend/src/`, `backend/tests/`, `frontend/src/`, `frontend/tests/`
- Shared types: `shared/types.ts`
- Mock: `mock/server.ts`, `scripts/seed-mock.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared contracts and browser session primitives used by all stories.

- [X] T001 Add `AccountSession` and `AuthMe` response types to `shared/types.ts`; keep the existing `Player` shape unchanged and defer removing `PlayerSession` until US4.
- [X] T002 [P] Add `registerSchema` and `loginSchema` to `backend/src/http/schemas.ts`: email valid/trimmed/max 254; display name trimmed 2–32 characters; password 8–128 characters and not only whitespace.
- [X] T003 [P] Create `frontend/src/lib/auth/session.ts` with load/save/clear helpers for the `gdul.session` key, shape validation for `{ token, expiresAt, player }`, and startup removal of the legacy `gdul.guest` key.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Durable account storage, password/session primitives, auth HTTP endpoints, and mock parity. All user stories depend on this phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Create `backend/src/db/migrations/007_accounts.sql` with the additive `accounts` table (`player_id` PK + FK `players(id)`, `email`, `email_normalized` UNIQUE, `display_name_key` UNIQUE, `password_hash`, `created_at`), `account_sessions` (`token_hash` PK, `player_id` FK `accounts(player_id)`, `created_at`, `expires_at`, `last_used_at`, `revoked_at`), and `idx_account_sessions_player`; do not alter existing tables.
- [X] T005 [P] Implement `backend/src/domain/password.ts` with scrypt hashing/verification: per-account 16-byte salt, N=32768, r=8, p=1, key length 64, `maxmem` 64 MB, versioned stored string, and `timingSafeEqual` comparison.
- [X] T006 [P] Implement `backend/src/http/middleware/login-rate-limit.ts` as an app-scoped in-memory fixed window: 5 failures per normalized email + request IP in 15 minutes blocks for 15 minutes; expose a reset-on-success function and a JSON `429 RATE_LIMITED` handler.
- [X] T007 Implement `backend/src/domain/accounts.ts`: transactional register (player + account + first session), account player ids with an `acct_<8 chars>` prefix, normalize email/display name with trim + NFKC + lowercase, sign-in with dummy scrypt verification for unknown emails, session issue/lookup/extend/revoke, and constraint mapping to `EMAIL_TAKEN` / `DISPLAY_NAME_TAKEN`. Enforce email max 254, password 8–128 not only whitespace, display name 2–32 after trimming, 30-day sliding sessions, 32-byte tokens, and SHA-256 token hashes.
- [X] T008 Update `backend/src/http/middleware/auth.ts` to export `requireAccount(db)` that reads the bearer token, finds an active session (`expires_at > now AND revoked_at IS NULL`), extends the expiry by 30 days, sets `req.playerId`, and returns `401 TOKEN_REQUIRED` / `TOKEN_INVALID`; update `backend/src/http/types.d.ts` only if additional request context is needed.
- [X] T009 Implement `backend/src/http/routes/auth.ts` as `authRouter(db, catalog)` with `register`, `login`, `logout`, and `me` exactly as specified in `contracts/auth-api.md`, including `201` registration, `204` logout, owner-only `account.email`, full public player stats via the catalog for login/me, standard error envelopes, and the T006 login limiter on sign-in attempts.
- [X] T010 Wire `backend/src/app.ts`: mount `/api/auth`, apply the auth rate limiter (20 requests/minute/IP with JSON `429`), and keep the existing security middleware order. Do not add log redaction here; US3 owns it.
- [X] T011 [P] Add password hashing tests in `backend/tests/unit/password.test.ts`: unique salts, successful verification, wrong-password rejection, malformed verifier rejection, and no plaintext in the stored value.
- [X] T012 [P] Add contract tests in `backend/tests/contract/auth.test.ts` for register/login/logout/me response shapes, owner email visibility, `204` logout with no body, and error envelopes from `contracts/auth-api.md`.
- [X] T013 [P] Add auth integration tests in `backend/tests/integration/auth.test.ts` for registration, auto sign-in, duplicate email/display name with case and whitespace differences, invalid input, login, persistence across a new app instance, and logout revocation.
- [X] T014 [P] Add mock auth parity in `mock/server.ts`: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, account/session storage in `data/mock-db.json`, scrypt-based mock passwords, duplicate checks, and session enforcement; remove the `playerId` body fallback for writes.
- [X] T015 [P] Update `scripts/seed-mock.ts` to seed `accounts` and `sessions` arrays alongside existing players/completions/progress, keeping seeded legacy players for read-only leaderboard coverage.
- [X] T016 [P] Add `frontend/src/lib/auth/session.test.ts` for save/load/clear, malformed stored data, legacy `gdul.guest` cleanup, and token expiry shape handling.

**Checkpoint**: Migration, password/session core, auth API, mock parity, and foundational tests are ready. User stories can begin.

---

## Phase 3: User Story 1 — Create an account and sign in (Priority: P1) 🎯 MVP

**Goal**: A visitor registers or signs in with email/display name/password; the session survives reloads and browser restarts; sign-out works; the header and profile reflect the account.

**Independent Test**: Register in the UI, reload and restart the browser, see the same signed-in profile, sign out, sign in again, and reach the profile without any guest identity.

### Tests for User Story 1

- [X] T017 [P] [US1] Add `frontend/tests/e2e/auth-flow.spec.ts` covering registration, reload persistence, sign-out, sign-in again, and second-device sign-in in a new browser context.
- [X] T018 [P] [US1] Update `frontend/tests/e2e/a11y.spec.ts` to create an account through `/api/auth/register` and seed `gdul.session` instead of `gdul.guest`; keep the auth dialog and signed-in profile in the axe audit.
- [X] T019 [P] [US1] Update `frontend/tests/e2e/catalog-profile.spec.ts` so the profile-creation test uses email/password account creation and the signed-out filter copy expects sign-in instead of guest creation.

### Implementation for User Story 1

- [X] T020 [P] [US1] Add `register`, `login`, `logout`, and `me` functions to `frontend/src/lib/api/client.ts`, using the `AccountSession`/`AuthMe` types and the `/auth/*` contract.
- [X] T021 [US1] Replace `GuestProvider` with `AuthProvider` in `frontend/src/app/providers.tsx` and `frontend/src/main.tsx`: hydrate from `gdul.session`, validate with `/auth/me`, expose `{ session, status, signIn, signOut }`, clear stale sessions on `401`, remove `gdul.guest` on startup, and make sign-out clear local state even if the logout request fails.
- [X] T022 [US1] Create `frontend/src/features/auth/AuthDialog.tsx` using Radix `Dialog` + `Tabs` from `frontend/src/components/ui`, with SIGN IN / CREATE ACCOUNT tabs, labeled email/display-name/password fields, inline validation, loading/disabled submit, server errors, and success callback; reuse existing dialog/field/button classes from `docs/design.md`.
- [X] T023 [P] [US1] Update `frontend/src/components/layout/AppChrome.tsx`: show `PLAYER / <displayName>` when signed in, a Radix `DropdownMenu` with profile and sign-out actions, and a sign-in entry when signed out.
- [X] T024 [P] [US1] Update `frontend/src/features/profile/ProfilePage.tsx` to use `useAuth`, show a loading state while the session validates, and provide signed-out states with SIGN IN and CREATE ACCOUNT actions opening `AuthDialog`; do not change record rendering yet.

**Checkpoint**: US1 is independently usable: account creation, sign-in, persistence, sign-out, and account-aware header/profile states.

---

## Phase 4: User Story 2 — Record progress and completions under an account (Priority: P1)

**Goal**: Signed-in players record progress/completions owned by their account; unauthenticated and cross-account writes are rejected; the profile, level dialog, catalog filter, and leaderboard use account identity.

**Independent Test**: Two accounts record activity; each sees their own editable records; public views show both players; writes with no session or another account's session are rejected without data changes.

### Tests for User Story 2

- [X] T025 [P] [US2] Add `backend/tests/integration/session-authorization.test.ts` covering missing/invalid/expired/revoked sessions, guest-token rejection, server-derived player identity, cross-account body manipulation, and no data change on rejected writes.
- [X] T026 [P] [US2] Update `backend/tests/integration/players.test.ts` and `backend/tests/integration/leaderboard.test.ts` to create accounts through `/api/auth/register` instead of `/api/players`; assert account players rank and legacy players remain readable.

### Implementation for User Story 2

- [X] T027 [US2] Update `backend/src/http/routes/records.ts` to use `requireAccount(db)` and remove the guest-token middleware; keep level validation and idempotent completion behavior unchanged.
- [X] T028 [US2] Replace guest dialogs in `frontend/src/features/onboarding/OnboardingDialogs.tsx` with an auth gate offering SIGN IN and CREATE ACCOUNT, both opening `AuthDialog`; keep the Radix Dialog structure and destructive-action copy.
- [X] T029 [US2] Update `frontend/src/features/level/LevelDialog.tsx` to use `useAuth`, load the account's progress/completions by account player id, gate writes behind sign-in, and on `401` clear the session, open the auth gate, and preserve the page state.
- [X] T030 [P] [US2] Update `frontend/src/features/catalog/CatalogPage.tsx` so completion-status filtering uses the account player id and signed-out copy invites sign-in rather than guest creation.
- [X] T031 [P] [US2] Update `frontend/src/features/profile/ProfilePage.tsx` and `frontend/src/features/leaderboard/LeaderboardPage.tsx` to use account identity: fetch the account player/completions/progress, highlight the signed-in account on the board, keep best-progress and completion behavior, and remove guest identity assumptions.
- [X] T032 [P] [US2] Update `frontend/tests/e2e/profile-flow.spec.ts` to register an account, record progress/completion, verify best-progress preservation and idempotent completion, and assert unauthenticated direct writes are rejected.
- [X] T033 [P] [US2] Update `frontend/tests/e2e/backend.spec.ts` to register through the real backend, record a completion, verify persistence, and assert missing sessions and random session-like tokens cannot write.
- [X] T034 [P] [US2] Update `frontend/tests/e2e/leaderboard.spec.ts` to create accounts through `/api/auth/register`, use account tokens for writes, and keep the deterministic ranking assertions.

**Checkpoint**: US2 is independently usable: account-backed records and server-enforced ownership are complete.

---

## Phase 5: User Story 3 — Depend on account security and isolation (Priority: P2)

**Goal**: Credentials are protected, repeated guessing is throttled, errors do not reveal account existence, and public views/logs never expose secrets.

**Independent Test**: Submit rapid wrong-password attempts, duplicate registrations, and public profile/leaderboard reads; verify throttling, generic credential errors, no credential/email leakage, and redacted auth headers in logs.

### Tests for User Story 3

- [X] T035 [P] [US3] Add `backend/tests/integration/auth-security.test.ts` for the 5-failure/15-minute block and 15-minute retry message, identical unknown-email/wrong-password responses, no password/hash/session secret in responses, email absent from public player/leaderboard responses, and normalization-based duplicate rejection.
- [X] T036 [P] [US3] Add `frontend/tests/e2e/auth-security.spec.ts` for duplicate email/display-name messages, generic wrong-password feedback, and the signed-out gate on a level write.

### Implementation for User Story 3

- [X] T037 [US3] Configure Pino redaction in `backend/src/app.ts` for `req.headers.authorization` and `req.headers.cookie`, and confirm auth request bodies are not logged.
- [X] T038 [US3] Harden `frontend/src/features/auth/AuthDialog.tsx` and `frontend/src/components/layout/AppChrome.tsx` error/loading states: map `429 RATE_LIMITED` to a retry message, keep field errors attached to the right input, prevent duplicate submissions, and never leave a false signed-in header state.

**Checkpoint**: US3 is independently verifiable: security controls and their observable behavior are complete.

---

## Phase 6: User Story 4 — Transition from temporary guest profiles (Priority: P3)

**Goal**: New guest profile creation and guest-token writes are gone; existing guest players/records stay visible and read-only; user-facing copy no longer claims profiles are local-only.

**Independent Test**: Open the app with an old `gdul.guest` entry, confirm a signed-out state, confirm legacy records remain visible, confirm no guest creation flow exists, and confirm an old guest token gets `401` on writes.

### Tests for User Story 4

- [X] T039 [P] [US4] Add `backend/tests/integration/migrations.test.ts` that applies migrations 001–006, inserts a legacy player/token/progress/completion, applies 007, and asserts all legacy rows remain unchanged while accounts/sessions tables exist.
- [X] T040 [P] [US4] Add `frontend/tests/e2e/legacy-guest.spec.ts` that seeds `gdul.guest`, verifies the UI is signed out, verifies legacy leaderboard/profile records remain visible, and verifies an old guest token is rejected for writes.

### Implementation for User Story 4

- [X] T041 [US4] Remove `POST /api/players` from `backend/src/http/routes/players.ts` and remove the guest `createPlayer` path from `backend/src/domain/players.ts`; leave public player reads and legacy rows untouched.
- [X] T042 [US4] Remove the guest profile creation endpoint from `mock/server.ts` while keeping seeded legacy players and the session-only write enforcement from T014.
- [X] T043 [US4] Remove guest/local-only copy and dead guest actions from `frontend/src/features/profile/ProfilePage.tsx`, `frontend/src/features/leaderboard/LeaderboardPage.tsx`, `frontend/src/features/level/LevelDialog.tsx`, `frontend/src/features/onboarding/OnboardingDialogs.tsx`, `frontend/src/features/catalog/CatalogPage.tsx`, and the header/footer text in `frontend/src/components/layout/AppChrome.tsx`; replace with durable-account wording.
- [X] T044 [US4] Remove the unused `PlayerSession` type and guest creation helpers from `shared/types.ts` and `frontend/src/lib/api/client.ts`; remove the old `gdul.guest` identity module if no callers remain.

**Checkpoint**: US4 is complete: the guest flow is retired without losing legacy data.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, full verification, and final security review.

- [X] T045 [P] Update `README.md` to replace guest-profile instructions with account registration/sign-in, session persistence, and the `POST /api/players` removal.
- [X] T046 [P] Update `backend/README.md` with the accounts/sessions schema, scrypt/session behavior, auth rate limits, single-instance throttling limitation, and legacy guest data note.
- [X] T047 [P] Update `docs/ARCHITECTURE.md` sections 4, 6, 8, 11, and 12 and the open authorization decision in `docs/PRD.md` to describe durable accounts, `accounts`/`account_sessions`, auth API endpoints, and the resolved authorization decision.
- [X] T048 [P] Update `docs/ACCESSIBILITY.md` to add the auth dialog, signed-out profile, and signed-in header to the audit scope and verification instructions.
- [X] T049 Run `npm run typecheck` from `package.json` for frontend, backend, and node tooling; fix all type errors.
- [X] T050 Run `npm run lint` and `npm test` from `package.json`; fix all failures.
- [X] T051 Run `npm run test:e2e:backend` from `package.json` against the real SQLite backend; confirm account registration, writes, rejection of unauthenticated writes, and legacy reads.
- [X] T052 Run `npm run test:e2e` from `package.json` against the auth-enabled mock; confirm account flow, accessibility, mobile, and signed-out gates.
- [X] T053 Execute the API and UI validation scenarios in `specs/002-real-account-auth/quickstart.md` and record any deviations.
- [X] T054 Perform a security sweep across `backend/src`, `frontend/src`, `mock/`, `shared/`, and `scripts/`: search for `gdul.guest`, `POST /api/players`, guest-token writes, unredacted `authorization` logging, passwords in responses/storage, and any remaining body-derived `playerId`; fix all findings.
- [X] T055 [P] Clean up unused imports, guest-era helpers, and stale comments in `frontend/src` and `backend/src` files touched by this feature; keep behavior unchanged.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: Starts immediately; T001, T002, and T003 are parallel.
- **Phase 2 Foundational**: Depends on Phase 1; blocks all user stories. T004–T006 can start in parallel. T007 depends on T004/T005. T008 depends on T007. T009 depends on T002/T007/T008. T010 depends on T006/T009. T011–T016 can follow their implementation tasks.
- **Phase 3 US1**: Depends on Phase 2. T017–T019 and T020–T024 are frontend slices; T021 depends on T020, and T022–T024 depend on T021.
- **Phase 4 US2**: Depends on Phase 3 for the frontend auth context and on T027 for backend enforcement. T025/T026 can start after Phase 2. T028 must precede T029 because the auth gate is reused. T030/T031 can run parallel after T028. T032–T034 depend on the corresponding UI/backend tasks.
- **Phase 5 US3**: Depends on US1 and US2. T037 depends on T010. T038 depends on T022/T023. T035/T036 can run in parallel after the related implementation.
- **Phase 6 US4**: Depends on US2 (no guest writes) and US1 (auth UI). T039/T040 can be written before T041–T044. T041 must precede T042 and T044. T043 depends on T028. T044 depends on T041/T042.
- **Phase 7 Polish**: Depends on all desired stories.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories after Foundational.
- **US2 (P1)**: Uses US1's auth provider/UI; backend authorization is testable independently after Foundational.
- **US3 (P2)**: Uses US1 credentials and US2 ownership rules.
- **US4 (P3)**: Uses US1 UI and US2 write enforcement; preserves legacy records.

### Within Each User Story

- Tests come before the implementation they verify where the phase ordering allows.
- Shared gate/provider before dialogs and pages.
- Backend enforcement before frontend write paths.
- Story complete before moving to the next priority.

### Parallel Opportunities

- **Setup**: T002 and T003 after T001.
- **Foundational**: T004, T005, T006 in parallel; T011–T016 in parallel once their dependencies exist.
- **US1**: T020 and T021 first; then T022, T023, T024 in parallel; T017–T019 in parallel once the UI exists.
- **US2**: T025/T026 backend tests in parallel; T028 first; T029/T030/T031 in parallel; T032/T033/T034 in parallel.
- **US3**: T035/T036 in parallel; T037/T038 in parallel on different files.
- **US4**: T039/T040 in parallel; T041 first; T042/T043/T044 in parallel once dependencies are met.
- **Polish**: T045–T048 and T055 in parallel; verification commands T049–T053 sequentially.

---

## Parallel Example: User Story 1

```bash
# After T020/T021 exist, build the three UI surfaces in parallel:
Task: "T022 [US1] Create AuthDialog in frontend/src/features/auth/AuthDialog.tsx"
Task: "T023 [US1] Update AppChrome header in frontend/src/components/layout/AppChrome.tsx"
Task: "T024 [US1] Update ProfilePage shell in frontend/src/features/profile/ProfilePage.tsx"

# Then write/run the browser coverage in parallel:
Task: "T017 [US1] Add auth-flow e2e in frontend/tests/e2e/auth-flow.spec.ts"
Task: "T018 [US1] Update a11y e2e in frontend/tests/e2e/a11y.spec.ts"
Task: "T019 [US1] Update catalog-profile e2e in frontend/tests/e2e/catalog-profile.spec.ts"
```

## Parallel Example: User Story 2

```bash
Task: "T025 [US2] Add session-authorization tests in backend/tests/integration/session-authorization.test.ts"
Task: "T026 [US2] Update players/leaderboard tests in backend/tests/integration/"
Task: "T030 [US2] Update catalog status filter in frontend/src/features/catalog/CatalogPage.tsx"
Task: "T031 [US2] Update profile/leaderboard account identity in frontend/src/features/profile/ProfilePage.tsx and frontend/src/features/leaderboard/LeaderboardPage.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "T035 [US3] Add auth-security integration tests in backend/tests/integration/auth-security.test.ts"
Task: "T036 [US3] Add auth-security e2e in frontend/tests/e2e/auth-security.spec.ts"
Task: "T037 [US3] Configure Pino redaction in backend/src/app.ts"
Task: "T038 [US3] Harden auth error/loading states in frontend/src/features/auth/AuthDialog.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

Both P1 stories form the usable MVP: durable accounts plus account-owned writes.

1. Complete Phase 1 Setup.
2. Complete Phase 2 Foundational (blocking).
3. Complete Phase 3 US1 and validate account creation/sign-in/persistence.
4. Complete Phase 4 US2 and validate authorized writes.
5. Stop and run the US1/US2 independent tests; deploy/demo if ready.

### Incremental Delivery

1. Setup + Foundational → auth core and mock parity ready.
2. US1 → account identity and sessions (partial MVP).
3. US2 → account-backed records (complete MVP).
4. US3 → security hardening and proof.
5. US4 → guest flow retirement with legacy preservation.
6. Polish → docs and full verification.

### Notes

- Do not mark a task complete until its relevant tests or verification command passes.
- Keep legacy guest rows untouched; never delete or reassign them.
- Do not add dependencies; scrypt and token generation use `node:crypto`.
- Reuse the Radix wrappers and existing design tokens for all new UI.
- Stop at each checkpoint to validate the story independently.
