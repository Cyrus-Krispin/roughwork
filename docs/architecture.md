# Roughwork Architecture

Status: Planned architecture; only the baseline shell is implemented initially.

## Decision Summary

Roughwork starts as a local-first Electron desktop application with a React and TypeScript interface. Electron's main process owns privileged operations. The renderer remains a sandboxed web environment and communicates through a narrow preload bridge.

```text
React renderer
  note workspace
  review surface
  questions
  understanding map
        |
        | typed, task-specific commands
        v
Preload bridge
        |
        v
Electron main process
  local persistence
  model requests
  import/export
  secure settings
```

## Current Baseline

The baseline proves only these boundaries:

- Electron controls the application lifecycle and desktop window.
- React owns the renderer UI.
- TypeScript checks both environments.
- Electron Forge packages the application.

No inter-process API is exposed until a product slice needs one.

## Planned Process Responsibilities

### Main process

- application lifecycle and native window management;
- local database ownership and migrations;
- filesystem import and export;
- secure storage of provider credentials;
- outbound model requests;
- validation of every renderer request.

### Preload bridge

- expose only named, typed operations required by the renderer;
- hide raw Electron IPC, filesystem, database, and shell capabilities;
- contain no product or persistence logic.

### Renderer

- capture learner input;
- display note, review, question, and graph states;
- maintain temporary presentation state;
- never access secrets, the filesystem, or a database directly.

## Planned Data Model

The likely SQLite entities are:

- `notes`: learner-authored documents and timestamps;
- `concepts`: normalized concepts proposed or approved by the learner;
- `note_concepts`: evidence connecting notes to concepts;
- `concept_edges`: approved relationships between concepts;
- `reviews`: immutable records of requested AI reviews;
- `questions`: questions generated from a review;
- `attempts`: learner answers and evaluation evidence.

This is a hypothesis, not an approved schema. The first persistence slice should validate it against the note workflow before migrations are committed.

## Planned Review Contract

Model responses should be structured and validated before storage or display. A review may propose:

- unclear passages;
- possible misconceptions;
- concepts supported by quoted evidence;
- questions that test understanding;
- possible relationships to existing concepts;
- a small number of next learning questions.

The model cannot directly modify learner text or approve concepts and links.

## Security Defaults

- `contextIsolation` remains enabled.
- Renderer sandboxing remains enabled.
- Node integration remains disabled in the renderer.
- Only packaged local content is executed.
- Navigation and new-window behavior are denied unless explicitly allowed.
- Provider credentials never cross into the renderer.
- User content is sent externally only during an explicit review action.

## Dependency Policy

Add dependencies only when a planned vertical slice requires them. Expected candidates include a rich-text editor, SQLite access, schema validation, and a graph renderer, but none belongs in the baseline merely because it may be useful later.

## Architecture References

- Electron process model: <https://www.electronjs.org/docs/latest/tutorial/process-model>
- Electron security guidance: <https://www.electronjs.org/docs/latest/tutorial/security>
- Electron Forge: <https://www.electronforge.io/>
- React `createRoot`: <https://react.dev/reference/react-dom/client/createRoot>
