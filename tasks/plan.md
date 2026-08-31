# Implementation Plan: Adaptive Learning Controls

## Overview

Add a persisted graduated-help ladder and an append-only evaluation challenge
flow. This is the first Phase 3 vertical slice: it gives learners bounded agency
when stuck or misjudged while preserving Strata AI's attempt-first interaction.

## Architecture Decisions

- Deterministic application code owns permitted help escalation; the model only
  generates the response for an allowed level.
- Help requests attach to the current question and never advance the session.
- Challenges attach to an immutable attempt, append evaluation revisions, and
  may update only the still-unanswered child question.
- SQLite migration 2 adds only provenance records; version-1 data is unchanged.
- Existing IPC and provider boundaries gain named operations rather than raw
  messaging or an orchestration dependency.

## Dependency Graph

```text
Help and challenge contracts
  -> provider adapters and contract tests
      -> migration and repository operations
          -> authoritative service transitions
              -> narrow IPC bridge
                  -> reducer and UI controls
                      -> restart and end-to-end verification
```

## Phase 1: Lock the model boundary

- [ ] Task 1: Define and test graduated-help response contracts
- [ ] Task 2: Define and test evaluation-challenge provider behavior

### Checkpoint: Model boundary

- [ ] Invalid, answer-leaking, or ungrounded output fails closed
- [ ] Existing evaluation fixtures remain green

## Phase 2: Persist auditable learner control

- [ ] Task 3: Add the version-2 migration and history types
- [ ] Task 4: Append and reload idempotent help requests
- [ ] Task 5: Append evaluation revisions and challenge provenance

### Checkpoint: Durable domain

- [ ] A version-1 database migrates without rewriting existing rows
- [ ] Help and challenge history survives database reopen
- [ ] Duplicate retries and stale challenges cannot create conflicting history

## Phase 3: Expose authoritative operations

- [ ] Task 6: Enforce help ladder and challenge rules in the learning service
- [ ] Task 7: Add strict named IPC and preload operations
- [ ] Task 8: Extend reducer states for help, challenge, retry, and rehydration

### Checkpoint: Process boundary

- [ ] Invalid or unauthorized state transitions are rejected
- [ ] Provider failures preserve learner input and acknowledged history
- [ ] Renderer receives no new privileged capability

## Phase 4: Complete the learner flow

- [ ] Task 9: Add accessible help controls and response display
- [ ] Task 10: Add challenge rationale and evaluation revision UI
- [ ] Task 11: Show help and revision provenance in session review

### Checkpoint: Complete

- [ ] Full five-level help flow works without advancing the session
- [ ] Latest evaluation is clear and prior revisions remain inspectable
- [ ] Restart, offline retry, stale challenge, and ended-session flows pass
- [ ] `npm run lint`, `npm run typecheck`, `npm test`,
      `npm run format:check`, and `npm run package` pass

## Risks and Mitigations

| Risk                                           | Impact | Mitigation                                                                     |
| ---------------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| Early help leaks the answer                    | High   | Level-specific schemas, prompts, fixtures, and manual adversarial checks       |
| Challenge becomes evaluation shopping          | High   | One explicit rationale, append-only provenance, and visible revision history   |
| Current next question diverges after revision  | High   | Replace only the active branch pointer transactionally; preserve prior records |
| Retried calls create duplicate charges or rows | Medium | Client request IDs and acknowledged-result replay                              |
| Migration harms existing local history         | High   | Version-1 migration fixture, additive tables, transaction, and reopen test     |

## Approval Gate

Implementation starts after founder approval of
`docs/adaptive-learning-controls.md`, especially migration 2 and the permitted
update of a still-unanswered child question after a successful challenge.
