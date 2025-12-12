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
	GOALS_ETAG: 'uhabit-goals-etag'
} as const;

// KV cache keys (server-side Cloudflare KV)
export const KV_KEYS = {
	/** Daily quote cache */
	DAILY_QUOTE: 'daily-quote'
} as const;
