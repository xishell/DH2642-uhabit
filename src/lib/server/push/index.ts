/**
 * Web Push notification sender
 * Implements RFC 8030 (Generic Event Delivery Using HTTP Push) and RFC 8291 (Message Encryption)
 */

import { eq } from 'drizzle-orm';
import type { DB } from '../api-helpers';
import { pushSubscription } from '../db/schema';
import { generateVapidHeaders } from './vapid';
import { encryptPayload, buildEncryptedBody, type SubscriptionKeys } from './encrypt';

export interface PushConfig {
	vapidPublicKey: string;
	vapidPrivateKey: string;
}

export interface PushResult {
	success: boolean;
	endpoint: string;
	statusCode?: number;
	error?: string;
}

/**
 * Send a push notification to a single subscription
 */
export async function sendPushNotification(
	endpoint: string,
	keys: SubscriptionKeys,
	payload: string,
	config: PushConfig
): Promise<PushResult> {
	try {
		// Generate VAPID headers
		const vapidHeaders = await generateVapidHeaders(
			endpoint,
			config.vapidPublicKey,
			config.vapidPrivateKey
		);

		// Encrypt the payload
		const encryption = await encryptPayload(payload, keys);
		const body = buildEncryptedBody(encryption);

		// Send the push message
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				Authorization: vapidHeaders.authorization,
				'Content-Type': 'application/octet-stream',
				'Content-Encoding': 'aes128gcm',
				'Content-Length': String(body.length),
				TTL: '86400', // 24 hours
				Urgency: 'normal'
			},
			body: body.buffer as ArrayBuffer
		});

		if (response.status === 201 || response.status === 200) {
			return { success: true, endpoint, statusCode: response.status };
		}

		// Handle specific error cases
		if (response.status === 404 || response.status === 410) {
			// Subscription has expired or is no longer valid
			return {
				success: false,
				endpoint,
				statusCode: response.status,
				error: 'Subscription expired'
			};
		}

		const errorText = await response.text().catch(() => 'Unknown error');
		return {
			success: false,
			endpoint,
			statusCode: response.status,
			error: errorText
		};
	} catch (error) {
		return {
			success: false,
			endpoint,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Send a push notification to all of a user's subscribed devices
 * Returns results for each subscription attempt
 */
export async function sendPushToUser(
	db: DB,
	userId: string,
	payload: string,
	config: PushConfig
): Promise<PushResult[]> {
	// Get all push subscriptions for the user
	const subscriptions = await db
		.select({
			id: pushSubscription.id,
			endpoint: pushSubscription.endpoint,
			keys: pushSubscription.keys
		})
		.from(pushSubscription)
		.where(eq(pushSubscription.userId, userId));

	if (subscriptions.length === 0) {
		return [];
	}

	const results: PushResult[] = [];
	const expiredSubscriptionIds: string[] = [];

	// Send to all subscriptions
	for (const sub of subscriptions) {
		let keys: SubscriptionKeys;
		try {
			keys = typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys;
		} catch {
			results.push({
				success: false,
				endpoint: sub.endpoint,
				error: 'Invalid subscription keys'
			});
			continue;
		}

		const result = await sendPushNotification(sub.endpoint, keys, payload, config);
		results.push(result);

		// Track expired subscriptions for cleanup
		if (result.statusCode === 404 || result.statusCode === 410) {
			expiredSubscriptionIds.push(sub.id);
		}
	}

	// Clean up expired subscriptions
	if (expiredSubscriptionIds.length > 0) {
		for (const id of expiredSubscriptionIds) {
			await db.delete(pushSubscription).where(eq(pushSubscription.id, id)).catch(() => {
				// Ignore cleanup errors
			});
		}
	}

	return results;
}

/**
 * Send a wake-up push notification (trigger-only, minimal payload)
 * This is the recommended approach for privacy-preserving notifications
 */
export async function sendWakeUpPush(
	db: DB,
	userId: string,
	config: PushConfig
): Promise<PushResult[]> {
	const payload = JSON.stringify({
		type: 'wake',
		timestamp: Date.now()
	});

	return sendPushToUser(db, userId, payload, config);
}

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(env: { VAPID_PUBLIC_KEY?: string; VAPID_PRIVATE_KEY?: string }): boolean {
	return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
}

/**
 * Get push configuration from environment
 */
export function getPushConfig(env: {
	VAPID_PUBLIC_KEY?: string;
	VAPID_PRIVATE_KEY?: string;
}): PushConfig | null {
	if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
		return null;
	}

	return {
		vapidPublicKey: env.VAPID_PUBLIC_KEY,
		vapidPrivateKey: env.VAPID_PRIVATE_KEY
	};
}

export { generateVapidHeaders } from './vapid';
export { encryptPayload, buildEncryptedBody } from './encrypt';
