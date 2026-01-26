"""
Tests for the name data generator.

Tests name cleaning and filtering functionality.
"""

import pytest

from name_data_generator.generator import DatasetGenerator


class TestIsValidFirstName:
	"""Test the is_valid_first_name static method."""

	@pytest.mark.parametrize(
		'valid_name',
		[
			'John',
			'Mary',
			'Alexander',
			'Elizabeth',
			'Jean-Claude',  # Hyphenated name
			"O'Malley",  # Apostrophe
			'Anne-Marie',
			"Mary-Jane",
			'José',
			'Michael',
			'Sarah',
			'Emma',
			'Liam',
			'Olivia',
			'Muhammad',
			'Aisha',
			'Daniel',
			'Sophia',
			'João',
			'Marie-Louise',
		],
	)
	def test_valid_first_names(self, valid_name: str) -> None:
		"""Test that valid first names pass validation."""
		assert DatasetGenerator.is_valid_first_name(valid_name) is True

	@pytest.mark.parametrize(
		'invalid_name',
		[
			# Too short
			'Al',
			'Bo',
			'Ed',
			'Jo',
			'Ia',
			'Li',
			'Ma',
			'',
			'x',
			'ab',
			# Too long (over 20 characters)
			'ABCDEFGHIJKLMNOPQRSTU',
			'VeryLongNameThatExceedsTwentyCharacters',
			# Initials with periods
			'A.J.',
			'J.R.',
			'M.A.',
			'T.J.',
			'P.G.',
			# Abbreviations ending with period
			'Jos.',
			'Wm.',
			'Th.',
			'Geo.',
			'Rob.',
			# All caps (short, likely abbreviations)
			'ABC',
			'JRB',
			'THM',
			'WKR',
			# Names with numbers
			'John2',
			'Mary3',
			'Alex1',
			'Sam123',
			'Mike0',
			# Invalid characters
			'John@Doe',
			'Mary#Jane',
			'Alex$Smith',
			'Sam*Jones',
			# Multiple consecutive hyphens or apostrophes
			'Jean--Claude',
			"O''Malley",
			'Mary--Jane',
			"Anne--Marie",
			# Suspicious pun patterns (same character repeated)
			'AAA',
			'BBB',
			'XXX',
			'aaa',
			'eeee',
			# Starting/ending with non-letter (hyphens/apostrophes at edges)
			'-John',
			'John-',
			"'John",
			"John'",
			# Initials without period
			'A.J',
			'J.R',
			'AJ',
			'JR',
			'MT',
		],
	)
	def test_invalid_first_names(self, invalid_name: str) -> None:
		"""Test that invalid first names fail validation."""
		assert DatasetGenerator.is_valid_first_name(invalid_name) is False

	def test_whitespace_trimming(self) -> None:
		"""Test that leading/trailing whitespace is trimmed correctly."""
		# Valid name with whitespace should be valid after trimming
		assert DatasetGenerator.is_valid_first_name('  John  ') is True
		assert DatasetGenerator.is_valid_first_name('\tMary\n') is True
		# Invalid name should still be invalid even with trimming
		assert DatasetGenerator.is_valid_first_name('  Al  ') is False
		assert DatasetGenerator.is_valid_first_name('  A.J.  ') is False

	def test_length_boundaries(self) -> None:
		"""Test names at length boundaries."""
		# Exactly 3 characters - valid
		assert DatasetGenerator.is_valid_first_name('Amy') is True
		assert DatasetGenerator.is_valid_first_name('Leo') is True
		# Exactly 20 characters - valid
		assert DatasetGenerator.is_valid_first_name('Nebuchadnezzar') is True
		assert DatasetGenerator.is_valid_first_name('Alexandrovich') is True
		# 2 characters - too short
		assert DatasetGenerator.is_valid_first_name('Al') is False
		# 21 characters - too long
		assert DatasetGenerator.is_valid_first_name('ABCDEFGHIJKLMNOPQRSTU') is False

	def test_hyphenated_and_apostrophe_names(self) -> None:
		"""Test names with hyphens and apostrophes."""
		# Valid hyphenated names
		assert DatasetGenerator.is_valid_first_name('Jean-Claude') is True
		assert DatasetGenerator.is_valid_first_name('Anne-Marie') is True
		assert DatasetGenerator.is_valid_first_name('Mary-Jane') is True
		assert DatasetGenerator.is_valid_first_name('Jean-Pierre') is True

		# Valid apostrophe names
		assert DatasetGenerator.is_valid_first_name("O'Malley") is True
		assert DatasetGenerator.is_valid_first_name("O'Connor") is True
		assert DatasetGenerator.is_valid_first_name("D'Angelo") is True
		assert DatasetGenerator.is_valid_first_name("O'Brien") is True

		# Invalid - hyphen or apostrophe at edges
		assert DatasetGenerator.is_valid_first_name('-John') is False
		assert DatasetGenerator.is_valid_first_name('John-') is False
		assert DatasetGenerator.is_valid_first_name("'John") is False
		assert DatasetGenerator.is_valid_first_name("John'") is False

		# Invalid - consecutive hyphens or apostrophes
		assert DatasetGenerator.is_valid_first_name('Jean--Claude') is False
		assert DatasetGenerator.is_valid_first_name("O''Malley") is False


