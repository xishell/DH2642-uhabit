import type { Notification } from '$lib/types/notification';

const DB_NAME = 'uhabit-notifications';
const DB_VERSION = 1;
const STORE_NAME = 'pending';

export interface PendingNotification {
	id: string;
	title: string;
	body: string;
	type: string;
	actionUrl: string;
	createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: 'id' });
			}
		};
	});
}

export async function savePendingNotification(notification: Notification): Promise<void> {
	try {
		const db = await openDB();
		const pending: PendingNotification = {
			id: notification.id,
			title: notification.title,
			body: notification.body,
			type: notification.type,
			actionUrl: getActionUrl(notification),
			createdAt: notification.createdAt.getTime()
		};

		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			store.put(pending);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	} catch (error) {
		console.error('[IDB] Failed to save pending notification:', error);
	}
}

export async function savePendingNotifications(notifications: Notification[]): Promise<void> {
	if (notifications.length === 0) return;

	try {
		const db = await openDB();

		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);

			for (const notification of notifications) {
				store.put({
					id: notification.id,
					title: notification.title,
					body: notification.body,
					type: notification.type,
					actionUrl: getActionUrl(notification),
					createdAt: notification.createdAt.getTime()
				});
			}

			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	} catch (error) {
		console.error('[IDB] Failed to save pending notifications:', error);
	}
}

export async function getPendingNotifications(): Promise<PendingNotification[]> {
	try {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readonly');
			const request = tx.objectStore(STORE_NAME).getAll();
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result || []);
		});
	} catch (error) {
		console.error('[IDB] Failed to get pending notifications:', error);
		return [];
	}
}

export async function clearPendingNotifications(): Promise<void> {
	try {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			tx.objectStore(STORE_NAME).clear();
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	} catch (error) {
		console.error('[IDB] Failed to clear pending notifications:', error);
	}
}

function getActionUrl(notification: Notification): string {
	switch (notification.type) {
		case 'streak_milestone':
		case 'habit_reminder':
			return notification.habitId ? `/habits/${notification.habitId}` : '/habits';
		case 'goal_progress':
			return notification.goalId ? `/goals/${notification.goalId}` : '/goals';
		default:
			return '/overview';
	}
}

export function isIDBAvailable(): boolean {
	return typeof indexedDB !== 'undefined';
}
