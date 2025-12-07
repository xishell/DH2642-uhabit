import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { habit, habitCompletion } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for updating a completion
const updateCompletionSchema = z.object({
	// Measurement value (for numeric habits)
	measurement: z.number().int().positive().nullish(),
	// Optional notes for this completion
	notes: z.string().max(1000).nullish()
});

// Helper function to verify habit and completion ownership
async function verifyOwnership(
	db: ReturnType<typeof getDB>,
	habitId: string,
	completionId: string,
	userId: string
) {
	// Verify habit exists and belongs to user
	const habits = await db
		.select()
		.from(habit)
		.where(and(eq(habit.id, habitId), eq(habit.userId, userId)))
		.limit(1);

	if (habits.length === 0) {
		throw error(404, 'Habit not found');
	}

	// Verify completion exists and belongs to the habit
	const completions = await db
		.select()
		.from(habitCompletion)
		.where(and(eq(habitCompletion.id, completionId), eq(habitCompletion.habitId, habitId)))
		.limit(1);

	if (completions.length === 0) {
		throw error(404, 'Completion not found');
	}

	return { habit: habits[0], completion: completions[0] };
}

// GET /api/habits/[id]/completions/[completionId] - Get single completion
export const GET: RequestHandler = async ({ params, locals, platform, setHeaders }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

	const db = getDB(platform!.env.DB);

	const { completion } = await verifyOwnership(db, params.id, params.completionId, userId);

	// Cache privately
	setHeaders({
		'Cache-Control': 'private, max-age=60, stale-while-revalidate=30'
	});

	return json(completion);
};

// PATCH /api/habits/[id]/completions/[completionId] - Update completion
export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

	const db = getDB(platform!.env.DB);

	// Verify ownership
	await verifyOwnership(db, params.id, params.completionId, userId);

	// Parse and validate request body
	const body = await request.json();
	const validationResult = updateCompletionSchema.safeParse(body);

	if (!validationResult.success) {
		throw error(
			400,
			'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
		);
	}

	const data = validationResult.data;

	// Check if there's anything to update
	if (Object.keys(data).length === 0) {
		throw error(400, 'No fields to update');
	}

	// Build update object
	const updateData: { measurement?: number | null; notes?: string | null } = {};

	if (data.measurement !== undefined) {
		updateData.measurement = data.measurement;
	}

	if (data.notes !== undefined) {
		updateData.notes = data.notes;
	}

	// Update completion
	await db
		.update(habitCompletion)
		.set(updateData)
		.where(eq(habitCompletion.id, params.completionId));

	// Fetch the updated completion
	const updatedCompletion = await db
		.select()
		.from(habitCompletion)
		.where(eq(habitCompletion.id, params.completionId))
		.limit(1);

	return json(updatedCompletion[0]);
};

// DELETE /api/habits/[id]/completions/[completionId] - Delete completion
export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

	const db = getDB(platform!.env.DB);

	// Verify ownership
	await verifyOwnership(db, params.id, params.completionId, userId);

	// Delete completion
	await db.delete(habitCompletion).where(eq(habitCompletion.id, params.completionId));

	return new Response(null, { status: 204 });
};
