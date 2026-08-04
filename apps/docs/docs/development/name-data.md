---
sidebar_position: 3
---

# Name Data & Generator

Two datasets, both in the monorepo, plus a Python tool that generates them. Both cover 7 countries: 🇺🇸 🇬🇧 🇫🇷 🇮🇹 🇩🇪 🇪🇸 🇮🇪.

| Dataset | Location | Usage |
|---------|----------|-------|
| **Base** | `packages/name-data/data/names-*.json` | Curated per country, seeded during onboarding |
| **Extended** | `packages/name-data/data/extended-dataset/*.csv` (Git LFS) | Thousands per country, loaded from [Advanced Settings](/docs/features/advanced) |

## The `name-data` Package

`packages/name-data` is a small TypeScript package that loads the base JSON datasets and exposes typed helpers:

```ts
import { getNamesByCountries, getAllCountries } from '@little-origin/name-data';

// All French and Italian female names up to 10 characters
const names = getNamesByCountries(['FR', 'IT'], 'female', 10);
```

The API server uses it to seed the database when onboarding completes.

### Data Format

Each `names-<country>.json` file contains:

```json
{
	"country": "FR",
	"countryName": "France",
	"male": ["Louis", "Gabriel", "..."],
	"female": ["Louise", "Emma", "..."]
}
```

## The Name Data Generator

`packages/name-data-generator` is a Python tool that produces the extended-dataset CSV files from the [names-dataset](https://github.com/philipperemy/name-dataset) library (top first names per gender per country).

### Running the Generator

Python tooling is managed by [mise](https://mise.jdx.dev) and [uv](https://github.com/astral-sh/uv) — `mise install` at the repository root sets everything up.

```bash
# From the repository root
mise run generate-names          # 250 names per gender per country (default)
mise run generate-names-5k       # 5000 names per gender per country
mise run generate-names-ai       # 5000 names + AI cleaning (requires OPENROUTER_API_KEY)

# Or via pnpm
pnpm generate:names
```

### CLI Options

Run directly for full control:

```bash
cd packages/name-data-generator
uv run generate-names --names 500 --countries US GB FR
```

| Option | Default | Description |
|--------|---------|-------------|
| `--names` / `-n` | `250` | Names to fetch per gender |
| `--countries` / `-c` | All 7 | Countries to generate |
| `--output` / `-o` | `packages/name-data/data/extended-dataset` | Output directory |
| `--use-ai` | `false` | LLM-based cleaning of non-names (via OpenRouter) |
| `--ai-model` | `google/gemini-2.0-flash-001` | Model used for AI cleaning |

:::note Memory

The `names-dataset` library loads ~3.2 GB into RAM — make sure your machine has enough memory.

:::

### Output Format

The generator writes one CSV per country in the format consumed by the ingestion service:

```csv
Jose,,M,US
Maria,,F,US
```

### Tests

```bash
mise run test-names
# or
cd packages/name-data-generator && uv run pytest
```

## From CSV to Your Database

The extended CSVs are stored with **Git LFS** and served through GitHub. When a user hits **Load** in Advanced Settings, the API:

1. Streams the country's CSV from the repository
2. Validates each name (3-20 characters, letters only, no duplicates)
3. Inserts valid names in batches of 100 with `source: 'extended'`
4. Publishes progress over GraphQL subscriptions for the live UI

See the [Advanced Settings](/docs/features/advanced) feature page for the user-facing side.

## Next Steps

- **[Architecture](/docs/development/architecture)** - How the packages fit together
- **[Development Setup](/docs/development/setup)** - Get the monorepo running locally
