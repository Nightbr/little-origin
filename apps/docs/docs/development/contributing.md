---
sidebar_position: 4
---

# Contributing

Contributions are welcome — code, bug reports, docs, design, or name data.

## Getting Started

1. Follow the [Development Setup](/docs/development/setup) guide
2. Pick an issue tagged `good first issue` or `help wanted`, and comment to claim it
3. Create a branch: `feature/...`, `fix/...`, `docs/...`, `refactor/...`, or `test/...`

## Workflow

Keep changes small and focused. Add tests for new functionality. Before pushing:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add name search by popularity
fix: resolve race condition in match detection
docs: improve deployment guide
```

## Pull Requests

Describe **what** changed and **why**, include screenshots for UI changes, and make sure CI passes. Maintainers review, you address feedback, and the PR is squash-merged.

## Code Style

Biome enforces formatting — run `pnpm format`, don't format by hand. Beyond that:

- TypeScript: no `any`, type function signatures
- React: functional components with hooks
- Tests: Vitest, co-located with source

## Name Data

To improve the datasets, see [Name Data & Generator](/docs/development/name-data). New base names go in `packages/name-data/data/names-<country>.json` (`male`/`female` arrays); extended datasets are produced by the generator.

## License

By contributing, you agree your contributions are licensed under the MIT License.

Questions? Use [GitHub Issues](https://github.com/Nightbr/little-origin/issues) or Discussions.
