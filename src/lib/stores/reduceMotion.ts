import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const MOTION_KEY = 'reduce-motion';

function getSystemPreference(): boolean {
	if (!browser) return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getInitialValue(): boolean {
	if (!browser) return false;
	const stored = localStorage.getItem(MOTION_KEY);
	// If no stored preference, use system preference as default
	if (stored === null) {
		return getSystemPreference();
	}
	return stored === 'true';
}

function createReduceMotionStore() {
	const { subscribe, set } = writable<boolean>(getInitialValue());

	function applyPreference(enabled: boolean) {
		if (!browser) return;

		const html = document.documentElement;
		if (enabled) {
			html.setAttribute('data-reduce-motion', 'true');
		} else {
			html.removeAttribute('data-reduce-motion');
		}
	}

	// Apply on initial load
	if (browser) {
		applyPreference(getInitialValue());
	}

	return {
		subscribe,
		set: (enabled: boolean) => {
			if (browser) {
				localStorage.setItem(MOTION_KEY, String(enabled));
				applyPreference(enabled);
			}
			set(enabled);
		},
		initialize: () => {
			if (browser) {
				applyPreference(getInitialValue());
			}
		}
	};
}

export const reduceMotion = createReduceMotionStore();
