"""
Blacklist of known pseudonyms, joke names, and invalid names.

These names should be filtered out regardless of names-dataset validation.
"""

# Known joke/pseudonym names from various countries
# These are obviously fake or joke names that appear in the dataset
JOKE_NAMES = {
	# German joke names
	'bredlbroad',
	'gsichtsbäichl',
	# Add more as discovered
}

# Suspicious patterns that indicate fake/test data
SUSPICIOUS_PATTERNS = [
	# Single character names (rarely valid)
	r'^.$',
	# Repeated characters (aaa, bbb, etc.)
	r'^(.)\1{2,}$',
	# All same characters with slight variation
	r'^(.)\1+(.)\2+$',
	# Consonant-only names (very rare in real names)
	r'^[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{4,}$',
]

# Names that are obviously not first names
NOT_FIRST_NAMES = {
	'unknown',
	'none',
	'anonymous',
	'test',
	'dummy',
	# Add more as discovered
}

# Country-specific blacklists (names that shouldn't appear for specific countries)
COUNTRY_SPECIFIC = {
	'US': {
		# Non-Latin script names that shouldn't be in US dataset
		# These will be filtered by character pattern validation anyway
	},
	'DE': {
		# Names that are clearly not German
		# Add as discovered
	},
	'GB': {},
	'FR': {},
	'IT': {},
	'ES': {},
	'IE': {},
}


def is_joke_name(name: str) -> bool:
	"""Check if name is a known joke or pseudonym."""
	return name.lower() in JOKE_NAMES


def is_suspicious_pattern(name: str) -> bool:
	"""Check if name matches suspicious patterns."""
	import re

	for pattern in SUSPICIOUS_PATTERNS:
		if re.match(pattern, name.lower()):
			return True
	return False


def is_not_first_name(name: str) -> bool:
	"""Check if name is obviously not a first name."""
	return name.lower() in NOT_FIRST_NAMES


def is_country_blacklisted(name: str, country: str) -> bool:
	"""Check if name is blacklisted for specific country."""
	country_blacklist = COUNTRY_SPECIFIC.get(country.upper(), set())
	return name.lower() in country_blacklist
