"""
Custom validation rules for name filtering.

These rules complement the names-dataset library with additional checks.
"""

import regex
from typing import Optional


# Character set patterns for country-specific validation
# Based on Unicode ranges for different scripts
COUNTRY_PATTERNS = {
	# Latin script with common diacritics
	'US': regex.compile(r'^[\p{L}\'\-\. ]+$', regex.UNICODE),
	'GB': regex.compile(r'^[\p{L}\'\-\. ]+$', regex.UNICODE),
	'FR': regex.compile(r'^[\p{L}\'\-\. ]+$', regex.UNICODE),
	'DE': regex.compile(r'^[\p{L}\'\-\. ]+$', regex.UNICODE),
	'IT': regex.compile(r'^[\p{L}\'\-\. ]+$', regex.UNICODE),
	'ES': regex.compile(r'^[\p{L}\'\-\. ]+$', regex.UNICODE),
	'IE': regex.compile(r'^[\p{L}\'\-\. ]+$', regex.UNICODE),
}


# Non-Latin script patterns (to detect and filter)
NON_LATIN_PATTERNS = [
	# Arabic script
	regex.compile(r'[\u0600-\u06FF]'),
	# Cyrillic script
	regex.compile(r'[\u0400-\u04FF]'),
	# Greek script
	regex.compile(r'[\u0370-\u03FF]'),
	# Chinese characters
	regex.compile(r'[\u4E00-\u9FFF]'),
	# Japanese characters
	regex.compile(r'[\u3040-\u309F\u30A0-\u30FF]'),
	# Korean characters
	regex.compile(r'[\uAC00-\uD7AF]'),
	# Thai script
	regex.compile(r'[\u0E00-\u0E7F]'),
	# Hebrew script
	regex.compile(r'[\u0590-\u05FF]'),
	# Devanagari (Hindi, etc.)
	regex.compile(r'[\u0900-\u097F]'),
]


# Valid name patterns by country (more specific than just character sets)
VALID_NAME_PATTERNS = {
	'US': regex.compile(r'^[A-ZÀ-ÖØ-öø-ÿ][a-zà-öø-ÿ\'\-\.]*(?: [A-ZÀ-ÖØ-öø-ÿ][a-zà-öø-ÿ\'\-\.]*)*$', regex.UNICODE),
	'GB': regex.compile(r'^[A-ZÀ-ÖØ-öø-ÿ][a-zà-öø-ÿ\'\-\.]*(?: [A-ZÀ-ÖØ-öø-ÿ][a-zà-öø-ÿ\'\-\.]*)*$', regex.UNICODE),
	'DE': regex.compile(r'^[A-ZÄÖÜ][a-zäöüß\'\-\.]*(?: [A-ZÄÖÜ][a-zäöüß\'\-\.]*)*$', regex.UNICODE),
	'FR': regex.compile(r'^[A-ZÀÂÆÇÉÈÊËÏÎÔÙÛÜŸ][a-zàâæçéèêëïîôùûüÿ\'\-\.]*(?: [A-ZÀÂÆÇÉÈÊËÏÎÔÙÛÜŸ][a-zàâæçéèêëïîôùûüÿ\'\-\.]*)*$', regex.UNICODE),
	'IT': regex.compile(r'^[A-ZÀÈÉÌÒÙ][a-zàèéìòù\'\-\.]*(?: [A-ZÀÈÉÌÒÙ][a-zàèéìòù\'\-\.]*)*$', regex.UNICODE),
	'ES': regex.compile(r'^[A-ZÁÉÍÓÚÑ][a-záéíóúñü\'\-\.]*(?: [A-ZÁÉÍÓÚÑ][a-záéíóúñü\'\-\.]*)*$', regex.UNICODE),
	'IE': regex.compile(r'^[A-ZÁÉÍÓÚ][a-záéíóú\'\-\.]*(?: [A-ZÁÉÍÓÚ][a-záéíóú\'\-\.]*)*$', regex.UNICODE),
}


class ValidationError:
	"""Represents a validation error with reason."""
	def __init__(self, reason: str, details: str = ''):
		self.reason = reason
		self.details = details

	def __bool__(self) -> bool:
		return False


def validate_character_set(name: str, country: str) -> Optional[ValidationError]:
	"""
	Validate that name only contains appropriate characters for the country.

	Checks for:
	- Non-Latin scripts (Arabic, Cyrillic, Chinese, etc.)
	- Valid country-specific character patterns
	"""
	# Check for non-Latin scripts first
	for pattern in NON_LATIN_PATTERNS:
		if pattern.search(name):
			return ValidationError('non_latin_script', f'Contains non-Latin characters: {name}')

	# Check country-specific pattern
	pattern = COUNTRY_PATTERNS.get(country.upper())
	if pattern and not pattern.match(name):
		return ValidationError('invalid_characters', f'Invalid characters for {country}: {name}')

	return None


def validate_name_format(name: str, country: str) -> Optional[ValidationError]:
	"""
	Validate that name follows proper format for the country.

	Checks:
	- Starts with capital letter
	- Proper capitalization
	- Valid structure (no excessive special characters)
	"""
	pattern = VALID_NAME_PATTERNS.get(country.upper())
	if pattern and not pattern.match(name):
		return ValidationError('invalid_format', f'Invalid name format for {country}: {name}')

	return None


