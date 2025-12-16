import { createStatsCache } from '$lib/cache/statsCache';
import {
	describeScenario,
	generateScenarioData,
	listScenarioNames,
	type ScenarioName
} from './seedData';

/**
 * Seed the IndexedDB cache with test data
 */
export async function seedTestData(
	scenarioName: ScenarioName = 'realistic'
): Promise<{ habits: number; completions: number }> {
	const { scenario, habits, completions } = generateScenarioData(scenarioName);

	const cache = createStatsCache();
	await cache.open();

	// Clear existing data
	await cache.clearAll();

	// Store new data
	await cache.setHabits(habits);
	await cache.addCompletions(completions);
	await cache.setMetadata({
		lastHabitsSync: new Date(),
		lastCompletionsSync: new Date(),
		lastStatsCompute: null,
		habitsETag: null,
		version: 1
	});

	console.log(`Seeded ${scenarioName} scenario:`);
	console.log(`  - ${habits.length} habits`);
	console.log(`  - ${completions.length} completions`);
	console.log(`  - ${scenario.days} days of history`);

	return { habits: habits.length, completions: completions.length };
}

/**
 * Clear all test data from cache
 */
export async function clearTestData(): Promise<void> {
	const cache = createStatsCache();
	await cache.open();
	await cache.clearAll();
	console.log('Test data cleared');
}

export { listScenarioNames as listScenarios, describeScenario } from './seedData';
