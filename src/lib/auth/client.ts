import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
	baseURL: typeof window !== 'undefined' ? window.location.origin : ''
});

export interface SignUpData {
	email: string;
	password: string;
	username: string;
}

export async function signUp(data: SignUpData) {
	// Use username as the Better Auth 'name' field
	const result = await authClient.signUp.email(
		{
			email: data.email,
			password: data.password,
			name: data.username
		},
		{
			body: {
				username: data.username,
				displayName: data.username // Default displayName to username on registration
			}
		}
	);

	if (result.error) {
		throw new Error(result.error.message || 'Sign up failed');
	}

	return result.data;
}

export async function signIn(email: string, password: string) {
	const result = await authClient.signIn.email({
		email,
		password
	});
	if (result.error) {
		throw new Error(result.error.message || 'Sign in failed');
	}

	return result.data;
}

export async function signOut() {
	const result = await authClient.signOut();

	if (result.error) {
		throw new Error(result.error.message || 'Sign out failed');
	}

	return result.data;
}

export async function getSession() {
	const result = await authClient.getSession();
	return result.data;
}

export async function getPreferences() {
	const response = await fetch('/api/user/preferences', {
		credentials: 'include'
	});
	if (!response.ok) {
		if (response.status === 401) {
			throw new Error('Not authenticated');
		}
		throw new Error('Failed to get preferences');
	}

	return await response.json();
}

export async function updatePreferences(preferences: {
	username?: string;
	displayName?: string;
	pronouns?: string;
	theme?: 'light' | 'dark' | 'system';
	country?: string;
	preferences?: {
		notifications?: boolean;
		emailNotifications?: boolean;
		weekStartsOn?: number;
	};
}) {
	const response = await fetch('/api/user/preferences', {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include',
		body: JSON.stringify(preferences)
	});

	if (!response.ok) {
		if (response.status === 401) {
			throw new Error('Not authenticated');
		}
		throw new Error('Failed to update preferences');
	}

	return await response.json();
}
