"""Tests for validators module."""

from unittest.mock import MagicMock

import pytest

from name_data_cleaner.validators import (
	ValidationError,
	validate_character_set,
	validate_double_names,
	validate_length,
	validate_name_format,
)


class TestValidateLength:
	"""Tests for length validation."""

	def test_valid_length(self):
		"""Test that names within length limits pass."""
		assert validate_length('John', 3, 20) is None
		assert validate_length('Maria', 3, 20) is None

	def test_too_short(self):
		"""Test that names below minimum length fail."""
		error = validate_length('Jo', 3, 20)
		assert error is not None
		assert error.reason == 'too_short'

	def test_too_long(self):
		"""Test that names above maximum length fail."""
		error = validate_length('A' * 25, 3, 20)
		assert error is not None
		assert error.reason == 'too_long'

	def test_exact_boundaries(self):
		"""Test that boundary values work correctly."""
		assert validate_length('Bob', 3, 20) is None  # Exactly min
		assert validate_length('A' * 20, 3, 20) is None  # Exactly max


class TestValidateCharacterSet:
	"""Tests for character set validation."""

	def test_valid_latin_characters(self):
		"""Test that Latin characters pass validation."""
		assert validate_character_set('John', 'US') is None
		assert validate_character_set('Maria', 'GB') is None
		assert validate_character_set('José', 'ES') is None
		assert validate_character_set('François', 'FR') is None
		assert validate_character_set('Müller', 'DE') is None

	def test_valid_german_umlaut(self):
		"""Test that German umlauts are accepted for DE."""
		assert validate_character_set('Müller', 'DE') is None
		assert validate_character_set('Jäger', 'DE') is None

	def test_valid_french_accents(self):
		"""Test that French accents are accepted for FR."""
		assert validate_character_set('François', 'FR') is None
		assert validate_character_set('Hélène', 'FR') is None
		assert validate_character_set('Étienne', 'FR') is None

	def test_valid_spanish_accents(self):
		"""Test that Spanish accents are accepted for ES."""
		assert validate_character_set('José', 'ES') is None
		assert validate_character_set('María', 'ES') is None
		assert validate_character_set('Núñez', 'ES') is None

	def test_hyphen_and_apostrophe(self):
		"""Test that hyphens and apostrophes are allowed."""
		assert validate_character_set('Mary-Ann', 'US') is None
		assert validate_character_set("O'Connor", 'GB') is None

	def test_arabic_script_rejected(self):
		"""Test that Arabic script is rejected."""
		error = validate_character_set('محمد', 'US')
		assert error is not None
		assert error.reason == 'non_latin_script'

	def test_chinese_characters_rejected(self):
		"""Test that Chinese characters are rejected."""
		error = validate_character_set('王小明', 'US')
		assert error is not None
		assert error.reason == 'non_latin_script'

	def test_cyrillic_rejected(self):
		"""Test that Cyrillic script is rejected."""
		error = validate_character_set('Владимир', 'US')
		assert error is not None
		assert error.reason == 'non_latin_script'


class TestValidateNameFormat:
	"""Tests for name format validation."""

	def test_valid_single_name(self):
		"""Test that properly formatted single names pass."""
		assert validate_name_format('John', 'US') is None
		assert validate_name_format('Maria', 'ES') is None

	def test_capitalization_required(self):
		"""Test that names must start with capital letter."""
		error = validate_name_format('john', 'US')
		assert error is not None
		assert error.reason == 'invalid_format'

	def test_valid_double_name(self):
		"""Test that properly formatted double names pass."""
		assert validate_name_format('Jose Luis', 'ES') is None
		assert validate_name_format('Mary Anne', 'US') is None

	def test_invalid_double_name_capitalization(self):
		"""Test that both parts must be capitalized."""
		error = validate_name_format('Jose luis', 'ES')
		assert error is not None
		assert error.reason == 'invalid_format'


class TestValidateDoubleNames:
	"""Tests for double name validation."""

	def test_single_name_passes(self):
		"""Test that single names pass double name validation."""
		assert validate_double_names('John') is None
		assert validate_double_names('Maria') is None

	def test_valid_double_name(self):
		"""Test that valid double names pass."""
		assert validate_double_names('Jose Luis') is None
		assert validate_double_names('Mary Anne') is None

	def test_too_many_parts(self):
		"""Test that names with more than 2 parts fail."""
		error = validate_double_names('Jose Luis Maria')
		assert error is not None
		assert error.reason == 'too_many_parts'

	def test_capitalization_check(self):
		"""Test that both parts must be capitalized."""
		error = validate_double_names('Jose luis')
		assert error is not None
		assert error.reason == 'invalid_capitalization'

		error = validate_double_names('mary anne')
		assert error is not None
		assert error.reason == 'invalid_capitalization'


class TestValidationError:
	"""Tests for ValidationError class."""

	def test_error_is_falsy(self):
		"""Test that ValidationError is falsy in boolean context."""
		error = ValidationError('test_reason', 'test details')
		assert not error
		assert not bool(error)

	def test_error_attributes(self):
		"""Test that ValidationError stores reason and details."""
		error = ValidationError('reason', 'details')
		assert error.reason == 'reason'
		assert error.details == 'details'


class TestValidateWithNamesDataset:
	"""Tests for names-dataset validation."""

	def test_none_result(self):
		"""Test handling of None result from names-dataset."""
		mock_nd = MagicMock()
		mock_nd.search.return_value = None

		from name_data_cleaner.validators import validate_with_names_dataset

		error = validate_with_names_dataset('UnknownName', 'M', 'US', mock_nd, 5000)
		assert error is not None
		assert error.reason == 'not_found'

	def test_none_first_name_data(self):
		"""Test handling of None first_name_data even when key exists."""
		mock_nd = MagicMock()
		mock_nd.search.return_value = {'first_name': None, 'last_name': {}}

		from name_data_cleaner.validators import validate_with_names_dataset

		error = validate_with_names_dataset('UnknownName', 'M', 'US', mock_nd, 5000)
		assert error is not None
		assert error.reason == 'not_found'
