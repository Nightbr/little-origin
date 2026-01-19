import { nameService } from '../services/name.service';
import { db } from '../db/client';
import { sql } from 'drizzle-orm';
import { matchService } from '../services/match.service';

async function main() {
	console.log('🌱 Seeding database...');

	// Seed Names
	const result = await nameService.seedNames(250);
	console.log(`✅ Seeded ${result.count} names from ${result.source}`);

	// Maybe verify matches exist?
	const matches = await matchService.getAllMatches();
	console.log(`ℹ️ Current matches: ${matches.length}`);

	console.log('✨ Seeding complete');
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
