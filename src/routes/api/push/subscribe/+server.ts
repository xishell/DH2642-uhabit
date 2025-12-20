import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import {
	requireAuth,
	requireDB,
	enforceApiRateLimit,
	parseAndValidate
} from '$lib/server/api-helpers';
import { pushSubscription } from '$lib/server/db/schema';

const subscribeSchema = z.object({
	endpoint: z.string().url(),
	keys: z.object({
		p256dh: z.string().min(1),
		auth: z.string().min(1)
	})
});

const unsubscribeSchema = z.object({
	endpoint: z.string().url()
});

/**
 * POST /api/push/subscribe
 * Register a push subscription for the authenticated user
 */
export const POST: RequestHandler = async (event) => {
	const { request, locals, platform } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	const data = await parseAndValidate(request, subscribeSchema);
	const userAgent = request.headers.get('user-agent');

	// Check if subscription already exists
	const existing = await db
		.select()
		.from(pushSubscription)
		.where(eq(pushSubscription.endpoint, data.endpoint))
		.limit(1);

	const now = new Date();

	if (existing.length > 0) {
		// Update existing subscription (might be a different user or re-subscription)
		await db
			.update(pushSubscription)
			.set({
				userId,
				keys: JSON.stringify(data.keys),
				userAgent,
				lastUsedAt: now
			})
			.where(eq(pushSubscription.endpoint, data.endpoint));

		return json({ success: true, updated: true });
	}

	// Create new subscription
	const subscriptionId = crypto.randomUUID();

	await db.insert(pushSubscription).values({
		id: subscriptionId,
		userId,
		endpoint: data.endpoint,
		keys: JSON.stringify(data.keys),
		userAgent,
		createdAt: now,
		lastUsedAt: now
	});

	return json({ success: true, created: true }, { status: 201 });
};

/**
 * DELETE /api/push/subscribe
 * Unsubscribe from push notifications
 */
export const DELETE: RequestHandler = async (event) => {
	const { request, locals, platform } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	const data = await parseAndValidate(request, unsubscribeSchema);

	// Delete subscription (only if it belongs to this user)
	await db
		.delete(pushSubscription)
		.where(and(eq(pushSubscription.endpoint, data.endpoint), eq(pushSubscription.userId, userId)));

	return json({ success: true });
};
