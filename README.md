# Roughwork

Roughwork is an early-stage, local-first learning workspace. Its goal is to help learners turn incomplete ideas into durable understanding without letting AI do the thinking for them.

The repository currently contains only the desktop foundation. Product features are deliberately unimplemented.

## Requirements

- macOS
- Node.js 24 or newer
- npm 11 or newer

## Development

```bash
npm install
npm start
```

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
npm run package
```

Create a local distributable after packaging succeeds:

```bash
npm run make
```

Unsigned development builds are intended only for local use. Code signing and notarization will be planned before external distribution.

## Documentation

- [Product specification](docs/product-spec.md)
- [Architecture](docs/architecture.md)
- [Roadmap](docs/roadmap.md)
- [Implementation plan](tasks/plan.md)
- [Task checklist](tasks/todo.md)

## Current boundaries

- No AI integration
- No note editor or persistence
- No knowledge graph
- No accounts, cloud backend, or synchronization
- No secrets or environment files committed
