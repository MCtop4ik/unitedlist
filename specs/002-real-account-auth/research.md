# Phase 0 Research: Real Account Authentication

**Feature**: `002-real-account-auth`  
**Date**: 2026-11-19

All technical unknowns from the plan are resolved below. No `NEEDS CLARIFICATION`
markers remain.

## 1. Session transport and client storage

- **Decision**: Use opaque bearer session tokens in the `Authorization` header, stored in
  browser `localStorage` under `gdul.session` alongside the public player snapshot and
  expiry.
- **Rationale**: This matches the existing guest-token architecture, keeps the CORS setup
  unchanged (`credentials: false`), works through the Vite `/api` proxy and direct API
  calls, and satisfies "stay signed in after browser restart" without adding CSRF
  machinery. Tokens are random, revocable, and never persisted server-side in plain form.
- **Alternatives considered**:
  - **HttpOnly cookies**: Stronger XSS resistance but needs `credentials: true`, CSRF
    protection for cookie-authenticated writes, cookie/proxy configuration, and changes
    to every Supertest and Playwright helper. Rejected for this delivery's complexity.
  - **JWT access tokens**: Stateless but not immediately revocable, larger payloads, and
    signing-key management; the spec requires sign-out to revoke the current session.
  - **`sessionStorage`**: Does not survive browser restarts, contradicting the spec.

## 2. Password verification

- **Decision**: Use Node's built-in `crypto.scryptSync` with a per-account 16-byte salt,
  N=32768, r=8, p=1, key length 64, and `maxmem` 64 MB. Store parameters, salt, and hash
  in one versioned string and compare with `timingSafeEqual`.
- **Rationale**: `scrypt` is a memory-hard password KDF available in Node 22 without a
  new dependency, satisfying the constitution's minimal-dependency rule. The parameters
  are affordable for a low-volume community site and expensive enough to slow offline
  guessing.
- **Alternatives considered**:
  - **Argon2id (`argon2`/`@node-rs/argon2`)**: Stronger modern default but adds a native
    dependency and build/deployment risk.
  - **bcrypt (`bcrypt`/`bcryptjs`)**: Adds a dependency; `bcryptjs` is slow in pure JS.
  - **PBKDF2**: Native and simple but less memory-hard than scrypt.
  - **Async `crypto.scrypt`**: Avoids blocking the event loop, but complicates Express 4
    error propagation; sync is acceptable with the strict auth rate limit and small user
    scale.

## 3. Account-to-player data model

- **Decision**: Keep the existing `players` table as the public identity and add a 1:1
  `accounts` table keyed by `player_id`, containing normalized email, display-name key,
  and password verifier.
- **Rationale**: Progress, completions, ranking, and public profile reads already key off
  `players.id`. A 1:1 account extension adds credentials without rewriting foreign keys
  or duplicating player data. Legacy guest players simply have no account row.
- **Alternatives considered**:
  - **Add credential columns to `players`**: Requires nullable credential columns for
    legacy guests and mixes public identity with secrets.
  - **Replace `players` with `accounts`**: Forces a destructive migration and touches
    every record/ranking query.
  - **Separate account profile**: Duplicates display name and creates two identity
    sources.

## 4. Display-name and email uniqueness

- **Decision**: Store `email_normalized` (trim, NFKC, lowercase) and
  `display_name_key` (trim, NFKC, lowercase) with unique indexes in `accounts`. Keep the
  original trimmed email and display name for display.
- **Rationale**: The spec requires case- and whitespace-insensitive uniqueness. Storing
  normalized keys makes the rule explicit, indexable, and race-safe through SQLite unique
  constraints. Legacy guest players are not subject to these indexes.
- **Alternatives considered**:
  - **`COLLATE NOCASE` unique indexes**: SQLite `NOCASE` only folds ASCII and would not
    cover all Unicode display names.
  - **Application-only duplicate checks**: Race-prone under concurrent registration.

## 5. Session model and expiry

- **Decision**: Add `account_sessions` with a SHA-256 token hash primary key,
  `player_id`, `created_at`, `expires_at`, `last_used_at`, and `revoked_at`. Issue 32-byte
  random tokens. Reject sessions where `expires_at <= now` or `revoked_at` is set. On
  successful use, extend `expires_at` to 30 days from now. Sign-out revokes only the
  presented token; other device sessions remain valid.
- **Rationale**: This directly implements the spec's 30-day sliding lifetime, multi-device
  support, and per-device sign-out. Hashing stored tokens limits damage from a database
  leak.
- **Alternatives considered**:
  - **Reuse `player_tokens`**: Its `player_id` primary key allows only one token per
    player and has no expiry, so multi-device sessions and expiry would need schema
    changes anyway.
  - **JWT sessions**: Harder to revoke immediately and no simpler than a small session
    table with SQLite.
  - **Non-sliding expiry**: Contradicts the spec's "each successful use extends the
    30-day window."

## 6. Login throttling and enumeration resistance

- **Decision**: Add an app-scoped in-memory fixed-window limiter keyed by normalized email
  plus `req.ip`. After 5 failures in 15 minutes, reject auth attempts for 15 minutes.
  Successful authentication clears the entry. Add `express-rate-limit` at 20 requests per
  minute on `/api/auth`. Return the same `INVALID_CREDENTIALS` message for unknown email
  and wrong password, and run a dummy scrypt verification for unknown emails to reduce
  timing differences.
