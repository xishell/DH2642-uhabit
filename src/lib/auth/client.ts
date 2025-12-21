import { createAuthClient } from 'better-auth/client';
import { usernameClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	baseURL: typeof window !== 'undefined' ? window.location.origin : '',
	plugins: [usernameClient()]
});

export interface SignUpData {
	email: string;
	password: string;
	username: string;
}

export async function signUp(data: SignUpData) {
	// Use username as the Better Auth 'name' field (display name)
	const result = await authClient.signUp.email(
		{
			email: data.email,
			password: data.password,
			name: data.username
		},
		{
			body: {
				username: data.username
			}
		}
	);

	if (result.error) {
		throw new Error(result.error.message || 'Sign up failed');
	}

	return result.data;
}

export async function signIn(emailOrUsername: string, password: string) {
	const isEmail = emailOrUsername.includes('@');

	const result = isEmail
		? await authClient.signIn.email({
				email: emailOrUsername,
				password
			})
		: await authClient.signIn.username({
				username: emailOrUsername,
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

export interface NotificationPrefs {
	enabled?: boolean;
	pushEnabled?: boolean;
	habitReminders?: boolean;
	reminderTime?: string;
	streakMilestones?: boolean;
	goalProgress?: boolean;
	holidaySuggestions?: boolean;
}

export interface UserPreferences {
	notifications?: boolean;
	emailNotifications?: boolean;
	weekStartsOn?: number;
	bio?: string;
	accentColor?: string;
	typography?: string;
	notificationPrefs?: NotificationPrefs;
}

export interface UserSettings {
	username?: string;
	name?: string;
	pronouns?: string;
	theme?: 'light' | 'dark' | 'system';
	country?: string;
	preferences?: UserPreferences;
}

export interface UserSettingsResponse {
	username: string | null;
	name: string;
	pronouns: string | null;
	theme: 'light' | 'dark' | 'system';
	country: string | null;
	preferences: UserPreferences;
	imageUrl: string | null;
}

export async function getPreferences(): Promise<UserSettingsResponse> {
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

export async function updatePreferences(preferences: UserSettings): Promise<UserSettingsResponse> {
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
