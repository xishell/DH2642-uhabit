import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth, requireDB, enforceApiRateLimit } from '$lib/server/api-helpers';
import { notification } from '$lib/server/db/schema';

/**
 * GET /api/notifications/unread-count
 * Get the count of unread notifications for the authenticated user
 */
export const GET: RequestHandler = async (event) => {
	const { locals, platform } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	const [result] = await db
		.select({ count: sql<number>`count(*)` })
		.from(notification)
		.where(
			and(
				eq(notification.userId, userId),
				eq(notification.read, false),
				eq(notification.dismissed, false)
			)
		);

	return json({ count: Number(result?.count ?? 0) });
};
