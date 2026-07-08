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

## Progress Log

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