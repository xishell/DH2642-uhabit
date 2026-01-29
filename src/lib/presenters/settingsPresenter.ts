/**
 * Presenter layer for settings.
 * Manages state, change tracking, caching, and API coordination.
 */

import { writable, derived, get } from 'svelte/store';
import { createUserApi, type UserSettingsResponse, type UserSettings } from '$lib/api/userApi';
import { themeMode as themeStore, type ThemeMode } from '$lib/stores/theme';
import { reduceMotion as motionStore } from '$lib/stores/reduceMotion';
import { avatarUrl as avatarStore } from '$lib/stores/avatar';
import { userCountry } from '$lib/stores/country';
import { STORAGE_KEYS } from '$lib/constants';

export type SettingsField =
	| 'name'
	| 'bio'
	| 'pronouns'
	| 'username'
	| 'email'
	| 'theme'
	| 'reduceMotion'
	| 'country'
	| 'accentColor'
	| 'typography'
	| 'pushEnabled'
	| 'habitReminders'
	| 'streakMilestones'
	| 'goalProgress'
	| 'holidaySuggestions'
	| 'reminderTime';

export interface SettingsState {
	// Profile
	name: string;
	bio: string;
	pronouns: string;
	username: string;
	email: string;
	avatarUrl: string | null;

	// Preferences
	theme: ThemeMode;
	reduceMotion: boolean;
	country: string;
	accentColor: string;
	typography: string;

	// Notifications
	pushEnabled: boolean;
	habitReminders: boolean;
	streakMilestones: boolean;
	goalProgress: boolean;
	holidaySuggestions: boolean;
	reminderTime: string;

	// UI state
	isLoading: boolean;
	isSaving: boolean;
	isUploadingAvatar: boolean;
	error: string | null;
}

interface FieldChange {
	original: unknown;
	current: unknown;
}

type SettingsPresenterDeps = {
	fetcher: typeof fetch;
	browser: boolean;
	storage: Storage | null;
	getSession: () => Promise<{ user?: { email?: string } } | null>;
};

const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;

const initialState: SettingsState = {
	name: '',
	bio: '',
	pronouns: '',
	username: '',
	email: '',
	avatarUrl: null,
	theme: 'system',
	reduceMotion: false,
	country: '',
	accentColor: '',
	typography: '',
	pushEnabled: false,
	habitReminders: true,
	streakMilestones: true,
	goalProgress: true,
	holidaySuggestions: true,
	reminderTime: '08:00',
	isLoading: true,
	isSaving: false,
	isUploadingAvatar: false,
	error: null
};

