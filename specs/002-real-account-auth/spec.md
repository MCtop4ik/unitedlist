# Feature Specification: Real Account Authentication

**Feature Branch**: `002-real-account-auth`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "сделай авторизацию реальную с реальными аккаунтами на бэкенде а не так чтобы все локально было ну можешь в sqlite сохранять данные об аккаунтах"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create an account and sign in (Priority: P1)

A visitor creates a durable account with an email address, a display name, and a
password, then signs in from any device. Their session survives page reloads and browser
restarts, and they can sign out when they are finished.

**Why this priority**: Durable identity is the foundation of the request. Without
account creation, sign-in, and persistent sessions, none of the authorized record
features can exist.

**Independent Test**: A new visitor registers, closes the browser, reopens the site,
and is still signed in. They sign out, sign in again with the same credentials, and
reach their profile with no local guest data involved.

**Acceptance Scenarios**:

1. **Given** a visitor without an account, **When** they submit a valid email, display
   name, and password, **Then** an account is created and they are signed in
   immediately.
2. **Given** an account exists, **When** the owner enters the correct email and
   password on another device, **Then** they are signed in and see the same profile
   and records.
3. **Given** a signed-in user, **When** they reload the page or restart the browser,
   **Then** they remain signed in without entering credentials again.
4. **Given** a signed-in user, **When** they sign out, **Then** the current session ends
   and protected pages and actions require sign-in again.
5. **Given** an account exists, **When** someone enters a wrong password, **Then**
   sign-in fails with a clear message that does not reveal whether the email exists.

---

### User Story 2 - Record progress and completions under an account (Priority: P1)

A signed-in player records progress and completions, and those records belong to their
account. The profile, status, points, and leaderboard position are backed by the
account rather than by a temporary browser profile. Attempts to change another
player's records are rejected.

**Why this priority**: The request is specifically to move personal data and write
authorization to real backend accounts. This story delivers the value of signing in.

**Independent Test**: Two accounts record activity. Each sees only their own editable
records, both appear on the public leaderboard, and a write attempted with no session
or with another account's session is rejected without changing data.

**Acceptance Scenarios**:

1. **Given** a signed-in player opens a level, **When** they record progress or a
   completion, **Then** the record is saved to their account and appears on their
   profile.
2. **Given** a visitor is not signed in, **When** they attempt to record progress or a
   completion, **Then** the action is refused, no data changes, and the interface
   directs them to sign in or create an account.
3. **Given** a signed-in player, **When** their profile is viewed publicly, **Then**
   their display name, status, points, rank, completions, and progress are visible but
   their email address is never shown.
4. **Given** account A and account B, **When** a request tries to modify a record owned
   by B using A's session, **Then** the request is rejected and B's data is unchanged.
5. **Given** a session has expired or was revoked, **When** the user attempts a write,
   **Then** the write is rejected, the stale session is cleared, and the user is asked
   to sign in again.

---

### User Story 3 - Depend on account security and isolation (Priority: P2)

Account owners trust that passwords are protected, repeated guessing is slowed down,
and one account cannot access or alter another account's private data. Display names
are unique so players cannot impersonate one another.

**Why this priority**: A real account system is only credible if credentials and
ownership are protected. This story prevents the most damaging failures of a shared
backend identity system.

**Independent Test**: Review account responses for credential exposure; attempt rapid
repeated sign-ins; attempt to register a duplicate email or display name; verify each
attempt is handled safely with clear feedback.

**Acceptance Scenarios**:

1. **Given** any public response or log, **When** an account is inspected, **Then** the
   password and session secret are never exposed.
2. **Given** five failed sign-in attempts within fifteen minutes, **When** another
   attempt is made, **Then** further attempts are blocked for fifteen minutes with a
   clear retry message.
3. **Given** an email or display name is already registered, **When** a visitor tries to
   register it again (including with different letter casing or surrounding spaces),
   **Then** registration is rejected with a specific, actionable message.
4. **Given** a user creates an account, **When** they choose a password below the
   minimum strength, **Then** registration is rejected before any account is created.

---

### User Story 4 - Transition from temporary guest profiles (Priority: P3)

Existing temporary guest profiles stop being the way new identity is created. Current
guest records remain visible as legacy entries, but they cannot be signed into or
modified. The product no longer presents profiles as local-only or device-bound.

