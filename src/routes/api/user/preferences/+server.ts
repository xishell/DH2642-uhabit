import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '$lib/server/api-helpers';

// Notification preferences schema
const notificationPrefsSchema = z.object({
	enabled: z.boolean().optional(),
	pushEnabled: z.boolean().optional(),
	habitReminders: z.boolean().optional(),
	reminderTime: z
		.string()
		.regex(/^\d{2}:\d{2}$/)
		.optional(),
	streakMilestones: z.boolean().optional(),
	goalProgress: z.boolean().optional(),
	holidaySuggestions: z.boolean().optional()
});

// Validation schema for user preferences
const preferencesSchema = z.object({
	username: z
		.string()
		.min(3)
		.max(20)
		.regex(/^[a-zA-Z0-9_]+$/)
		.optional(),
	displayName: z.string().min(1).max(100).optional(),
	pronouns: z.string().max(50).optional(),
	theme: z.enum(['light', 'dark', 'system']).optional(),
	country: z.string().length(2).optional(), // ISO 3166-1 alpha-2 code
	preferences: z
		.object({
			notifications: z.boolean().optional(),
			emailNotifications: z.boolean().optional(),
			weekStartsOn: z.number().int().min(0).max(6).optional(),
			bio: z.string().max(100).optional(),
			pronouns: z.string().max(20).optional(),
			accentColor: z.string().max(20).optional(),
			typography: z.string().max(20).optional(),
			notificationPrefs: notificationPrefsSchema.optional()
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
			username: user.username,
			displayName: user.displayName,
			pronouns: user.pronouns,
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
		username: userData.username,
		displayName: userData.displayName,
		pronouns: userData.pronouns,
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
	const updates = buildPreferenceUpdates(body);
	const nextPreferences = body.preferences
		? await computeNextPreferences(drizzle, userId, body.preferences)
		: null;

	await drizzle
		.update(user)
		.set({ ...updates, preferences: nextPreferences })
		.where(eq(user.id, userId));

	const [updatedUser] = await drizzle
		.select({
			username: user.username,
			displayName: user.displayName,
			pronouns: user.pronouns,
			theme: user.theme,
			country: user.country,
			preferences: user.preferences
		})
		.from(user)
		.where(eq(user.id, userId));

	let preferences = {};
	preferences = nextPreferences ? JSON.parse(nextPreferences) : {};

	return json({
		username: updatedUser.username,
		displayName: updatedUser.displayName,
		pronouns: updatedUser.pronouns,
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

const buildPreferenceUpdates = (body: z.infer<typeof preferencesSchema>) => {
	return buildSimpleUpdates(body);
};

const buildSimpleUpdates = (body: z.infer<typeof preferencesSchema>) => {
	const updates: Partial<typeof user.$inferInsert> = { updatedAt: new Date() };
	const simpleFields: Partial<typeof user.$inferInsert> = {
		username: body.username ? body.username.toLowerCase().trim() : undefined,
		displayName: body.displayName,
		pronouns: body.pronouns,
		theme: body.theme,
		country: body.country
	};

	for (const [key, value] of Object.entries(simpleFields)) {
		if (value !== undefined) {
			// @ts-expect-error - dynamic assignment
			updates[key] = value;
		}
	}

	// Sync name field with displayName if updated
	if (body.displayName !== undefined) {
		updates.name = body.displayName || 'User';
	}

	return updates;
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
