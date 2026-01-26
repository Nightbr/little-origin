"""
Generate extended-dataset CSV files from names-dataset library.

Uses get_top_names() to fetch top first names per gender per country.
"""

import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from threading import Lock

from names_dataset import NameDataset
from rich.console import Console
from rich.progress import (
	BarColumn,
	Progress,
	SpinnerColumn,
	TextColumn,
	TimeRemainingColumn,
	TaskID,
)
from rich.live import Live
from rich.table import Table

# Countries we support (matching existing datasets)
COUNTRIES = ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'IE']
DEFAULT_NAMES_PER_GENDER = 250


@dataclass
class GeneratorConfig:
	"""Configuration for the dataset generator."""

	output_dir: Path
	countries: list[str]
	names_per_gender: int = DEFAULT_NAMES_PER_GENDER


@dataclass
class GenerationStats:
	"""Statistics for name generation."""

	total_names: int = 0
	male_names: int = 0
	female_names: int = 0
	male_filtered: int = 0
	female_filtered: int = 0


class DatasetGenerator:
	"""Generates extended-dataset CSV files using names-dataset library."""

	def __init__(self, config: GeneratorConfig, max_workers: int = 4):
		self.config = config
		self.console = Console()
		self.nd: NameDataset | None = None
		self.stats_by_country: dict[str, GenerationStats] = {}
		self.stats_lock = Lock()  # Thread-safe stats tracking
		self.max_workers = max_workers
		# Shared progress for all workers
		self.progress = Progress(
			SpinnerColumn(),
			TextColumn('[progress.description]{task.description}'),
			BarColumn(),
			TextColumn('[progress.percentage]{task.percentage:>3.0f}%'),
			TimeRemainingColumn(),
			console=self.console,
		)
		self.progress_lock = Lock()  # Thread-safe progress updates

	def initialize_dataset(self):
		"""Initialize the names-dataset library (takes time and memory)."""
		self.console.print('[bold yellow]Initializing names-dataset...[/]')
		self.console.print('[dim]This requires ~3.2GB of RAM and may take a moment.[/]')
		self.nd = NameDataset()
		self.console.print('[bold green]✓[/] names-dataset initialized')

	@staticmethod
	def is_valid_first_name(name: str) -> bool:
		"""
		Check if a name is a valid first name.

		Filter out:
		- Names that are too short (< 3 chars)
		- Names that are too long (> 20 chars)
		- Initials (e.g., "A.J.", "J.R.", single letters)
		- Abbreviations (e.g., "Jos.", "Wm.", "Antho", "Clem")
		- Names with numbers
		- Names with suspicious patterns (all caps, multiple periods, etc.)
		- Reduplicated nicknames (Titi, Momo, Boubou, etc.)
		- Common words (Bonjour, Salut, Petit, etc.)

		Args:
			name: The name to validate

		Returns:
			True if the name is valid, False otherwise
		"""
		# Remove leading/trailing whitespace
		name = name.strip()
		name_lower = name.lower()

		# Length checks
		if len(name) < 3 or len(name) > 20:
			return False

		# No numbers allowed
		if re.search(r'\d', name):
			return False

		# No initials with periods (e.g., "A.J.", "J.R.")
		if re.match(r'^[A-Z]\.?[A-Z]\.?', name):
			return False

		# No abbreviations ending with period (e.g., "Jos.", "Wm.")
		if name.endswith('.'):
			return False

		# No all-caps names (likely abbreviations)
		if name.isupper() and len(name) <= 4:
			return False

		# Must contain at least one letter (including Unicode)
		if not re.search(r'\w', name, re.UNICODE):
			return False

		# Allow only letters (including Unicode), hyphens, and apostrophes
		# Must start and end with a letter
		if not re.match(r'^\w[\w\-\']*\w$', name, re.UNICODE):
			return False

		# No multiple consecutive hyphens or apostrophes
		if '--' in name or "''" in name:
			return False

		# No suspicious pun patterns (all same character repeated)
		if len(set(name_lower.replace('-', '').replace("'", ''))) <= 1:
			return False

		# Filter reduplicated nicknames (Titi, Momo, Boubou, etc.)
		# Pattern: 2 syllables with same or similar sounds
		if re.match(r'^(\w{1,3})\1+$', name_lower):
			return False

		# Specific reduplicated patterns
		reduplicated = {
			'titi', 'toto', 'momo', 'bobo', 'gigi', 'lolo', 'dodo',
			'coco', 'jojo', 'doudou', 'boubou', 'moumoune', 'chou',
			'nounou', 'loulou', 'fifi', 'riri', 'sisi', 'zizi',
		}
		if name_lower in reduplicated:
			return False

		# Filter common French/English words and greetings
		common_words = {
			'bonjour', 'salut', 'hello', 'petit', 'petite', 'grand',
			'grande', 'monsieur', 'madame', 'mademoiselle', 'ami', 'amie',
			'frere', 'soeur', 'fils', 'fille', 'garcon', 'fille',
			'mr', 'mrs', 'ms', 'miss', 'dr', 'prof',
		}
		if name_lower in common_words:
			return False

		# Filter very short clipped abbreviations
		# These are typically nicknames: Antho, Clem, Flo, Seb, Stef, Xav, etc.
		clipped_abbreviations = {
			'antho', 'clem', 'djo', 'flo', 'jerem', 'seb', 'stef', 'xav',
			'ced', 'gigi', 'dodo', 'loul', 'nini', 'toutou', 'mouss',
			'boba', 'kika', 'nana', 'baba', 'riri', 'fifi', 'sisi',
		}
		if name_lower in clipped_abbreviations:
			return False

		# Filter diminutives ending in -ou or -o (very short ones)
		# These are typically affectionate nicknames: Boubou, Momo, Lolo, etc.
		diminutives = {
			'boubou', 'momo', 'lolo', 'djo', 'nino', 'toto', 'titi',
			'coco', 'jojo', 'gigi', 'mouss', 'loulou', 'doudou',
		}
		if name_lower in diminutives:
			return False

		# Filter very short single-syllable nicknames (3-4 chars)
		# Many of these are valid but also common nicknames
		# Be more conservative - only filter the most obvious ones
		obvious_nicknames = {
			'ben', 'dan', 'dom', 'fab', 'gil', 'jack', 'jim', 'joe',
			'jul', 'kev', 'mat', 'med', 'mick', 'mike', 'nico', 'phil',
			'sam', 'stan', 'tom', 'ted', 'tim', 'bob', 'max', 'totof', 
			'papi', 'doudou', 'loulou', 'coco', 'mimi', 'gigi', 'bibi', 
			'titi', 'toto', 'lolo', 'nini', 'momo', 'bobo', 'kiki', 'fifi', 
			'sisi', 'zizi', 'riri', 'jaja', 'mama', 'papa', 'dodo', 'lili',
		}
		if name_lower in obvious_nicknames:
			return False

		return True

	@staticmethod
	def clean_names(names: list[str], target_count: int) -> list[str]:
		"""
		Clean and filter a list of names to get valid first names.

		Args:
			names: List of candidate names (should be 15-20% more than target_count)
			target_count: Desired number of valid names to return

		Returns:
			List of valid names (up to target_count)
		"""
		valid_names = [name for name in names if DatasetGenerator.is_valid_first_name(name)]

		# Return only the requested amount
		return valid_names[:target_count]

	def fetch_names_until_sufficient(
		self,
		country: str,
		gender: str,
		target_count: int,
		task: TaskID,
	) -> tuple[list[str], int]:
		"""
		Fetch names from the dataset until we have enough valid names.

		Keeps fetching in batches until we reach the target count or exhaust
		available names.

		Args:
			country: Country code (e.g., 'US', 'DE')
			gender: 'M' or 'F'
			target_count: Desired number of valid names
			task: Progress bar task ID

		Returns:
			Tuple of (valid_names, total_fetched)
		"""
		all_valid_names: list[str] = []
		total_fetched = 0
		batch_size = int(target_count * 1.2)  # Start with 20% buffer
		max_iterations = 5  # Safety limit to prevent infinite loops

		for iteration in range(max_iterations):
			# Fetch a batch of names
			result = self.nd.get_top_names(
				n=batch_size,
				use_first_names=True,
				country_alpha2=country,
				gender=gender,
			)
			batch = result.get(country, {}).get(gender, [])
			total_fetched += len(batch)

			# Filter valid names from this batch
			valid_batch = [name for name in batch if self.is_valid_first_name(name)]
			all_valid_names.extend(valid_batch)

			# Update progress to show we're working
			with self.progress_lock:
				progress_pct = 25 + (25 * (iteration + 1) / max_iterations)
				self.progress.update(
					task,
					completed=progress_pct,
					description=f'[cyan]Fetching {country} {gender} names ({len(all_valid_names)}/{target_count})[/cyan]',
				)

			# Check if we have enough valid names
			if len(all_valid_names) >= target_count:
				break

			# If we got fewer names than requested in this batch, we've exhausted the dataset
			if len(batch) < batch_size:
				break

		# Return exactly target_count names
		return all_valid_names[:target_count], total_fetched

	def generate_country(self, country: str, task: TaskID) -> GenerationStats:
		"""
		Generate a single country's CSV file.

		Args:
			country: Country code (e.g., 'US', 'DE')
			task: The progress bar task ID for this country

		Returns:
			GenerationStats with the results
		"""
		output_file = self.config.output_dir / f'{country}.csv'
		stats = GenerationStats()

		with self.stats_lock:
			self.stats_by_country[country] = stats

		# Create output directory if needed
		output_file.parent.mkdir(parents=True, exist_ok=True)

		target_count = self.config.names_per_gender

		# Fetch male names (with automatic retry until we have enough)
		male_names, male_total_fetched = self.fetch_names_until_sufficient(
			country=country,
			gender='M',
			target_count=target_count,
			task=task,
		)
		stats.male_filtered = male_total_fetched - len(male_names)

		# Fetch female names (with automatic retry until we have enough)
		with self.progress_lock:
			self.progress.update(
				task,
				description=f'[cyan]Fetching {country} F names[/cyan]',
				completed=50,
			)

		female_names, female_total_fetched = self.fetch_names_until_sufficient(
			country=country,
			gender='F',
			target_count=target_count,
			task=task,
		)
		stats.female_filtered = female_total_fetched - len(female_names)

		stats.male_names = len(male_names)
		stats.female_names = len(female_names)
		stats.total_names = stats.male_names + stats.female_names

		with self.progress_lock:
			self.progress.update(
				task,
				description=f'[cyan]Writing {country} names[/cyan]',
				completed=90,
			)

		# Write to CSV
		with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
			# No header row - matching existing format
			# Format: first_name,,gender,country (empty last_name)
			for first_name in male_names:
				outfile.write(f'{first_name},,M,{country}\n')
			for first_name in female_names:
				outfile.write(f'{first_name},,F,{country}\n')

		# Mark as complete
		with self.progress_lock:
			self.progress.update(task, completed=100)
			self.progress.update(task, description=f'[green]✓[/green] [dim]{country}[/dim]')

		return stats

	def generate_all(self):
		"""Generate all configured country datasets in parallel."""
		self.initialize_dataset()

		self.console.print(f'\n[bold]Generating datasets for {len(self.config.countries)} countries[/bold]')
		self.console.print(f'[dim]Names per gender: {self.config.names_per_gender:,}[/dim]')
		self.console.print(f'[dim]Workers: {self.max_workers}[/dim]\n')

		# Create progress bar tasks for each country
		tasks: dict[str, TaskID] = {}
		for country in self.config.countries:
			task = self.progress.add_task(f'[cyan]Generating {country}[/cyan]', total=100)
			tasks[country] = task

		# Process countries in parallel with live progress display
		with Live(self.progress, console=self.console, refresh_per_second=10):
			with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
				# Submit all tasks with their progress task IDs
				future_to_country = {
					executor.submit(self.generate_country, country, tasks[country]): country
					for country in tasks.keys()
				}

				# Collect results as they complete
				for future in as_completed(future_to_country):
					country = future_to_country[future]
					try:
						stats = future.result()
					except Exception as e:
						with self.progress_lock:
							self.console.print(f'[red]✗[/] [dim]{country}[/dim] failed: {e}')

		# Build summary table after all processing is complete
		self.console.print('\n[bold]Building summary...[/]')
		summary_table = Table(title='Generation Summary', show_header=True, header_style='bold magenta')
		summary_table.add_column('Country', style='cyan')
		summary_table.add_column('Male', justify='right', style='blue')
		summary_table.add_column('Female', justify='right', style='magenta')
		summary_table.add_column('Total', justify='right')
		summary_table.add_column('Filtered', justify='right', style='yellow')

		# Sort countries by original order
		for country in self.config.countries:
			stats = self.stats_by_country.get(country)
			if not stats:
				continue

			total_filtered = stats.male_filtered + stats.female_filtered
			summary_table.add_row(
				country,
				f'{stats.male_names:,}',
				f'{stats.female_names:,}',
				f'{stats.total_names:,}',
				f'{total_filtered:,}' if total_filtered > 0 else '[dim]0[/dim]',
			)

		# Print final summary
		self.console.print('\n')
		self.console.print(summary_table)
