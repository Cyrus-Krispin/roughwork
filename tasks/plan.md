# Implementation Plan: ThinkEdge

## Overview

Build ThinkEdge as narrow, local-first vertical learning loops. After the secure Electron/React baseline, validate the interaction rhythm with deterministic data before adding a model. Then test constrained evaluation, adaptive questioning, retention, and finally an evidence graph.

## Architecture Decisions

- Use Electron, React, and TypeScript so the desktop shell and interface share a widely supported ecosystem.
- Keep privileged work and model calls in the Electron main process behind task-specific preload methods.
- Model a learning session as explicit deterministic states; treat model output as untrusted input to those states.
- Call the first model provider directly and validate structured responses; do not add LangChain or another orchestration framework initially.
- Store learner data locally first and introduce remote infrastructure only after a validated need.
- Derive future graph claims from preserved answer evidence, never from unsupported model summaries.

## Dependency Graph

```text
Desktop baseline
    |
    v
Deterministic local session
    |
    v
Constrained AI evaluation
    |
    v
Adaptive question and help selection
    |
    v
Retention and optional sources
    |
    v
Evidence graph and learning frontier
```

## Task List

### Phase 0: Foundation

- [x] Task 0: Establish the Electron/React/TypeScript baseline
- [ ] Task 1: Add deterministic unit and application smoke-test harnesses
- [ ] Task 2: Record packaging, security, and development conventions

### Checkpoint: Foundation

- [ ] The app launches on macOS
- [ ] Linting, type checking, tests, formatting, and packaging pass
- [ ] No product dependency or feature has been added
- [ ] Founder reviews the updated product direction and MVP boundary

### Phase 1: Deterministic Session Shell

- [ ] Task 3: Define session, question, attempt, evaluation, and help-ladder domain states with tests
- [ ] Task 4: Build the topic, question, text-answer, feedback, and session-summary interface using fixtures
- [ ] Task 5: Persist and reopen immutable session history using a versioned local schema

### Checkpoint: Session Shell

- [ ] The full loop works offline with deterministic fixtures
- [ ] The UI shows one question at a time and never overwrites an answer
- [ ] Simulated interruption does not lose acknowledged attempts

### Phase 2: Constrained AI Evaluation

- [ ] Task 6: Define a structured evaluation and next-question contract with adversarial fixtures
- [ ] Task 7: Store provider credentials securely and call the provider from the main process
- [ ] Task 8: Validate, persist, and display brief evidence-grounded evaluations and explicit uncertainty

### Checkpoint: AI Evaluation

- [ ] The model cites the learner's answer and distinguishes partial knowledge from error
- [ ] No full explanation appears before an attempt unless explicitly requested
- [ ] Provider and validation failures preserve the session and explain recovery

### Phase 3: Adaptive Questioning

- [ ] Task 9: Implement probe, advance, prerequisite, and hint transition rules
- [ ] Task 10: Add the graduated help ladder and learner challenge workflow
- [ ] Task 11: Generate and preserve session summaries with demonstrated evidence and unresolved gaps

### Checkpoint: Adaptive Loop

- [ ] Strong, partial, mistaken, and ambiguous answers lead to meaningfully different next moves
- [ ] A complete session reveals useful gaps without becoming a lecture
- [ ] Model judgments remain provisional and correctable

### Phase 4: Retention and Sources

- [ ] Task 12: Add an evidence-based revisit queue and delayed-recall checks
- [ ] Task 13: Accept an optional source and preserve its provenance
- [ ] Task 14: Ground questions and corrections in that source when present

### Phase 5: Evidence Graph and Learning Frontier

- [ ] Task 15: Derive concept and misconception evidence from preserved attempts
- [ ] Task 16: Propose prerequisite and related-concept edges with provenance
- [ ] Task 17: Add topic audits and next-question recommendations
- [ ] Task 18: Test a small graph view only against concrete learning decisions

### Checkpoint: Product Validation

- [ ] Critical flows pass end-to-end tests
- [ ] Delayed qualitative testing compares ThinkEdge with ordinary explanatory chat
- [ ] Privacy, security, backup, and distribution reviews are complete

## Risks and Mitigations

| Risk                                           | Impact | Mitigation                                                                                           |
| ---------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| AI creates a false sense of mastery            | High   | Require multiple retrieval or application attempts and show evidence instead of a mastery percentage |
| Questioning becomes frustrating or aimless     | High   | Use explicit next-move rules, a graduated help ladder, and learner-controlled session exit           |
| Evaluation is confidently wrong                | High   | Ground judgments in answer excerpts or sources, expose uncertainty, and support learner challenge    |
| Model becomes an answer-dump chatbot           | High   | Enforce one-question contracts and gate direct explanation behind an explicit request                |
| Knowledge graph becomes decorative             | Medium | Delay it until longitudinal evidence exists and test it against next-step decisions                  |
| Local data loss                                | High   | Version migrations, transactional writes, backups, export, and interruption tests                    |
| Electron boundary exposes desktop capabilities | High   | Sandboxed renderer, context isolation, narrow preload methods, and sender validation                 |
| Scope expands into a general study suite       | Medium | Preserve the Not Doing list and ship only the next learning loop                                     |

## Open Questions

- Resolve product-spec questions before the affected phase begins.
- Decide distribution and signing before external alpha testing.
- Build a small founder-authored evaluation set before choosing the first model.
