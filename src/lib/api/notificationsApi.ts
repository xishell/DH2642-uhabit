/**
 * API service layer for notifications.
 * Handles all HTTP communication with the backend.
 */

import type { Notification } from '$lib/types/notification';

export type Fetcher = typeof fetch;

export interface NotificationsApiDeps {
	fetcher: Fetcher;
}

export interface NotificationsPaginatedResponse {
	data: Notification[];
	pagination: {
		total: number;
		hasMore: boolean;
	};
}

export interface UnreadCountResponse {
	count: number;
}

export function createNotificationsApi({ fetcher }: NotificationsApiDeps) {
	const fetchUnreadCount = async (): Promise<UnreadCountResponse> => {
		const res = await fetcher('/api/notifications/unread-count');

		if (!res.ok) {
			throw new Error('Failed to fetch unread count');
		}

		return (await res.json()) as UnreadCountResponse;
	};

	const fetchNotifications = async (
		page: number,
		limit: number = 10
	): Promise<NotificationsPaginatedResponse> => {
		const res = await fetcher(`/api/notifications?page=${page}&limit=${limit}`);

		if (!res.ok) {
			throw new Error('Failed to fetch notifications');
		}

		return (await res.json()) as NotificationsPaginatedResponse;
	};

	const markAsRead = async (notificationId: string): Promise<void> => {
		const res = await fetcher(`/api/notifications/${notificationId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ read: true })
		});

		if (!res.ok) {
			throw new Error('Failed to mark notification as read');
		}
	};

	const markAllAsRead = async (): Promise<void> => {
		const res = await fetcher('/api/notifications/mark-all-read', {
			method: 'PATCH'
		});

		if (!res.ok) {
			throw new Error('Failed to mark all notifications as read');
		}
	};

	const dismiss = async (notificationId: string): Promise<void> => {
		const res = await fetcher(`/api/notifications/${notificationId}`, {
			method: 'DELETE'
		});

		if (!res.ok) {
			throw new Error('Failed to dismiss notification');
		}
	};

	return {
		fetchUnreadCount,
		fetchNotifications,
		markAsRead,
		markAllAsRead,
		dismiss
	};
}

export type NotificationsApi = ReturnType<typeof createNotificationsApi>;
