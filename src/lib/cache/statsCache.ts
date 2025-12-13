/**
 * IndexedDB cache for statistics data
 * Provides offline-first storage for habits, completions, and computed stats
 */

import type { Habit, HabitCompletion } from '$lib/types/habit';
import type { CacheMetadata, CachedStats, Scope } from '$lib/stats/types';
import { STATS_CACHE } from '$lib/constants';

const STORES = {
	HABITS: 'habits',
	COMPLETIONS: 'completions',
	STATS: 'stats',
	METADATA: 'metadata'
} as const;

const METADATA_ID = 'sync-metadata';

/**
 * Create a statistics cache instance
 * Uses native IndexedDB with Promise-based operations
 */
export function createStatsCache() {
	let db: IDBDatabase | null = null;

	/**
	 * Open the IndexedDB database, creating stores if needed
	 */
	async function open(): Promise<IDBDatabase> {
		if (db) return db;

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(STATS_CACHE.DB_NAME, STATS_CACHE.DB_VERSION);

			request.onerror = () => reject(request.error);

			request.onsuccess = () => {
				db = request.result;
				resolve(db);
			};

			request.onupgradeneeded = (event) => {
				const database = (event.target as IDBOpenDBRequest).result;

				// Habits store
				if (!database.objectStoreNames.contains(STORES.HABITS)) {
					database.createObjectStore(STORES.HABITS, { keyPath: 'id' });
				}

				// Completions store with indexes for efficient queries
				if (!database.objectStoreNames.contains(STORES.COMPLETIONS)) {
					const completionsStore = database.createObjectStore(STORES.COMPLETIONS, {
						keyPath: 'id'
					});
					completionsStore.createIndex('habitId', 'habitId', { unique: false });
					completionsStore.createIndex('completedAt', 'completedAt', { unique: false });
				}

				// Stats store for computed statistics
				if (!database.objectStoreNames.contains(STORES.STATS)) {
					const statsStore = database.createObjectStore(STORES.STATS, { keyPath: 'id' });
					statsStore.createIndex('scope', 'scope', { unique: false });
				}

				// Metadata store for sync tracking (single record)
				if (!database.objectStoreNames.contains(STORES.METADATA)) {
					database.createObjectStore(STORES.METADATA, { keyPath: 'id' });
				}
			};
		});
	}

	/**
	 * Get sync metadata
	 */
	async function getMetadata(): Promise<CacheMetadata | null> {
		const database = await open();

		return new Promise((resolve, reject) => {
			const tx = database.transaction(STORES.METADATA, 'readonly');
			const store = tx.objectStore(STORES.METADATA);
			const request = store.get(METADATA_ID);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				const result = request.result;
				if (!result) {
					resolve(null);
					return;
				}
				// Convert stored timestamps back to Date objects
				resolve({
					...result,
					lastHabitsSync: result.lastHabitsSync ? new Date(result.lastHabitsSync) : null,
					lastCompletionsSync: result.lastCompletionsSync
						? new Date(result.lastCompletionsSync)
						: null,
					lastStatsCompute: result.lastStatsCompute ? new Date(result.lastStatsCompute) : null
				});
			};
		});
	}

	/**
	 * Update sync metadata (merges with existing)
	 */
	async function setMetadata(meta: Partial<CacheMetadata>): Promise<void> {
		const database = await open();
		const existing = await getMetadata();

		const updated: CacheMetadata & { id: string } = {
			id: METADATA_ID,
			lastHabitsSync: meta.lastHabitsSync ?? existing?.lastHabitsSync ?? null,
			lastCompletionsSync: meta.lastCompletionsSync ?? existing?.lastCompletionsSync ?? null,
			lastStatsCompute: meta.lastStatsCompute ?? existing?.lastStatsCompute ?? null,
			habitsETag: meta.habitsETag ?? existing?.habitsETag ?? null,
			version: meta.version ?? existing?.version ?? 1
		};

		return new Promise((resolve, reject) => {
			const tx = database.transaction(STORES.METADATA, 'readwrite');
			const store = tx.objectStore(STORES.METADATA);
			const request = store.put(updated);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	/**
	 * Get all cached habits
	 */
	async function getHabits(): Promise<Habit[]> {
		const database = await open();

		return new Promise((resolve, reject) => {
			const tx = database.transaction(STORES.HABITS, 'readonly');
			const store = tx.objectStore(STORES.HABITS);
			const request = store.getAll();

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				// Convert dates back from stored format
				const habits = request.result.map(
					(h: Habit & { createdAt: string; updatedAt: string }) => ({
						...h,
						createdAt: new Date(h.createdAt),
						updatedAt: new Date(h.updatedAt)
					})
				);
				resolve(habits);
			};
		});
	}

	/**
	 * Store habits (replaces all existing)
	 */
	async function setHabits(habits: Habit[]): Promise<void> {
		const database = await open();

		return new Promise((resolve, reject) => {
			const tx = database.transaction(STORES.HABITS, 'readwrite');
			const store = tx.objectStore(STORES.HABITS);

			// Clear existing and add new
			store.clear();

			for (const habit of habits) {
				store.put(habit);
			}

			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	/**
	 * Get completions, optionally filtered by date range
	 */
	async function getCompletions(from?: Date, to?: Date): Promise<HabitCompletion[]> {
		const database = await open();

		return new Promise((resolve, reject) => {
			const tx = database.transaction(STORES.COMPLETIONS, 'readonly');
			const store = tx.objectStore(STORES.COMPLETIONS);

			let request: IDBRequest;

			if (from && to) {
				// Use index for date range query
				const index = store.index('completedAt');
				const range = IDBKeyRange.bound(from.toISOString(), to.toISOString());
				request = index.getAll(range);
			} else {
				request = store.getAll();
			}

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				// Convert dates back from stored format
				const completions = request.result.map(
					(c: HabitCompletion & { completedAt: string; createdAt: string }) => ({
						...c,
						completedAt: new Date(c.completedAt),
						createdAt: new Date(c.createdAt)
					})
				);
				resolve(completions);
			};
		});
	}

	/**
	 * Add completions (merges with existing, updates on conflict)
	 */
	async function addCompletions(completions: HabitCompletion[]): Promise<void> {
		if (completions.length === 0) return;

		const database = await open();

		return new Promise((resolve, reject) => {
			const tx = database.transaction(STORES.COMPLETIONS, 'readwrite');
			const store = tx.objectStore(STORES.COMPLETIONS);

			for (const completion of completions) {
				// Store with ISO string dates for indexing
				store.put({
					...completion,
					completedAt:
						completion.completedAt instanceof Date
							? completion.completedAt.toISOString()
							: completion.completedAt,
					createdAt:
						completion.createdAt instanceof Date
							? completion.createdAt.toISOString()
							: completion.createdAt
				});
			}

			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	/**
	 * Get cached computed stats for a scope and date
	 */
	async function getStats(scope: Scope, dateKey: string): Promise<CachedStats | null> {
		const database = await open();
		const id = `${scope}-${dateKey}`;

		return new Promise((resolve, reject) => {
			const tx = database.transaction(STORES.STATS, 'readonly');
			const store = tx.objectStore(STORES.STATS);
			const request = store.get(id);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				const result = request.result;
				if (!result) {
					resolve(null);
					return;
				}
				resolve({
					...result,
					computedAt: new Date(result.computedAt),
					validUntil: new Date(result.validUntil)
				});
			};
		});
	}

	/**
	 * Store computed stats
	 */
	async function setStats(stats: CachedStats): Promise<void> {
		const database = await open();

		return new Promise((resolve, reject) => {
			const tx = database.transaction(STORES.STATS, 'readwrite');
			const store = tx.objectStore(STORES.STATS);
			const request = store.put(stats);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	/**
	 * Clear all cached data
	 */
	async function clearAll(): Promise<void> {
		const database = await open();

		return new Promise((resolve, reject) => {
			const tx = database.transaction(
				[STORES.HABITS, STORES.COMPLETIONS, STORES.STATS, STORES.METADATA],
				'readwrite'
			);

			tx.objectStore(STORES.HABITS).clear();
			tx.objectStore(STORES.COMPLETIONS).clear();
			tx.objectStore(STORES.STATS).clear();
			tx.objectStore(STORES.METADATA).clear();

			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	/**
	 * Close the database connection
	 */
	function close(): void {
		if (db) {
			db.close();
			db = null;
		}
	}

	return {
		open,
		getMetadata,
		setMetadata,
		getHabits,
		setHabits,
		getCompletions,
		addCompletions,
		getStats,
		setStats,
		clearAll,
		close
	};
}

export type StatsCache = ReturnType<typeof createStatsCache>;
