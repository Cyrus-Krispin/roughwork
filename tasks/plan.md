# Implementation Plan: Roughwork

## Overview

Build Roughwork as a sequence of narrow, local-first learning workflows. The first increment is only a secure and verifiable Electron/React baseline. Product phases then proceed vertically from capture to review, retrieval, connections, and the learning frontier.

## Architecture Decisions

- Use Electron, React, and TypeScript so the desktop shell and interface share a widely supported language and ecosystem.
- Keep privileged work in the Electron main process and expose only task-specific preload methods.
- Add persistence, editor, model, and graph dependencies only when their vertical slice begins.
- Store learner data locally first; introduce remote infrastructure only after a validated need.
- Treat AI output as untrusted structured proposals that require validation and, where appropriate, learner approval.

## Dependency Graph

```text
Desktop baseline
    |
    v
Local note capture
    |
    v
Explicit AI review
    |
    v
Questions and attempts
    |
    v
Approved concepts and links
    |
    v
Learning frontier and audits
```

## Task List

### Phase 0: Foundation

- [x] Task 0: Establish the Electron/React/TypeScript baseline
- [ ] Task 1: Add deterministic unit and application smoke-test harnesses
- [ ] Task 2: Record packaging, security, and development conventions

### Checkpoint: Foundation

- [ ] The app launches on macOS
- [ ] Linting, type checking, tests, and packaging pass
- [ ] No product dependency or feature has been added
- [ ] Founder reviews the product specification and roadmap

### Phase 1: Capture

- [ ] Task 3: Create and edit one plain local note
- [ ] Task 4: Persist and reopen the note using a versioned SQLite schema
- [ ] Task 5: Add autosave recovery and Markdown import/export

### Checkpoint: Capture

- [ ] The complete capture flow works offline
- [ ] Simulated interruption does not lose acknowledged content
- [ ] The persistence design is approved before AI integration

### Phase 2: Review

- [ ] Task 6: Define and evaluate the review behavior contract
- [ ] Task 7: Store provider credentials and request an explicit review
- [ ] Task 8: Display validated passage-level review proposals

### Checkpoint: Review

- [ ] AI runs only after explicit learner action
- [ ] The model cannot rewrite the note or silently change stored concepts
- [ ] Provider and validation failures preserve the note and explain recovery

### Phase 3: Retrieval

- [ ] Task 9: Generate bounded questions from an accepted review
- [ ] Task 10: Capture learner attempts without prematurely revealing answers
- [ ] Task 11: Record evidence states and create a revisit queue

### Checkpoint: Retrieval

- [ ] One note can complete the full write, review, answer, and revisit loop
- [ ] Evaluation language distinguishes uncertainty from error

### Phase 4: Connections

- [ ] Task 12: Propose concepts and relationships with source evidence
- [ ] Task 13: Add learner approval for concept and edge changes
- [ ] Task 14: Render a small understanding map across notes

### Checkpoint: Connections

- [ ] Every graph node and edge has provenance
- [ ] The learner can reject, edit, and remove proposed organization

### Phase 5: Learning Frontier

- [ ] Task 15: Propose a few next questions from demonstrated gaps
- [ ] Task 16: Add topic audits and longitudinal progress views

### Checkpoint: MVP Complete

- [ ] Product-spec success criteria are updated from founder validation
- [ ] Critical flows pass end-to-end tests
- [ ] Privacy, security, backup, and distribution reviews are complete

## Risks and Mitigations

| Risk                                           | Impact | Mitigation                                                                               |
| ---------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| AI creates a false sense of mastery            | High   | Require learner explanations and retrieval evidence before marking understanding         |
| Review becomes an answer dump                  | High   | Enforce a structured contract, bounded output, and evaluation fixtures                   |
| Knowledge graph becomes decorative             | Medium | Delay it until multi-note evidence exists and test whether it improves next-step choices |
| Local data loss                                | High   | Version migrations, transactional writes, backups, export, and interruption tests        |
| Electron boundary exposes desktop capabilities | High   | Sandboxed renderer, context isolation, narrow preload methods, sender validation         |
| Scope expands into a general note app          | Medium | Preserve the Not Doing list and ship vertical learning loops                             |

## Open Questions

- Resolve the product-spec questions before the affected phase begins.
- Decide distribution channel and signing approach before external alpha testing.
- Define a small qualitative evaluation set before choosing the first model.
