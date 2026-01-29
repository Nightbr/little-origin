"""
Generate extended-dataset CSV files from names-dataset library.

Uses get_top_names() to fetch top first names per gender per country.
"""

import re
import json
import os
import logging
import httpx
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
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
	use_ai: bool = False
	ai_api_key: str | None = None
	ai_model: str = 'google/gemini-2.0-flash-001'


@dataclass
class GenerationStats:
	"""Statistics for name generation."""
	
	total_names: int = 0
	male_names: int = 0
	female_names: int = 0
	
	male_fetched: int = 0
	female_fetched: int = 0
	
	male_regex_filtered: int = 0
	female_regex_filtered: int = 0
	
	male_ai_filtered: int = 0
	female_ai_filtered: int = 0


class DatasetGenerator:
	"""Generates extended-dataset CSV files using names-dataset library."""

	def __init__(self, config: GeneratorConfig, max_workers: int = 4):
		self.config = config
		self.console = Console()
		self.setup_logging()
		
		self.nd: NameDataset | None = None
		self.stats_by_country: dict[str, GenerationStats] = {}
		self.stats_lock = Lock()
		self.max_workers = max_workers
		
		self.progress = Progress(
			SpinnerColumn(),
			TextColumn('[progress.description]{task.description}'),
			BarColumn(),
			TextColumn('[progress.percentage]{task.percentage:>3.0f}%'),
			TimeRemainingColumn(),
			console=self.console,
		)
		self.progress_lock = Lock()

	def setup_logging(self):
		"""Set up file-based logging for debugging."""
		log_file = Path('generation.log')
		logging.basicConfig(
			filename=log_file,
			level=logging.DEBUG,
			format='%(asctime)s - %(threadName)s - %(levelname)s - %(message)s',
			filemode='w',  # Overwrite each run
		)
		self.console.print(f'[dim]Logging execution details to: {log_file.absolute()}[/dim]')

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

		# Must contain at least one vowel (a, e, i, o, u, y) - "Consonant only" check
		if not re.search(r'[aeiouy]', name_lower):
			return False

		# Double vowel check (reject aa, ii, uu, etc unless specifically allowed)
		# Common valid ones might be ignored, but user specifically asked to clean "sabriina", "evaa", "claraa"
		# Let's target double vowels at the end of string or unusual doubles
		# "aa" at end: "evaa", "claraa"
		if name_lower.endswith('aa'):
			return False
		# "ii" anywhere: "sabriina" -> usually "ina" or "iana"
		if 'ii' in name_lower and name_lower != 'hawaii': # simple safeguard
			return False
		# "uu" anywhere (rare in most euro languages except Dutch/Finland etc, maybe too strict for global but OK for this list)
		if 'uu' in name_lower:
			return False
		# "ee" is common (Renee), "oo" is common (Cooper) - keep those.

		# Blacklist of common words/garbage
		blacklist = {
			'rien', 'empty', 'trop', 'equipe', 'entreprise', 'bro', 'bienvenue', 'zouz',
			'null', 'undefined', 'test', 'user', 'admin', 'nom', 'prenom', 'name', 
			'surname', 'firstname', 'lastname', 'unknown', 'inconnu', 'anonymous',
			'umm',
		}
		if name_lower in blacklist:
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

	def clean_batch_with_ai(self, names: list[str]) -> list[str]:
		"""
		Clean a batch of names using OpenRouter AI.
		Returns list of valid names.
		"""
		if not self.config.use_ai:
			return names

		api_key = self.config.ai_api_key or os.environ.get('OPENROUTER_API_KEY')
		if not api_key:
			self.console.print('[yellow]Warning: AI enabled but no API key provided. Skipping AI cleaning.[/]')
			return names

		# Allow up to 3 retries
		for _ in range(3):
			try:
				prompt = (
					"Filter this list of names. Return a JSON list of strictly valid first names only. "
					"Remove words, places, brand names, garbage, full names (keep only first name), "
					"and names with obvious typos (e.g. 'sabriina', 'evaa').\n\n"
					f"Input List: {json.dumps(names)}\n\n"
					"Return ONLY the JSON list."
				)

				response = httpx.post(
					"https://openrouter.ai/api/v1/chat/completions",
					headers={
						"Authorization": f"Bearer {api_key}",
						"Content-Type": "application/json",
						"HTTP-Referer": "https://little-origin.com",
					},
					json={
						"model": self.config.ai_model,
						"messages": [{"role": "user", "content": prompt}],
						"response_format": {"type": "json_object"},
					},
					timeout=30.0
				)
				response.raise_for_status()
				data = response.json()
				content = data['choices'][0]['message']['content']
				
				# Parse JSON response - try to find the list
				try:
					cleaned_data = json.loads(content)
					# Handle { "names": [...] } or just [...]
					if isinstance(cleaned_data, dict):
						# Look for any list value
						for val in cleaned_data.values():
							if isinstance(val, list):
								return [str(n) for n in val]
						# If no list found, maybe empty?
						return []
					elif isinstance(cleaned_data, list):
						return [str(n) for n in cleaned_data]
				except json.JSONDecodeError:
					# Fallback regex extraction if JSON fails
					found = re.findall(r'"([^"]+)"', content)
					if found:
						return found
					
			except Exception as e:
				self.console.print(f'[dim yellow]AI Batch query failed: {e}. Retrying...[/]')
		
		# If we get here, AI failed repeatedly. Return original names (or empty to be safe? safe is better)
		# But returning original risks garbage. Let's return original and trust regex filters.
		self.console.print('[red]AI cleaning failed after retries. Using regex-filtered names.[/]')
		return names

	def fetch_names_until_sufficient(
		self,
		country: str,
		gender: str,
		target_count: int,
		task: TaskID,
	) -> tuple[list[str], int, int, int]:
		"""
		Fetch names from the dataset until we have enough valid names.
		Returns: (valid_names, total_fetched, regex_filtered_count, ai_filtered_count)
		"""
		all_valid_names: list[str] = []
		total_fetched = 0
		regex_filtered_total = 0
		ai_filtered_total = 0
		
		# Yield rate tracking (valid / fetched)
		yield_rate = 0.5 # Start with a neutral-to-pessimistic estimate
		current_offset = 0
		max_iterations = 50 # Increase limit for large targets
		
		logging.info(f"[{country}-{gender}] Starting fetch. Target: {target_count}")

		for iteration in range(max_iterations):
			# Calculate how many more valid names we need
			needed = target_count - len(all_valid_names)
			if needed <= 0:
				break
				
			# Estimate how many we need to fetch to get 'needed' valid ones
			# Apply a safety multiplier (1.5x) to avoid too many small iterations
			estimate_to_fetch = int((needed / yield_rate) * 1.5)
			
			# Clamp step size: min 200, max 5000 per iteration
			# If AI is enabled, we keep steps smaller (max 1000) to avoid huge AI batches
			max_step = 1000 if self.config.use_ai else 5000
			step_size = max(200, min(estimate_to_fetch, max_step))
			
			request_n = current_offset + step_size
			logging.debug(f"[{country}-{gender}] Iteration {iteration+1}: Requesting top {request_n} (step: {step_size}, current yield: {yield_rate:.2f})")
			
			result = self.nd.get_top_names(
				n=request_n,
				use_first_names=True,
				country_alpha2=country,
				gender=gender,
			)
			full_list = result.get(country, {}).get(gender, [])
			
			# Get only the new names from the top N list
			batch = full_list[current_offset:]
			if not batch:
				logging.info(f"[{country}-{gender}] No more names returned by dataset. Final count: {len(all_valid_names)}")
				break
				
			current_offset = len(full_list)
			batch_fetched_count = len(batch)
			total_fetched += batch_fetched_count

			# 1. Regex Filter
			regex_valid = [name for name in batch if self.is_valid_first_name(name)]
			regex_dropped = len(batch) - len(regex_valid)
			regex_filtered_total += regex_dropped
			
			# 2. AI Filter (if enabled)
			final_batch = []
			if self.config.use_ai and regex_valid:
				# Process in chunks of 100 for AI
				ai_valid_names = []
				chunk_size = 100
				for i in range(0, len(regex_valid), chunk_size):
					chunk = regex_valid[i:i+chunk_size]
					cleaned_chunk = self.clean_batch_with_ai(chunk)
					ai_valid_names.extend(cleaned_chunk)
				
				# Verify format again
				final_batch = [n for n in ai_valid_names if self.is_valid_first_name(n)]
				
				ai_dropped = len(regex_valid) - len(final_batch)
				ai_filtered_total += ai_dropped
			else:
				final_batch = regex_valid

			# Add new valid names (preserving order)
			for name in final_batch:
				if name not in all_valid_names:
					all_valid_names.append(name)
			
			# Update yield rate based on this batch's performance
			# We use a moving average or just the cumulative rate
			if total_fetched > 0:
				current_batch_yield = len(final_batch) / batch_fetched_count if batch_fetched_count > 0 else 0
				# Moving average to stay responsive to data quality changes
				yield_rate = (yield_rate * 0.3) + (current_batch_yield * 0.7)
				yield_rate = max(0.01, yield_rate) # Don't let it hit zero

			with self.progress_lock:
				self.progress.update(
					task,
					description=f'[cyan]Fetching {country} {gender} names ({len(all_valid_names)}/{target_count})[/cyan]',
				)

		logging.info(f"[{country}-{gender}] Finished. Got {len(all_valid_names)}/{target_count} names in {iteration+1} iterations.")
		# Return exactly target_count names
		return all_valid_names[:target_count], total_fetched, regex_filtered_total, ai_filtered_total

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
		male_names, male_total_fetched, male_regex, male_ai = self.fetch_names_until_sufficient(
			country=country,
			gender='M',
			target_count=target_count,
			task=task,
		)
		stats.male_fetched = male_total_fetched
		stats.male_regex_filtered = male_regex
		stats.male_ai_filtered = male_ai

		# Fetch female names (with automatic retry until we have enough)
		with self.progress_lock:
			self.progress.update(
				task,
				description=f'[cyan]Fetching {country} F names[/cyan]',
				completed=50,
			)

		female_names, female_total_fetched, female_regex, female_ai = self.fetch_names_until_sufficient(
			country=country,
			gender='F',
			target_count=target_count,
			task=task,
		)
		stats.female_fetched = female_total_fetched
		stats.female_regex_filtered = female_regex
		stats.female_ai_filtered = female_ai

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
		summary_table.add_column('Fetched', justify='right', style='dim')
		summary_table.add_column('Male', justify='right', style='blue')
		summary_table.add_column('Female', justify='right', style='magenta')
		summary_table.add_column('Total', justify='right', style='bold')
		summary_table.add_column('Regex Filt', justify='right', style='yellow')
		summary_table.add_column('AI Filt', justify='right', style='red')

		# Sort countries by original order
		for country in self.config.countries:
			stats = self.stats_by_country.get(country)
			if not stats:
				continue

			total_fetched = stats.male_fetched + stats.female_fetched
			total_regex = stats.male_regex_filtered + stats.female_regex_filtered
			total_ai = stats.male_ai_filtered + stats.female_ai_filtered
			
			summary_table.add_row(
				country,
				f'{total_fetched:,}',
				f'{stats.male_names:,}',
				f'{stats.female_names:,}',
				f'{stats.total_names:,}',
				f'{total_regex:,}',
				f'{total_ai:,}',
			)

		# Print final summary
		self.console.print('\n')
		self.console.print(summary_table)
