/**
 * API service layer for user operations.
 * Handles all HTTP communication for user preferences and avatar.
 */

export type Fetcher = typeof fetch;

export interface UserApiDeps {
	fetcher: Fetcher;
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

export interface AvatarUploadResponse {
	success: boolean;
	imageUrl: string;
}

export function createUserApi({ fetcher }: UserApiDeps) {
	const getPreferences = async (): Promise<UserSettingsResponse> => {
		const res = await fetcher('/api/user/preferences', {
			credentials: 'include'
		});

		if (!res.ok) {
			if (res.status === 401) {
				throw new Error('Not authenticated');
			}
			throw new Error('Failed to get preferences');
		}

		return (await res.json()) as UserSettingsResponse;
	};

	const updatePreferences = async (settings: UserSettings): Promise<UserSettingsResponse> => {
		const res = await fetcher('/api/user/preferences', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify(settings)
		});

		if (!res.ok) {
			if (res.status === 401) {
				throw new Error('Not authenticated');
			}
			throw new Error('Failed to update preferences');
		}

		return (await res.json()) as UserSettingsResponse;
	};

	const uploadAvatar = async (file: File): Promise<AvatarUploadResponse> => {
		const formData = new FormData();
		formData.append('avatar', file);

		const res = await fetcher('/api/user/avatar', {
			method: 'POST',
			credentials: 'include',
			body: formData
		});

		if (!res.ok) {
			const errorData = (await res.json().catch(() => ({}))) as { message?: string };
			throw new Error(errorData.message || 'Upload failed');
		}

		return (await res.json()) as AvatarUploadResponse;
	};

	return {
		getPreferences,
		updatePreferences,
		uploadAvatar
	};
}

export type UserApi = ReturnType<typeof createUserApi>;
