import { logger } from '../config/logger';
import { matchService } from '../services/match.service';
import { nameService } from '../services/name.service';

async function main() {
	logger.info('🌱 Seeding database...');

	// Seed Names (all names for all available countries)
	const result = await nameService.seedNames();
	logger.info(`✅ Seeded ${result.count}/${result.total} names from ${result.source}`);

	// Maybe verify matches exist?
	const matches = await matchService.getAllMatches();
	logger.info(`ℹ️ Current matches: ${matches.length}`);

	logger.info('✨ Seeding complete');
	process.exit(0);
}

main().catch((err) => {
	logger.error({ err }, 'Seeding script failed');
	process.exit(1);
});
