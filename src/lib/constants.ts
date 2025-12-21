/**
 * Application-wide constants for cookies, storage keys, and cache keys.
 * Centralizing these prevents typos and makes it easy to find/change key names.
 */

// Cookie keys for persisting UI state
export const COOKIES = {
	/** Active tab on habits page ('habits' | 'goals') */
	HABITS_TAB: 'habits-tab',
	/** Active tab on overview page ('habits' | 'goals') */
	OVERVIEW_TAB: 'overview-tab',
	/** Modal state on overview page */
	OVERVIEW_MODAL: 'overview-modal',
	/** Modal state on habits page (legacy) */
	HABITS_MODAL: 'habits-modal',
	/** Habit modal state */
	HABIT_MODAL: 'habits-modal-habit',
	/** Goal modal state */
	GOAL_MODAL: 'habits-modal-goal',
	/** Cached quote data */
	QUOTE_CACHE: 'uhabit-quote'
} as const;

// LocalStorage keys for client-side caching
export const STORAGE_KEYS = {
	/** Cached quote data */
	QUOTE_CACHE: 'uhabit-quote',
	/** ETag for habits list caching */
	HABITS_ETAG: 'uhabit-habits-etag',
	/** ETag for goals list caching */
	GOALS_ETAG: 'uhabit-goals-etag',
	/** Cached settings payload */
	SETTINGS_CACHE: 'uhabit-settings-cache'
} as const;

// KV cache keys (server-side Cloudflare KV)
export const KV_KEYS = {
	/** Daily quote cache */
	DAILY_QUOTE: 'daily-quote'
} as const;

// Pastel color palette for habits and goals
export const PASTEL_COLORS: string[] = [
	'#BFD7EA', // pastel blue
	'#FFF1B6', // pastel yellow
	'#CDEAC0', // pastel green
	'#FFD6A5', // pastel orange
	'#FFADAD', // pastel red
	'#FBC4E2', // pastel pink
	'#aa92f7' // pastel purple
];

// Default color index (green)
export const DEFAULT_COLOR_INDEX = 2;

// Statistics cache configuration
export const STATS_CACHE = {
	/** IndexedDB database name */
	DB_NAME: 'uhabit-stats-cache',
	/** IndexedDB schema version */
	DB_VERSION: 1,
	/** How long computed stats are valid (5 minutes) */
	TTL_MS: 5 * 60 * 1000,
	/** How many days of history to fetch on first load */
	HISTORY_DAYS: 90,
	/** How long before forcing a full sync (24 hours) */
	FULL_SYNC_INTERVAL_MS: 24 * 60 * 60 * 1000
} as const;
