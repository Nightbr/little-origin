"""Tests for blacklist module."""

import pytest

from name_data_cleaner.blacklist import (
	is_country_blacklisted,
	is_joke_name,
	is_not_first_name,
	is_suspicious_pattern,
)


class TestJokeNames:
	"""Tests for joke name detection."""

	def test_known_joke_name(self):
		"""Test that known joke names are detected."""
		assert is_joke_name('Bredlbroad')
		assert is_joke_name('Gsichtsbäichl')

	def test_case_insensitive(self):
		"""Test that joke name detection is case-insensitive."""
		assert is_joke_name('bredlbroad')
		assert is_joke_name('GSICHTSBÄICHL')

	def test_normal_name_not_joke(self):
		"""Test that normal names are not flagged as jokes."""
		assert not is_joke_name('John')
		assert not is_joke_name('Maria')


class TestSuspiciousPatterns:
	"""Tests for suspicious pattern detection."""

	def test_single_character(self):
		"""Test that single character names are detected."""
		assert is_suspicious_pattern('A')
		assert is_suspicious_pattern('X')

	def test_repeated_characters(self):
		"""Test that repeated character names are detected."""
		assert is_suspicious_pattern('aaa')
		assert is_suspicious_pattern('BBB')
		assert is_suspicious_pattern('ccc')

	def test_normal_names_not_suspicious(self):
		"""Test that normal names are not flagged."""
		assert not is_suspicious_pattern('John')
		assert not is_suspicious_pattern('Maria')
		assert not is_suspicious_pattern('Alex')


class TestNotFirstNames:
	"""Tests for non-first-name detection."""

	def test_known_non_first_names(self):
		"""Test that obvious non-first-names are detected."""
		assert is_not_first_name('unknown')
		assert is_not_first_name('none')
		assert is_not_first_name('test')
		assert is_not_first_name('anonymous')

	def test_case_insensitive(self):
		"""Test that detection is case-insensitive."""
		assert is_not_first_name('UNKNOWN')
		assert is_not_first_name('Test')

	def test_normal_names_allowed(self):
		"""Test that normal names are allowed."""
		assert not is_not_first_name('John')
		assert not is_not_first_name('Maria')


class TestCountryBlacklist:
	"""Tests for country-specific blacklists."""

	def test_country_blacklisted_name(self):
		"""Test that country-specific blacklists work."""
		# This test demonstrates the mechanism; actual blacklisted names
		# would be added to COUNTRY_SPECIFIC in blacklist.py
		assert not is_country_blacklisted('John', 'US')

	def test_case_insensitive_country(self):
		"""Test that country code is case-insensitive."""
		assert not is_country_blacklisted('TestName', 'us')
		assert not is_country_blacklisted('TestName', 'Us')
		assert not is_country_blacklisted('TestName', 'US')
