import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';

/**
 * API Route Test Example
 * This demonstrates testing validation schemas and business logic from API routes
 */

// Import the validation schema from the API route
const createHabitSchema = z
	.object({
		title: z.string().min(1).max(255),
		notes: z.string().optional(),
		color: z.string().optional(),
		frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
		measurement: z.enum(['boolean', 'numeric']).default('boolean'),
		period: z.string().optional(),
		targetAmount: z.number().int().positive().optional(),
		unit: z.string().optional(),
		categoryId: z.string().uuid().optional(),
		goalId: z.string().uuid().optional()
	})
	.refine(
		(data) => {
			// For numeric habits, require targetAmount and unit
			if (data.measurement === 'numeric') {
				return data.targetAmount !== undefined && data.unit !== undefined;
			}
			return true;
		},
		{
			message: 'Numeric habits require both targetAmount and unit',
			path: ['targetAmount']
		}
	);

describe('Habit API Validation', () => {
	describe('createHabitSchema', () => {
		it('validates a minimal valid habit', () => {
			const input = {
				title: 'Drink water'
			};

			const result = createHabitSchema.safeParse(input);
			expect(result.success).toBe(true);

			if (result.success) {
				expect(result.data.title).toBe('Drink water');
				expect(result.data.frequency).toBe('daily');
				expect(result.data.measurement).toBe('boolean');
			}
		});

		it('validates a complete habit with all fields', () => {
			const input = {
				title: 'Run 5km',
				notes: 'Morning run',
				color: '#FF5733',
				frequency: 'weekly' as const,
				measurement: 'numeric' as const,
				period: '[1,3,5]',
				targetAmount: 5,
				unit: 'km',
				categoryId: '123e4567-e89b-12d3-a456-426614174000',
				goalId: '123e4567-e89b-12d3-a456-426614174001'
			};

			const result = createHabitSchema.safeParse(input);
			expect(result.success).toBe(true);

			if (result.success) {
				expect(result.data).toMatchObject(input);
			}
		});

		it('rejects habit with empty title', () => {
			const input = {
				title: ''
			};

			const result = createHabitSchema.safeParse(input);
			expect(result.success).toBe(false);

			if (!result.success) {
				expect(result.error.issues[0].path).toContain('title');
			}
		});

		it('rejects habit with title > 255 characters', () => {
			const input = {
				title: 'a'.repeat(256)
			};

			const result = createHabitSchema.safeParse(input);
			expect(result.success).toBe(false);

			if (!result.success) {
				expect(result.error.issues[0].path).toContain('title');
			}
		});

		it('rejects numeric habit without targetAmount', () => {
			const input = {
				title: 'Run',
				measurement: 'numeric' as const,
				unit: 'km'
			};

			const result = createHabitSchema.safeParse(input);
			expect(result.success).toBe(false);

			if (!result.success) {
				expect(result.error.issues[0].message).toContain(
					'Numeric habits require both targetAmount and unit'
				);
			}
		});

		it('rejects numeric habit without unit', () => {
			const input = {
				title: 'Run',
				measurement: 'numeric' as const,
				targetAmount: 5
			};

			const result = createHabitSchema.safeParse(input);
			expect(result.success).toBe(false);

			if (!result.success) {
				expect(result.error.issues[0].message).toContain(
					'Numeric habits require both targetAmount and unit'
				);
			}
		});

		it('rejects invalid frequency', () => {
			const input = {
				title: 'Test',
				frequency: 'hourly'
			};

			const result = createHabitSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('rejects invalid measurement type', () => {
			const input = {
				title: 'Test',
				measurement: 'percentage'
			};

			const result = createHabitSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('rejects invalid UUID for categoryId', () => {
			const input = {
				title: 'Test',
				categoryId: 'not-a-uuid'
			};

			const result = createHabitSchema.safeParse(input);
			expect(result.success).toBe(false);

			if (!result.success) {
				expect(result.error.issues[0].path).toContain('categoryId');
			}
		});

		it('accepts valid boolean habit', () => {
			const input = {
				title: 'Meditate',
				measurement: 'boolean' as const,
				frequency: 'daily' as const
			};

			const result = createHabitSchema.safeParse(input);
			expect(result.success).toBe(true);

			if (result.success) {
				expect(result.data.measurement).toBe('boolean');
				expect(result.data.targetAmount).toBeUndefined();
				expect(result.data.unit).toBeUndefined();
			}
		});
	});
});
