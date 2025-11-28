import { describe, it, expect } from 'vitest';
import { isToday, startOfDay, endOfDay, formatDate, getDaysBetween } from '$lib/utils/date';

describe('Date Utilities', () => {
	describe('isToday', () => {
		it('returns true for current date', () => {
			const now = new Date();
			expect(isToday(now)).toBe(true);
		});

		it('returns false for yesterday', () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			expect(isToday(yesterday)).toBe(false);
		});

		it('returns false for tomorrow', () => {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			expect(isToday(tomorrow)).toBe(false);
		});
	});

	describe('startOfDay', () => {
		it('sets time to midnight', () => {
			const date = new Date('2025-11-28T15:30:45.123');
			const result = startOfDay(date);

			expect(result.getHours()).toBe(0);
			expect(result.getMinutes()).toBe(0);
			expect(result.getSeconds()).toBe(0);
			expect(result.getMilliseconds()).toBe(0);
		});

		it('preserves the date', () => {
			const date = new Date('2025-11-28T15:30:45');
			const result = startOfDay(date);

			expect(result.getFullYear()).toBe(2025);
			expect(result.getMonth()).toBe(10); // November is month 10
			expect(result.getDate()).toBe(28);
		});
	});

	describe('endOfDay', () => {
		it('sets time to end of day', () => {
			const date = new Date('2025-11-28T10:00:00');
			const result = endOfDay(date);

			expect(result.getHours()).toBe(23);
			expect(result.getMinutes()).toBe(59);
			expect(result.getSeconds()).toBe(59);
			expect(result.getMilliseconds()).toBe(999);
		});
	});

	describe('formatDate', () => {
		it('formats date as YYYY-MM-DD', () => {
			const date = new Date('2025-11-28T15:30:00');
			expect(formatDate(date)).toBe('2025-11-28');
		});

		it('pads single digit months and days', () => {
			const date = new Date('2025-01-05T12:00:00');
			expect(formatDate(date)).toBe('2025-01-05');
		});
	});

	describe('getDaysBetween', () => {
		it('calculates days between two dates', () => {
			const start = new Date('2025-11-20');
			const end = new Date('2025-11-28');
			expect(getDaysBetween(start, end)).toBe(8);
		});

		it('returns 0 for same day', () => {
			const date = new Date('2025-11-28');
			expect(getDaysBetween(date, date)).toBe(0);
		});

		it('handles negative duration', () => {
			const start = new Date('2025-11-28');
			const end = new Date('2025-11-20');
			expect(getDaysBetween(start, end)).toBe(-8);
		});

		it('ignores time of day', () => {
			const start = new Date('2025-11-20T23:59:00');
			const end = new Date('2025-11-21T00:01:00');
			expect(getDaysBetween(start, end)).toBe(1);
		});
	});
});