class TestCleanNames:
	"""Test the clean_names method."""

	@pytest.fixture
	def valid_names(self) -> list[str]:
		"""Return a list of valid first names."""
		return [
			'John',
			'Mary',
			'Alexander',
			'Elizabeth',
			'Jean-Claude',
			"O'Malley",
			'Michael',
			'Sarah',
			'Emma',
			'Liam',
			'Olivia',
			'José',
			'Muhammad',
			'Aisha',
			'Daniel',
			'Sophia',
			'João',
			'Marie-Louise',
			'Anne-Marie',
			'David',
			'Jennifer',
			'Robert',
			'Lisa',
			'James',
			'Maria',
		]

	@pytest.fixture
	def invalid_names(self) -> list[str]:
		"""Return a list of invalid first names."""
		return [
			'Al',
			'Bo',
			'Ed',
			'A.J.',
			'J.R.',
			'Jos.',
			'Wm.',
			'ABC',
			'JRB',
			'John2',
			'Mary3',
			'Alex1',
			'Jean--Claude',
			"O''Malley",
			'VeryLongNameThatExceedsTwentyCharacters',
			'',
			'x',
			'ab',
			'A.J',
			'JR',
		]

	def test_clean_names_filters_invalid(self, valid_names: list[str], invalid_names: list[str]) -> None:
		"""Test that clean_names filters out invalid names."""
		mixed_names = valid_names + invalid_names
		result = DatasetGenerator.clean_names(mixed_names, target_count=len(valid_names))

		# Should only contain valid names
		assert all(DatasetGenerator.is_valid_first_name(name) for name in result)
		# Should not contain any invalid names
		assert not any(DatasetGenerator.is_valid_first_name(name) is False for name in result)

	def test_clean_names_respects_target_count(self, valid_names: list[str]) -> None:
		"""Test that clean_names respects the target_count parameter."""
		result = DatasetGenerator.clean_names(valid_names, target_count=10)
		assert len(result) == 10
		assert result == valid_names[:10]

	def test_clean_names_with_insufficient_valid_names(self, invalid_names: list[str]) -> None:
		"""Test that clean_names returns all valid names when there are fewer than target_count."""
		# Only 2 valid names mixed with many invalid ones
		mixed = invalid_names + ['John', 'Mary']
		result = DatasetGenerator.clean_names(mixed, target_count=10)

		# Should return only the 2 valid names
		assert len(result) == 2
		assert 'John' in result
		assert 'Mary' in result

	def test_clean_names_preserves_order(self, valid_names: list[str]) -> None:
		"""Test that clean_names preserves the original order of names."""
		result = DatasetGenerator.clean_names(valid_names, target_count=len(valid_names))
		assert result == valid_names

	def test_clean_names_empty_list(self) -> None:
		"""Test that clean_names handles empty input list."""
		result = DatasetGenerator.clean_names([], target_count=10)
		assert result == []

	def test_clean_names_target_count_zero(self, valid_names: list[str]) -> None:
		"""Test that clean_names returns empty list when target_count is 0."""
		result = DatasetGenerator.clean_names(valid_names, target_count=0)
		assert result == []
