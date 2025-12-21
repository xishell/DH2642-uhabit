import { writable, derived } from 'svelte/store';

export type SettingsField =
	| 'name'
	| 'bio'
	| 'pronouns'
	| 'username'
	| 'email'
	| 'theme'
	| 'country'
	| 'accentColor'
	| 'typography'
	| 'notifications'
	| 'pushEnabled'
	| 'habitReminders'
	| 'streakMilestones'
	| 'goalProgress'
	| 'holidaySuggestions'
	| 'reminderTime';

interface FieldChange {
	original: unknown;
	current: unknown;
}

function createSettingsChangesStore() {
	const { subscribe, set, update } = writable<Map<SettingsField, FieldChange>>(new Map());

	return {
		subscribe,

		// Mark a field as changed
		setField: (field: SettingsField, original: unknown, current: unknown) => {
			update((changes) => {
				// If field is already tracked, preserve the true original value
				const existing = changes.get(field);
				const actualOriginal = existing ? existing.original : original;

				if (actualOriginal === current) {
					// Value is back to original, remove from tracking
					changes.delete(field);
				} else {
					changes.set(field, { original: actualOriginal, current });
				}
				return new Map(changes);
			});
		},

		// Clear a specific field
		clearField: (field: SettingsField) => {
			update((changes) => {
				changes.delete(field);
				return new Map(changes);
			});
		},

		// Clear all changes (after save or discard)
		clearAll: () => {
			set(new Map());
		},

		// Discard all changes - returns the original values
		getOriginalValues: (): Map<SettingsField, unknown> => {
			let originals = new Map<SettingsField, unknown>();
			subscribe((changes) => {
				changes.forEach((value, key) => {
					originals.set(key, value.original);
				});
			})();
			return originals;
		}
	};
}

export const settingsChanges = createSettingsChangesStore();

// Derived store to check if there are any changes
export const hasUnsavedChanges = derived(settingsChanges, ($changes) => $changes.size > 0);

// Derived store to get list of changed field names
export const changedFields = derived(settingsChanges, ($changes) => new Set($changes.keys()));
