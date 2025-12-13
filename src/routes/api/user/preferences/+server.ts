import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '$lib/server/api-helpers';

// Validation schema for user preferences
const preferencesSchema = z.object({
	firstName: z.string().min(1).max(50).optional(),
	lastName: z.string().min(1).max(50).optional(),
	username: z
		.string()
		.min(3)
		.max(20)
		.regex(/^[a-zA-Z0-9_]+$/)
		.optional(),
	displayName: z.string().min(1).max(100).optional(),
	theme: z.enum(['light', 'dark', 'system']).optional(),
	country: z.string().length(2).optional(), // ISO 3166-1 alpha-2 code
	preferences: z
		.object({
			notifications: z.boolean().optional(),
			emailNotifications: z.boolean().optional(),
			weekStartsOn: z.number().int().min(0).max(6).optional()
		})
		.optional()
});

export const GET: RequestHandler = async ({ locals, platform, setHeaders }) => {
	const userId = requireAuth(locals);

	const db = platform?.env?.DB;
	if (!db) {
		return error(500, 'Service temporarily unavailable');
	}

	const drizzle = getDB(db);

	const [userData] = await drizzle
		.select({
			firstName: user.firstName,
			lastName: user.lastName,
			username: user.username,
			displayName: user.displayName,
			theme: user.theme,
			country: user.country,
			preferences: user.preferences
		})
		.from(user)
		.where(eq(user.id, userId));

	if (!userData) {
		return error(401, 'Authentication required');
	}

	// Private cache to avoid re-fetching each request
	setHeaders({
		'Cache-Control': 'private, max-age=300, stale-while-revalidate=60'
	});

	let preferences = {};
	if (userData.preferences) {
		try {
			preferences = JSON.parse(userData.preferences as string);
		} catch (e) {
			console.error('Failed to parse user preferences JSON:', e);
		}
	}

	return json({
		firstName: userData.firstName,
		lastName: userData.lastName,
		username: userData.username,
		displayName: userData.displayName,
		theme: userData.theme || 'system',
		country: userData.country,
		preferences
	});
};

export const PATCH: RequestHandler = async ({ request, locals, platform }) => {
	const userId = requireAuth(locals);

	const db = platform?.env?.DB;
	if (!db) {
		return error(500, 'Service temporarily unavailable');
	}

	const drizzle = getDB(db);

	const body = await parsePreferencesBody(request);
	const updates = await buildPreferenceUpdates(drizzle, userId, body);
	const nextPreferences = body.preferences
		? await computeNextPreferences(drizzle, userId, body.preferences)
		: null;

	await drizzle
		.update(user)
		.set({ ...updates, preferences: nextPreferences })
		.where(eq(user.id, userId));

	const [updatedUser] = await drizzle
		.select({
			firstName: user.firstName,
			lastName: user.lastName,
			username: user.username,
			displayName: user.displayName,
			theme: user.theme,
			country: user.country,
			preferences: user.preferences
		})
		.from(user)
		.where(eq(user.id, userId));

	let preferences = {};
	preferences = nextPreferences ? JSON.parse(nextPreferences) : {};

	return json({
		firstName: updatedUser.firstName,
		lastName: updatedUser.lastName,
		username: updatedUser.username,
		displayName: updatedUser.displayName,
		theme: updatedUser.theme || 'system',
		country: updatedUser.country,
		preferences
	});
};

const parsePreferencesBody = async (request: Request) => {
	try {
		const rawBody = await request.json();
		return preferencesSchema.parse(rawBody);
	} catch (e) {
		if (e instanceof z.ZodError) {
			throw error(400, `Validation error: ${e.issues.map((err) => err.message).join(', ')}`);
		}
		throw error(400, 'Invalid request body');
	}
};

const buildPreferenceUpdates = async (
	drizzle: ReturnType<typeof getDB>,
	userId: string,
	body: z.infer<typeof preferencesSchema>
) => {
	const updates = buildSimpleUpdates(body);
	await syncNameIfNeeded(drizzle, userId, body, updates);
	return updates;
};

const buildSimpleUpdates = (body: z.infer<typeof preferencesSchema>) => {
	const updates: Partial<typeof user.$inferInsert> = { updatedAt: new Date() };
	const simpleFields: Partial<typeof user.$inferInsert> = {
		firstName: body.firstName,
		lastName: body.lastName,
		username: body.username ? body.username.toLowerCase().trim() : undefined,
		displayName: body.displayName,
		theme: body.theme,
		country: body.country
	};

	for (const [key, value] of Object.entries(simpleFields)) {
		if (value !== undefined) {
			// @ts-expect-error - dynamic assignment
			updates[key] = value;
		}
	}

	return updates;
};

const syncNameIfNeeded = async (
	drizzle: ReturnType<typeof getDB>,
	userId: string,
	body: z.infer<typeof preferencesSchema>,
	updates: Partial<typeof user.$inferInsert>
) => {
	if (body.firstName === undefined && body.lastName === undefined) return;

	const [currentUser] = await drizzle
		.select({ firstName: user.firstName, lastName: user.lastName })
		.from(user)
		.where(eq(user.id, userId));

	const newFirstName = body.firstName ?? currentUser?.firstName ?? '';
	const newLastName = body.lastName ?? currentUser?.lastName ?? '';
	updates.name = [newFirstName, newLastName].filter(Boolean).join(' ') || 'User';
};

const loadCurrentPreferences = async (drizzle: ReturnType<typeof getDB>, userId: string) => {
	const [currentUser] = await drizzle
		.select({ preferences: user.preferences })
		.from(user)
		.where(eq(user.id, userId));

	if (!currentUser?.preferences) return {};
	try {
		return JSON.parse(currentUser.preferences as string);
	} catch (e) {
		console.error('Failed to parse existing preferences JSON:', e);
		return {};
	}
};

const computeNextPreferences = async (
	drizzle: ReturnType<typeof getDB>,
	userId: string,
	partialPrefs: Record<string, unknown> | undefined
) => {
	if (partialPrefs === undefined) return null;
	const currentPrefs = await loadCurrentPreferences(drizzle, userId);
	return JSON.stringify({ ...currentPrefs, ...partialPrefs });
};
