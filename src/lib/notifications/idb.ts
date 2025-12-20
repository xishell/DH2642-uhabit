/**
 * IndexedDB helpers for notification storage
 *
 * This module provides helpers to store notifications in IndexedDB
 * so the service worker can display them when a push is received.
 *
 * Uses the same database and store names as the service worker (static/sw.js).
 */

import type { Notification } from '$lib/types/notification';

const DB_NAME = 'uhabit-notifications';
const DB_VERSION = 1;
const STORE_NAME = 'pending';

/**
 * Pending notification format for IndexedDB/service worker
 */
export interface PendingNotification {
	id: string;
	title: string;
	body: string;
	type: string;
	actionUrl: string;
	createdAt: number;
}

/**
 * Open the IndexedDB database
 */
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

/**
 * Save a notification to IndexedDB for the service worker to display
 */
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
			const request = store.put(pending);

			request.onerror = () => reject(request.error);
			tx.oncomplete = () => resolve();
		});
	} catch (error) {
		console.error('[IDB] Failed to save pending notification:', error);
	}
}

/**
 * Save multiple notifications to IndexedDB
 */
export async function savePendingNotifications(notifications: Notification[]): Promise<void> {
	if (notifications.length === 0) return;

	try {
		const db = await openDB();

		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);

			for (const notification of notifications) {
				const pending: PendingNotification = {
					id: notification.id,
					title: notification.title,
					body: notification.body,
					type: notification.type,
					actionUrl: getActionUrl(notification),
					createdAt: notification.createdAt.getTime()
				};
				store.put(pending);
			}

			tx.onerror = () => reject(tx.error);
			tx.oncomplete = () => resolve();
		});
	} catch (error) {
		console.error('[IDB] Failed to save pending notifications:', error);
	}
}

/**
 * Get all pending notifications from IndexedDB
 */
export async function getPendingNotifications(): Promise<PendingNotification[]> {
	try {
		const db = await openDB();

		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readonly');
			const store = tx.objectStore(STORE_NAME);
			const request = store.getAll();

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result || []);
		});
	} catch (error) {
		console.error('[IDB] Failed to get pending notifications:', error);
		return [];
	}
}

/**
 * Clear all pending notifications from IndexedDB
 */
export async function clearPendingNotifications(): Promise<void> {
	try {
		const db = await openDB();

		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			store.clear();

			tx.onerror = () => reject(tx.error);
			tx.oncomplete = () => resolve();
		});
	} catch (error) {
		console.error('[IDB] Failed to clear pending notifications:', error);
	}
}

/**
 * Remove a specific notification from IndexedDB
 */
export async function removePendingNotification(id: string): Promise<void> {
	try {
		const db = await openDB();

		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			store.delete(id);

			tx.onerror = () => reject(tx.error);
			tx.oncomplete = () => resolve();
		});
	} catch (error) {
		console.error('[IDB] Failed to remove pending notification:', error);
	}
}

/**
 * Get the action URL for a notification based on its type
 */
function getActionUrl(notification: Notification): string {
	switch (notification.type) {
		case 'streak_milestone':
		case 'habit_reminder':
			return notification.habitId ? `/habits/${notification.habitId}` : '/habits';
		case 'goal_progress':
			return notification.goalId ? `/goals/${notification.goalId}` : '/goals';
		case 'holiday_reschedule':
			return '/overview';
		default:
			return '/overview';
	}
}

/**
 * Check if IndexedDB is available
 */
export function isIDBAvailable(): boolean {
	return typeof indexedDB !== 'undefined';
}
