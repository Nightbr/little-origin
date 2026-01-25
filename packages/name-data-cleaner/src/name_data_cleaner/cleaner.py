"""
Main cleaning logic for extended-dataset CSV files.

Processes CSV files line by line, validates names, and outputs cleaned files.
"""

import csv
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path
from threading import Lock
from typing import Optional

from names_dataset import NameDataset
from rich.console import Console, Group
from rich.live import Live
from rich.panel import Panel
from rich.progress import (
	BarColumn,
	Progress,
	SpinnerColumn,
	TextColumn,
	TimeRemainingColumn,
	TaskID,
)
from rich.table import Table

from .validators import ValidationError, validate_all


def count_lines_fast(file_path: Path) -> int:
	"""
	Count lines in a file efficiently without loading into memory.

	Uses buffered reading for speed - much faster than loading the entire file.

	Args:
		file_path: Path to the file

	Returns:
		Number of lines in the file
	"""
	count = 0
	buf_size = 1024 * 1024  # 1MB buffer

	with open(file_path, 'rb') as f:
		buf = f.read(buf_size)
		while buf:
			count += buf.count(b'\n')
			buf = f.read(buf_size)

	return count


@dataclass
class CleaningStats:
	"""Statistics for the cleaning process."""
	total_rows: int = 0
	valid_rows: int = 0
	filtered_rows: int = 0
	filtered_reasons: dict[str, int] = field(default_factory=dict)

	def add_filtered(self, reason: str):
		"""Increment counter for a specific filter reason."""
		self.filtered_rows += 1
		self.filtered_reasons[reason] = self.filtered_reasons.get(reason, 0) + 1


@dataclass
class CleaningConfig:
	"""Configuration for the cleaning process."""
	input_dir: Path
	output_dir: Path
	countries: list[str]
	min_length: int = 3
	max_length: int = 20
	min_rank: int = 5000  # Maximum rank (higher = more permissive)


