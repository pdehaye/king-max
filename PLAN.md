# Games Platform Plan

## Goal

Refactor the repo from two game-specific implementations into a generic game framework with thin per-game adapters, while keeping both Nonogram and King Max working throughout the migration.

## Core Direction

- Make the UI as game-agnostic as possible.
- Replace game-specific setup concepts with shared controls such as board size, preset, seed, reset, and new game.
- Keep puzzle rules, generation, solver logic, and game-specific visuals inside each game package.
- Preserve GitHub Pages compatibility and avoid introducing a backend or build system that changes the static-site model.

## Target Layout

- Adopt a mirrored domain structure where each top-level root can host the same kinds of subareas:

```text
generic/
	js/
	stories/
	scripts/
	specific/

games/
	king-max/
		html/
		js/
		stories/
		scripts/
		specific/
	nonogram/
		html/
		js/
		stories/
		scripts/
		specific/
```

- `generic/` holds framework-level implementations and assets that are game-agnostic.
- `games/<game>/` holds game-owned implementations and assets, split by runtime (`js`), docs (`stories`), tooling (`scripts`), and deeper game-only modules (`specific`).
- `games/<game>/html/index.html` is the canonical source for each game route page.
- Root-level route copies are transitional only; once tooling serves `_site` directly, they should be removed.
- The current legacy root folders remain temporary during migration; final structure should not rely on top-level generic shims in `js/`.

## Shared Contract

Each game should expose the same adapter surface so the generic shell can host it without knowing puzzle details.

- Game metadata: id, label, description, icon, route.
- Puzzle setup: board size or preset selection, optional seed, and initialization.
- State operations: create, reset, serialize, deserialize, apply move, and restore.
- Gameplay checks: valid move, solved state, and hint or annotation hooks where needed.
- Rendering hooks: board drawing, status text, and any game-specific overlays.

## Migration Phases

### Phase 1: Define the framework boundary

- Identify which code belongs in the generic shell and which code stays game-specific.
- Lock in the adapter contract before moving too much code.
- Standardize language in the shell so it does not assume realms, regions, or other game-specific vocabulary.

### Phase 2: Extract the generic shell

- Move shared page chrome, registry-driven navigation, controls, stats, win state, and persistence into generic/.
- Make the shell consume a game descriptor or adapter instead of importing puzzle internals directly.
- Standardize difficulty-related UI around board size and preset selection.

### Phase 3: Migrate Nonogram first

- Move Nonogram-specific generation, puzzle logic, visuals, and tactics into games/nonogram/js and games/nonogram/specific.
- Rewire nonogram/index.html to use the generic shell.
- Keep behavior stable and minimize user-facing changes during the move.

### Phase 4: Migrate King Max second

- Move King Max-specific logic, generation, solver, tactics, and visuals into games/king-max/js and games/king-max/specific.
- Rewire king-max/index.html to use the same generic shell.
- Remove realm-specific shell wording and map any remaining puzzle language into the adapter or game-specific UI.

### Phase 5: Consolidate shared helpers

- Move reusable board helpers, annotation rendering, and shared interaction code into generic/.
- Split any common difficulty or scoring concepts out only if they are truly shared.
- Remove duplicate code paths once both games use the new structure.

### Phase 6: Update build and deployment wiring

- Adjust package.json build scripts so the generated site copies generic/ and games/ correctly.
- Keep the hub landing page working at the repo root and both game routes working under GitHub Pages.
- Leave Storybook and story generation alone until the runtime migration is stable.

### Phase 7: Clean up compatibility code

- Remove temporary shims and obsolete entrypoints once both games are fully on the generic shell.
- Delete or retire old folder paths only after validation is green.
- Confirm the final structure is coherent and discoverable for future games.

## Validation Rules

- Verify new game creation, reset, and solve/win behavior after each migration step.
- Verify board size or preset selection works consistently in both games.
- Verify share or URL state still round-trips if the game uses it.
- Add or update regression coverage before removing compatibility layers.
- Keep at least one focused test or manual playtest checkpoint per phase.

## Implementation Order

1. Define the adapter interface and generic shell.
2. Port Nonogram onto the new shell.
3. Port King Max onto the same shell.
4. Move remaining shared helpers into generic/.
5. Restructure into games/<name> roots with mirrored subfolders (js/stories/scripts/specific).
6. Update build scripts and remove compatibility code.

## Success Criteria

- New games can be added by implementing the shared adapter, not by copying an existing full app.
- The UI stays mostly game-agnostic, with puzzle-specific terms contained inside the game packages.
- Nonogram and King Max both continue to work at their existing routes during and after migration.
- The repo layout clearly separates shared framework code from game-specific code.

