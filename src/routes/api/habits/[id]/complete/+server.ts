import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { habit, habitCompletion } from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { startOfDay, endOfDay } from '$lib/utils/date';

// Validation schema for completing a habit
const completeHabitSchema = z.object({
	// Optional date - defaults to today if not provided
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
		.nullish(),
	// Measurement value for numeric habits (required for numeric, ignored for boolean)
	measurement: z.number().int().positive().nullish(),
	// Optional notes for this completion
	notes: z.string().max(1000).nullish()
});

// POST /api/habits/[id]/complete - Mark habit as complete
export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

	const db = getDB(platform!.env.DB);

	// Verify habit exists and belongs to user
	const habits = await db
		.select()
		.from(habit)
		.where(and(eq(habit.id, params.id), eq(habit.userId, userId)))
		.limit(1);

	if (habits.length === 0) {
		throw error(404, 'Habit not found');
	}

	const targetHabit = habits[0];

	// Parse and validate request body
	const body = await request.json().catch(() => ({}));
	const validationResult = completeHabitSchema.safeParse(body);

	if (!validationResult.success) {
		throw error(
			400,
			'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
		);
	}

	const data = validationResult.data;

	// Parse completion date (default to today)
	const completionDate = data.date ? new Date(data.date + 'T12:00:00Z') : new Date();
	const dayStart = startOfDay(completionDate);
	const dayEnd = endOfDay(completionDate);

	// Validate measurement for numeric habits
	if (targetHabit.measurement === 'numeric' && data.measurement === undefined) {
		throw error(400, 'Measurement value is required for numeric habits');
	}

	// For boolean habits, check for duplicate completions on the same day
	if (targetHabit.measurement === 'boolean') {
		const existingCompletions = await db
			.select()
			.from(habitCompletion)
			.where(
				and(
					eq(habitCompletion.habitId, params.id),
					gte(habitCompletion.completedAt, dayStart),
					lte(habitCompletion.completedAt, dayEnd)
				)
			)
			.limit(1);

		if (existingCompletions.length > 0) {
			throw error(409, 'Habit already completed for this date');
		}
	}

	// Create the completion record
	const completionId = crypto.randomUUID();
	const now = new Date();

	try {
		await db.insert(habitCompletion).values({
			id: completionId,
			habitId: params.id,
			userId,
			completedAt: completionDate,
			measurement: data.measurement ?? null,
			notes: data.notes ?? null,
			createdAt: now
		});
	} catch (err) {
		console.error('Insert error:', err);
		throw error(500, 'Failed to create completion: ' + (err as Error).message);
	}

	// Fetch the created completion
	const newCompletion = await db
		.select()
		.from(habitCompletion)
		.where(eq(habitCompletion.id, completionId))
		.limit(1);

	return json(newCompletion[0], { status: 201 });
};
