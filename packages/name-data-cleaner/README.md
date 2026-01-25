# name-data-cleaner

Python tool to clean extended-dataset CSV files using the `names-dataset` library for validation.

## Purpose

The extended-dataset (downloaded from the names-dataset PyPI package) contains quality issues:

- **Non-Latin script names**: Arabic, Chinese, Cyrillic names in Western datasets
- **Pseudonyms/joke names**: Obviously fake entries
- **Names in wrong countries**: "Ali" in German dataset, "Pierre" in US dataset
- **Invalid formats**: Single characters, repeated letters, suspicious patterns

This tool validates and filters names to produce clean datasets.

## Validation Strategy

1. **names-dataset strict validation**: Name must exist for that country + gender
2. **Character set validation**: Only appropriate Latin characters for each country
3. **Format validation**: Proper capitalization, structure, no excessive special chars
4. **Custom blacklist**: Known joke names and pseudonyms
5. **Popularity threshold**: Filter very rare names (configurable rank threshold)

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
# Clean the datasets
mise run clean-names

# Run tests
mise run test-names
```

### From npm script (delegates to mise)

```bash
# Clean the datasets
pnpm clean:names

# Run tests
pnpm test:names
```

### Direct uv execution

```bash
cd packages/name-data-cleaner
uv run clean-names
```

### As a module

```python
from pathlib import Path
from name_data_cleaner import DatasetCleaner, CleaningConfig

config = CleaningConfig(
    input_dir=Path('data/extended-dataset'),
    output_dir=Path('data/extended-dataset-cleaned'),
    countries=['US', 'GB', 'DE'],
    min_length=3,
    max_length=20,
    min_rank=5000,  # Accept top 5000 names per country
)

cleaner = DatasetCleaner(config)
cleaner.clean_all()
```

## Configuration

Edit [`cleaner.py`](src/name_data_cleaner/cleaner.py) or pass custom `CleaningConfig`:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `min_length` | 3 | Minimum name length |
| `max_length` | 20 | Maximum name length |
| `min_rank` | 5000 | Maximum rank (higher = more permissive) |

## Performance

The cleaner includes several optimizations for fast processing:

- **Parallel processing**: Countries are processed simultaneously (up to 4 workers)
- **Fast line counting**: Uses buffered reading to count rows without loading the file
- **Batch writes**: Writes valid rows in batches of 1000 to reduce I/O overhead
- **Early filtering**: Applies quick checks (length, gender) before expensive validation
- **Pre-fetched config**: Avoids repeated attribute lookups in the processing loop

### Parallel Processing

All countries are processed in parallel using `ThreadPoolExecutor`:

- **Default workers**: 4 (or number of countries, whichever is less)
- **US** is the largest file (~598M), so it runs in parallel with smaller countries
- **Speedup**: Near 4x for processing all countries compared to sequential

### Progress Tracking

Before processing each file, the cleaner quickly counts the total rows using buffered I/O. This provides accurate progress tracking with percentage completion and time remaining estimates - all without loading the entire file into memory.

### Future: Pandas/Polars Support

For even faster processing (5-10x speedup), you could integrate pandas or polars:

```python
import pandas as pd

# Read and filter in chunks
for chunk in pd.read_csv('source.csv', chunksize=100000):
    valid = chunk[chunk['first_name'].str.len().between(3, 20)]
    valid.to_csv('output.csv', mode='a', header=not pd.io.common.file_exists('output.csv'))
```

This would require adding pandas as a dependency but could significantly speed up processing for very large files.

## Filter Reasons

The cleaner tracks why names are filtered:

- `non_latin_script`: Contains Arabic, Cyrillic, Chinese, etc.
- `country_mismatch`: Name not found for this country
- `gender_mismatch`: Gender doesn't match dataset
- `too_rare`: Name rank exceeds threshold
- `joke_name`: Known pseudonym/joke name
- `suspicious_pattern`: Single char, repeated letters, etc.
- `invalid_format`: Doesn't match country naming patterns
- `invalid_csv_format`: Malformed CSV row
- `invalid_gender`: Not 'M' or 'F'

## Output

Cleaned files are saved in the same CSV format:
```
[first name],[last name],[gender (M/F)],[country code]
```

Files are saved to `packages/name-data/data/extended-dataset/` by default. This is the same location used by the ingestion system, so cleaned files are immediately available for use.

## Data Directory Structure

```
packages/name-data-cleaner/
├── data/
│   └── source/           # Original extended-dataset CSV files (Git LFS)
└── packages/name-data/
    └── data/
        └── extended-dataset/  # Cleaned output files (Git LFS)
```

Both source and cleaned CSV files are tracked with **Git LFS** due to their size. The source files (~2.3GB) are stored in `data/source/` within this package, and the cleaned output is written directly to the `name-data` package where the ingestion system expects to find it.

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

## Memory Requirements

The `names-dataset` library requires **~3.2GB of RAM** to load. Ensure your machine has sufficient memory.

## Development

```bash
cd packages/name-data-cleaner

# Run tests
mise run test-names
# or
uv run pytest

# Run tests with coverage
uv run pytest --cov

# Run specific test file
uv run pytest tests/test_validators.py

# Format code
uv run black .
uv run isort .
```

## Adding Custom Rules

### Blacklist names

Edit [`blacklist.py`](src/name_data_cleaner/blacklist.py):

```python
JOKE_NAMES = {
    'bredlbroad',
    'your-joke-name',
}

COUNTRY_SPECIFIC = {
    'US': {
        'obviously-not-american-name',
    },
}
```

### Custom validation patterns

Edit [`validators.py`](src/name_data_cleaner/validators.py) to add new validation functions.

## Sources

- [names-dataset PyPI](https://pypi.org/project/names-dataset/)
- [names-dataset GitHub](https://github.com/philipperemy/name-dataset)
- [mise documentation](https://mise.jdx.dev)
- [uv documentation](https://github.com/astral-sh/uv)