## Nurikabe Delivery Plan

### Objective

- Add Nurikabe as a first-class game in the existing generic games hub.
- Keep static-site compatibility and route behavior aligned with current games.
- Deliver with explicit red-green-refactor evidence and regression coverage.

### Working Assumptions

- Nurikabe ships as a dedicated game package under `games/nurikabe/` with mirrored subfolders.
- Initial release prioritizes a robust core loop over advanced generation variety.
- The first playable version supports URL state sharing and deterministic replay through serialized board state.

### Phase N1: Scaffold and Register

- Create mirrored Nurikabe structure:
	- `games/nurikabe/html/index.html`
	- `games/nurikabe/js/`
	- `games/nurikabe/specific/adapter.js`
	- `games/nurikabe/stories/`
	- `games/nurikabe/scripts/`
- Add Nurikabe adapter metadata (id, label, icon, description, setup model).
- Register adapter in `generic/game-registry.js`.
- Update route rendering list in `generic/scripts/render-route-html.mjs`.
- Update build copy targets and route outputs in `package.json` scripts.

Acceptance criteria:
- Hub tile for Nurikabe appears on root index.
- `/nurikabe/` route is generated in `_site` from canonical source html.
- Game switcher select includes Nurikabe in the site nav.

### Phase N2: Define Core Rules and Failing Scenarios (Red)

- Document acceptance rules before implementation:
	- Numbered islands must match clue size.
	- Islands cannot touch orthogonally.
	- Sea must form one connected component.
	- No 2x2 all-sea block is allowed.
- Create failing regression scenarios (manual checklist + Playwright smoke hooks) for:
	- Invalid board states not detected.
	- Win condition false positives.
	- URL encode/decode mismatch.

Acceptance criteria:
- A written Red section exists for each rule area.
- At least one reproducible failing scenario per rule area is captured before Green changes.

### Phase N3: Minimal Playable Core (Green)

- Implement `games/nurikabe/js/puzzle-logic.js` for board model, move application, and rule validation.
- Implement `games/nurikabe/js/game-generation.js` for puzzle creation with solvable board guarantees.
- Implement `games/nurikabe/js/board-visuals.js` for rendering and interaction states.
- Wire page controls in `games/nurikabe/html/index.html`:
	- New puzzle
	- Clear
	- Hint
	- Share puzzle
	- Timer/mistakes/difficulty chips
	- Win banner
- Wire shell helpers through `generic/js/page-shell.js`.

Acceptance criteria:
- A full puzzle can be started, played, reset, and solved from the UI.
- Invalid actions produce visible feedback.
- Shared link restores board state and metadata on reload.

### Phase N4: Difficulty and Hint Quality

- Add `games/nurikabe/js/difficulty-scorer.js` with stable tier labels.
- Add `games/nurikabe/js/difficulty-weights.js` and optional tactic weighting controls if exposed in UI.
- Add tactical hint logic aligned with deterministic solving steps where possible.

Acceptance criteria:
- Generated puzzle shows a non-empty difficulty score and tier.
- Hint always targets a valid next action or provides clear fallback messaging.

### Phase N5: Stories, Regression, and Refactor

- Add Nurikabe tactic and behavior stories under `games/nurikabe/stories/`.
- Add Playwright coverage in `tests/regression.spec.js`:
	- Nurikabe route smoke
	- Core interaction cycle
	- Share/restore roundtrip
	- Win-condition smoke
- Add npm test target in `package.json` for Nurikabe tag filtering.
- Refactor duplicated utility logic only after Green checks pass.

Acceptance criteria:
- Nurikabe stories build with existing Storybook flow.
- Nurikabe tagged regression tests pass locally.
- Existing king-max, nonogram, and cross-game tests remain green.

### Execution Checklist (Trackable)

1. Create Nurikabe folder skeleton and adapter.
2. Register game and enable generated route output.
3. Write Red scenarios for rules, win logic, and URL state.
4. Implement minimal playable loop and pass Red scenarios.
5. Add difficulty scoring and hint reliability checks.
6. Add stories and regression automation.
7. Run full game suite and manual playtest checklist.
8. Capture release notes and residual risk summary.

### Verification and Sign-off

- Manual playtest checkpoints:
	- Start/reset flow
	- Core interaction flow
	- Hint/help flow
	- Share/restore flow
	- Completion/win flow
- Automated checks:
	- `npm run test:nurikabe` (new)
	- `npm run test:games`
	- `npm run build:site`
- Local pages parity check with `node local-test-server.mjs`.

### Risks and Mitigations

