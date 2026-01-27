/**
 * Presenter layer for notifications.
 * Manages state and coordinates API calls.
 */

import { writable } from 'svelte/store';
import type { Notification } from '$lib/types/notification';
import { createNotificationsApi } from '$lib/api/notificationsApi';
import { savePendingNotifications, isIDBAvailable } from '$lib/notifications/idb';

export type NotificationsState = {
	notifications: Notification[];
	unreadCount: number;
	loading: boolean;
	hasMore: boolean;
	page: number;
	initialized: boolean;
	error: string | null;
};

type NotificationsPresenterDeps = {
	fetcher: typeof fetch;
};

function parseNotificationDates(notification: Notification): Notification {
	return {
		...notification,
		createdAt: new Date(notification.createdAt),
		expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : null
	};
}

export function createNotificationsPresenter({ fetcher }: NotificationsPresenterDeps) {
	const api = createNotificationsApi({ fetcher });

	const state = writable<NotificationsState>({
		notifications: [],
		unreadCount: 0,
		loading: false,
		hasMore: false,
		page: 1,
		initialized: false,
		error: null
	});

	const { subscribe, update } = state;

	const getState = (): NotificationsState => {
		let current: NotificationsState;
		subscribe((v) => (current = v))();
		// @ts-expect-error - assigned above
		return current as NotificationsState;
	};

	const fetchUnreadCount = async () => {
		try {
			const data = await api.fetchUnreadCount();
			update((s) => ({ ...s, unreadCount: data.count, error: null }));
		} catch (error) {
			console.error('Failed to fetch unread count:', error);
			update((s) => ({ ...s, error: 'Failed to fetch unread count' }));
		}
	};

	const fetchNotifications = async (reset = false) => {
		const currentState = getState();
		if (currentState.loading) return;

		update((s) => ({ ...s, loading: true, error: null }));

		try {
			const pageToFetch = reset ? 1 : currentState.page;
			const data = await api.fetchNotifications(pageToFetch);

			const parsed = data.data.map(parseNotificationDates);

			update((s) => {
				const notifications = reset ? parsed : [...s.notifications, ...parsed];
				return {
					...s,
					notifications,
					hasMore: data.pagination.hasMore,
					page: reset ? 1 : s.page,
					initialized: true,
					loading: false,
					error: null
				};
			});

			// Save unread notifications to IndexedDB for service worker access
			if (isIDBAvailable()) {
				const unread = parsed.filter((n) => !n.read);
				if (unread.length > 0) {
					savePendingNotifications(unread).catch(() => {
						// Silently ignore IDB errors
					});
				}
			}
		} catch (error) {
			console.error('Failed to fetch notifications:', error);
			update((s) => ({ ...s, loading: false, error: 'Failed to fetch notifications' }));
		}
	};

	const loadMore = async () => {
		const currentState = getState();
		if (currentState.hasMore && !currentState.loading) {
			update((s) => ({ ...s, page: s.page + 1 }));
			await fetchNotifications();
		}
	};

	const markAsRead = async (notificationId: string) => {
		try {
			await api.markAsRead(notificationId);

			update((s) => {
				const notification = s.notifications.find((n) => n.id === notificationId);
				const wasUnread = notification && !notification.read;

				return {
					...s,
					unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
					notifications: s.notifications.map((n) =>
						n.id === notificationId ? { ...n, read: true } : n
					),
					error: null
				};
			});
		} catch (error) {
			console.error('Failed to mark notification as read:', error);
			update((s) => ({ ...s, error: 'Failed to mark notification as read' }));
		}
	};

	const markAllAsRead = async () => {
		try {
			await api.markAllAsRead();

			update((s) => ({
				...s,
				notifications: s.notifications.map((n) => ({ ...n, read: true })),
				unreadCount: 0,
				error: null
			}));
		} catch (error) {
			console.error('Failed to mark all as read:', error);
			update((s) => ({ ...s, error: 'Failed to mark all notifications as read' }));
		}
	};

	const dismiss = async (notificationId: string) => {
		try {
			await api.dismiss(notificationId);

			update((s) => {
				const notification = s.notifications.find((n) => n.id === notificationId);
				const wasUnread = notification && !notification.read;

				return {
					...s,
					unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
					notifications: s.notifications.filter((n) => n.id !== notificationId),
					error: null
				};
			});
		} catch (error) {
			console.error('Failed to dismiss notification:', error);
			update((s) => ({ ...s, error: 'Failed to dismiss notification' }));
		}
	};

	const reset = () => {
		update(() => ({
			notifications: [],
			unreadCount: 0,
			loading: false,
			hasMore: false,
			page: 1,
			initialized: false,
			error: null
		}));
	};

	return {
		state: { subscribe },
		fetchUnreadCount,
		fetchNotifications,
		loadMore,
		markAsRead,
		markAllAsRead,
		dismiss,
		reset
	};
}

export type NotificationsPresenter = ReturnType<typeof createNotificationsPresenter>;
