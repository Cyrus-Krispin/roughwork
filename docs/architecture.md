# ThinkEdge Architecture

Status: Phase 1 implemented; persistence and longitudinal learning remain planned.

## Decision Summary

ThinkEdge starts as a local-first Electron desktop application with a React and TypeScript interface. Electron's main process owns privileged operations and outbound model requests. The renderer remains sandboxed and communicates through a narrow preload bridge.

The first AI integration should call a model provider directly and validate structured output. An orchestration framework and graph database are unnecessary until demonstrated complexity requires them.

```text
React renderer
  topic and session setup
  one active question
  answer and feedback
  session evidence
        |
        | typed, task-specific commands
        v
Preload bridge
        |
        v
Electron main process
  session state machine
  local persistence
  model requests and validation
  secure settings
```

## Current Phase 1 Architecture

The first learning slice now implements these boundaries:

- Electron controls the application lifecycle and desktop window.
- React owns the renderer UI.
- Material UI provides the renderer's component primitives, responsive layout,
  and centralized visual theme without an application stylesheet pipeline.
- TypeScript checks both environments.
- Electron Forge packages the application.
- The main process calls DeepSeek V4 Flash and validates structured output.
- A narrow preload API exposes provider status, question generation, and answer
  evaluation without exposing raw IPC or the provider key.
- The renderer owns an in-memory learning state machine and preserves submitted
  answers across recoverable provider failures.

## Planned Process Responsibilities

### Main process

- application lifecycle and native window management;
- local database ownership and migrations;
- deterministic session transition rules;
- secure storage of provider credentials;
- outbound model requests and runtime response validation;
- validation of every renderer request.

### Preload bridge

- expose only named, typed operations required by the renderer;
- hide raw Electron IPC, filesystem, database, and shell capabilities;
- contain no product, model, or persistence logic.

### Renderer

- start and resume learning sessions;
- display exactly one active question;
- capture learner answers and help requests;
- show concise feedback, uncertainty, evidence, and session summaries;
- never access secrets, the filesystem, a database, or a model provider directly.

## Planned Data Model

The likely SQLite entities are:

- `topics`: learner-named subject scopes;
- `sessions`: bounded learning interactions and their status;
- `sources`: optional learner-supplied material and provenance;
- `questions`: prompts, intent, difficulty, and parent relationship;
- `attempts`: immutable learner answers and timestamps;
- `evaluations`: validated judgments, reasons, uncertainty, and next moves;
- `concepts`: normalized concepts inferred from accumulated evidence;
- `concept_evidence`: links between concepts and exact attempts or evaluations;
- `concept_edges`: proposed relationships with provenance and learner status.

This is a hypothesis, not an approved schema. Phase 1 should begin with only the fields required by the deterministic session loop. Concept and edge tables wait until longitudinal evidence exists.

## Planned Model Contract

Each model operation should have one narrow purpose and return structured, validated data. The first combined turn may propose:

- an evaluation status and concise reason grounded in the learner's answer;
- concept evidence and an explicit uncertainty level;
- exactly one next move;
- at most one next question or one graduated-help response.

The model cannot alter the learner's answer, mark a topic mastered, or write graph relationships without provenance. Deterministic application rules enforce the help ladder and session state even when model output disagrees.

## Security Defaults

- `contextIsolation` remains enabled.
- Renderer sandboxing remains enabled.
- Node integration remains disabled in the renderer.
- Only packaged local content is executed.
- Navigation and new-window behavior are denied unless explicitly allowed.
- Provider credentials never cross into the renderer.
- Learner content is sent externally only during an explicit learner-started model action.

## Dependency Policy

Add dependencies only when a planned vertical slice requires them. Expected candidates include SQLite access and runtime schema validation. Voice transcription and graph rendering are deferred. The baseline does not need an AI orchestration library.

## Architecture References

- Electron process model: <https://www.electronjs.org/docs/latest/tutorial/process-model>
- Electron security guidance: <https://www.electronjs.org/docs/latest/tutorial/security>
- Electron Forge: <https://www.electronforge.io/>
- React `createRoot`: <https://react.dev/reference/react-dom/client/createRoot>
