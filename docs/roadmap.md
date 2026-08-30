# ThinkEdge Roadmap

This roadmap orders learning risk before breadth. Each phase should be reviewed before starting the next.

## Phase 0: Baseline

Outcome: a maintainable, packageable Mac desktop shell with no product functionality.

- Electron Forge, TypeScript, and React foundation
- Secure renderer defaults
- Linting, formatting, type checking, and smoke tests
- Product specification, architecture record, and task plan

## Phase 1: Deterministic Session Shell

Outcome: the learner can start, complete, reopen, and delete a local mock learning session without an AI provider.

- Topic entry and one-question-at-a-time interface
- Text answer capture and immutable attempt history
- Deterministic mock evaluations and next moves
- SQLite persistence with migrations and backup/export strategy

Decision gate: confirm that the question-answer-feedback rhythm feels focused and that persistence is trustworthy.

## Phase 2: Constrained AI Evaluation

Outcome: real model output can evaluate an answer without becoming a lecturer.

- Provider credential storage in the main process
- Structured evaluation and next-question contract
- Runtime validation and explicit uncertainty
- Evaluation fixtures across strong, partial, mistaken, and ambiguous answers
- Provider failure, retry, and offline behavior

Decision gate: verify that evaluations cite the learner's answer, remain brief, and expose useful gaps reliably enough for a small founder test set.

## Phase 3: Adaptive Questioning

Outcome: ThinkEdge keeps a learner at the edge of understanding across a complete session.

- Probe, advance, prerequisite, and hint transitions
- Graduated help ladder
- Learner challenge and correction of evaluations
- Session-ending evidence and unresolved-gap summary

Decision gate: compare the adaptive loop with an ordinary explanatory chat and test whether it reveals more specific gaps without causing unproductive frustration.

## Phase 4: Retention and Sources

Outcome: learners can return at useful intervals and optionally ground a session in material they chose.

- Revisit queue based on prior answer evidence
- Lightweight retrieval scheduling
- Optional pasted text or document source
- Source-linked questions, corrections, and uncertainty

Decision gate: test whether revisits improve delayed recall and whether sources increase factual trust without turning the product into a reading or note-management app.

## Phase 5: Evidence Graph and Learning Frontier

Outcome: longitudinal attempts form a useful model of demonstrated knowledge and reachable next topics.

- Concepts, prerequisites, misconceptions, and evidence provenance
- Learner-visible topic audit and history
- Suggested next questions at the learning frontier
- Small graph view only if it improves a real learning decision

Decision gate: retain the graph only if learners use it to choose what to revisit or learn next.

## Deferred Until Validation

- Voice answers and transcription
- Accounts and synchronization
- Collaboration or public sharing
- Mobile applications
- Multiple model providers
- Browser extensions and automatic source capture
- Rich note editing or knowledge-base features
- Marketplace or plugin architecture
