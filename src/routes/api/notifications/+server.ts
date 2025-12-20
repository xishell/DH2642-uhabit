import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { desc, eq, and, sql } from 'drizzle-orm';
import {
	requireAuth,
	requireDB,
	enforceApiRateLimit,
	parsePagination,
	paginatedResponse
} from '$lib/server/api-helpers';
import { notification } from '$lib/server/db/schema';
import type { Notification, NotificationMetadata } from '$lib/types/notification';

/**
 * Parse notification from database record
 */
function parseNotificationFromDB(n: typeof notification.$inferSelect): Notification {
	return {
		...n,
		type: n.type as Notification['type'],
		metadata: n.metadata ? (JSON.parse(n.metadata) as NotificationMetadata) : null
	};
}

/**
 * GET /api/notifications
 * List notifications for the authenticated user
 * Query params:
 *   - page, limit: pagination
 *   - unread: filter to unread only (true/false)
 */
export const GET: RequestHandler = async (event) => {
	const { locals, platform, url } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	const pagination = parsePagination(url);
	const unreadOnly = url.searchParams.get('unread') === 'true';

	// Build conditions
	const conditions = [eq(notification.userId, userId), eq(notification.dismissed, false)];

	if (unreadOnly) {
		conditions.push(eq(notification.read, false));
	}

	// Get total count
	const [countResult] = await db
		.select({ count: sql<number>`count(*)` })
		.from(notification)
		.where(and(...conditions));
	const total = Number(countResult?.count ?? 0);

	// Get paginated notifications
	const notifications = await db
		.select()
		.from(notification)
		.where(and(...conditions))
		.orderBy(desc(notification.createdAt))
		.limit(pagination.limit)
		.offset(pagination.offset);

	const parsed = notifications.map(parseNotificationFromDB);

	return json(paginatedResponse(parsed, total, pagination));
};
