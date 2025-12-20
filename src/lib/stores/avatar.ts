import { writable } from 'svelte/store';

export const avatarUrl = writable<string | null>(null);