**Why this priority**: Removing the guest flow is required for the switch to real
accounts, but preserving existing records avoids destructive surprises during rollout.

**Independent Test**: Open the site with an old guest identity stored in the browser;
confirm the interface presents a signed-out state, old guest records are still viewable
on profiles and the leaderboard, and creating a new guest profile is no longer
possible.

**Acceptance Scenarios**:

1. **Given** a browser holds an old guest identity, **When** the site loads, **Then**
   the user is treated as signed out and invited to sign in or create an account.
2. **Given** a legacy guest profile has records, **When** anyone views its profile or
   the leaderboard, **Then** those records remain visible and unchanged.
3. **Given** any visitor, **When** they look for the guest profile creation flow,
   **Then** it is no longer offered and the interface explains that durable accounts
   are required to record new activity.

---

### Edge Cases

- A visitor submits an email with leading/trailing spaces or different letter casing:
  it is normalized for uniqueness and sign-in, so it cannot create a second account.
- A visitor submits a malformed email, an empty display name, or a display name outside
  the allowed length: registration is rejected with field-specific guidance.
- Two visitors try to register the same email or display name at nearly the same time:
  exactly one account succeeds and the other receives a conflict message.
- A password is far too short, far too long, or only whitespace: it is rejected before
  account creation.
- A session expires while the user is filling out a record form: the write is rejected
  and the user is prompted to sign in again without losing the rest of the page.
- A session is revoked by signing out on one device: other devices remain signed in
  until their own session ends or is revoked.
- The same account signs in on several devices: all valid sessions can read and write
  the same profile.
- Account data is requested after a server restart: the account still signs in and all
  records remain intact.
- A legacy guest profile's records are shown next to account-backed records: the
  leaderboard and profiles clearly distinguish them where relevant.
- A user clears browser storage: they can sign in again from any device because the
  account lives on the server.
- An unauthenticated request targets a record identifier directly: authorization is
  enforced on the server, not only hidden in the interface.
- The service is unavailable during sign-up or sign-in: the user sees a retryable error
  and no partial account is created.

## Requirements *(mandatory)*

### Functional Requirements

**Account creation**

- **FR-001**: The system MUST allow a visitor to create a durable account with an email
  address, a display name, and a password.
- **FR-002**: The system MUST normalize email addresses for comparison and MUST allow
  only one account per email address, ignoring letter casing and surrounding spaces.
- **FR-003**: The system MUST require display names to be unique among accounts,
  ignoring letter casing and surrounding spaces, and MUST require 2–32 characters
  after trimming.
- **FR-004**: The system MUST validate the email format and MUST require passwords of
  8–128 characters that are not only whitespace before creating an account.
- **FR-005**: The system MUST store passwords only in a non-reversible protected form
  and MUST never return or display them.
- **FR-006**: The system MUST sign a newly created account in immediately.

**Sign-in, sessions, and sign-out**

- **FR-007**: The system MUST allow an account owner to sign in with their email and
  password.
- **FR-008**: The system MUST keep a signed-in session valid across page reloads and
  browser restarts, and MUST allow the same account to sign in on multiple devices.
- **FR-009**: The system MUST end the current session when the user signs out, while
  leaving other devices' sessions active.
- **FR-010**: The system MUST reject expired, revoked, malformed, or missing sessions
  for protected actions and MUST signal to the interface that sign-in is required.
- **FR-011**: The system MUST return the same generic message for an unknown email and
  a wrong password so sign-in does not reveal which accounts exist.
- **FR-012**: After five failed sign-in attempts within fifteen minutes, the system MUST
  block further attempts for fifteen minutes and tell the user when to retry.
- **FR-013**: The system MUST allow a user with a stale session to clear it locally and
  sign in again without losing access to their account.

**Authorization and ownership**

- **FR-014**: The system MUST require a valid account session for every write to
  progress and completion records; temporary guest tokens MUST no longer authorize new
  writes.
- **FR-015**: The system MUST enforce record ownership on the server so an account can
  modify only its own progress and completions.
- **FR-016**: The system MUST reject unauthenticated or cross-account write attempts
  without changing any data.
- **FR-017**: The system MUST keep public catalog, level, profile, completion, and
  leaderboard reads available without sign-in.
- **FR-018**: The system MUST never expose an account's email address or credentials in
  public profile, completion, or leaderboard views.
