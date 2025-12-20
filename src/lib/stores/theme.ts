import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'theme-mode';

function getSystemPreference(): 'light' | 'dark' {
	if (!browser) return 'dark';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialMode(): ThemeMode {
	if (!browser) return 'system';
	const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null;
	return stored || 'system';
}

function createThemeStore() {
	const { subscribe, set, update } = writable<ThemeMode>(getInitialMode());

	function applyTheme(mode: ThemeMode) {
		if (!browser) return;

		const effectiveMode = mode === 'system' ? getSystemPreference() : mode;
		const html = document.documentElement;

		// Use Skeleton's data-mode attribute strategy
		html.setAttribute('data-mode', effectiveMode);

		// Set color-scheme for native browser styling (scrollbars, form controls, etc.)
		html.style.colorScheme = effectiveMode;

		// Also set the class for Tailwind dark: variants
		if (effectiveMode === 'dark') {
			html.classList.add('dark');
		} else {
			html.classList.remove('dark');
		}
	}

	// Apply theme on initial load
	if (browser) {
		applyTheme(getInitialMode());

		// Listen for system preference changes
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
			const currentMode = localStorage.getItem(THEME_KEY) as ThemeMode | null;
			if (currentMode === 'system' || !currentMode) {
				applyTheme('system');
			}
		});
	}

	return {
		subscribe,
		set: (mode: ThemeMode) => {
			if (browser) {
				localStorage.setItem(THEME_KEY, mode);
				applyTheme(mode);
			}
			set(mode);
		},
		toggle: () => {
			update((current) => {
				const effectiveCurrent = current === 'system' ? getSystemPreference() : current;
				const newMode = effectiveCurrent === 'dark' ? 'light' : 'dark';
				if (browser) {
					localStorage.setItem(THEME_KEY, newMode);
					applyTheme(newMode);
				}
				return newMode;
			});
		},
		initialize: () => {
			if (browser) {
				applyTheme(getInitialMode());
			}
		}
	};
}

export const themeMode = createThemeStore();