class DatasetCleaner:
	"""Cleans extended-dataset CSV files using names-dataset validation."""

	def __init__(self, config: CleaningConfig, max_workers: Optional[int] = None):
		self.config = config
		self.console = Console()
		self.nd: Optional[NameDataset] = None
		self.stats_by_country: dict[str, CleaningStats] = {}
		self.stats_lock = Lock()  # Thread-safe stats tracking
		self.max_workers = max_workers or min(4, len(config.countries))  # Limit to 4 workers
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

	def clean_country(self, country: str, task: TaskID) -> CleaningStats:
		"""
		Clean a single country's CSV file.

		Args:
			country: Country code (e.g., 'US', 'DE')
			task: The progress bar task ID for this country

		Returns:
			CleaningStats with the results
		"""
		input_file = self.config.input_dir / f'{country}.csv'
		output_file = self.config.output_dir / f'{country}.csv'

		if not input_file.exists():
			with self.progress_lock:
				self.console.print(f'[red]✗[/] Input file not found: {input_file}')
			return CleaningStats()

		stats = CleaningStats()
		with self.stats_lock:
			self.stats_by_country[country] = stats

		# Create output directory if needed
		output_file.parent.mkdir(parents=True, exist_ok=True)

		# Count total rows for accurate progress tracking (fast, doesn't load file)
		with self.progress_lock:
			self.console.print(f'[dim]Counting rows in {country}.csv...[/]')
		total_rows = count_lines_fast(input_file)
		with self.progress_lock:
			self.console.print(f'[dim]→ {total_rows:,} rows found[/]')

		with open(input_file, 'r', encoding='utf-8', newline='') as infile, \
		     open(output_file, 'w', encoding='utf-8', newline='') as outfile:

			reader = csv.reader(infile)
			writer = csv.writer(outfile)

			# Batch valid rows for faster writing
			valid_rows_batch: list[list[str]] = []
			BATCH_SIZE = 1000

			# Pre-fetch config values to avoid attribute lookups
			min_length = self.config.min_length
			max_length = self.config.max_length
			min_rank = self.config.min_rank

			for row in reader:
				stats.total_rows += 1

				# Update progress every 10000 rows
				if stats.total_rows % 10000 == 0:
					with self.progress_lock:
						self.progress.update(task, completed=stats.total_rows)

				# Parse CSV row
				if len(row) < 3:
					stats.add_filtered('invalid_csv_format')
					continue

				first_name = row[0]
				gender_raw = row[2]

				# Fast pre-checks before expensive operations
				# Check length first (very fast)
				name_len = len(first_name)
				if name_len < min_length or name_len > max_length:
					stats.add_filtered('too_short' if name_len < min_length else 'too_long')
					continue

				# Fast gender check
				if gender_raw != 'M' and gender_raw != 'F' and gender_raw != 'm' and gender_raw != 'f':
					stats.add_filtered('invalid_gender')
					continue

				# Normalize gender once
				gender = gender_raw.upper()

				# Strip whitespace (only if name passed length check)
				first_name = first_name.strip()

				# Validate name (only names that passed fast checks)
				error = validate_all(
					first_name,
					gender,
					country,
					self.nd,
					min_length=min_length,
					max_length=max_length,
					min_rank=min_rank,
					skip_length_check=True,  # Already checked above
				)

				if error:
					stats.add_filtered(error.reason)
					continue

				# Valid row - batch for writing
				valid_rows_batch.append(row)
				stats.valid_rows += 1

				# Write batch when full
				if len(valid_rows_batch) >= BATCH_SIZE:
					writer.writerows(valid_rows_batch)
					valid_rows_batch.clear()

			# Write remaining rows
			if valid_rows_batch:
				writer.writerows(valid_rows_batch)

		# Final update - mark task as complete
		with self.progress_lock:
			self.progress.update(task, completed=stats.total_rows)
			# Update task description to show completion
			self.progress.update(task, description=f'[green]✓[/green] [dim]{country}[/dim]')

		return stats

	def clean_all(self):
		"""Clean all configured country datasets in parallel."""
		self.initialize_dataset()

		self.console.print(f'\n[bold]Processing {len(self.config.countries)} countries in parallel[/bold]')
		self.console.print(f'[dim]Workers: {self.max_workers}[/dim]\n')

		# Create progress bar tasks for each country
		tasks: dict[str, TaskID] = {}
		for country in self.config.countries:
			# Count rows first to get total
			input_file = self.config.input_dir / f'{country}.csv'
			if input_file.exists():
				self.console.print(f'[dim]Counting rows in {country}.csv...[/]')
				total_rows = count_lines_fast(input_file)
				self.console.print(f'[dim]→ {total_rows:,} rows found[/]')
				task = self.progress.add_task(f'[cyan]Cleaning {country}[/cyan]', total=total_rows)
				tasks[country] = task
			else:
				self.console.print(f'[red]✗[/] [dim]{country}[/dim] file not found')

		# Process countries in parallel with live progress display
		with Live(self.progress, console=self.console, refresh_per_second=10):
			with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
				# Submit all tasks with their progress task IDs
				future_to_country = {
					executor.submit(self.clean_country, country, tasks[country]): country
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
		summary_table = Table(title='Cleaning Summary', show_header=True, header_style='bold magenta')
		summary_table.add_column('Country', style='cyan')
		summary_table.add_column('Total', justify='right')
		summary_table.add_column('Valid', justify='right', style='green')
		summary_table.add_column('Filtered', justify='right', style='red')
		summary_table.add_column('Keep Rate', justify='right')
		summary_table.add_column('Top Filter Reason', style='yellow')

		# Sort countries by completion (maintain original order for consistency)
		for country in self.config.countries:
			stats = self.stats_by_country.get(country)
			if not stats:
				continue

			# Add to summary table
			keep_rate = (stats.valid_rows / stats.total_rows * 100) if stats.total_rows > 0 else 0
			top_reason = max(stats.filtered_reasons.items(), key=lambda x: x[1])[0] if stats.filtered_reasons else '-'

			summary_table.add_row(
				country,
				f'{stats.total_rows:,}',
				f'{stats.valid_rows:,}',
				f'{stats.filtered_rows:,}',
				f'{keep_rate:.1f}%',
				top_reason,
			)

			# Print detailed stats
			if stats.filtered_reasons:
				self.console.print(f'\n[bold cyan]{country}[/bold cyan] Filter Reasons:')
				for reason, count in sorted(stats.filtered_reasons.items(), key=lambda x: -x[1])[:5]:
					self.console.print(f'  [dim]{reason}:[/] {count:,}')

		# Print final summary
		self.console.print('\n')
		self.console.print(summary_table)

	def print_filter_reasons_report(self):
		"""Print a detailed report of filter reasons across all countries."""
		report_table = Table(title='Detailed Filter Reasons', show_header=True, header_style='bold magenta')
		report_table.add_column('Country', style='cyan')
		report_table.add_column('Reason', style='yellow')
		report_table.add_column('Count', justify='right')

		for country, stats in self.stats_by_country.items():
			for reason, count in sorted(stats.filtered_reasons.items(), key=lambda x: -x[1]):
				report_table.add_row(country, reason, f'{count:,}')

		self.console.print('\n')
		self.console.print(report_table)


def find_repo_root() -> Path:
	"""Find the repository root by searching for .git or .mise.toml."""
	current = Path.cwd()
	while current != current.parent:
		if (current / '.git').exists() or (current / '.mise.toml').exists():
			return current
		current = current.parent
	# Fallback to relative path from script
	return Path(__file__).parent.parent.parent.parent


def main():
	"""Main entry point for the CLI."""
	console = Console()

	# Determine paths - search for repository root from current working directory
	repo_root = find_repo_root()
	# Source files are in the cleaner package
	data_dir = repo_root / 'packages' / 'name-data-cleaner' / 'data' / 'source'
	# Output goes to the name-data package for ingestion
	output_dir = repo_root / 'packages' / 'name-data' / 'data' / 'extended-dataset'

	# Validate input directory
	if not data_dir.exists():
		console.print(f'[red]Error:[/] Source data directory not found: {data_dir}')
		console.print('[dim]Make sure you\'ve moved the source CSV files to the correct location.[/]')
		return 1

	# Create output directory if needed
	output_dir.mkdir(parents=True, exist_ok=True)

	# Configuration
	config = CleaningConfig(
		input_dir=data_dir,
		output_dir=output_dir,
		countries=['US', 'GB', 'FR', 'IT', 'DE', 'ES', 'IE'],
		min_length=3,
		max_length=20,
		min_rank=5000,  # Accept top 5000 names per country
	)

	# Determine max workers (use min of 4 or number of countries)
	max_workers = min(4, len(config.countries))

	# Print configuration
	console.print(Panel.fit(
		f'[bold]Configuration:[/]\n'
		f'Input: {data_dir}\n'
		f'Output: {output_dir}\n'
		f'Countries: {", ".join(config.countries)}\n'
		f'Min length: {config.min_length}\n'
		f'Max length: {config.max_length}\n'
		f'Max rank: {config.min_rank}\n'
		f'Parallel workers: {max_workers}',
		title='Dataset Cleaner',
		border_style='blue',
	))

	# Run cleaning
	cleaner = DatasetCleaner(config, max_workers=max_workers)
	try:
		cleaner.clean_all()
		cleaner.print_filter_reasons_report()
	except Exception as e:
		console.print(f'[red]Error during cleaning:[/] {e}')
		import traceback
		console.print(traceback.format_exc())
		return 1

	console.print('\n[bold green]✓ Cleaning complete![/]')
	console.print(f'[dim]Cleaned files saved to: {output_dir}[/]')

	return 0


if __name__ == '__main__':
	exit(main())
