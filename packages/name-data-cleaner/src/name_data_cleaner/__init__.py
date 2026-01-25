"""
name_data_cleaner - Clean extended-dataset CSV files using names-dataset validation.

This package provides tools to validate and clean baby name datasets by:
1. Using the names-dataset library to verify names exist for specific countries/genders
2. Applying custom validation rules (character sets, formats, patterns)
3. Filtering out joke names, pseudonyms, and obviously invalid entries

Example:
    from name_data_cleaner import DatasetCleaner, CleaningConfig

    config = CleaningConfig(
        input_dir=Path('data/extended-dataset'),
        output_dir=Path('data/extended-dataset-cleaned'),
        countries=['US', 'GB', 'DE'],
    )

    cleaner = DatasetCleaner(config)
    cleaner.clean_all()
"""

from .cleaner import CleaningConfig, DatasetCleaner, main

__all__ = ['DatasetCleaner', 'CleaningConfig', 'main']

__version__ = '0.1.0'
