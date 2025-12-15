#!/usr/bin/env node

// Simple complexity guard: flag oversized source files to keep maintainability in check.
// Thresholds are intentionally conservative for Svelte/TS files; adjust if needed.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'src');
const LIMITS = {
	svelte: 300,
	ts: 350,
	js: 350
};

const shouldSkip = (p) => {
	return /node_modules|\.svelte-kit|coverage|build/.test(p);
};

const getFiles = (dir) => {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	return entries.flatMap((entry) => {
		const fullPath = path.join(dir, entry.name);
		if (shouldSkip(fullPath)) return [];
		if (entry.isDirectory()) return getFiles(fullPath);
		return [fullPath];
	});
};

const offenders = [];

for (const file of getFiles(ROOT)) {
	const ext = path.extname(file).slice(1);
	const limit = LIMITS[ext];
	if (!limit) continue;

	const contents = fs.readFileSync(file, 'utf8');
	const lines = contents.split('\n').length;
	if (lines > limit) {
		offenders.push({ file: path.relative(process.cwd(), file), lines, limit });
	}
}

if (offenders.length) {
	console.error('Files exceeding complexity thresholds:');
	for (const { file, lines, limit } of offenders) {
		console.error(` - ${file}: ${lines} lines (limit ${limit})`);
	}
	process.exit(1);
}

console.log('Complexity check passed.');
