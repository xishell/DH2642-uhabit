import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { getDB } from './db';
import { habit, habitCompletion } from './db/schema';
import type { z } from 'zod';
import { checkRateLimit, getClientIP, getRateLimits } from './ratelimit';
import type { Habit } from '$lib/types/habit';

/** Database instance type returned by getDB */
export type DB = ReturnType<typeof getDB>;

/**
 * Parse a habit record from the database, converting JSON fields and casting types.
 * Use this when fetching habits from the database to ensure proper typing.
 *
 * @param h - Raw habit record from the database
 * @returns Parsed habit with proper types for frequency, measurement, and period
 *
 * @example
 * const habits = await db.select().from(habit).where(eq(habit.userId, userId));
 * const parsed = habits.map(parseHabitFromDB);
 */
export function parseHabitFromDB(h: typeof habit.$inferSelect): Habit {
	return {
		...h,
		frequency: h.frequency as Habit['frequency'],
		measurement: h.measurement as Habit['measurement'],
		period: h.period ? JSON.parse(h.period) : null
	};
}

/** Default pagination limits */
export const PAGINATION_DEFAULTS = {
	page: 1,
	limit: 20,
	maxLimit: 100
} as const;

/** Pagination parameters parsed from URL */
export interface PaginationParams {
	page: number;
	limit: number;
	offset: number;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasMore: boolean;
	};
}

/**
 * Requires authentication and returns the authenticated user's ID.
 *
 * @param locals - The locals object from the request event
 * @returns The authenticated user's ID
 * @throws {HttpError} 401 if user is not authenticated
 *
 * @example
 * export const GET: RequestHandler = async ({ locals }) => {
 *   const userId = requireAuth(locals);
 *   // userId is guaranteed to be a valid string here
 * };
 */
export function requireAuth(locals: RequestEvent['locals']): string {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	return locals.user.id;
}

/**
 * Requires a valid database connection from the platform environment.
 *
 * @param platform - The platform object from the request event
 * @returns A database instance ready for queries
 * @throws {HttpError} 500 if database is not configured
 *
 * @example
 * export const GET: RequestHandler = async ({ platform }) => {
 *   const db = requireDB(platform);
 *   const results = await db.select().from(habit);
 * };
 */
export function requireDB(platform: RequestEvent['platform']): DB {
	const db = platform?.env?.DB;
	if (!db) {
		console.error('[API] Database not available in platform.env');
		throw error(500, 'Database not configured');
	}
	return getDB(db);
}

/**
 * Verifies that a habit exists and belongs to the authenticated user.
 *
 * @param db - Database instance
 * @param habitId - The ID of the habit to verify
 * @param userId - The authenticated user's ID
 * @returns The habit record if found and owned by user
 * @throws {HttpError} 404 if habit not found or doesn't belong to user
 */
