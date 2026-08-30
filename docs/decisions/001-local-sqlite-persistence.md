# 001: Use Main-Process SQLite for Learning Evidence

Status: Accepted

## Context

ThinkEdge needs resumable local sessions before it can build longitudinal
learning features. The data includes learner-authored answers and provisional
model evaluations. Future knowledge-graph claims must remain attributable to the
exact evidence that produced them.

Electron 44 includes Node's built-in `node:sqlite` module. The application is
single-user and local-first, and does not yet require synchronization or a graph
query engine.

## Decision

Use `node:sqlite` in the Electron main process with versioned SQL migrations.
Store sessions, ordered questions, immutable attempts, append-only evaluations,
and exact evaluation evidence in normalized relational tables with stable UUIDs
and foreign keys.

Expose task-specific typed IPC operations through the existing preload bridge.
Do not expose SQLite, filesystem paths, or generic persistence primitives to the
renderer. Defer concept and edge tables until longitudinal evidence can justify
their semantics.

## Consequences

- The application adds no production dependency or native package lifecycle
  script.
- Local data works offline and remains inside Electron's application-data folder.
- Transactions, constraints, and WAL provide a small, robust persistence core.
- Future graph projections can reference original attempt and evaluation IDs.
- Cloud sync will require a later replication design rather than replacing the
  evidence model.
- Export and automatic backup remain separate follow-up work.

## Alternatives Considered

- JSON files: simpler initially, but weak for atomic multi-record updates,
  migrations, querying history, and referential provenance.
- Renderer storage: violates the privileged-process boundary and makes durable
  transactional records harder to enforce.
- Graph database: premature operational complexity before graph semantics or user
  value have been validated.
- Cloud database: conflicts with local-first operation and introduces accounts,
  privacy, availability, and cost before they are needed.
