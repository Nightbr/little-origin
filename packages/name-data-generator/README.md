# name-data-generator

Python tool to generate extended-dataset CSV files from the `names-dataset` library.

## Purpose

Generates baby name datasets by fetching top first names per gender per country from the names-dataset library.

## Output Format

The generated CSV files have the format:
```
[first name],,[gender (M/F)],[country code]
```

Note: The last name field is empty (only first names are generated).

Example:
```
Jose,,M,US
Maria,,F,US
```

## Installation

This project uses [mise](https://mise.jdx.dev) for Python version management and [uv](https://github.com/astral-sh/uv) for fast Python dependency management.

### Prerequisites

```bash
# Install mise (if not already installed)
curl https://mise.run | sh

# Install uv (mise will auto-install it, but you can also install manually)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Setup

```bash
# From repository root - mise will handle Python 3.11 and uv automatically
mise install
```

That's it! mise and uv will work together to manage the Python environment.

## Usage

### From mise task (recommended)

From the repository root:

```bash
# Generate datasets with default 250 names per gender
mise run generate-names

# Run tests
mise run test-names
```

### From npm script (delegates to mise)

```bash
# Generate datasets
pnpm generate:names

# Run tests
pnpm test:names
```

### Direct CLI execution

```bash
cd packages/name-data-generator
uv run generate-names

# Custom number of names per gender
uv run generate-names --names 500

# Generate only specific countries
uv run generate-names --countries US GB DE

# Custom output directory
uv run generate-names --output ./my-output
```

### As a module

```python
from pathlib import Path
from name_data_generator import DatasetGenerator, GeneratorConfig

config = GeneratorConfig(
    output_dir=Path('data/extended-dataset'),
    countries=['US', 'GB', 'DE'],
    names_per_gender=250,  # Number of names per gender (M+F)
)

generator = DatasetGenerator(config)
generator.generate_all()
```

## CLI Options

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--names` | `-n` | `250` | Number of names to fetch per gender |
| `--countries` | `-c` | All 7 countries | Countries to generate (US, GB, DE, FR, IT, ES, IE) |
| `--output` | `-o` | `packages/name-data/data/extended-dataset` | Output directory |
| `--use-ai` | | `False` | Enable AI-based cleaning (requires API key) |
| `--ai-api-key` | | `env: OPENROUTER_API_KEY` | OpenRouter API Key |
| `--ai-model` | | `google/gemini-2.0-flash-001` | Model to use for cleaning |

## Supported Countries

- `US` - United States
- `GB` - Great Britain
- `DE` - Germany
- `FR` - France
- `IT` - Italy
- `ES` - Spain
- `IE` - Ireland

## Performance

The generator includes several optimizations for fast processing:

- **Parallel processing**: Countries are processed simultaneously (up to 4 workers)
- **Rich progress display**: Shows progress bars for all countries with percentage completion
- **Batch processing**: Fetches names efficiently from the names-dataset library

### Parallel Processing

All countries are processed in parallel using `ThreadPoolExecutor`:

- **Default workers**: 4 (or number of countries, whichever is less)
- Each country fetches male and female names independently

## Memory Requirements

The `names-dataset` library requires **~3.2GB of RAM** to load. Ensure your machine has sufficient memory.

## AI Cleaning

You can optionally use an LLM (via OpenRouter) to clean the generated names. This is useful for removing non-names that might pass regex filters.

### Configuration

You can provide the OpenRouter API key via:
1.  **Environment Variable** (Recommended): Set `OPENROUTER_API_KEY` in your shell or a `.env` file (if using `python-dotenv`, though currently not automatically loaded, so shell export is best).
2.  **CLI Argument**: Pass `--ai-api-key` directly.

### Example

```bash
# Export key first
export OPENROUTER_API_KEY=sk-or-v1-...

# Run with AI enabled
uv run generate-names --use-ai

# Or specify model (default is google/gemini-2.0-flash-001)
uv run generate-names --use-ai --ai-model openai/gpt-4o
```

## Development

```bash
cd packages/name-data-generator

# Run tests
mise run test-names
# or
uv run pytest

# Run tests with coverage
uv run pytest --cov

# Run specific test file
uv run pytest tests/test_generator.py

# Format code
uv run black .
uv run isort .
```

## Data Directory Structure

```
packages/name-data-generator/
└── packages/name-data/
    └── data/
        └── extended-dataset/  # Generated output files (Git LFS)
```

The generated CSV files are written directly to the `name-data` package where the ingestion system expects to find them.

### Git LFS Setup

When cloning this repository, ensure you have Git LFS installed:

```bash
# Install Git LFS
# macOS: brew install git-lfs
# Ubuntu/Debian: apt install git-lfs

# Initialize Git LFS
git lfs install

# Clone the repository
git clone <repo-url>
```

## Sources

- [names-dataset PyPI](https://pypi.org/project/names-dataset/)
- [names-dataset GitHub](https://github.com/philipperemy/name-dataset)
- [mise documentation](https://mise.jdx.dev)
- [uv documentation](https://github.com/astral-sh/uv)
