# Source Data

This directory contains the original extended-dataset CSV files downloaded from the names-dataset PyPI package.

## Files

Place the raw CSV files here:
- `DE.csv` - Germany dataset
- `ES.csv` - Spain dataset
- `FR.csv` - France dataset
- `GB.csv` - Great Britain dataset
- `IE.csv` - Ireland dataset
- `IT.csv` - Italy dataset
- `US.csv` - United States dataset

## CSV Format

```
[first name],[last name],[gender (M/F)],[country code]
```

## Downloading Source Files

You can download the original dataset from:
- https://pypi.org/project/names-dataset/
- https://github.com/philipperemy/name-dataset

## Git LFS

These files are tracked with **Git LFS** (Large File Storage) due to their size (~2.3GB total).

When cloning this repository, make sure you have Git LFS installed:

```bash
# Install Git LFS
# On macOS: brew install git-lfs
# On Ubuntu/Debian: apt install git-lfs
# On Windows: download from https://git-lfs.github.com/

# Initialize Git LFS
git lfs install

# Clone the repository
git clone <repo-url>
```

The cleaned output files in `packages/name-data/data/extended-dataset/` are also tracked with Git LFS.
