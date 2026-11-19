# Feature Specification: AI-Assisted Client Behavior Tests

**Feature Branch**: `006-ai-client-tests`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "добавь тесты по Создайте и проверьте тесты с помощью AI... Покройте компоненты, формы и состояния... Ответы сервера в тестах подменяйте тестовыми данными: успех, пустой ответ, задержка и ошибка... повторная отправка во время ожидания не создаёт второй запрос... Хотя бы один автоматический тест должен пройти основной сценарий на клиенте от действия пользователя до видимого результата."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prove the main client journey end to end (Priority: P1)

A visitor opens a level, is prompted to sign in, creates an account, records partial
progress, and sees that progress on the level and profile. The whole journey runs in an
automated browser test against controlled server responses.

**Why this priority**: This is the required action-to-visible-result test and proves the
forms, dialogs, API calls, and result rendering work together.

**Independent Test**: Run the single main-journey test with mocked success responses; it
starts on the catalog, performs the user actions, and asserts the visible best progress
without any real backend dependency.

**Acceptance Scenarios**:

1. **Given** the catalog is loaded, **When** the visitor opens a level and chooses to
   update progress while signed out, **Then** the account gate is visible.
2. **Given** the account gate is open, **When** the visitor creates an account with valid
   data, **Then** the auth dialog closes and the signed-in account name is visible.
3. **Given** the signed-in visitor has the progress dialog open, **When** they choose a
   value and save, **Then** a success message and the chosen best progress are visible.
4. **Given** the main journey ends, **When** the profile is opened, **Then** the same
   progress result is visible there.

---

### User Story 2 - Validate forms and dialog behavior visibly (Priority: P1)

A user encounters required-field validation, invalid input, and server errors in the
registration and progress forms. Dialog open/close behavior and focusable controls are
covered by visible assertions.

**Why this priority**: Forms are the main interaction surface and must not rely on
component-existence checks.

**Independent Test**: Submit empty and invalid forms, open and close dialogs, and assert
the visible messages and states; then submit valid data and assert the success state.

**Acceptance Scenarios**:

1. **Given** the registration dialog, **When** the user submits without email, display name,
   or password, **Then** visible validation feedback appears and no request is sent.
2. **Given** the registration dialog, **When** the user enters an invalid email or a password
   outside the allowed length, **Then** a field-specific error is visible.
3. **Given** the registration dialog, **When** the server returns a validation or conflict
   error, **Then** the message is visible and the dialog stays usable for retry.
4. **Given** any dialog, **When** the user closes it with the close control or Escape,
   **Then** it disappears and focus returns to a sensible trigger.
5. **Given** the progress form, **When** the user enters an out-of-range percentage,
   **Then** the value is constrained or rejected with visible feedback.

---

### User Story 3 - Prevent duplicate submissions while waiting (Priority: P1)

While a form request is pending, the user cannot accidentally send the same action twice.
The test performs a repeated click or Enter press during a delayed response and asserts
that only one request was made.

**Why this priority**: Duplicate account or progress writes are a concrete correctness
risk and one of the required acceptance checks.

**Independent Test**: Delay the mocked response, submit twice (click and/or Enter), count
requests, then release the response and assert one visible result.

**Acceptance Scenarios**:

1. **Given** the registration form is submitting, **When** the submit control is activated
   again, **Then** it is disabled or ignored and no second request is sent.
2. **Given** the user presses Enter repeatedly while the request is pending,
   **Then** only one request is observed.
3. **Given** the pending request eventually succeeds, **Then** exactly one success state is
   shown and no duplicate entity is visible.
4. **Given** the pending request fails, **Then** the loading state ends and the user can
   retry with a new request.

---

### User Story 4 - Cover loading, empty, success, and error states with mocked responses (Priority: P2)

The client shows distinct visible states for loading, empty data, successful data, and
errors. Each state is produced by controlled test responses rather than real services.

**Why this priority**: State handling is part of the visible product behavior and prevents
regressions in empty or failure paths.

**Independent Test**: Run separate tests with success, empty, delayed, and error responses
and assert the visible state for each.

**Acceptance Scenarios**:

1. **Given** a delayed catalog response, **When** the catalog is opened, **Then** a loading
   state is visible until the response is released.
2. **Given** an empty catalog response, **When** it resolves, **Then** an explicit empty
   state is visible, not a blank page.
3. **Given** a successful catalog response, **Then** level rows are visible.
4. **Given** a server error response, **Then** an error state with a retry action is visible.
5. **Given** a successful retry after an error, **Then** the error state is replaced by the
   successful result.

---

### User Story 5 - Review AI-proposed checks for meaning (Priority: P2)

The test author asks AI to propose checks, reviews them, removes weak or implementation-only
assertions, and keeps tests that prove visible behavior. The final suite maps to the five
requested testing criteria.

**Why this priority**: Generates useful coverage without accepting shallow tests just
because they pass.

**Independent Test**: Review the added tests against the coverage table; every criterion
7–11 has at least one visible-behavior test and no added test asserts only that a component
exists.

**Acceptance Scenarios**:

1. **Given** AI-proposed tests, **When** each is reviewed, **Then** tests that only check
   component presence or internal implementation are removed or rewritten.
2. **Given** the final suite, **When** it is mapped to criteria 7–11, **Then** every
   criterion has at least one test and the mapping is documented.
3. **Given** the full client test run, **Then** all tests pass without relying on live
   external services.

---

### Edge Cases

- Double click and Enter key both attempt submission during the same pending request.
- A server error arrives after a retry was already requested.
- The user closes a dialog while a request is pending; the pending result must not reopen a
  stale dialog or create duplicate state.
- Empty response, delayed response, and error response are tested separately and combined
  with a retry.
- Validation messages remain associated with the correct field.
- A second submission after the first completes is allowed and creates the expected next
  action.
- Tests do not depend on real network timing or real external data.
- Test account identifiers are unique per test run.

## Requirements *(mandatory)*

### Functional Requirements

**Visible-behavior test quality**

- **FR-001**: Added tests MUST assert visible user-facing behavior such as text, roles,
  enabled/disabled state, dialog visibility, validation messages, and result values.
- **FR-002**: Added tests MUST NOT pass solely because a component or element exists in the
  code or DOM.
- **FR-003**: Added tests MUST cover component display, button activation, data entry, and
  dialog opening and closing where present.
- **FR-004**: Tests MUST be deterministic and MUST NOT depend on real external services or
  fixed sleeps.
- **FR-005**: The AI-proposed test set MUST be reviewed; weak or implementation-only checks
  MUST be removed or rewritten before completion.

**Forms and validation**

- **FR-006**: Tests MUST cover required email, display name, and password fields in the
  registration form.
- **FR-007**: Tests MUST cover invalid email, invalid display-name length, and password
  length/whitespace validation.
- **FR-008**: Validation feedback MUST be visible, and field-specific messages MUST be
  associated with the corresponding field.
- **FR-009**: Server-side validation, conflict, and failure messages MUST be visible and
  MUST leave the form usable for retry.
- **FR-010**: Tests MUST cover open and close behavior for registration, auth gate,
  progress, and level dialogs where the scenario uses them.

**Duplicate submission protection**

- **FR-011**: While a form request is pending, the submit action MUST be disabled or
  ignored.
- **FR-012**: Repeated click or Enter during a delayed request MUST produce exactly one
  request.
- **FR-013**: A successful pending request MUST produce exactly one visible success result
  and no duplicate entity.
- **FR-014**: A failed pending request MUST end the pending state and allow a new retry
  request.

**Controlled server states**

- **FR-015**: Tests MUST substitute server responses at the network boundary with controlled
  success, empty, delayed, and error data.
- **FR-016**: A delayed response MUST show a visible loading state before completion.
- **FR-017**: An empty response MUST show an explicit empty state.
- **FR-018**: A success response MUST show the expected visible data.
- **FR-019**: An error response MUST show a visible error state with a retry path.
- **FR-020**: A retry after an error MUST replace the error state with the successful
  result when the mocked retry succeeds.

**Main journey and coverage**

- **FR-021**: At least one client test MUST cover the full journey: open a level, open the
  account gate, create an account, choose progress, save, and see the visible best
  progress and profile result.
- **FR-022**: The final test suite MUST map to criteria 7–11, with at least one test per
  criterion.
- **FR-023**: All client tests MUST run successfully in the project’s standard client test
  commands.
- **FR-024**: Existing passing client behavior MUST NOT regress.

### Key Entities

- **Test scenario**: A user-visible journey with actions, mocked responses, and observable
  results.
- **Mocked response**: Controlled success, empty, delayed, or error data substituted for a
  server response.
- **Form submission**: A visible action that may enter a pending state and must not
  duplicate requests.
- **UI state**: Loading, empty, success, or error presentation visible to the user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The duplicate-submission test observes exactly one request during a delayed
  submit while the user attempts at least two submissions.
- **SC-002**: Validation tests cover required fields, invalid email, invalid display name,
  and password rules, with visible messages for each.
- **SC-003**: Success, empty, delayed, and error responses are each covered by at least one
  visible-state test.
- **SC-004**: The main client journey test completes from the first user action to the
  visible progress result in under 10 seconds in the automated run.
- **SC-005**: 100% of added tests assert visible behavior; none rely only on component or
  DOM existence.
- **SC-006**: The coverage matrix shows 5 of 5 requested criteria (7–11) covered.
- **SC-007**: The full client test suite passes on two consecutive runs with no failures.
- **SC-008**: No existing client test regresses.

## Assumptions

- The main scenario is the existing account and progress flow; points and leaderboard are
  out of scope.
- Server responses are controlled at the network boundary with success, empty, delayed, and
  error variants.
- “Empty response” for the catalog produces the existing empty state.
- “Delayed response” is controlled by the test’s interception, not a hard-coded sleep.
- Tests use the project’s existing client automation stack and run without live external
  APIs.
- Test accounts and data are unique per run and do not depend on production data.
- AI-proposed tests are treated as drafts and require human review for meaning and
  stability.