- Risk: generator produces ambiguous or low-quality puzzles.
	- Mitigation: enforce uniqueness checks and bounded retries with quality floor.
- Risk: win validation is expensive for larger boards.
	- Mitigation: maintain incremental validity caches and only run deep checks when needed.
- Risk: regression growth slows CI feedback.
	- Mitigation: keep per-game test tags and targeted scripts for focused iteration.

### Nurikabe Issue Breakdown (GitHub-Ready)

#### NURI-01: Scaffold Nurikabe package and route wiring

- Type: feature
- Estimate: S (0.5 day)
- Depends on: none
- Scope:
	- Create `games/nurikabe/{html,js,specific,stories,scripts}`.
	- Add `games/nurikabe/specific/adapter.js`.
	- Register adapter in `generic/game-registry.js`.
	- Add Nurikabe route generation in `generic/scripts/render-route-html.mjs`.
	- Ensure `_site/nurikabe/index.html` is emitted by existing build flow.
- Acceptance:
	- Hub shows Nurikabe tile.
	- Game switcher lists Nurikabe.
	- `npm run build:site:base` produces a working `/nurikabe/` route.
- Notes:
	- Keep any UI placeholder minimal; no gameplay logic required in this issue.

#### NURI-02: Define and lock Nurikabe rule contract (Red)

- Type: test/design
- Estimate: S (0.5 day)
- Depends on: NURI-01
- Scope:
	- Write acceptance rules for islands, sea connectivity, and 2x2 sea prohibition.
	- Add failing scenarios checklist for each rule area.
	- Add placeholder/failing test hooks in `tests/regression.spec.js` tagged `[nurikabe]`.
- Acceptance:
	- At least one explicit failing scenario exists per rule family.
	- Failures are reproducible and documented before implementation starts.
- Notes:
	- This is the Red gate for TDD. Do not implement rule engine logic here.

#### NURI-03: Implement board state model and rule validator (Green core)

- Type: feature
- Estimate: M (1 to 1.5 days)
- Depends on: NURI-02
- Scope:
	- Add `games/nurikabe/js/puzzle-logic.js` with:
		- state representation
		- move application
		- legality checks
		- solved-state validation
	- Add focused unit-like assertions via Playwright evaluate flows where practical.
- Acceptance:
	- Rule checks pass prior failing scenarios from NURI-02.
	- No false win on invalid island/sea states.
- Notes:
	- Keep APIs stable for upcoming UI wiring and generator usage.

#### NURI-04: Build minimal playable Nurikabe UI loop

- Type: feature
- Estimate: M (1 day)
- Depends on: NURI-03
- Scope:
	- Implement `games/nurikabe/html/index.html` interactive shell using shared page patterns.
	- Add `games/nurikabe/js/board-visuals.js` for rendering and cell state updates.
	- Wire controls: new puzzle, clear, hint placeholder, share, timer/mistakes/win banner.
	- Integrate site nav + Storybook link plumbing via `generic/js/page-shell.js`.
- Acceptance:
	- User can start, interact, reset, and finish at least one valid puzzle.
	- Visual feedback appears on invalid actions.
	- Mobile layout remains usable.

#### NURI-05: Add generation + URL share/restore stability

- Type: feature
- Estimate: M/L (1.5 to 2 days)
- Depends on: NURI-03
- Scope:
	- Add `games/nurikabe/js/game-generation.js` with solvable puzzle generation.
	- Add board serialization/deserialization for URL state in page script.
	- Add share button behavior aligned with existing games.
- Acceptance:
	- Shared URL restores puzzle and board progress.
	- Generation is bounded and does not freeze UI.
	- Regression roundtrip test passes (`state -> url -> reload -> same state`).

#### NURI-06: Difficulty scoring and deterministic hint quality

- Type: feature
- Estimate: M (1 day)
- Depends on: NURI-05
- Scope:
	- Add `games/nurikabe/js/difficulty-scorer.js` and tier labels.
	- Add `games/nurikabe/js/difficulty-weights.js` if tactic weighting is exposed.
	- Implement deterministic hint behavior with safe fallback messaging.
- Acceptance:
	- Difficulty score and tier display for generated puzzles.
	- Hint gives valid progress step or explicit “no safe deterministic step” message.

#### NURI-07: Regression suite expansion for Nurikabe

- Type: test
- Estimate: S/M (0.5 to 1 day)
- Depends on: NURI-04, NURI-05
- Scope:
	- Extend `tests/regression.spec.js` with `[nurikabe]` scenarios:
		- route smoke
		- interaction cycle
		- share/restore
		- win-condition smoke
	- Add script targets in `package.json`:
		- `test:nurikabe`
		- update `test:games` composition
