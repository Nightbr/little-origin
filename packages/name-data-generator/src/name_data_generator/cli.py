"""CLI entry point for the dataset generator."""

import argparse
from pathlib import Path

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel

from .generator import COUNTRIES, DatasetGenerator, GeneratorConfig


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
	# Load environment variables from .env file in repo root
	repo_root = find_repo_root()
	load_dotenv(repo_root / '.env')

	console = Console()

	parser = argparse.ArgumentParser(
		description='Generate extended-dataset CSV files from names-dataset library',
		formatter_class=argparse.RawDescriptionHelpFormatter,
		epilog='''
Examples:
  python -m name_data_cleaner              # Generate with default 250 names per gender
  python -m name_data_cleaner --names 500   # Generate 500 names per gender
  python -m name_data_cleaner --countries US GB  # Generate only specific countries
		''',
	)
	parser.add_argument(
		'--names', '-n',
		type=int,
		default=250,
		help='Number of names to fetch per gender (default: 250)',
	)
	parser.add_argument(
		'--countries', '-c',
		nargs='+',
		choices=COUNTRIES,
		default=COUNTRIES,
		help=f'Countries to generate (default: all {len(COUNTRIES)} countries)',
	)
	parser.add_argument(
		'--output', '-o',
		type=Path,
		default=None,
		help='Output directory (default: packages/name-data/data/extended-dataset)',
	)
	parser.add_argument(
		'--use-ai',
		action='store_true',
		help='Enable AI-based cleaning using OpenRouter',
	)
	parser.add_argument(
		'--ai-api-key',
		type=str,
		default=None,
		help='OpenRouter API Key (or set OPENROUTER_API_KEY env var)',
	)
	parser.add_argument(
		'--ai-model',
		type=str,
		default='google/gemini-2.0-flash-001',
		help='AI model to use (default: google/gemini-2.0-flash-001)',
	)
	args = parser.parse_args()

	# Determine paths - search for repository root from current working directory
	repo_root = find_repo_root()

	# Output goes to the name-data package for ingestion
	if args.output:
		output_dir = args.output
	else:
		output_dir = repo_root / 'packages' / 'name-data' / 'data' / 'extended-dataset'

	# Create output directory if needed
	output_dir.mkdir(parents=True, exist_ok=True)

	# Configuration
	config = GeneratorConfig(
		output_dir=output_dir,
		countries=args.countries,
		names_per_gender=args.names,
		use_ai=args.use_ai,
		ai_api_key=args.ai_api_key,
		ai_model=args.ai_model,
	)

	# Determine max workers (use min of 4 or number of countries)
	max_workers = min(4, len(config.countries))

	# Print configuration
	console.print(Panel.fit(
		f'[bold]Configuration:[/]\n'
		f'Output: {output_dir}\n'
		f'Countries: {", ".join(config.countries)}\n'
		f'Names per gender: {config.names_per_gender:,}\n'
		f'Total names per country: {config.names_per_gender * 2:,}\n'
		f'Parallel workers: {max_workers}',
		title='Dataset Generator',
		border_style='blue',
	))

	# Run generation
	generator = DatasetGenerator(config, max_workers=max_workers)
	try:
		generator.generate_all()
	except Exception as e:
		console.print(f'[red]Error during generation:[/] {e}')
		import traceback

		console.print(traceback.format_exc())
		return 1

	console.print('\n[bold green]✓ Generation complete![/]')
	console.print(f'[dim]Generated files saved to: {output_dir}[/]')

	return 0


if __name__ == '__main__':
	exit(main())
