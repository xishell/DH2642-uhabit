import type { Notification } from '$lib/types/notification';

class NotificationStore {
	notifications = $state<Notification[]>([]);
	unreadCount = $state(0);
	loading = $state(false);
	hasMore = $state(false);
	page = $state(1);
	initialized = $state(false);

	async fetchUnreadCount() {
		try {
			const response = await fetch('/api/notifications/unread-count');
			if (response.ok) {
				const data = (await response.json()) as { count: number };
				this.unreadCount = data.count;
			}
		} catch (error) {
			console.error('Failed to fetch unread count:', error);
		}
	}

	async fetchNotifications(reset = false) {
		if (this.loading) return;

		this.loading = true;
		try {
			const pageToFetch = reset ? 1 : this.page;
			const response = await fetch(`/api/notifications?page=${pageToFetch}&limit=10`);

			if (response.ok) {
				const data = (await response.json()) as {
					data: Notification[];
					pagination: { total: number; hasMore: boolean };
				};

				// Parse dates from JSON
				const parsed = data.data.map((n) => ({
					...n,
					createdAt: new Date(n.createdAt),
					expiresAt: n.expiresAt ? new Date(n.expiresAt) : null
				}));

				if (reset) {
					this.notifications = parsed;
					this.page = 1;
				} else {
					this.notifications = [...this.notifications, ...parsed];
				}
				this.hasMore = data.pagination.hasMore;
				this.initialized = true;
			}
		} catch (error) {
			console.error('Failed to fetch notifications:', error);
		} finally {
			this.loading = false;
		}
	}

	async loadMore() {
		if (this.hasMore && !this.loading) {
			this.page += 1;
			await this.fetchNotifications();
		}
	}

	async markAsRead(notificationId: string) {
		try {
			const response = await fetch(`/api/notifications/${notificationId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ read: true })
			});

			if (response.ok) {
				const notification = this.notifications.find((n) => n.id === notificationId);
				if (notification && !notification.read) {
					this.unreadCount = Math.max(0, this.unreadCount - 1);
				}
				this.notifications = this.notifications.map((n) =>
					n.id === notificationId ? { ...n, read: true } : n
				);
			}
		} catch (error) {
			console.error('Failed to mark notification as read:', error);
		}
	}

	async markAllAsRead() {
		try {
			const response = await fetch('/api/notifications/mark-all-read', {
				method: 'PATCH'
			});

			if (response.ok) {
				this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
				this.unreadCount = 0;
			}
		} catch (error) {
			console.error('Failed to mark all as read:', error);
		}
	}

	async dismiss(notificationId: string) {
		try {
			const response = await fetch(`/api/notifications/${notificationId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				const notification = this.notifications.find((n) => n.id === notificationId);
				if (notification && !notification.read) {
					this.unreadCount = Math.max(0, this.unreadCount - 1);
				}
				this.notifications = this.notifications.filter((n) => n.id !== notificationId);
			}
		} catch (error) {
			console.error('Failed to dismiss notification:', error);
		}
	}

	reset() {
		this.notifications = [];
		this.unreadCount = 0;
		this.loading = false;
		this.hasMore = false;
		this.page = 1;
		this.initialized = false;
	}
}

export const notificationStore = new NotificationStore();
