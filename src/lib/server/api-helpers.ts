import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { getDB } from './db';
import { habit, habitCompletion } from './db/schema';

/**
 * Requires authentication and returns the authenticated user's ID.
 * Throws 401 error if user is not authenticated.
 */
export function requireAuth(locals: RequestEvent['locals']): string {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	return locals.user.id;
}

/**
 * Verifies that a habit exists and belongs to the authenticated user.
 * Throws 404 error if habit not found or doesn't belong to user.
 */
export async function verifyHabitOwnership(
	db: ReturnType<typeof getDB>,
	habitId: string,
	userId: string
) {
	const habits = await db
		.select()
		.from(habit)
		.where(and(eq(habit.id, habitId), eq(habit.userId, userId)))
		.limit(1);

	if (habits.length === 0) {
		throw error(404, 'Habit not found');
	}

	return habits[0];
}

/**
 * Verifies that both a habit and completion exist and belong to the authenticated user.
 * Throws 404 error if either not found or don't belong to user.
 */
export async function verifyCompletionOwnership(
	db: ReturnType<typeof getDB>,
	habitId: string,
	completionId: string,
	userId: string
) {
	// Verify habit exists and belongs to user
	const habitRecord = await verifyHabitOwnership(db, habitId, userId);

	// Verify completion exists and belongs to the habit
	const completions = await db
		.select()
		.from(habitCompletion)
		.where(and(eq(habitCompletion.id, completionId), eq(habitCompletion.habitId, habitId)))
		.limit(1);

	if (completions.length === 0) {
		throw error(404, 'Completion not found');
	}

	return { habit: habitRecord, completion: completions[0] };
}
