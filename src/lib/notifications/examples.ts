/** Notification System - Frontend Examples: Copy-paste snippets, not meant to be imported directly. */
import type { Notification } from '$lib/types/notification';
import type { Holiday } from '$lib/types/holiday';

// ================================ API HELPERS ================================

/**
 * Fetch notifications with optional filters
 */
export async function fetchNotifications(options?: {
	page?: number;
	limit?: number;
	unreadOnly?: boolean;
}): Promise<{ data: Notification[]; pagination: { total: number; hasMore: boolean } }> {
	const params = new URLSearchParams();
	if (options?.page) params.set('page', String(options.page));
	if (options?.limit) params.set('limit', String(options.limit));
	if (options?.unreadOnly) params.set('unread', 'true');

	const response = await fetch(`/api/notifications?${params}`);
	if (!response.ok) throw new Error('Failed to fetch notifications');
	return response.json();
}

/**
 * Fetch unread notification count
 */
export async function fetchUnreadCount(): Promise<number> {
	const response = await fetch('/api/notifications/unread-count');
	if (!response.ok) throw new Error('Failed to fetch unread count');
	const data = (await response.json()) as { count: number };
	return data.count;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
	const response = await fetch(`/api/notifications/${notificationId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ read: true })
	});
	if (!response.ok) throw new Error('Failed to mark notification as read');
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
	const response = await fetch('/api/notifications/mark-all-read', {
		method: 'PATCH'
	});
	if (!response.ok) throw new Error('Failed to mark all as read');
}

/**
 * Dismiss/delete a notification
 */
export async function dismissNotification(notificationId: string): Promise<void> {
	const response = await fetch(`/api/notifications/${notificationId}`, {
		method: 'DELETE'
	});
	if (!response.ok) throw new Error('Failed to dismiss notification');
}

/**
 * Fetch holidays for user's country
 */
export async function fetchHolidays(from?: string, to?: string): Promise<Holiday[]> {
	const params = new URLSearchParams();
	if (from) params.set('from', from);
	if (to) params.set('to', to);

	const response = await fetch(`/api/holidays?${params}`);
	if (!response.ok) throw new Error('Failed to fetch holidays');
	const data = (await response.json()) as { holidays: Holiday[] };
	return data.holidays;
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
	return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
	if (!('Notification' in window)) {
		throw new Error('Notifications not supported');
	}
	return Notification.requestPermission();
}

/**
 * Subscribe to push notifications
 * Returns true if subscription was successful
 */
export async function subscribeToPush(): Promise<boolean> {
	if (!isPushSupported()) {
		console.warn('Push notifications not supported');
		return false;
	}

	// Request permission
	const permission = await requestNotificationPermission();
	if (permission !== 'granted') {
		console.warn('Notification permission denied');
		return false;
	}

	try {
		// Get VAPID public key
		const keyResponse = await fetch('/api/push/vapid-public-key');
		if (!keyResponse.ok) {
			console.error('Push notifications not configured on server');
			return false;
		}
		const { publicKey } = (await keyResponse.json()) as { publicKey: string };

		// Register service worker if not already registered
		const registration = await navigator.serviceWorker.ready;

		// Subscribe to push
		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
		});

		// Send subscription to server
		const subscribeResponse = await fetch('/api/push/subscribe', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				endpoint: subscription.endpoint,
				keys: {
					p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
					auth: arrayBufferToBase64(subscription.getKey('auth')!)
				}
			})
		});

		return subscribeResponse.ok;
	} catch (error) {
		console.error('Failed to subscribe to push:', error);
		return false;
	}
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();

		if (!subscription) return true;

		// Unsubscribe locally
		await subscription.unsubscribe();

		// Remove from server
		await fetch('/api/push/subscribe', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ endpoint: subscription.endpoint })
		});

		return true;
	} catch (error) {
		console.error('Failed to unsubscribe:', error);
		return false;
	}
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isPushSubscribed(): Promise<boolean> {
	if (!isPushSupported()) return false;

	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();
		return subscription !== null;
	} catch {
		return false;
	}
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert URL-safe base64 to Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}

// ============================================================================
// SVELTE COMPONENT EXAMPLE (copy into .svelte file)
// ============================================================================

/*
<script lang="ts">
  import { Bell } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { fetchNotifications, fetchUnreadCount, markAsRead } from '$lib/notifications/examples';
  import type { Notification } from '$lib/types/notification';

  let notifications: Notification[] = $state([]);
  let unreadCount = $state(0);
  let isOpen = $state(false);
  let loading = $state(false);

  onMount(async () => {
    unreadCount = await fetchUnreadCount();
  });

  async function openDropdown() {
    isOpen = true;
    loading = true;
    try {
      const result = await fetchNotifications({ limit: 10 });
      notifications = result.data;
    } finally {
      loading = false;
    }
  }

  async function handleMarkRead(id: string) {
    await markAsRead(id);
    notifications = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    unreadCount = Math.max(0, unreadCount - 1);
  }
</script>

<div class="relative">
  <button onclick={() => isOpen ? isOpen = false : openDropdown()}>
    <Bell size={20} />
    {#if unreadCount > 0}
      <span class="badge">{unreadCount}</span>
    {/if}
  </button>

  {#if isOpen}
    <div class="dropdown">
      {#if loading}
        <p>Loading...</p>
      {:else if notifications.length === 0}
        <p>No notifications</p>
      {:else}
        {#each notifications as notification}
          <div
            class:unread={!notification.read}
            onclick={() => handleMarkRead(notification.id)}
          >
            <strong>{notification.title}</strong>
            <p>{notification.body}</p>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>
*/

// ============================================================================
// PUSH PERMISSION PROMPT EXAMPLE
// ============================================================================

/*
<script lang="ts">
  import { Bell, BellOff } from 'lucide-svelte';
  import { isPushSupported, isPushSubscribed, subscribeToPush, unsubscribeFromPush } from '$lib/notifications/examples';

  let isSubscribed = $state(false);
  let isSupported = $state(false);
  let loading = $state(false);

  $effect(() => {
    isSupported = isPushSupported();
    if (isSupported) {
      isPushSubscribed().then(v => isSubscribed = v);
    }
  });

  async function togglePush() {
    loading = true;
    try {
      if (isSubscribed) {
        await unsubscribeFromPush();
        isSubscribed = false;
      } else {
        isSubscribed = await subscribeToPush();
      }
    } finally {
      loading = false;
    }
  }
</script>

{#if isSupported}
  <button onclick={togglePush} disabled={loading}>
    {#if isSubscribed}
      <BellOff size={16} /> Disable Push
    {:else}
      <Bell size={16} /> Enable Push
    {/if}
  </button>
{:else}
  <p class="text-surface-500">Push notifications not supported</p>
{/if}
*/