- **Rationale**: Meets FR-011/FR-012 with the installed rate-limit dependency and no new
  store. App-scoped state makes tests independent.
- **Alternatives considered**:
  - **Persisted attempts table**: Survives restarts but adds write traffic and cleanup.
  - **Keying only by IP**: Punishes shared networks; keying only by email enables targeted
    denial of service. The pair limits both.
  - **No dummy verification**: Leaks account existence through response timing.
- **Limitation**: In-memory counters are per process. The backend is documented as a
  single-writer, single-instance deployment while SQLite is the store; a shared store is
  required before horizontal scaling.

## 7. Error and response contract

- **Decision**: Keep the existing `{ data: ... }` success envelope and
  `{ error: { code, message, field? } }` error envelope. Add:
  - `POST /api/auth/register`: `201 { data: Player, account: { email }, token, expiresAt }`
  - `POST /api/auth/login`: `200` with the same shape
  - `POST /api/auth/logout`: `204`
  - `GET /api/auth/me`: `200 { data: { player, account: { email } }, expiresAt }`
  - Validation `400 VALIDATION_ERROR`, duplicate `409 EMAIL_TAKEN` /
    `DISPLAY_NAME_TAKEN`, bad credentials `401 INVALID_CREDENTIALS`, missing/invalid
    session `401 TOKEN_REQUIRED` / `TOKEN_INVALID`, throttling `429 RATE_LIMITED`.
- **Rationale**: Reuses the established contract and frontend error handling. Field codes
  let the auth dialog attach messages to the right input.
- **Alternatives considered**: A separate session API version or flat error strings would
  fragment the client and existing error middleware.

## 8. Log redaction

- **Decision**: Configure Pino with redaction for `req.headers.authorization` and
  `req.headers.cookie`, and never log request bodies. Auth responses omit password
  verifiers and session hashes.
- **Rationale**: Satisfies the spec's requirement that session secrets and credentials
  never reach logs. Pino-http's default request serializer includes headers, so redaction
  is required rather than optional.
- **Alternatives considered**: Removing the Pino-http header serializer entirely would
  lose useful diagnostics; redaction keeps non-sensitive request metadata.

## 9. Frontend state and migration from guests

- **Decision**: Replace `GuestProvider`/`useGuest` with `AuthProvider`/`useAuth`. Store
  only `{ token, expiresAt, player }` under `gdul.session`. On startup, remove the old
  `gdul.guest` key and validate the token with `/api/auth/me`; if invalid, clear it and
  show signed-out states. Actions are disabled while validation is in flight.
- **Rationale**: Prevents a revoked or expired token from leaving a false signed-in
  state, and completes the guest-to-account transition without a server-side claim step.
  Public profile data is safe to cache; no email beyond the owner's own session is stored
  in a new public field.
- **Alternatives considered**:
  - **Keep the guest provider and add accounts beside it**: Duplicates identity state and
    keeps guest writes reachable.
  - **Validate only on write**: Shows stale signed-in UI and surprises users mid-action.
  - **Migrate or claim guest profiles**: Requires an ownership proof flow and is outside
    the chosen scope; legacy records stay visible.

## 10. Mock parity

- **Decision**: Extend `mock/server.ts` with the same auth endpoints, session enforcement,
  duplicate checks, and scrypt-based password storage in `data/mock-db.json`. Remove the
  `playerId` body fallback. Update `scripts/seed-mock.ts` to seed accounts/sessions.
- **Rationale**: The default Playwright suite and frontend-only development use the mock.
  Without parity, tests would pass with guest writes or unauthenticated writes that the
  real backend rejects.
- **Alternatives considered**:
  - **Use only the real backend for all e2e tests**: Slower, requires full catalog/data
    setup for every UI test, and loses fast offline frontend development.
  - **Keep mock guest creation**: Contradicts the spec and hides authorization bugs.

## 11. Migration and rollback safety

- **Decision**: Add migration `007_accounts.sql` that only creates new tables and indexes.
  Register/login writes remain transactional. Rolling back the application leaves account
  player rows and their records in `players`, `progress`, and `completions`; dropping the
  new tables removes credentials/sessions but not player records.
- **Rationale**: Additive migrations preserve the current data contract and satisfy the
  spec's no-data-loss rollout requirement. Legacy guest rows are never modified.
- **Alternatives considered**: Altering `players` or rewriting player IDs would be
  destructive and would break existing foreign keys.

## 12. Verification strategy

- **Decision**: Use backend Supertest tests for auth/authorization/session edge cases,
  a migration test that applies 001–007 over pre-existing rows, frontend unit tests for
  session storage and error states, and Playwright tests against both the mock and the
  real backend.
- **Rationale**: Security invariants must be proven at the HTTP boundary, while UI state
  transitions and focus behavior need browser coverage. The existing test stack already
  supports all three layers.
- **Alternatives considered**: Unit-testing middleware in isolation would miss route
  wiring; testing only the mock would miss real SQLite constraints and session storage.
