# ThinkEdge

ThinkEdge is an early-stage, local-first desktop learning partner that finds the edge of a learner's understanding through adaptive Socratic questions. It asks one question at a time, evaluates the learner's own answer, and offers only the smallest useful amount of help.

The current branch contains the first provider-backed learning loop: topic entry,
an AI diagnostic question, a learner answer, evidence-based AI feedback, and one
adaptive next question. Sessions are intentionally in memory for this slice.

## Requirements

- macOS
- Node.js 24 or newer
- npm 11 or newer

## Development

Create your local environment file and add your DeepSeek API key:

```bash
cp .env.example .env
```

```dotenv
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-v4-flash
```

`.env` and `.env.*` are ignored by Git. Only `.env.example`, which contains no
secret, is committed. Restart ThinkEdge after changing the key.

Then install and start the application:

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

- [Product direction](docs/product-direction.md)
- [Product specification](docs/product-spec.md)
- [Architecture](docs/architecture.md)
- [Roadmap](docs/roadmap.md)
- [Implementation plan](tasks/plan.md)
- [Task checklist](tasks/todo.md)

## Current boundaries

- DeepSeek V4 Flash is the only provider and runs in non-thinking mode for the
  first fast, cost-conscious iteration
- Sessions are in memory and disappear when the app restarts
- No persistence or knowledge graph
- No accounts, cloud backend, or synchronization
- Local secrets remain ignored and are never exposed to the renderer
