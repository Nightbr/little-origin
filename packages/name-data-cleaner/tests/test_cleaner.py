"""Tests for cleaner module."""

import csv
from io import StringIO
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from name_data_cleaner.cleaner import CleaningConfig, CleaningStats, DatasetCleaner


class TestCleaningStats:
	"""Tests for CleaningStats dataclass."""

	def test_initial_stats(self):
		"""Test that stats initialize to zero."""
		stats = CleaningStats()
		assert stats.total_rows == 0
		assert stats.valid_rows == 0
		assert stats.filtered_rows == 0
		assert stats.filtered_reasons == {}

	def test_add_filtered(self):
		"""Test adding filtered rows."""
		stats = CleaningStats()
		stats.add_filtered('too_short')
		stats.add_filtered('too_short')
		stats.add_filtered('invalid_format')

		assert stats.filtered_rows == 3
		assert stats.filtered_reasons == {'too_short': 2, 'invalid_format': 1}


class TestCleaningConfig:
	"""Tests for CleaningConfig."""

	def test_default_config(self):
		"""Test default configuration values."""
		config = CleaningConfig(
			input_dir=Path('input'),
			output_dir=Path('output'),
			countries=['US', 'GB'],
		)

		assert config.min_length == 3
		assert config.max_length == 20
		assert config.min_rank == 5000


class TestDatasetCleaner:
	"""Tests for DatasetCleaner."""

	@pytest.fixture
	def mock_config(self, tmp_path):
		"""Create a test configuration with temporary directories."""
		input_dir = tmp_path / 'input'
		output_dir = tmp_path / 'output'
		input_dir.mkdir()

		return CleaningConfig(
			input_dir=input_dir,
			output_dir=output_dir,
			countries=['US'],
			min_length=3,
			max_length=20,
			min_rank=5000,
		)

	@pytest.fixture
	def sample_csv(self, mock_config):
		"""Create a sample CSV file for testing."""
		csv_content = """John,Doe,M,US
Jane,Smith,F,US
A,B,M,US
José,Garcia,M,US
Mary,Anne,F,US"""
		csv_file = mock_config.input_dir / 'US.csv'
		csv_file.write_text(csv_content)
		return csv_file

	def test_cleaner_initialization(self, mock_config):
		"""Test that cleaner initializes correctly."""
		cleaner = DatasetCleaner(mock_config)
		assert cleaner.config == mock_config
		assert cleaner.nd is None
		assert cleaner.stats_by_country == {}

	def test_csv_parsing(self, mock_config, sample_csv):
		"""Test that CSV files are parsed correctly."""
		cleaner = DatasetCleaner(mock_config)

		with open(sample_csv, 'r') as f:
			reader = csv.reader(f)
			rows = list(reader)

		assert len(rows) == 5
		assert rows[0] == ['John', 'Doe', 'M', 'US']
		assert rows[1] == ['Jane', 'Smith', 'F', 'US']

	@patch('name_data_cleaner.cleaner.NameDataset')
	def test_clean_country_creates_output_file(
		self, mock_nd_class, mock_config, sample_csv
	):
		"""Test that clean_country creates an output file."""
		# Mock the names-dataset
		mock_nd = MagicMock()
		mock_nd.search.return_value = {
			'first_name': {
				'country': {'US': 0.5},
				'gender': {'Male': 1.0},
				'rank': {'US': 100},
			}
		}
		mock_nd_class.return_value = mock_nd

		cleaner = DatasetCleaner(mock_config)
		cleaner.nd = mock_nd

		stats = cleaner.clean_country('US')

		# Check that output file was created
		output_file = mock_config.output_dir / 'US.csv'
		assert output_file.exists()

		# Check that stats were recorded
		assert stats.total_rows > 0

	def test_output_file_format(self, mock_config, sample_csv):
		"""Test that output file maintains CSV format."""
		with patch('name_data_cleaner.cleaner.NameDataset') as mock_nd_class:
			# Mock the names-dataset to accept all names
			mock_nd = MagicMock()
			mock_nd.search.return_value = {
				'first_name': {
					'country': {'US': 0.5},
					'gender': {'Male': 1.0, 'Female': 1.0},
					'rank': {'US': 100},
				}
			}
			mock_nd_class.return_value = mock_nd

			cleaner = DatasetCleaner(mock_config)
			cleaner.nd = mock_nd

			cleaner.clean_country('US')

			output_file = mock_config.output_dir / 'US.csv'
			content = output_file.read_text()

			# Check it's valid CSV
			reader = csv.reader(StringIO(content))
			rows = list(reader)

			assert len(rows) > 0
			# Each row should have 4 columns
			for row in rows:
				assert len(row) == 4

	def test_missing_input_file(self, mock_config):
		"""Test handling of missing input file."""
		cleaner = DatasetCleaner(mock_config)
		cleaner.nd = MagicMock()

		stats = cleaner.clean_country('US')

		assert stats.total_rows == 0
		assert stats.valid_rows == 0


@pytest.mark.integration
class TestIntegration:
	"""Integration tests (require names-dataset library)."""

	@pytest.fixture
	def real_config(self, tmp_path):
		"""Create a real configuration with temporary directories."""
		input_dir = tmp_path / 'input'
		output_dir = tmp_path / 'output'
		input_dir.mkdir()

		return CleaningConfig(
			input_dir=input_dir,
			output_dir=output_dir,
			countries=['US'],
			min_length=3,
			max_length=20,
			min_rank=10000,  # More permissive for testing
		)

	@pytest.fixture
	def realistic_csv(self, real_config):
		"""Create a realistic CSV with good and bad data."""
		csv_content = """John,Doe,M,US
Jane,Smith,F,US
Robert,Johnson,M,US
Michael,Williams,M,US
A,B,M,US
abc,def,F,US
Mary,Anne,F,US"""
		csv_file = real_config.input_dir / 'US.csv'
		csv_file.write_text(csv_content)
		return csv_file

	@pytest.mark.slow
	def test_end_to_end_cleaning(self, real_config, realistic_csv):
		"""Test end-to-end cleaning process."""
		cleaner = DatasetCleaner(real_config)
		cleaner.initialize_dataset()

		stats = cleaner.clean_country('US')

		# Should have processed some rows
		assert stats.total_rows > 0

		# Should have some valid rows
		assert stats.valid_rows > 0

		# Should have filtered some rows
		assert stats.filtered_rows > 0

		# Output file should exist
		output_file = real_config.output_dir / 'US.csv'
		assert output_file.exists()

		# Output should have fewer rows than input
		input_rows = len(realistic_csv.read_text().splitlines())
		output_rows = len(output_file.read_text().splitlines())
		assert output_rows <= input_rows
