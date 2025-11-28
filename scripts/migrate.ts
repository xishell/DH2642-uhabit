#!/usr/bin/env bun
/**
 * Smart migration script for D1 database
 * - Automatically detects new migrations
 * - Tracks applied migrations
 * - Only runs unapplied migrations
 * - Works for both local and remote databases
 */

import { readdir } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

const MIGRATIONS_DIR = './drizzle';
const MIGRATIONS_TABLE = '__drizzle_migrations';

interface Migration {
	filename: string;
	name: string;
}

async function getMigrationFiles(): Promise<Migration[]> {
	const files = await readdir(MIGRATIONS_DIR);
	return files
		.filter((f) => f.endsWith('.sql'))
		.sort()
		.map((filename) => ({
			filename,
			name: filename.replace('.sql', '')
		}));
}

async function getAppliedMigrations(isLocal: boolean, env?: string): Promise<Set<string>> {
	const remoteFlag = isLocal ? '--local' : '--remote';
	const envFlag = env ? `--env=${env}` : '';

	// Ensure migrations table exists
	execSync(
		`wrangler d1 execute DB ${remoteFlag} ${envFlag} --command "CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, applied_at INTEGER NOT NULL)"`,
		{ encoding: 'utf-8', stdio: 'pipe' }
	);

	// Get applied migrations
	const result = execSync(
		`wrangler d1 execute DB ${remoteFlag} ${envFlag} --command "SELECT name FROM ${MIGRATIONS_TABLE}" --json`,
		{ encoding: 'utf-8', stdio: 'pipe' }
	);

	// Parse the JSON output from wrangler (extract JSON from output)
	const jsonMatch = result.match(/\[[\s\S]*\]/);
	if (!jsonMatch) {
		return new Set();
	}

	const parsed = JSON.parse(jsonMatch[0]);
	const migrations = parsed[0]?.results || [];
	return new Set(migrations.map((m: { name: string }) => m.name));
}

async function applyMigration(
	migration: Migration,
	isLocal: boolean,
	env?: string
): Promise<void> {
	const remoteFlag = isLocal ? '--local' : '--remote';
	const envFlag = env ? `--env=${env}` : '';
	const migrationPath = join(MIGRATIONS_DIR, migration.filename);

	console.log(`  [*] Applying ${migration.name}...`);

	// Apply the migration
	execSync(`wrangler d1 execute DB ${remoteFlag} ${envFlag} --file="${migrationPath}"`, {
		encoding: 'utf-8'
	});

	// Record migration as applied
	const timestamp = Date.now();
	execSync(
		`wrangler d1 execute DB ${remoteFlag} ${envFlag} --command "INSERT INTO ${MIGRATIONS_TABLE} (name, applied_at) VALUES ('${migration.name}', ${timestamp})"`,
		{ encoding: 'utf-8' }
	);

	console.log(`  [+] Applied ${migration.name}`);
}

async function main() {
	const args = process.argv.slice(2);
	const isLocal = !args.includes('--remote');

	// Parse environment flag (e.g., --env=preview or --env=production)
	const envArg = args.find((arg) => arg.startsWith('--env='));
	const env = envArg ? envArg.split('=')[1] : undefined;

	const envLabel = env ? ` (${env})` : '';
	console.log(`\nRunning migrations on ${isLocal ? 'local' : 'remote'}${envLabel} database...\n`);

	// Get all migrations and check which have been applied
	const allMigrations = await getMigrationFiles();
	const appliedMigrations = await getAppliedMigrations(isLocal, env);

	const pendingMigrations = allMigrations.filter((m) => !appliedMigrations.has(m.name));

	if (pendingMigrations.length === 0) {
		console.log('No new migrations to apply. Database is up to date!\n');
		return;
	}

	console.log(`Found ${pendingMigrations.length} new migration(s) to apply:\n`);

	// Apply each pending migration
	for (const migration of pendingMigrations) {
		await applyMigration(migration, isLocal, env);
	}

	console.log(`\nSuccessfully applied ${pendingMigrations.length} migration(s)!\n`);
}

main().catch((error) => {
	console.error('[ERROR] Migration failed:', error.message);
	process.exit(1);
});
