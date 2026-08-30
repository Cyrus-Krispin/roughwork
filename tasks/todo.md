# ThinkEdge Task Checklist

Tasks are dependency-ordered. A task is complete only after its acceptance criteria and verification checks pass.

## Task 0: Establish the baseline

**Description:** Create the packageable Electron Forge, TypeScript, and React shell plus repository hygiene and scripts. Do not add product behavior.

**Acceptance criteria:**

- [x] A minimal React root renders inside a sandboxed Electron window.
- [x] No database, AI, session, graph, account, or synchronization code exists.
- [x] Standard development and packaging scripts are documented and executable.

**Verification:**

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run package`
- [x] Manual launch using `npm start`

**Dependencies:** None

**Files likely touched:** `package.json`, Forge/Webpack/TypeScript configuration, `src/*`, `.gitignore`, `README.md`

**Estimated scope:** Medium

## Task 1: Establish test harnesses

**Description:** Add deterministic domain-test and Electron smoke-test foundations before behavioral implementation.

**Acceptance criteria:**

- [ ] Unit tests can run without launching the desktop UI.
- [ ] A smoke test can verify the packaged application reaches its minimal renderer.
- [ ] Test commands fail when their assertions are deliberately broken.

**Verification:**

- [ ] `npm test`
- [ ] `npm run test:e2e`

**Dependencies:** Task 0

**Files likely touched:** `package.json`, test configuration, `tests/*`, minimal test-only application hook

**Estimated scope:** Medium

## Task 2: Record baseline conventions

**Description:** Finalize timeless development, security, and packaging documentation after the actual baseline has been verified.

**Acceptance criteria:**

- [ ] Commands and directory descriptions match the repository.
- [ ] Electron process boundaries and security defaults are explicit.
- [ ] Local development and unsigned packaging limitations are documented.

**Verification:**

- [ ] Follow the README from a clean checkout.
- [ ] Compare documentation commands with `package.json` scripts.

**Dependencies:** Tasks 0-1

**Files likely touched:** `README.md`, `docs/architecture.md`, `docs/development.md`

**Estimated scope:** Small

## Future Tasks

Tasks 3-18 are intentionally summarized in `tasks/plan.md`. Expand only the next approved vertical slice into task-sized work after the preceding checkpoint is reviewed.
