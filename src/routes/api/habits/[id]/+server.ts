import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { habit } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth, verifyHabitOwnership, enforceApiRateLimit } from '$lib/server/api-helpers';

// Validation schema for habit updates
const updateHabitSchema = z.object({
	title: z.string().min(1).max(255).optional(),
	notes: z.string().nullish(),
	color: z.string().nullish(),
	frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
	measurement: z.enum(['boolean', 'numeric']).optional(),
	period: z.array(z.number().int()).nullish(),
	targetAmount: z.number().int().positive().nullish(),
	unit: z
		.string()
		.nullish()
		.transform((val) => val?.trim().toLowerCase() || null),
	categoryId: z.string().uuid().nullish(),
	goalId: z.string().uuid().nullish()
});

// GET /api/habits/[id] - Get single habit by ID
export const GET: RequestHandler = async (event) => {
	const { params, locals, platform, setHeaders } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = getDB(platform!.env.DB);

	// Fetch habit - ensure it belongs to the current user
	const found = await verifyHabitOwnership(db, params.id, userId);

	// Cache privately to reduce repeat DB hits for the same habit
	setHeaders({
		'Cache-Control': 'private, max-age=300, stale-while-revalidate=60'
	});

	return json({
		...found,
		period: found.period ? JSON.parse(found.period) : null
	});
};

const parseUpdateBody = async (request: Request) => {
	const body = await request.json();
	const validationResult = updateHabitSchema.safeParse(body);

	if (!validationResult.success) {
		throw error(
			400,
			'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
		);
	}

	return validationResult.data;
};

const validateNumericHabit = (
	data: z.infer<typeof updateHabitSchema>,
	existingHabit: typeof habit.$inferSelect
) => {
	const effectiveMeasurement = data.measurement ?? existingHabit.measurement;
	const effectiveTargetAmount = data.targetAmount ?? existingHabit.targetAmount;
	const effectiveUnit = data.unit ?? existingHabit.unit;

	if (
		effectiveMeasurement === 'numeric' &&
		(effectiveTargetAmount == null || effectiveUnit == null || effectiveUnit.trim() === '')
	) {
		throw error(400, 'Numeric habits require both targetAmount and unit');
	}
};

const buildUpdateData = (
	data: z.infer<typeof updateHabitSchema>,
	existingHabit: typeof habit.$inferSelect
) => {
	const serializedPeriod = data.period ? JSON.stringify(data.period) : null;
	const updateData: Record<string, unknown> = { updatedAt: new Date() };

	const maybeSet = (key: keyof typeof updateData, value: unknown) => {
		if (value !== undefined) updateData[key] = value;
	};

	maybeSet('title', data.title);
	maybeSet('notes', data.notes);
	maybeSet('color', data.color);
	maybeSet('frequency', data.frequency);
	maybeSet('measurement', data.measurement);
	maybeSet('period', data.period !== undefined ? serializedPeriod : undefined);
	maybeSet('targetAmount', data.targetAmount);
	maybeSet('unit', data.unit);
	maybeSet('categoryId', data.categoryId);
	maybeSet('goalId', data.goalId);

	const mergedPeriod =
		data.period !== undefined
			? data.period
			: existingHabit.period
				? JSON.parse(existingHabit.period)
				: null;

	const updatedHabit = {
		...existingHabit,
		...updateData,
		period: mergedPeriod
	};

	return { updateData, updatedHabit };
};

// PATCH /api/habits/[id] - Update existing habit
export const PATCH: RequestHandler = async (event) => {
	const { params, request, locals, platform } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);

	const data = await parseUpdateBody(request);
	const db = getDB(platform!.env.DB);

	// Check if habit exists and belongs to user
	const existingHabit = await verifyHabitOwnership(db, params.id, userId);
	validateNumericHabit(data, existingHabit);

	const { updateData, updatedHabit } = buildUpdateData(data, existingHabit);

	// Update habit
	await db
		.update(habit)
		.set({
			...updateData
		})
		.where(and(eq(habit.id, params.id), eq(habit.userId, userId)));

	return json(updatedHabit);
};

// DELETE /api/habits/[id] - Delete habit
export const DELETE: RequestHandler = async (event) => {
	const { params, locals, platform } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = getDB(platform!.env.DB);

	// Check if habit exists and belongs to user
	await verifyHabitOwnership(db, params.id, userId);

	// Delete habit
	await db.delete(habit).where(and(eq(habit.id, params.id), eq(habit.userId, userId)));

	return new Response(null, { status: 204 });
};