- Acceptance:
	- `npm run test:nurikabe` passes locally.
	- Existing game tests remain green.

#### NURI-08: Storybook tactic coverage and docs

- Type: docs/test
- Estimate: S/M (0.5 to 1 day)
- Depends on: NURI-06
- Scope:
	- Add tactic stories under `games/nurikabe/stories/`.
	- Provide one story per deterministic tactic used by hints/scoring.
	- Add short “How to play Nurikabe” docs block consistent with current style.
- Acceptance:
	- `npm run build-storybook` succeeds.
	- Nurikabe stories are accessible from static stories output.

#### NURI-09: Final playtest and release readiness pass

- Type: release
- Estimate: S (0.5 day)
- Depends on: NURI-07, NURI-08
- Scope:
	- Run manual checklist (start/reset, interactions, hint, share/restore, completion).
	- Run:
		- `npm run test:nurikabe`
		- `npm run test:games`
		- `npm run build:site`
	- Validate local Pages parity via `node local-test-server.mjs`.
	- Record residual risks and follow-up backlog candidates.
- Acceptance:
	- Go/no-go decision documented with evidence.
	- No blocker regressions in existing games.

### Suggested Issue Creation Order

1. NURI-01
2. NURI-02
3. NURI-03
4. NURI-04
5. NURI-05
6. NURI-06
7. NURI-07
8. NURI-08
9. NURI-09

### Parallelization Guidance

- Safe parallel pair after NURI-03:
	- NURI-04 (UI loop)
	- NURI-05 (generation + URL state)
- Safe parallel pair after NURI-05:
	- NURI-06 (difficulty/hints)
	- NURI-07 (regression expansion prep)
- Keep NURI-09 strictly last.

## Progress Log

### Slice 11 completed (2026-07-18)

- Added Nurikabe as a third game with canonical source roots under `games/nurikabe/`:
	- `games/nurikabe/html/index.html`
	- `games/nurikabe/js/*`
	- `games/nurikabe/specific/adapter.js`
	- `games/nurikabe/stories/nurikabe-basics.stories.js`
	- `games/nurikabe/scripts/`
- Integrated Nurikabe into shared registration and navigation:
	- `generic/game-registry.js`
	- cross-game navigation now includes king-max, nonogram, and nurikabe
- Integrated Nurikabe route rendering and static output wiring:
	- `generic/scripts/render-route-html.mjs`
	- `package.json` site build scripts now emit `_site/nurikabe/`
	- `local-test-server.mjs` now advertises the Nurikabe route
- Added Nurikabe regression and cross-game coverage:
	- `[nurikabe]` tests for logic validity, share/restore, and win banner flow
	- cross-game nav and canonical HTML assertions updated for third game
	- added `npm run test:nurikabe` and updated `npm run test:games`
- Added Storybook coverage for Nurikabe via `games/nurikabe/stories/nurikabe-basics.stories.js` and `.storybook/main.js`.
- Verified with:
	- `npm run test:nurikabe`
	- stress repeat of the Nurikabe logic regression
	- `npm run build:site`
	- `npm run build-storybook`

### Slice 1 completed (2026-07-07)

- Added initial generic/specific runtime scaffold:
	- generic/game-adapter.js
	- generic/game-registry.js
	- games/king-max/specific/adapter.js
	- games/nonogram/specific/adapter.js
- Established generic/game-registry.js as the shared registry entrypoint.
- Added explicit per-game regression execution scripts:
	- npm run test:king-max
	- npm run test:nonogram
	- npm run test:games (sum of both suites)
- Tagged Playwright tests by domain ([king-max], [nonogram], [cross-game]) so coverage can be executed and reported per game.
- Added adapter-shape regression coverage for GAME_ADAPTERS.

### Slice 2 completed (2026-07-07)

- Moved shared annotation modules into generic/annotations:
	- generic/annotations/annotation-renderer.js
	- generic/annotations/reasoning-annotation.js
- Updated active consumers to import from generic/annotations:
	- king-max/index.html
	- nonogram/index.html
	- games/king-max/js/deterministic-tactics.js
	- games/nonogram/js/tactics.js
	- games/nonogram/js/game-interface.js
	- tests/regression.spec.js
- This established generic/annotations as the long-term annotation source of truth.
- Verified aggregate coverage still passes via npm run test:games (18 king-max/cross-game + 17 nonogram/cross-game tests).

### Slice 3 completed (2026-07-07)

- Removed top-level js generic shim files:
	- js/game-registry.js
	- js/annotation-renderer.js
	- js/reasoning-annotation.js
	- js/game-interface.js
