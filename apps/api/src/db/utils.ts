import path from 'path';
import fs from 'fs';

export function findProjectRoot(startDir: string = __dirname): string {
	let currentDir = path.resolve(startDir);
	while (currentDir !== path.parse(currentDir).root) {
		if (fs.existsSync(path.join(currentDir, 'pnpm-workspace.yaml'))) {
			return currentDir;
		}
		currentDir = path.dirname(currentDir);
	}
	return process.cwd(); // Fallback to current working directory
}
