# Roughwork Product Specification

Status: Draft for founder review

## Objective

Roughwork is a local-first desktop workspace for self-directed learners who want to turn incomplete ideas into durable understanding. The first user is the founder: someone learning technical and mathematical subjects from podcasts, articles, videos, and independent exploration.

The product should help the learner:

- capture ideas without organizing them first;
- request a review only after they choose to stop writing;
- discover unclear reasoning, misconceptions, and missing connections;
- retrieve knowledge through questions rather than receive an immediate explanation;
- see what they have demonstrated, merely encountered, or not yet explored.

The central product promise is: **Roughwork does not confuse exposure with understanding.**

## Product Principles

1. **Learner control:** AI reviews only after an explicit request.
2. **Questions before answers:** The system protects productive struggle instead of completing the learner's thinking.
3. **Evidence over confidence:** Understanding status is based on explanations and retrieval attempts, not AI-generated percentages.
4. **Proposals over silent changes:** AI may suggest concepts, links, and organization; the learner approves them.
5. **Local first:** Notes remain useful without an account or network connection. Network access is required only for model-backed operations.
6. **Progressive disclosure:** Show the next useful gap rather than dumping an entire curriculum.

## Baseline Scope

This repository setup includes only:

- a macOS-capable Electron application shell;
- a minimal React renderer proving the shell loads;
- TypeScript, linting, formatting, and packaging configuration;
- documentation and an ordered implementation plan.

It intentionally does not include note taking, persistence, AI review, questioning, a knowledge graph, synchronization, authentication, or production distribution.

## Proposed MVP Scope

The first product milestone should validate one learning loop:

1. The learner creates and edits a plain note.
2. The note autosaves locally.
3. The learner explicitly requests a review.
4. Roughwork identifies unclear passages and possible misconceptions without rewriting the note.
5. Roughwork asks three to five questions.
6. The learner answers without seeing a generated explanation first.
7. Roughwork records evidence about demonstrated and missing understanding.
8. Roughwork proposes a small number of next questions or concept links.

## Not Doing in the MVP

- Continuous AI monitoring
- AI-written or AI-rewritten notes
- A general-purpose chatbot
- Cloud accounts or multi-device sync
- Collaborative editing
- A graph database or vector database
- Automatic curriculum completion percentages
- Plugin systems or multiple AI-provider integrations
- Full flashcard or spaced-repetition functionality

## Planned Commands

These commands become authoritative once the baseline scaffold is complete:

```bash
npm start
npm run lint
npm run typecheck
npm test
npm run package
npm run make
```

## Project Structure

```text
src/
  main/       Electron main-process code
  preload/    Narrow bridge between desktop capabilities and the UI
  renderer/   React user interface
docs/         Product and architecture documentation
tasks/        Executable implementation plan and checklist
tests/        Cross-cutting and future end-to-end tests
```

The exact source layout may be introduced incrementally after the generated baseline. Planned directories are not evidence of implemented features.

## Code Style

Use TypeScript with explicit domain names, narrow interfaces, and no speculative abstractions.

```ts
export type UnderstandingEvidence = {
  conceptId: string;
  kind: 'mentioned' | 'explained' | 'retrieved' | 'applied';
  recordedAt: string;
};
```

- Components use `PascalCase`.
- Functions and variables use `camelCase`.
- Files use lowercase kebab-case except React component files, which use `PascalCase.tsx`.
- Prefer named domain types to anonymous objects at process and persistence boundaries.
- Format with Prettier and lint with ESLint.

## Testing Strategy

- Unit tests cover domain rules, parsing, validation, and persistence behavior.
- Component tests cover meaningful learner interactions, not implementation details.
- Integration tests cover the renderer-to-main-process contract.
- End-to-end tests cover the critical note, review, and question flow once it exists.
- AI evaluation fixtures test review behavior separately from ordinary deterministic tests.

No numeric coverage target is set for the baseline. New behavioral code must have tests that fail without the behavior and pass with it.

## Boundaries

### Always

- Keep the Electron renderer sandboxed and context-isolated.
- Validate data crossing process, persistence, and model boundaries.
- Keep notes usable when AI services are unavailable.
- Run linting, type checking, tests, and packaging checks before declaring a task complete.
- Update this specification when product decisions change.

### Ask First

- Add a production dependency.
- Change the local data schema after users could have stored data.
- Add a cloud backend, account system, telemetry, or paid service.
- Send note content anywhere other than the explicitly selected AI provider.
- Change the foundational desktop or UI framework.

### Never

- Commit secrets, API keys, signing certificates, or user notes.
- Give renderer code unrestricted Node.js or filesystem access.
- Execute remote code inside the desktop application.
- Let AI silently rewrite learner-authored content or approve its own graph changes.
- Remove failing tests merely to make verification pass.

## Success Criteria

The baseline is complete when:

- a fresh install can start the desktop shell on macOS;
- a minimal React root renders without product functionality;
- linting and TypeScript checks pass;
- the app can be packaged locally;
- repository documentation clearly separates current and planned capabilities;
- no secrets or product features are included.

The MVP will have separate success criteria after this draft is reviewed.

## Open Questions

- Should learner notes be stored as Tiptap JSON, Markdown, or both?
- Which evidence should be required before a concept is marked as understood?
- How should Roughwork distinguish a missing topic from a deliberate scope boundary?
- Which model provider should power the first review experiment?
- Should question review use only the learner's notes or also trusted external references?
