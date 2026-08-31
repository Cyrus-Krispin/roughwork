# Local Session Persistence

Status: Accepted for implementation

## Objective

Persist Strata AI learning sessions locally so a learner can close the app,
resume an active session, inspect prior evidence, and delete a session without an
account or network connection. The stored evidence must also provide stable,
auditable provenance for a future learner knowledge graph.

## Scope

This slice includes:

- a SQLite database in Electron's per-user application-data directory;
- versioned, transactional schema migrations;
- durable sessions, questions, immutable attempts, evaluations, and evidence;
- start, submit, resume, end, list, inspect, and delete operations;
- a recent-session interface with evidence-based progress counts;
- interruption-safe writes and explicit deletion confirmation.

This slice does not include cloud sync, accounts, graph tables or visualization,
mastery scores, export, automatic backups, sources, or retention scheduling.

## Assumptions

- Strata AI is a single-user, local-first desktop application.
- A session has one current question and advances one turn at a time.
- Learner answers and accepted evaluations are historical evidence and are never
  updated in place.
- SQLite is owned by the Electron main process. The renderer never receives a
  path, SQL statement, database handle, or unrestricted IPC capability.
- A future graph will reference the stable IDs of attempts, evaluations, and
  evidence rows. Concept inference remains a later, independently migrated
  projection rather than a concern of this schema.

## Data Model

- `learning_sessions`: topic, lifecycle status, current question, and timestamps.
- `questions`: ordered prompts and their diagnostic intent or rationale.
- `attempts`: immutable learner answers, one acknowledged attempt per question.
- `evaluations`: append-only validated judgments and next-move metadata.
- `evaluation_evidence`: ordered exact excerpts and findings for an evaluation.

Every domain record uses an application-generated UUID. Foreign keys are
enforced. Deleting a session cascades only through its owned records.

The schema deliberately does not normalize learner-entered topics or create
concept nodes. A later evidence graph can add `concepts`, `concept_evidence`, and
`concept_edges` tables whose provenance foreign keys point to these records.

## Main-Process Operations

All operations return the existing `LearningResult<T>` envelope with generic,
learner-safe errors.

- `startSession(topic)` generates the diagnostic question, then atomically saves
  the session and question.
- `submitAttempt(sessionId, questionId, answer)` validates that the session is
  active and the question is current, evaluates the answer, then atomically saves
  the attempt, evaluation, evidence, and proposed next question. Repeating the
  same acknowledged submission returns the saved result rather than inserting a
  duplicate.
- `getSession(sessionId)` returns the session and ordered turn history.
- `listSessions(limit)` returns newest-first summaries with evaluation counts.
- `endSession(sessionId)` marks an active session ended without a model call.
- `deleteSession(sessionId)` permanently deletes one resolved session and its
  owned evidence.

## Failure and Recovery

- Provider failure before a transaction leaves no partial question, attempt, or
  evaluation records.
- Database mutations use explicit transactions. A failed transaction rolls back.
- SQLite uses WAL journaling, foreign keys, a busy timeout, and normal synchronous
  durability for responsive local desktop use.
- Migrations are applied in order in one transaction per migration and recorded
  in `schema_migrations`.
- The database opens before learning IPC handlers are registered and closes on
  application shutdown.

## Trust Boundaries

- IPC payloads are strict runtime-validated objects with bounded strings and UUIDs.
- The main process verifies the sender and the persisted current-session state.
- SQL statements use bound parameters; user and model text is never interpolated.
- Model output passes the existing contract validation before persistence.
- Database failures and internal paths never cross into the renderer.
- Session deletion is initiated by a named API operation and confirmed in the UI.

## Acceptance Criteria

- Starting a session creates one durable active session and one current question.
- An acknowledged answer, evaluation, exact evidence, and next question survive a
  full Electron restart.
- Reopening an active session resumes at its saved current question.
- Submitted answers cannot be edited or overwritten by later operations.
- Retrying an acknowledged submission cannot create duplicate attempts.
- Ending a session needs no provider call and leaves its history inspectable.
- Recent sessions show topic, status, updated time, turn count, and evaluation
  status counts without claiming mastery.
- A learner can permanently delete exactly one session after confirmation.
- Migration, repository, IPC validation, reducer, and runtime Electron checks pass.

## Follow-up

The next persistence increment should add explicit local export and recoverable
backup/restore. The evidence graph should begin only after enough persisted
attempts exist to evaluate whether concept and relationship projections help a
learner choose what to revisit next.
