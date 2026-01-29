import pytest
from unittest.mock import MagicMock, patch
from pathlib import Path
from name_data_generator.generator import DatasetGenerator, GeneratorConfig

@pytest.fixture
def mock_nd():
	"""Mock NameDataset to control name pool size and yield."""
	with patch("name_data_generator.generator.NameDataset") as mock:
		yield mock

def test_fetch_names_until_sufficient_reaches_target():
	"""
	Regression test: Ensure fetch_names_until_sufficient doesn't stall 
	before reaching target_count, even with AI enabled.
	"""
	# Setup config with 500 target
	config = GeneratorConfig(
		output_dir=Path("./tmp"),
		countries=["US"],
		names_per_gender=500,
		use_ai=True # This triggers the smaller base_batch in current code
	)
	
	generator = DatasetGenerator(config)
	generator.nd = MagicMock()
	# Mock progress to avoid KeyError and console output
	generator.progress = MagicMock()
	
	# Mock get_top_names to return a list of names proportional to 'n'
	def mock_get_top(n, use_first_names, country_alpha2, gender):
		# Return 'n' unique names
		return {"US": {gender: [f"Name {i}" for i in range(n)]}}
	
	generator.nd.get_top_names.side_effect = mock_get_top
	
	with patch.object(DatasetGenerator, "is_valid_first_name", return_value=True), \
		 patch.object(DatasetGenerator, "clean_batch_with_ai", side_effect=lambda x: x):
		
		# Test with target_count = 3000
		# Current code with base_batch=100 and max_iterations=20 will stop at 2000 names
		names, total_fetched, regex_filt, ai_filt = generator.fetch_names_until_sufficient(
			country="US",
			gender="M",
			target_count=3000,
			task=1 # Use integer ID
		)
		
		assert len(names) == 3000, f"Expected 3000 names, got {len(names)}. total_fetched: {total_fetched}"

if __name__ == "__main__":
	# For manual run if needed
	pass