export async function verifyHabitOwnership(db: DB, habitId: string, userId: string) {
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
 *
 * @param db - Database instance
 * @param habitId - The ID of the habit
 * @param completionId - The ID of the completion to verify
 * @param userId - The authenticated user's ID
 * @returns Object containing both the habit and completion records
 * @throws {HttpError} 404 if habit or completion not found or don't belong to user
 */
export async function verifyCompletionOwnership(
	db: DB,
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

/**
 * Safely parses JSON from a request body with proper error handling.
 * Returns an empty object for empty bodies (allows optional body requests).
 *
 * @template T - The expected type of the parsed body
 * @param request - The incoming HTTP request
 * @returns Parsed JSON body, or empty object if body is empty
 * @throws {HttpError} 400 for malformed JSON
 */
export async function parseJsonBody<T = unknown>(request: Request): Promise<T> {
	const text = await request.text();

	// Allow empty body (returns empty object for optional body endpoints)
	if (!text || text.trim() === '') {
		return {} as T;
	}

	try {
		return JSON.parse(text) as T;
	} catch {
		throw error(400, 'Invalid JSON in request body');
	}
}

/**
 * Parses and validates request body against a Zod schema.
 *
 * @template T - Zod schema type
 * @param request - The incoming HTTP request
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data from the request body
 * @throws {HttpError} 400 for invalid JSON or validation failures
 *
 * @example
 * const data = await parseAndValidate(request, createHabitSchema);
 * // data is fully typed based on the schema
 */
export async function parseAndValidate<T extends z.ZodTypeAny>(
	request: Request,
	schema: T
): Promise<z.infer<T>> {
	const body = await parseJsonBody(request);
	const result = schema.safeParse(body);

	if (!result.success) {
		throw error(400, 'Invalid input: ' + result.error.issues.map((e) => e.message).join(', '));
	}

	return result.data;
}

/**
 * Parses pagination parameters from URL search params.
 * Ensures values are within valid ranges (page >= 1, limit between 1 and maxLimit).
 *
 * @param url - The request URL containing search params
 * @returns Pagination parameters with page, limit, and calculated offset
 *
 * @example
 * // URL: /api/habits?page=2&limit=10
 * const pagination = parsePagination(url);
 * // { page: 2, limit: 10, offset: 10 }
 */
export function parsePagination(url: URL): PaginationParams {
	const pageParam = url.searchParams.get('page');
	const limitParam = url.searchParams.get('limit');

	const page = Math.max(1, parseInt(pageParam || '', 10) || PAGINATION_DEFAULTS.page);
	const limit = Math.min(
		PAGINATION_DEFAULTS.maxLimit,
		Math.max(1, parseInt(limitParam || '', 10) || PAGINATION_DEFAULTS.limit)
	);
	const offset = (page - 1) * limit;

	return { page, limit, offset };
}

/**
 * Creates a paginated response wrapper with metadata.
 *
 * @template T - Type of items in the data array
 * @param data - Array of items for the current page
 * @param total - Total count of all items across all pages
 * @param pagination - Pagination parameters used for the query
 * @returns Wrapped response with data and pagination metadata
 */
export function paginatedResponse<T>(
	data: T[],
	total: number,
	pagination: PaginationParams
): PaginatedResponse<T> {
	const totalPages = Math.ceil(total / pagination.limit);

	return {
		data,
		pagination: {
			page: pagination.page,
			limit: pagination.limit,
			total,
			totalPages,
			hasMore: pagination.page < totalPages
		}
	};
}

/** Date format regex for YYYY-MM-DD validation */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates that a date string is in YYYY-MM-DD format.
 * Throws 400 error if format is invalid.
 */
export function validateDateParam(value: string | null, paramName: string): void {
	if (value && !DATE_REGEX.test(value)) {
		throw error(400, `Invalid "${paramName}" date format. Use YYYY-MM-DD`);
	}
}

/**
 * Parses and validates date range parameters from URL.
 * Returns validated date strings or null if not provided.
 * Throws 400 error if any date format is invalid.
 */
export function parseDateRangeParams(url: URL): {
	date: string | null;
	from: string | null;
	to: string | null;
} {
	const date = url.searchParams.get('date');
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');

	validateDateParam(date, 'date');
	validateDateParam(from, 'from');
	validateDateParam(to, 'to');

	return { date, from, to };
}

/**
 * Rate limit result with headers to set on response
 */
export interface RateLimitResult {
	headers: Record<string, string>;
}

/**
 * Enforces API rate limiting based on client IP.
 * Automatically detects dev/staging environments for relaxed limits.
 *
 * @param event - The SvelteKit request event
 * @returns Rate limit headers to include in the response
 * @throws {HttpError} 429 if rate limit exceeded
 *
 * @example
 * export const GET: RequestHandler = async (event) => {
 *   await enforceApiRateLimit(event);
 *   // Continue with request handling...
 * };
 */
export async function enforceApiRateLimit(event: RequestEvent): Promise<RateLimitResult> {
	const clientIP = getClientIP(event.request);
	const url = event.url.origin;

	// Detect dev/staging environments for relaxed limits
	const isStagingOrPreview =
		/preview-\d+\..*\.pages\.dev/.test(url) ||
		url.includes('staging.') ||
		url.includes('localhost') ||
		url.includes('127.0.0.1');

	const rateLimits = getRateLimits(isStagingOrPreview);
	const kv = event.platform?.env?.RATE_LIMIT;

	const result = await checkRateLimit(`api:${clientIP}`, rateLimits.API, kv);

	if (!result.allowed) {
		throw error(429, 'Too many requests. Please try again later.');
	}

	return {
		headers: {
			'X-RateLimit-Limit': result.limit.toString(),
			'X-RateLimit-Remaining': result.remaining.toString(),
			'X-RateLimit-Reset': result.resetAt.toString()
		}
	};
}
