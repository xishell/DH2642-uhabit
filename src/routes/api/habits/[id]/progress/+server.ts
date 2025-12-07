import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { habit, habitCompletion } from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { startOfDay, endOfDay } from '$lib/utils/date';

// Validation schema for adding progress
const addProgressSchema = z.object({
	// Amount to add to today's progress
	amount: z.number().int().positive('Amount must be a positive integer'),
	// Optional notes for this entry
	notes: z.string().max(1000).nullish()
});

// POST /api/habits/[id]/progress - Add progress to a numeric habit
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

	// Only allow progress on numeric habits
	if (targetHabit.measurement !== 'numeric') {
		throw error(
			400,
			'Progress can only be added to numeric habits. Use /complete for boolean habits.'
		);
	}

	// Parse and validate request body
	const body = await request.json().catch(() => ({}));
	const validationResult = addProgressSchema.safeParse(body);

	if (!validationResult.success) {
		throw error(
			400,
			'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
		);
	}

	const data = validationResult.data;

	// Create a new completion record for this progress entry
	const completionId = crypto.randomUUID();
	const now = new Date();

	try {
		await db.insert(habitCompletion).values({
			id: completionId,
			habitId: params.id,
			userId,
			completedAt: now,
			measurement: data.amount,
			notes: data.notes ?? null,
			createdAt: now
		});
	} catch (err) {
		console.error('Insert error:', err);
		throw error(500, 'Failed to add progress: ' + (err as Error).message);
	}

	// Fetch today's total progress
	const dayStart = startOfDay(now);
	const dayEnd = endOfDay(now);

	const todayCompletions = await db
		.select()
		.from(habitCompletion)
		.where(
			and(
				eq(habitCompletion.habitId, params.id),
				gte(habitCompletion.completedAt, dayStart),
				lte(habitCompletion.completedAt, dayEnd)
			)
		);

	const todayTotal = todayCompletions.reduce(
		(sum, completion) => sum + (completion.measurement ?? 0),
		0
	);

	const target = targetHabit.targetAmount ?? 0;
	const isCompleted = target > 0 && todayTotal >= target;

	// Fetch the created completion
	const newCompletion = await db
		.select()
		.from(habitCompletion)
		.where(eq(habitCompletion.id, completionId))
		.limit(1);

	return json(
		{
			completion: newCompletion[0],
			todayTotal,
			target: targetHabit.targetAmount,
			isCompleted
		},
		{ status: 201 }
	);
};
