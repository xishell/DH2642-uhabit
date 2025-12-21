import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getLocaleForCountry } from '$lib/constants/countries';

const STORAGE_KEY = 'user-country';

function createCountryStore() {
	const initial = browser ? localStorage.getItem(STORAGE_KEY) : null;
	const { subscribe, set, update } = writable<string | null>(initial);

	return {
		subscribe,
		set: (value: string | null) => {
			if (browser) {
				if (value) {
					localStorage.setItem(STORAGE_KEY, value);
				} else {
					localStorage.removeItem(STORAGE_KEY);
				}
			}
			set(value);
		},
		update
	};
}

export const userCountry = createCountryStore();

/**
 * Derived locale based on user's country
 */
export function getLocale(country: string | null | undefined): string {
	return getLocaleForCountry(country);
}