- Rewired remaining imports to generic modules directly:
	- index.html -> generic/game-registry.js
	- tests/regression.spec.js -> generic/game-registry.js
- Updated static site build to copy generic/ and games/ into _site.
- Verified aggregate coverage still passes via npm run test:games (18 king-max/cross-game + 17 nonogram/cross-game tests).

### Slice 4 completed (2026-07-07)

- Made per-game JS canonical under games/ roots:
	- games/king-max/js/*
	- games/nonogram/js/*
- Moved adapter modules into per-game specific roots:
	- games/king-max/specific/adapter.js
	- games/nonogram/specific/adapter.js
- Updated consumers to import canonical game paths:
	- king-max/index.html
	- nonogram/index.html
	- tests/regression.spec.js
	- games/king-max/scripts/discover-deterministic-examples.mjs
	- games/nonogram/scripts/discover-nonogram-examples.mjs
	- games/king-max/stories/game-visuals.js
	- games/nonogram/stories/nonogram-tactics.stories.js
- Used temporary compatibility wrappers during migration before canonical-only enforcement.
- Updated build/watch scripts to copy games/ into _site and watch games/king-max/js/deterministic-tactics.js.
- Verified aggregate coverage still passes via npm run test:games (18 king-max/cross-game + 17 nonogram/cross-game tests).

### Slice 5 completed (2026-07-07)

- Made per-game stories canonical under games/ roots:
	- games/king-max/stories/*
	- games/nonogram/stories/*
- Moved generated examples to per-game story roots:
	- games/king-max/stories/generated/deterministic-examples.generated.js
	- games/nonogram/stories/generated/nonogram-examples.generated.js
- Made per-game discovery scripts canonical under games/ roots:
	- games/king-max/scripts/discover-deterministic-examples.mjs
	- games/nonogram/scripts/discover-nonogram-examples.mjs
- Updated Storybook and npm scripts to use canonical paths.
- Kept temporary root wrappers only during this migration step, before removal in Slice 6.
- Verified aggregate coverage still passes via npm run test:games (18 king-max/cross-game + 17 nonogram/cross-game tests).

### Slice 6 completed (2026-07-07)

- Enforced canonical-only paths by removing compatibility wrappers:
	- removed js/king-max/* and js/nonogram/* wrappers
	- removed root stories wrappers and root scripts wrappers
- Updated build scripts to no longer copy a legacy root js tree.
- Updated instruction/skill/agent references to canonical game story paths under games/king-max/stories.
- Updated generator provenance headers and test docs to canonical games/* paths.
- Verified aggregate coverage still passes via npm run test:games (18 king-max/cross-game + 17 nonogram/cross-game tests).

### Slice 7 completed (2026-07-08)

- Extracted shared page shell behavior into generic/js/page-shell.js.
- Moved registry-driven game navigation into the shared shell helper and wired both game pages through it.
- Moved shared Storybook footer link resolution into the same helper and removed duplicated per-page implementations.
- Updated:
	- king-max/index.html
	- nonogram/index.html
	- generic/js/page-shell.js
- Verified focused cross-game shell checks pass via `npx playwright test --grep "\\[cross-game\\]"`.
- Verified aggregate coverage still passes via npm run test:games (18 king-max/cross-game + 17 nonogram/cross-game tests).

### Slice 8 completed (2026-07-08)

- Added canonical per-game HTML roots:
	- games/king-max/html/index.html
	- games/nonogram/html/index.html
- Updated Playwright/build flow so canonical html sources can drive both source validation and static output.
- Updated static site build to publish from canonical game html sources.

### Slice 9 completed (2026-07-08)

- Removed legacy root route source files:
	- king-max/index.html
	- nonogram/index.html
- Updated Playwright to serve built `_site` output instead of the source tree, so tests no longer depend on duplicated route files.
- Canonical game html now exists only under:
	- games/king-max/html/index.html
	- games/nonogram/html/index.html

### Slice 10 completed (2026-07-08)

- Fixed canonical game html pages so they load correctly at `/games/<game>/html/`.
- Updated canonical html asset and module paths to be correct from the canonical source locations:
	- games/king-max/html/index.html
	- games/nonogram/html/index.html
- Added generic/scripts/render-route-html.mjs so route pages in `_site` are rendered from canonical html with route-relative asset paths.
- Updated generic/js/page-shell.js so Storybook links resolve correctly from canonical html paths.
- Added regression coverage for canonical html pages under `/games/king-max/html/` and `/games/nonogram/html/`.
- Verified focused canonical-path checks pass and aggregate coverage still passes via npm run test:games (20 king-max/cross-game + 19 nonogram/cross-game tests).