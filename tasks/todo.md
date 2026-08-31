# Adaptive Learning Controls Checklist

## Task 1: Graduated-help contracts

**Acceptance criteria:** strict five-level responses; pre-explanation levels
reject answer dumps; question levels contain exactly one question.

**Verification:** `npm test -- tests/learning-contracts.test.mjs`

**Dependencies:** None

**Files:** `src/learning/contracts.ts`, `tests/learning-contracts.test.mjs`

## Task 2: Provider help and challenge operations

**Acceptance criteria:** bounded prompts; challenge includes immutable context;
all outputs pass strict parsers.

**Verification:** `npm test -- tests/deepseek-provider.test.mjs`

**Dependencies:** Task 1

**Files:** `src/main/ai/deepseek.ts`, `tests/deepseek-provider.test.mjs`

## Task 3: Version-2 schema and public history

**Acceptance criteria:** additive migration; version-1 data preserved; types
represent help requests and evaluation revisions without claiming mastery.

**Verification:** `npm test -- tests/session-repository.test.mjs`

**Dependencies:** Task 1; founder schema approval

**Files:** `src/main/persistence/database.ts`, `src/learning/history.ts`,
`tests/session-repository.test.mjs`

## Task 4: Durable help repository

**Acceptance criteria:** append permitted level with a unique client request ID;
replay acknowledged request; reload ordered history after database reopen.

**Verification:** `npm test -- tests/session-repository.test.mjs`

**Dependencies:** Task 3

**Files:** `src/main/persistence/sessionRepository.ts`,
`tests/session-repository.test.mjs`

## Task 5: Durable challenge revisions

**Acceptance criteria:** append one revision transactionally; retain original
evaluation and evidence; reject stale revision; update only an unanswered child
question; replay acknowledged client request ID.

**Verification:** `npm test -- tests/session-repository.test.mjs`

**Dependencies:** Task 3

**Files:** `src/main/persistence/sessionRepository.ts`,
`tests/session-repository.test.mjs`

## Task 6: Authoritative service rules

**Acceptance criteria:** enforce current question, help progression, latest
evaluation, active session, and idempotent acknowledged results.

**Verification:** `npm test -- tests/learning-service.test.mjs`

**Dependencies:** Tasks 2, 4, 5

**Files:** `src/main/learningService.ts`, `tests/learning-service.test.mjs`

## Task 7: Narrow IPC bridge

**Acceptance criteria:** strict request schemas; named help/challenge methods;
generic safe errors; trusted sender checks remain in force.

**Verification:** `npm test -- tests/learning-ipc.test.mjs`

**Dependencies:** Task 6

**Files:** `src/learning/ipc.ts`, `src/index.ts`, `src/preload.ts`,
`src/window.d.ts`, `tests/learning-ipc.test.mjs`

## Task 8: Interaction state

**Acceptance criteria:** help and challenge loading/retry states preserve answer
and rationale; rehydration restores acknowledged history.

**Verification:** `npm test -- tests/learning-session.test.mjs`

**Dependencies:** Task 7

**Files:** `src/learning/session.ts`, `tests/learning-session.test.mjs`

## Task 9: Help interface

**Acceptance criteria:** clear next permitted level; no automatic escalation;
accessible loading, response, retry, and direct-explanation confirmation.

**Verification:** manual flow plus `npm run lint && npm run typecheck`

**Dependencies:** Task 8

**Files:** `src/App.tsx`, `src/components/QuestionView.tsx`, one focused help
component

## Task 10: Challenge interface

**Acceptance criteria:** learner supplies rationale; latest revision is primary;
original judgment remains inspectable; duplicate submission is disabled.

**Verification:** manual flow plus `npm run lint && npm run typecheck`

**Dependencies:** Task 8

**Files:** `src/App.tsx`, `src/components/FeedbackView.tsx`, one focused challenge
component

## Task 11: Review and full verification

**Acceptance criteria:** session review shows help and challenge provenance;
restart and offline recovery pass; docs reflect shipped behavior.

**Verification:** `npm run lint && npm run typecheck && npm test && npm run
format:check && npm run package`

**Dependencies:** Tasks 9, 10

**Files:** `src/components/SessionReview.tsx`, `docs/architecture.md`,
`docs/roadmap.md`, `README.md`
