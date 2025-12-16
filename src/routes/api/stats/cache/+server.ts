import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, requireDB } from '$lib/server/api-helpers';
import { statsCache } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const getCacheSchema = z.object({
	scope: z.enum(['daily', 'weekly', 'monthly']),
	dateKey: z.string()
});

const setCacheSchema = z.object({
	scope: z.enum(['daily', 'weekly', 'monthly']),
	dateKey: z.string(),
	data: z.record(z.string(), z.unknown()),
	validUntil: z.string()
});

/**
 * GET /api/stats/cache?scope=daily&dateKey=2025-01-01
 * Retrieve cached stats for a specific scope and date
 */
export const GET: RequestHandler = async ({ locals, platform, url }) => {
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	const scope = url.searchParams.get('scope');
	const dateKey = url.searchParams.get('dateKey');

	const parsed = getCacheSchema.safeParse({ scope, dateKey });
	if (!parsed.success) {
		throw error(400, 'Invalid parameters: scope and dateKey required');
	}

	const cacheId = `${userId}-${parsed.data.scope}-${parsed.data.dateKey}`;

	const cached = await db
		.select()
		.from(statsCache)
		.where(and(eq(statsCache.id, cacheId), eq(statsCache.userId, userId)))
		.limit(1);

	if (cached.length === 0) {
		return json(null);
	}

	const entry = cached[0];

	// Check if cache is still valid
	if (entry.validUntil < new Date()) {
		// Cache expired, delete it
		await db.delete(statsCache).where(eq(statsCache.id, cacheId));
		return json(null);
	}

	return json({
		scope: entry.scope,
		dateKey: entry.dateKey,
		data: JSON.parse(entry.data),
		computedAt: entry.computedAt.toISOString(),
		validUntil: entry.validUntil.toISOString()
	});
};

/**
 * PUT /api/stats/cache
 * Store computed stats in the server cache
 */
export const PUT: RequestHandler = async ({ locals, platform, request }) => {
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	const body = await request.json();
	const parsed = setCacheSchema.safeParse(body);

	if (!parsed.success) {
		throw error(400, 'Invalid request body');
	}

	const { scope, dateKey, data, validUntil } = parsed.data;
	const cacheId = `${userId}-${scope}-${dateKey}`;
	const now = new Date();

	await db
		.insert(statsCache)
		.values({
			id: cacheId,
			userId,
			scope,
			dateKey,
			data: JSON.stringify(data),
			computedAt: now,
			validUntil: new Date(validUntil)
		})
		.onConflictDoUpdate({
			target: statsCache.id,
			set: {
				data: JSON.stringify(data),
				computedAt: now,
				validUntil: new Date(validUntil)
			}
		});

	return json({ success: true });
};

/**
 * DELETE /api/stats/cache
 * Clear all cached stats for the user
 */
export const DELETE: RequestHandler = async ({ locals, platform }) => {
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	await db.delete(statsCache).where(eq(statsCache.userId, userId));

	return json({ success: true });
};
