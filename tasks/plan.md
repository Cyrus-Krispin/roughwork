# Implementation Plan: ThinkEdge AI Learning Loop

## Overview

Build the smallest honest version of ThinkEdge: a learner enters a topic, an AI provider asks one diagnostic question, the learner answers in their own words, and AI returns validated evidence-based feedback plus exactly one adaptive next question. The session remains in memory for this first slice; persistence, sources, retention, and the knowledge graph follow only after the AI loop is useful.

There will be no scripted learner feedback in the product. Fixtures are used only in automated tests to verify the AI contract and failure handling.

## Product Question

Can ThinkEdge use AI to expose a specific gap in a learner's answer and choose a useful next question without becoming an explanatory chatbot?

```text
Learner names topic
  -> AI creates diagnostic question
      -> learner submits attempt
          -> AI evaluates evidence and uncertainty
              -> application validates the result
                  -> AI-proposed next question is shown
```

## Architecture Decisions

- Integrate one provider directly for the first slice; do not introduce LangChain or LangGraph yet.
- Use `deepseek-v4-flash` for the initial iteration; optimize prompts and evaluate quality before considering a more expensive model.
- Load the first development credential from an ignored local `.env` file and keep provider calls in the Electron main process. The renderer receives only typed learning results.
- Use a narrow provider interface so a second provider can be added later without redesigning the session domain.
- Require structured output and runtime validation for every model response.
- Preserve the learner's answer exactly and require every positive or negative finding to quote an exact excerpt from it.
- Let the model propose a next move; deterministic code enforces one-question pacing, allowed transitions, and help limits.
- Keep the first session in memory. SQLite becomes the next vertical slice after the AI interaction passes its decision gate.

## First Model Contract

The first slice needs two model operations:

1. `createDiagnosticQuestion(topic)`
2. `evaluateAttemptAndContinue(context)`

The second operation returns:

```ts
type EvaluationResult = {
  status: 'demonstrated' | 'partial' | 'misconception' | 'uncertain';
  evidence: Array<{
    excerpt: string;
    finding: string;
  }>;
  unresolvedGap: string;
  uncertainty: 'low' | 'medium' | 'high';
  proposedNextMove: 'probe' | 'advance' | 'prerequisite' | 'hint';
  nextQuestion: string;
  nextQuestionRationale: string;
};
```

Application validation must reject a response when:

- an evidence excerpt is not an exact substring of the learner's answer;
- a required field is missing or outside its allowed values;
- more than one next question is returned;
- the response presents a full answer or unrequested lecture;
- the result cannot be associated with the current attempt.

## First User Flow

```text
Local `.env` setup
  -> New session
      -> Enter topic
          -> AI question
              -> Write and submit answer
                  -> AI feedback
                      -> Continue to next question
                          -> End session
```

The first version needs loading, retry, invalid-response, missing-credential, network-failure, and explicit end-session states.

## Task List

### Phase 1: Define and test the AI boundary

- [x] Task 1: Define session states, provider interface, and validated model schemas
- [ ] Task 2: Add contract fixtures for demonstrated, partial, misconception, uncertain, malformed, and answer-leaking outputs

### Checkpoint: AI contract

- [x] Invalid output cannot enter session state
- [x] Evidence must point to exact learner text
- [x] Exactly one next move and one next question are accepted
- [x] Test fixtures do not require a network call

### Phase 2: Connect one provider securely

- [x] Task 3: Load the ignored local provider credential in the Electron main process
- [x] Task 4: Implement diagnostic-question and evaluation calls through the provider interface
- [x] Task 5: Expose narrow typed preload operations and validate IPC senders and payloads

### Checkpoint: Provider integration

- [x] The API key never enters renderer state, logs, or source control
- [x] A real topic produces one diagnostic question
- [x] A real answer produces a schema-valid evaluation and next question
- [x] Provider, network, timeout, and validation errors leave the answer recoverable

### Phase 3: Build the complete learning interaction

- [x] Task 6: Implement the topic, question, answer, feedback, next-question, and end-session UI
- [ ] Task 7: Add loading, retry, cancel, and failure recovery without duplicate model requests
- [x] Task 8: Make evidence, uncertainty, unresolved gap, and next-question rationale clear and accessible

### Checkpoint: First AI product slice

- [ ] A learner can complete at least three genuine AI-generated turns
- [ ] ThinkEdge never displays feedback before an attempt
- [ ] Feedback cites the learner's own words
- [ ] Strong, partial, mistaken, and ambiguous test answers produce meaningfully different next moves
- [ ] The system stays concise and asks one question at a time
- [ ] Ending the session never requires waiting for another model call
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, and `npm run package` pass

## Initial Evaluation Set

Before founder review, create a small test set for one topic such as gradient-based neural-network training:

- 3 substantially correct answers;
- 3 partial answers;
- 3 answers containing common misconceptions;
- 3 ambiguous or poorly worded answers.

For each case, record the acceptable status, required concept evidence, forbidden claims, and acceptable next-move categories. The evaluation set measures behavior across prompt or model changes; it is not learner-facing scripted feedback.

## Not Doing in This Slice

- SQLite or session persistence
- LangChain, LangGraph, or autonomous agents
- Multiple providers or automatic provider routing
- Uploaded sources, retrieval, embeddings, or a vector database
- Hint ladders beyond the single proposed next move
- Voice, notes, retention scheduling, or a knowledge graph
- Accounts, sync, analytics, billing, or production distribution
- Mastery percentages or unsupported claims of knowledge

## Next Vertical Slices

1. **Local persistence:** SQLite migrations, immutable attempts, resumable sessions, backup, and export.
2. **Packaged credential setup:** move from development `.env` loading to a signed app settings flow backed by macOS Keychain.
3. **Adaptive help:** rephrase, smaller question, hint, partial example, direct explanation, and learner challenge.
4. **Retention:** revisit queue and delayed retrieval based on evidence.
5. **Grounded sources:** pasted text and documents with passage provenance.
6. **Evidence graph:** concepts, prerequisites, misconceptions, and relationships backed by attempts.
7. **Optional orchestration:** LangGraph only if long-running, resumable workflows outgrow the application state machine.
8. **Optional cloud:** accounts, encrypted sync, managed provider usage, and PostgreSQL after local product validation.

## Risks and Mitigations

| Risk                                          | Impact | Mitigation                                                                                                |
| --------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| Model confidently misjudges an answer         | High   | Explicit uncertainty, exact evidence excerpts, challenge workflow next, and evaluation fixtures           |
| Model becomes a lecturer                      | High   | Strict output schema, concise field limits, forbidden-answer tests, and deterministic one-question pacing |
| Provider output changes unexpectedly          | High   | Runtime validation, versioned prompts, captured test fixtures, and fail-closed behavior                   |
| Key leaks into renderer or logs               | High   | Main-process-only provider service, secure storage, redaction, and narrow IPC                             |
| Retries create duplicate turns or charges     | Medium | Request IDs, pending-state guards, idempotent UI behavior, and explicit retry                             |
| Provider choice becomes architectural lock-in | Medium | Small internal provider interface without a full orchestration framework                                  |
| Infrastructure hides weak pedagogy            | High   | Founder evaluation set and a decision gate before persistence or broader integrations                     |

## Exit Decision

After the first real AI session, choose:

1. **Continue to persistence** if feedback reliably identifies evidence and useful gaps.
2. **Revise prompts/contracts** if the interaction is promising but inconsistent.
3. **Reconsider the product mechanism** if AI cannot evaluate the selected domain without frequent confident errors or lectures.
