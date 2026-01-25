"""
Generate extended-dataset CSV files from names-dataset library.

Uses get_top_names() to fetch top first names per gender per country.
"""

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

		# Get top first names for this country
		names_per_gender = self.config.names_per_gender

		with self.progress_lock:
			self.progress.update(task, description=f'[cyan]Fetching {country} names[/cyan]', completed=33)

		# Fetch male names
		male_result = self.nd.get_top_names(
			n=names_per_gender,
			use_first_names=True,
			country_alpha2=country,
			gender='M',
		)
		male_names = male_result.get(country, {}).get('M', [])

		with self.progress_lock:
			self.progress.update(task, completed=66)

		# Fetch female names
		female_result = self.nd.get_top_names(
			n=names_per_gender,
			use_first_names=True,
			country_alpha2=country,
			gender='F',
		)
		female_names = female_result.get(country, {}).get('F', [])

		stats.male_names = len(male_names)
		stats.female_names = len(female_names)
		stats.total_names = stats.male_names + stats.female_names

		with self.progress_lock:
			self.progress.update(task, completed=90)

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

		# Sort countries by original order
		for country in self.config.countries:
			stats = self.stats_by_country.get(country)
			if not stats:
				continue

			summary_table.add_row(
				country,
				f'{stats.male_names:,}',
				f'{stats.female_names:,}',
				f'{stats.total_names:,}',
			)

		# Print final summary
		self.console.print('\n')
		self.console.print(summary_table)
