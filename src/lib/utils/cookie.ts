/**
 * Client-side cookie utilities for persisting UI state
 * Uses js-cookie for reliable cross-browser handling
 */

import Cookies from 'js-cookie';

const DEFAULT_OPTIONS: Cookies.CookieAttributes = {
	expires: 7,
	path: '/',
	sameSite: 'Lax'
};

export function setCookie(name: string, value: string, days = 7): void {
	Cookies.set(name, value, { ...DEFAULT_OPTIONS, expires: days });
}

export function setJsonCookie(name: string, value: unknown, days = 7): void {
	Cookies.set(name, JSON.stringify(value), { ...DEFAULT_OPTIONS, expires: days });
}

export function deleteCookie(name: string): void {
	Cookies.remove(name, { path: '/' });
}

export function getCookie(name: string): string | undefined {
	return Cookies.get(name);
}

export function getJsonCookie<T>(name: string): T | null {
	const value = Cookies.get(name);
	if (!value) return null;
	try {
		return JSON.parse(value) as T;
	} catch {
		return null;
	}
}