def validate_length(name: str, min_length: int = 3, max_length: int = 20) -> Optional[ValidationError]:
	"""Validate name length constraints."""
	if len(name) < min_length:
		return ValidationError('too_short', f'Name too short ({len(name)} < {min_length}): {name}')

	if len(name) > max_length:
		return ValidationError('too_long', f'Name too long ({len(name)} > {max_length}): {name}')

	return None


def validate_double_names(name: str) -> Optional[ValidationError]:
	"""
	Validate double first names (e.g., "Jose Luis", "Mary Anne").

	Some datasets include double first names. This function:
	- Allows common double names
	- Validates both parts are valid names
	"""
	if ' ' not in name:
		return None

	parts = name.split()
	if len(parts) > 2:
		return ValidationError('too_many_parts', f'Name has too many parts: {name}')

	# Both parts should be capitalized properly
	for part in parts:
		if not part[0].isupper():
			return ValidationError('invalid_capitalization', f'Part not capitalized: {part} in {name}')

	return None


def validate_with_names_dataset(
	name: str,
	gender: str,
	country: str,
	names_dataset,
	min_rank: int = 5000,
) -> Optional[ValidationError]:
	"""
	Validate name using names-dataset library.

	Args:
		name: The name to validate
		gender: 'M' or 'F'
		country: Country code (e.g., 'US', 'DE')
		names_dataset: Instance of NameDataset
		min_rank: Minimum rank threshold (lower is more popular)
				  Names with rank > min_rank are considered too rare

	Returns:
		ValidationError if validation fails, None if passes
	"""
	from names_dataset import NameWrapper

	gender_map = {'M': 'Male', 'F': 'Female'}
	normalized_gender = gender_map.get(gender.upper())

	if not normalized_gender:
		return ValidationError('invalid_gender', f'Invalid gender: {gender}')

	result = names_dataset.search(name)

	# Check if result is None or doesn't contain first_name data
	if result is None:
		return ValidationError('not_found', f'Name not found in names-dataset: {name}')

	if 'first_name' not in result:
		return ValidationError('not_found', f'Name not found in names-dataset: {name}')

	first_name_data = result['first_name']

	# first_name_data might be None even if the key exists
	if first_name_data is None:
		return ValidationError('not_found', f'Name not found in names-dataset: {name}')

	# Check if name exists for this country
	country_data = first_name_data.get('country', {})
	if country.upper() not in country_data:
		return ValidationError(
			'country_mismatch',
			f'Name {name} not found for country {country}. Found in: {list(country_data.keys())[:5]}',
		)

	# Check if gender matches
	gender_data = first_name_data.get('gender', {})
	gender_prob = gender_data.get(normalized_gender, 0)

	if gender_prob < 0.5:
		return ValidationError(
			'gender_mismatch',
			f'Gender mismatch for {name}: expected {normalized_gender}, got distribution: {gender_data}',
		)

	# Check rank (popularity)
	rank_data = first_name_data.get('rank', {})
	country_rank = rank_data.get(country)

	if country_rank and country_rank > min_rank:
		return ValidationError(
			'too_rare',
			f'Name {name} too rare in {country} (rank {country_rank} > {min_rank})',
		)

	return None


def validate_all(name: str, gender: str, country: str, names_dataset, **kwargs) -> Optional[ValidationError]:
	"""
	Run all validations on a name.

	Args:
		name: The name to validate
		gender: 'M' or 'F'
		country: Country code
		names_dataset: Instance of NameDataset
		**kwargs: Additional parameters (min_rank, min_length, max_length, skip_length_check)

	Returns:
		ValidationError if any validation fails, None if all pass
	"""
	# Import blacklist functions
	from .blacklist import (
		is_country_blacklisted,
		is_joke_name,
		is_not_first_name,
		is_suspicious_pattern,
	)

	# Check blacklist first (fast checks)
	if is_joke_name(name):
		return ValidationError('joke_name', f'Known joke/pseudonym: {name}')

	if is_suspicious_pattern(name):
		return ValidationError('suspicious_pattern', f'Suspicious pattern: {name}')

	if is_not_first_name(name):
		return ValidationError('not_first_name', f'Not a first name: {name}')

	if is_country_blacklisted(name, country):
		return ValidationError('country_blacklisted', f'Blacklisted for {country}: {name}')

	# Validate length (can be skipped if already checked)
	skip_length_check = kwargs.get('skip_length_check', False)
	if not skip_length_check:
		min_length = kwargs.get('min_length', 3)
		max_length = kwargs.get('max_length', 20)
		length_error = validate_length(name, min_length, max_length)
		if length_error:
			return length_error

	# Validate character set
	char_error = validate_character_set(name, country)
	if char_error:
		return char_error

	# Validate format
	format_error = validate_name_format(name, country)
	if format_error:
		return format_error

	# Validate double names
	double_name_error = validate_double_names(name)
	if double_name_error:
		return double_name_error

	# Validate with names-dataset (most expensive check - do last)
	min_rank = kwargs.get('min_rank', 5000)
	dataset_error = validate_with_names_dataset(name, gender, country, names_dataset, min_rank)
	if dataset_error:
		return dataset_error

	return None
