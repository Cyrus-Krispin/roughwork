# Roughwork Roadmap

This roadmap orders learning-risk before breadth. Each phase should be reviewed before starting the next.

## Phase 0: Baseline

Outcome: a maintainable, packageable Mac desktop shell with no product functionality.

- Electron Forge, TypeScript, and React foundation
- Secure renderer defaults
- Linting, formatting, type checking, and smoke tests
- Product specification, architecture record, and task plan

## Phase 1: Capture

Outcome: the learner can create, edit, reopen, and export one durable local note.

- Plain-text editor first
- Explicit save state and autosave recovery
- SQLite persistence with migrations and backups
- Markdown import and export

Decision gate: confirm that writing feels immediate and that local persistence is trustworthy before introducing AI.

## Phase 2: Review

Outcome: the learner can request a bounded review that critiques without rewriting.

- Provider credential storage
- Structured review contract and validation
- Passage-level clarity and misconception feedback
- Review history attached to the note
- Offline and provider-error behavior

Decision gate: compare review output against the product principle of questions before answers.

## Phase 3: Retrieval

Outcome: Roughwork tests understanding rather than merely describing the note.

- Three to five generated questions per requested review
- Learner answer capture without immediate answer reveal
- Evidence-based evaluation
- Revisit queue for weak concepts

Decision gate: measure whether questions reveal gaps the learner did not notice.

## Phase 4: Connections

Outcome: approved concepts from multiple notes form a useful understanding map.

- Concept and relationship proposals
- Learner approval workflow
- Small, navigable graph view
- Evidence states such as mentioned, explained, retrieved, and applied

Decision gate: verify that the graph improves next-step decisions rather than becoming decorative organization.

## Phase 5: Learning Frontier

Outcome: Roughwork recommends a few next questions at the edge of demonstrated understanding.

- Gap detection with explicit uncertainty
- Learner-controlled scope boundaries
- Topic audits and longitudinal progress
- Optional general questioning mode

## Deferred Until Validation

- Accounts and synchronization
- Collaboration
- Mobile applications
- Multiple model providers
- Audio transcription
- Browser extensions and automatic source capture
- Public sharing and publishing
- Marketplace or plugin architecture