- **FR-019**: The system MUST associate exactly one player profile with each account.

**Profile, records, and leaderboard**

- **FR-020**: The system MUST show account-backed points, status, rank, completions, and
  progress using the same public presentation as the current player profiles.
- **FR-021**: The system MUST continue to calculate points and leaderboard positions
  from completions after a user signs in with an account, without duplicate entries.
- **FR-022**: The system MUST provide clear signed-out states on profile pages and
  record actions, with direct paths to sign in or create an account.

**Legacy guest transition**

- **FR-023**: The system MUST stop offering new temporary guest profile creation.
- **FR-024**: The system MUST treat any guest identity stored in a browser as signed
  out and MUST NOT let it authorize writes.
- **FR-025**: The system MUST preserve existing guest profiles and their records as
  visible legacy data and MUST NOT move, delete, or reassign them.
- **FR-026**: The system MUST stop describing profiles as local-only or
  device-bound in user-facing text.

**Persistence and safe rollout**

- **FR-027**: The system MUST persist accounts and sessions in the server-side database
  so they survive service restarts and are available from other devices.
- **FR-028**: The system MUST add account persistence without deleting or corrupting
  existing player, progress, completion, or catalog data.
- **FR-029**: The system MUST keep the change deployable and reversible without data
  loss if the rollout is rolled back.

**Interface and feedback**

- **FR-030**: The system MUST provide sign-up and sign-in forms with field labels,
  validation feedback, loading states, and retryable server-error states.
- **FR-031**: The system MUST show the signed-in display name and a sign-out action in
  the primary navigation.
- **FR-032**: Every account and session error MUST produce an understandable message
  and MUST NOT leave the interface in a false signed-in state.
- **FR-033**: Account forms and navigation MUST be keyboard accessible and work on
  mobile layouts.

### Key Entities *(include if feature involves data)*

- **Account**: A durable identity with a unique email address, a unique display name,
  a protected password verifier, and a creation timestamp. Owns one player profile and
  many sessions.
- **Session**: A revocable, expiring credential that proves an account is signed in on
  a device. Belongs to one account; multiple sessions per account are allowed.
- **Player profile**: The public identity and statistics for an account, including
  display name, points, status, rank, completions, and progress.
- **Progress record**: A player's best percentage below completion on a level; owned by
  one player profile.
- **Completion record**: A player's completed level; owned by one player profile and
  counted once per level.
- **Legacy guest profile**: A pre-existing player profile created before real accounts,
  retained read-only with its records intact.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor can create an account and reach their profile in under 2
  minutes.
- **SC-002**: A returning user can sign in and reach their profile in under 30 seconds.
- **SC-003**: 100% of write attempts without a valid account session are rejected with
  no data change.
- **SC-004**: 100% of cross-account write attempts in testing are rejected with no data
  change.
- **SC-005**: An account created on one device can sign in and see identical records on
  a second device.
- **SC-006**: Account and record data survive a full service restart with zero loss.
- **SC-007**: No password, session secret, or email address appears in public responses
  or logs.
- **SC-008**: At least 95% of users who start account creation complete it successfully
  when entering valid data.
- **SC-009**: Existing guest profiles and their records remain visible unchanged after
  the change.

## Assumptions

- **Authentication method**: Email address plus password, implemented with the
  project's existing application stack. OAuth/SSO is out of scope for this delivery.
- **Storage**: Account and session data are stored in the existing server-side SQLite
  database, as requested by the user; the browser holds only the current session
  credential, never the account data itself.
- **Email verification**: No verification email is sent in this delivery because no mail
  delivery service is configured. An account is usable immediately after registration.
- **Password recovery**: Self-service password reset and account deletion are out of
  scope for this delivery.
- **Profile editing**: Changing email, display name, or password after registration is
  out of scope; display names are fixed once chosen.
- **Legacy data**: Existing guest profiles are not converted or claimed by new accounts;
  they remain read-only legacy records. New activity is recorded only through accounts.
- **Session lifetime**: Sessions expire after 30 days without use and can be revoked by
  signing out; each successful use extends the 30-day window.
- **Public access**: Browsing the catalog, levels, profiles, and leaderboard remains
  available without signing in; only writes require an account.
- **Roles**: This delivery introduces no administrator or moderator roles; the existing
  script-based record correction process remains unchanged.
