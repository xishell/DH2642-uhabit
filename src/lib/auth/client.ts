import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
	baseURL: typeof window !== 'undefined' ? window.location.origin : ''
});

export interface SignUpData {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	username: string;
}

export async function signUp(data: SignUpData) {
	// Construct name from firstName and lastName for Better Auth compatibility
	const name =
		[data.firstName, data.lastName].filter(Boolean).join(' ') || data.email.split('@')[0];

	const result = await authClient.signUp.email(
		{
			email: data.email,
			password: data.password,
			name
		},
		{
			body: {
				firstName: data.firstName,
				lastName: data.lastName,
				username: data.username
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
	firstName?: string;
	lastName?: string;
	username?: string;
	displayName?: string;
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
