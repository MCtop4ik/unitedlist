# Tasks: AI-Assisted Client Behavior Tests

**Input**: Design documents from `/specs/006-ai-client-tests/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/test-doubles.md`, `quickstart.md`

**Tests**: Tests are the deliverable for this feature. Every user story is implemented as
browser-level behavior tests with intercepted server responses.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `US1`–`US5` in user-story phases only
- Every task includes an exact file path

## Path Conventions

- Tests: `frontend/tests/e2e/`
- Test helpers: `frontend/tests/e2e/support/`
- Production touchpoints only if a test exposes a real bug: `frontend/src/`

---

## Phase 1: Setup (Test Infrastructure)

**Purpose**: Create deterministic fixtures and the stateful API test double.

- [X] T001 Create `frontend/tests/e2e/support/fixtures.ts` with minimal deterministic catalog, level detail, player profile, progress, and completion fixtures usable across client tests.
- [X] T002 Create `frontend/tests/e2e/support/mock-api.ts` that intercepts `/api/**` via Playwright, records `{ method, url, body }`, and supports `success`, `empty`, `error`, `delayed`, and explicit deferred release for the endpoints in `contracts/test-doubles.md`.

**Checkpoint**: Test double and fixtures are ready; behavior specs can run without a live API.

---

## Phase 2: Foundational (No Blocking Prerequisites)

**Purpose**: No cross-story production work is required. The mock API helper is the only
shared foundation.

- [X] T003 [P] Wire `frontend/tests/e2e/support/mock-api.ts` into a reusable `createMockApi(page, options)` factory and document its request-log and release API in `frontend/tests/e2e/support/mock-api.ts`.

**Checkpoint**: All user stories can use the same deterministic API double.

---

## Phase 3: User Story 1 - Prove the main client journey (Priority: P1) 🎯 MVP

**Goal**: One browser test covers opening a level, the account gate, account creation,
progress selection, save, and visible best/profile results.

**Independent Test**: Run the journey with mocked success responses; it must reach the
visible saved progress without a real backend.

- [X] T004 [P] [US1] Add `frontend/tests/e2e/client-journey.spec.ts` covering catalog → level → account gate → register dialog → progress dialog → save → visible best progress → profile result.
- [X] T005 [US1] Run `client-journey.spec.ts` and fix any test-helper timing or mocked-route mismatch in `frontend/tests/e2e/support/mock-api.ts`; do not change product behavior just to satisfy the mock.

---

## Phase 4: User Story 2 - Validate forms and dialogs visibly (Priority: P1)

**Goal**: Cover dialog display/open/close, input, required fields, invalid values, visible
errors, and retry.

**Independent Test**: Submit empty/invalid forms, open/close dialogs, trigger a mocked
server error, and assert visible messages and no-request validation behavior.

- [X] T006 [P] [US2] Add `frontend/tests/e2e/client-forms.spec.ts` covering registration/sign-in dialog open/close, required email/display name/password, invalid email/name/password, field-level messages, server error, and successful retry.
- [X] T007 [US2] If the form tests reveal a missing visible validation message or a request sent for client-invalid input, fix `frontend/src/features/auth/AuthDialog.tsx` and re-run `client-forms.spec.ts`.

---

## Phase 5: User Story 3 - Prevent duplicate submissions (Priority: P1)

**Goal**: A delayed registration response plus repeated submit actions produces exactly one
request and one visible result.

**Independent Test**: Delay register, click and press Enter, assert request log count is 1,
release, and assert one success state.

- [X] T008 [P] [US3] Add `frontend/tests/e2e/client-duplicate-submit.spec.ts` using the deferred release in `frontend/tests/e2e/support/mock-api.ts`; assert one `POST /api/auth/register`, a visible pending state, and one success result.
- [X] T009 [US3] If the duplicate test observes a second request, add a synchronous in-flight guard in `frontend/src/features/auth/AuthDialog.tsx` and re-run the spec until the request count is exactly one.
- [X] T010 [US3] Confirm retry-after-error creates a new request only after the failed pending state ends in `frontend/tests/e2e/client-duplicate-submit.spec.ts`.

---

## Phase 6: User Story 4 - Cover loading, empty, success, and error states (Priority: P2)

**Goal**: Prove all four visible catalog states with substituted responses, including retry.

**Independent Test**: Use delayed, empty, success, and error mocked responses and assert the
corresponding visible states; then retry after an error.

- [X] T011 [P] [US4] Add `frontend/tests/e2e/client-states.spec.ts` covering delayed loading, empty catalog, successful rows, error state with retry, and retry success.
- [X] T012 [US4] If a state is not visibly distinct or retry does not replace the error, fix the relevant state handling in `frontend/src/features/catalog/CatalogPage.tsx` and re-run `client-states.spec.ts`.

---

## Phase 7: User Story 5 - Review AI-proposed checks and map coverage (Priority: P2)

