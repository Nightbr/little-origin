"""
name_data_cleaner - Generate extended-dataset CSV files from names-dataset library.

This package provides tools to generate baby name datasets by:
1. Using the names-dataset library's get_top_names() method
2. Fetching top N first names per gender per country
3. Generating CSV files with format: first_name,,gender,country

Example:
    from name_data_cleaner import DatasetGenerator, GeneratorConfig, main

    config = GeneratorConfig(
        output_dir=Path('data/extended-dataset'),
        countries=['US', 'GB', 'DE'],
        names_per_gender=250,
    )

    generator = DatasetGenerator(config)
    generator.generate_all()
"""

from .generator import (
	DEFAULT_NAMES_PER_GENDER,
	GenerationStats,
	GeneratorConfig,
	DatasetGenerator,
)

from .cli import main

__all__ = [
	'DatasetGenerator',
	'GeneratorConfig',
	'GenerationStats',
	'DEFAULT_NAMES_PER_GENDER',
	'main',
]

__version__ = '0.2.0'