export function createSettingsPresenter({
	fetcher,
	browser,
	storage,
	getSession
}: SettingsPresenterDeps) {
	const api = createUserApi({ fetcher });

	const state = writable<SettingsState>({ ...initialState });
	const changes = writable<Map<SettingsField, FieldChange>>(new Map());

	const { subscribe, update } = state;

	// Derived stores
	const hasUnsavedChanges = derived(changes, ($changes) => $changes.size > 0);
	const changedFields = derived(changes, ($changes) => new Set($changes.keys()));

	// Helper to get current state
	const getState = (): SettingsState => get(state);

	// Cache operations
	const readCache = (): UserSettingsResponse | null => {
		if (!browser || !storage) return null;
		const raw = storage.getItem(STORAGE_KEYS.SETTINGS_CACHE);
		if (!raw) return null;
		try {
			const cached = JSON.parse(raw) as { savedAt: number; data: UserSettingsResponse };
			if (Date.now() - cached.savedAt > SETTINGS_CACHE_TTL_MS) return null;
			return cached.data;
		} catch {
			return null;
		}
	};

	const writeCache = (settings: UserSettingsResponse) => {
		if (!browser || !storage) return;
		storage.setItem(
			STORAGE_KEYS.SETTINGS_CACHE,
			JSON.stringify({ savedAt: Date.now(), data: settings })
		);
	};

	const clearCache = () => {
		if (!browser || !storage) return;
		storage.removeItem(STORAGE_KEYS.SETTINGS_CACHE);
	};

	// Apply settings from API response to state
	const applySettings = (settings: UserSettingsResponse, email?: string) => {
		const notifPrefs = settings.preferences?.notificationPrefs;

		update((s) => ({
			...s,
			name: settings.name ?? '',
			pronouns: settings.pronouns ?? '',
			username: settings.username ?? '',
			avatarUrl: settings.imageUrl ?? null,
			theme: (settings.theme as ThemeMode) || 'system',
			country: settings.country ?? '',
			bio: settings.preferences?.bio ?? '',
			accentColor: settings.preferences?.accentColor ?? '',
			typography: settings.preferences?.typography ?? '',
			pushEnabled: notifPrefs?.pushEnabled ?? false,
			habitReminders: notifPrefs?.habitReminders ?? true,
			streakMilestones: notifPrefs?.streakMilestones ?? true,
			goalProgress: notifPrefs?.goalProgress ?? true,
			holidaySuggestions: notifPrefs?.holidaySuggestions ?? true,
			reminderTime: notifPrefs?.reminderTime ?? '08:00',
			email: email ?? s.email
		}));

		// Sync with global stores
		avatarStore.set(settings.imageUrl ?? null);
		themeStore.set((settings.theme as ThemeMode) || 'system');
		userCountry.set(settings.country ?? null);
	};

	// Initialize from cache if available
	const initFromCache = () => {
		const cached = readCache();
		if (cached) {
			applySettings(cached);
			update((s) => ({ ...s, isLoading: false }));
			return true;
		}
		return false;
	};

	// Load settings from API
	const loadSettings = async () => {
		try {
			const [session, settings] = await Promise.all([getSession(), api.getPreferences()]);

			applySettings(settings, session?.user?.email);
			writeCache(settings);
			changes.set(new Map()); // Clear changes after fresh load

			// Initialize reduceMotion from local store
			const unsubscribe = motionStore.subscribe((value) => {
				update((s) => ({ ...s, reduceMotion: value }));
			});
			unsubscribe();
		} catch (error) {
			update((s) => ({
				...s,
				error: error instanceof Error ? error.message : 'Failed to load settings'
			}));
			throw error;
		} finally {
			update((s) => ({ ...s, isLoading: false }));
		}
	};

	// Track field changes
	const setField = (field: SettingsField, value: unknown) => {
		const currentState = getState();
		const currentChanges = get(changes);

		// Get the original value (either from existing change tracking or current state)
		const existing = currentChanges.get(field);
		const original = existing ? existing.original : currentState[field as keyof SettingsState];

		// Update state
		update((s) => ({ ...s, [field]: value }));

		// Update change tracking
		if (original === value) {
			// Value is back to original, remove from tracking
			currentChanges.delete(field);
		} else {
			currentChanges.set(field, { original, current: value });
		}
		changes.set(new Map(currentChanges));

		// Sync specific fields with global stores
		if (field === 'theme') {
			themeStore.set(value as ThemeMode);
		} else if (field === 'reduceMotion') {
			motionStore.set(value as boolean);
		} else if (field === 'country') {
			userCountry.set((value as string) || null);
		}
	};

	// Save all changes
	const saveAll = async () => {
		update((s) => ({ ...s, isSaving: true, error: null }));

		try {
			const currentState = getState();

			const settings: UserSettings = {
				name: currentState.name || undefined,
				pronouns: currentState.pronouns || undefined,
				username: currentState.username || undefined,
				theme: currentState.theme,
				country: currentState.country || undefined,
				preferences: {
					bio: currentState.bio,
					accentColor: currentState.accentColor,
					typography: currentState.typography,
					notificationPrefs: {
						pushEnabled: currentState.pushEnabled,
						habitReminders: currentState.habitReminders,
						streakMilestones: currentState.streakMilestones,
						goalProgress: currentState.goalProgress,
						holidaySuggestions: currentState.holidaySuggestions,
						reminderTime: currentState.reminderTime
					}
				}
			};

			const updated = await api.updatePreferences(settings);
			applySettings(updated, currentState.email);
			writeCache(updated);
			changes.set(new Map()); // Clear changes after save

			return { success: true };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to save settings';
			update((s) => ({ ...s, error: message }));
			return { success: false, error: message };
		} finally {
			update((s) => ({ ...s, isSaving: false }));
		}
	};

	// Discard all changes
	const discardAll = () => {
		const currentChanges = get(changes);

		currentChanges.forEach((change, field) => {
			update((s) => ({ ...s, [field]: change.original }));

			// Sync specific fields with global stores
			if (field === 'theme') {
				themeStore.set(change.original as ThemeMode);
			} else if (field === 'reduceMotion') {
				motionStore.set(change.original as boolean);
			} else if (field === 'country') {
				userCountry.set((change.original as string) || null);
			}
		});

		changes.set(new Map());
	};

	// Upload avatar
	const uploadAvatar = async (file: File) => {
		update((s) => ({ ...s, isUploadingAvatar: true, error: null }));

		try {
			const result = await api.uploadAvatar(file);

			update((s) => ({ ...s, avatarUrl: result.imageUrl }));
			avatarStore.set(result.imageUrl);
			clearCache(); // Invalidate cache since avatar changed

			return { success: true, imageUrl: result.imageUrl };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Could not upload avatar';
			update((s) => ({ ...s, error: message }));
			return { success: false, error: message };
		} finally {
			update((s) => ({ ...s, isUploadingAvatar: false }));
		}
	};

	// Reset presenter state
	const reset = () => {
		state.set({ ...initialState });
		changes.set(new Map());
	};

	return {
		state: { subscribe },
		hasUnsavedChanges,
		changedFields,
		initFromCache,
		loadSettings,
		setField,
		saveAll,
		discardAll,
		uploadAvatar,
		reset
	};
}

export type SettingsPresenter = ReturnType<typeof createSettingsPresenter>;
