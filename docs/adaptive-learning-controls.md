# Adaptive Learning Controls

Status: Proposed for founder review

## Objective

Give learners two explicit ways to steer a Strata AI session without turning it
into an open-ended chat:

1. request progressively stronger help on the current question; and
2. challenge an evaluation that appears mistaken or incomplete.

Success means learners can recover when stuck or misjudged while every model
action remains bounded, attributable, append-only, and available after restart.

## Assumptions

- Help follows a deterministic ladder: `rephrase`, `smaller_question`, `hint`,
  `partial_example`, then `direct_explanation`.
- The learner may repeat the current level or move one level forward. The direct
  explanation is shown only after an explicit learner request.
- A help response supports the current question; it does not submit an answer,
  create an evaluation, or advance the session.
- A challenge includes a short learner rationale and asks the provider to
  reconsider the same immutable answer.
- A successful challenge appends evaluation revision 2 or later. It never edits
  or deletes an earlier judgment.
- The latest evaluation becomes the active display, while review history exposes
  every revision and its learner rationale.

## Tech Stack

- Electron 44 main process for privileged operations and SQLite ownership
- React 19 and Material UI 9 for the renderer
- TypeScript 5.9 and Zod 4 for typed runtime boundaries
- DeepSeek through the existing provider adapter
- Electron's built-in `node:sqlite`; no new production dependency

## Commands

```bash
npm start
npm run lint
npm run typecheck
npm test
npm run format:check
npm run package
```

## Project Structure

- `src/learning/`: shared contracts, IPC schemas, history types, and reducer
- `src/main/ai/`: bounded provider prompts and parsed model responses
- `src/main/persistence/`: migrations and append-only local records
- `src/main/learningService.ts`: authoritative transition rules
- `src/components/`: learner controls, help responses, and revision history
- `tests/`: contract, reducer, service, repository, and IPC verification
- `docs/`: product and architecture decisions

## Behavioral Contract

### Graduated help

The renderer sends a client-generated request ID, session ID, current question
ID, and requested help level. The main process verifies that the session is
active, the question is current, and the requested level is permitted by the
persisted ladder state.

The provider returns one structured response:

```ts
type HelpResponse = {
  level:
    | 'rephrase'
    | 'smaller_question'
    | 'hint'
    | 'partial_example'
    | 'direct_explanation';
  content: string;
};
```

`rephrase` and `smaller_question` must contain exactly one concise question.
`hint` must point toward one idea without giving the answer. `partial_example`
may demonstrate one analogous step but not solve the learner's question.
`direct_explanation` may answer directly only because the learner selected it.

Each successful response is appended with its request ID, level, content, and
timestamp. Provider or persistence failure leaves the current answer and earlier
help unchanged. Retrying an acknowledged request ID returns the stored response;
a new request ID may repeat the current level or advance exactly one level.

### Evaluation challenge

The renderer sends a client-generated request ID, session ID, answered question
ID, current evaluation ID, and a learner-written rationale. The main process
verifies that the evaluation belongs to the session and is currently the latest
revision for that attempt.

The provider re-evaluates the immutable question and answer with the original
evaluation plus the learner's rationale. The response uses the existing strict
evaluation contract, including exact answer excerpts and one next question.

The database appends the new evaluation revision and evidence in one transaction.
If the child question has not been answered, its prompt and intent are updated to
the new revision's proposal. The prior proposal remains inspectable on the prior
evaluation revision. No attempted question is ever updated. A stale challenge
against an older revision is rejected safely, and retrying an acknowledged
request ID returns its stored result.

## Persistence Model

Migration 2 adds:

- `help_requests`: ID, unique client request ID, session/question ownership,
  monotonic ordinal, requested level, response content, and creation time;
- `evaluation_challenges`: ID, unique client request ID, challenged evaluation,
  resulting evaluation, learner rationale, and creation time.

Existing `evaluations.revision` stores appended judgments. A uniqueness rule on
attempt and revision prevents competing revision numbers. Existing sessions are
not rewritten; new tables begin empty.

## Code Style

Keep domain operations named, typed, and validated before use:

```ts
const request = parseHelpRequest(value);
return learningResult(() => service.requestHelp(request));
```

Use strict Zod objects, discriminated string unions, immutable history records,
generic public errors, and repository transactions for multi-row writes. UI copy
should be brief and learner-facing; model and database details stay internal.

## Testing Strategy

- Contract tests reject leaked answers, wrong help levels, multiple questions,
  malformed challenge evaluations, and fabricated evidence.
- Reducer tests cover loading, retry, ladder progression, latest-revision display,
  and preservation of learner input.
- Service tests cover authorization by persisted state, stale challenges,
  idempotent retries, and ended-session rejection.
- Repository tests migrate an existing version-1 database, verify append-only
  revisions, and reload help/challenge history after reopening.
- IPC tests reject unknown fields, invalid UUIDs, oversized rationale, and
  untrusted senders.
- Manual verification covers a full help ladder, a successful challenge, an
  offline retry, and restart recovery.

## Boundaries

### Always

- Validate every renderer, provider, and persistence boundary.
- Preserve learner answers, prior evaluations, and prior help responses.
- Keep provider calls in the main process and one explicit action at a time.
- Make direct explanation and evaluation revision provenance visible.
- Run the full repository verification suite before completion.

### Ask first

- Apply the version-2 SQLite schema migration to existing local databases and
  permit a challenge to update its still-unanswered child question.
- Add a dependency, provider, telemetry, cloud service, or automatic escalation.
- Allow challenges to change anything beyond the challenged attempt's active
  evaluation and next-question branch.

### Never

- Overwrite a learner answer or earlier evaluation.
- Skip help levels silently or reveal a direct answer by default.
- Turn help or challenge controls into unrestricted chat.
- Expose credentials, raw IPC, SQL, local paths, or internal provider errors.

## Success Criteria

- A learner can use all five help levels in order on one current question.
- No level before direct explanation provides the complete answer.
- Help history survives restart and does not advance the session.
- A learner can challenge the latest evaluation with a rationale.
- A challenge appends a validated revision and preserves the original judgment.
- A challenge updates only the still-unanswered next question; its prior proposal
  remains visible through the original evaluation revision.
- Stale, duplicate, ended-session, and provider-failure paths are recoverable.
- The renderer shows the latest judgment and makes revision provenance available.
- Lint, typecheck, tests, formatting, packaging, and the manual flow pass.

## Open Question Requiring Approval

- Approve migration 2 adding `help_requests` and `evaluation_challenges`, use of
  `evaluations.revision` for append-only challenges, and transactional updates to
  the still-unanswered next question.
