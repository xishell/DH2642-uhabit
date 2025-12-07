import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { habitCompletion } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth, verifyCompletionOwnership } from '$lib/server/api-helpers';

// Validation schema for updating a completion
const updateCompletionSchema = z.object({
	// Measurement value (for numeric habits)
	measurement: z.number().int().positive().nullish(),
	// Optional notes for this completion
	notes: z.string().max(1000).nullish()
});

// GET /api/habits/[id]/completions/[completionId] - Get single completion
export const GET: RequestHandler = async ({ params, locals, platform, setHeaders }) => {
	const userId = requireAuth(locals);
	const db = getDB(platform!.env.DB);

	const { completion } = await verifyCompletionOwnership(db, params.id, params.completionId, userId);

	// Cache privately
	setHeaders({
		'Cache-Control': 'private, max-age=60, stale-while-revalidate=30'
	});

	return json(completion);
};

// PATCH /api/habits/[id]/completions/[completionId] - Update completion
export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
	const userId = requireAuth(locals);
	const db = getDB(platform!.env.DB);

	// Verify ownership
	await verifyCompletionOwnership(db, params.id, params.completionId, userId);

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
	const userId = requireAuth(locals);
	const db = getDB(platform!.env.DB);

	// Verify ownership
	await verifyCompletionOwnership(db, params.id, params.completionId, userId);

	// Delete completion
	await db.delete(habitCompletion).where(eq(habitCompletion.id, params.completionId));

	return new Response(null, { status: 204 });
};