**Goal**: Ensure the final suite is meaningful, deterministic, and maps to criteria 7–11.

**Independent Test**: Review every new test for visible-behavior assertions, run the new
suite twice, and confirm the coverage map has all five criteria.

- [X] T013 [US5] Add a coverage map section to `frontend/tests/e2e/client-journey.spec.ts` or `frontend/tests/e2e/support/mock-api.ts` comments linking tests to criteria 7–11.
- [X] T014 [US5] Review all new `frontend/tests/e2e/client-*.spec.ts` files and remove or rewrite assertions that only check component/DOM existence or internal implementation.
- [X] T015 [US5] Run `frontend/tests/e2e/client-*.spec.ts` twice and remove any data coupling, fixed sleeps, or order dependence that prevents repeatable passes.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Full verification and test-quality cleanup.

- [X] T016 Run `npm run typecheck` and `npm run lint` from `package.json`; fix all failures.
- [X] T017 Run `npm test` from `package.json`; fix all failures.
- [X] T018 Run `npm run test:e2e` and `npm run test:e2e:backend` from `package.json`; fix all failures.
- [X] T019 Verify the coverage map in `frontend/tests/e2e/client-*.spec.ts`: criteria 7–11 each have at least one visible-behavior test and the main journey reaches a visible result.
- [X] T020 [P] Clean up duplicate fixtures/mock handlers and stale test data in `frontend/tests/e2e/support` and `frontend/tests/e2e/client-*.spec.ts`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: T001 then T002 (mock helper needs fixtures).
- **Foundational**: T003 after T002.
- **US1**: T004 after T003; T005 after T004.
- **US2**: T006 after T003; T007 after T006 if failures occur.
- **US3**: T008 after T003; T009 after T008 if duplicate observed; T010 after T008.
- **US4**: T011 after T003; T012 after T011 if state gaps occur.
- **US5**: T013–T015 after the behavior specs exist.
- **Polish**: After desired stories.

### User Story Dependencies

- **US1 (P1)**: Main journey; independent after mock helper.
- **US2 (P1)**: Forms/dialogs; independent after mock helper.
- **US3 (P1)**: Duplicate submission; independent after mock helper.
- **US4 (P2)**: Catalog states; independent after mock helper.
- **US5 (P2)**: Review/coverage after US1–US4 tests exist.

### Parallel Opportunities

- T001/T002 are sequential (fixtures then helper).
- T004, T006, T008, and T011 touch different spec files and can be written in parallel after T003.
- T013 and T014 can run in parallel after specs exist.
- T016/T017/T018 are sequential; T019/T020 follow.

### Within Each User Story

- Write the behavior test first.
- Run it against the mock API and fix test-helper issues before touching production code.
- Only change production code when the test proves a real visible behavior defect.
- Re-run the story test before moving on.

---

## Parallel Example: Core Behavior Specs

```bash
Task: "T004 [US1] Add client journey in frontend/tests/e2e/client-journey.spec.ts"
Task: "T006 [US2] Add form validation in frontend/tests/e2e/client-forms.spec.ts"
Task: "T008 [US3] Add duplicate-submit test in frontend/tests/e2e/client-duplicate-submit.spec.ts"
Task: "T011 [US4] Add state coverage in frontend/tests/e2e/client-states.spec.ts"
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

These are all P1 and cover the required visible journey, form behavior, and duplicate
submission guard.

1. Build fixtures and the mock API helper.
2. Add and pass the main journey.
3. Add and pass forms/dialog validation.
4. Add and pass duplicate-submit proof.
5. Add state coverage and coverage review.

### Incremental Delivery

1. Test infrastructure.
2. P1 journey/forms/duplicate.
3. P2 states and coverage review.
4. Full client suite and repeatability check.

---

## Notes

- Tests must assert visible text/roles/state, not component existence.
- No real external services; all responses are controlled by the mock API.
- No fixed sleeps; use deferred release.
- Unique account/data identifiers per test run.
- Remove AI-generated assertions that do not prove user-visible behavior.

---

## Phase 9: Convergence

- [ ] T021 Add a visible success assertion after the delayed duplicate submission in `frontend/tests/e2e/client-duplicate-submit.spec.ts`: assert exactly one `ACCOUNT CREATED` success/toast state and no duplicate account state per FR-013 (partial).
- [ ] T022 Add a delayed-error submission test in `frontend/tests/e2e/client-duplicate-submit.spec.ts`: assert the pending state ends on error and a retry sends exactly one new registration request per FR-014 (missing).
- [ ] T023 Extend `frontend/tests/e2e/client-forms.spec.ts` with a malformed non-empty email case and assert the error is associated with the email field (for example `aria-invalid` and/or field-level message) per FR-007/FR-008 (partial).
- [ ] T024 Add assertions that the level dialog closes and the auth gate closes after choosing an account action in `frontend/tests/e2e/client-journey.spec.ts` or `frontend/tests/e2e/client-forms.spec.ts` per FR-010 (partial).
