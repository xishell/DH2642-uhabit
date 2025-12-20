import { integer, sqliteTable, text, index, unique } from 'drizzle-orm/sqlite-core';

// Better-auth user table with custom fields for D1
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	// Keep 'name' for Better Auth compatibility (required by the library)
	name: text('name').notNull(),
	// User profile fields
	username: text('username').unique(),
	email: text('email').notNull().unique(),
	emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
	image: text('image'),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
	// Custom fields for user preferences
	displayName: text('displayName'),
	pronouns: text('pronouns'),
	theme: text('theme').default('system'), // 'light', 'dark', or 'system'
	country: text('country'),
	preferences: text('preferences') // JSON string for flexibility
});

// Better-auth session table
export const session = sqliteTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
		token: text('token').notNull().unique(),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
		ipAddress: text('ipAddress'),
		userAgent: text('userAgent'),
		userId: text('userId')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(table) => ({
		userIdx: index('session_user_id_idx').on(table.userId)
	})
);

// Better-auth account table (for OAuth and credentials)
export const account = sqliteTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('accountId').notNull(),
		providerId: text('providerId').notNull(),
		userId: text('userId')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('accessToken'),
		refreshToken: text('refreshToken'),
		idToken: text('idToken'),
		accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
		refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
		scope: text('scope'),
		password: text('password'),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		userIdx: index('account_user_id_idx').on(table.userId)
	})
);

// Better-auth verification table
export const verification = sqliteTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
		createdAt: integer('createdAt', { mode: 'timestamp' }),
		updatedAt: integer('updatedAt', { mode: 'timestamp' })
	},
	(table) => ({
		identifierIdx: index('verification_identifier_idx').on(table.identifier)
	})
);

// Goal table for user objectives with attached habits
export const goal = sqliteTable(
	'goal',
	{
		id: text('id').primaryKey(),
		userId: text('userId')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		description: text('description'),
		color: text('color'),
		// Date range for the goal (stored as milliseconds)
		startDate: integer('startDate', { mode: 'timestamp_ms' }).notNull(),
		endDate: integer('endDate', { mode: 'timestamp_ms' }).notNull(),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull()
	},
	(table) => ({
		userIdx: index('goal_user_id_idx').on(table.userId),
		userDatesIdx: index('goal_user_dates_idx').on(table.userId, table.startDate, table.endDate)
	})
);

// Category table for organizing habits
export const category = sqliteTable(
	'category',
	{
		id: text('id').primaryKey(),
		userId: text('userId')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		color: text('color'),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		userIdx: index('category_user_id_idx').on(table.userId)
	})
);

// Habit table for tracking user habits
export const habit = sqliteTable(
	'habit',
	{
		id: text('id').primaryKey(),
		userId: text('userId')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		notes: text('notes'),
		color: text('color'),
		// Frequency: 'daily', 'weekly', 'monthly', or custom interval
		frequency: text('frequency').notNull().default('daily'),
		// Measurement type: 'boolean' (checkbox) or 'numeric' (tracked amount)
		measurement: text('measurement').notNull().default('boolean'),
		// Period for frequency - JSON array of selected days
		// Weekly: [0,2,4] for Sunday, Tuesday, Thursday (0=Sunday, 6=Saturday)
		// Monthly: [1,15,30] for 1st, 15th, and 30th of month
		period: text('period'),
		// Target amount for numeric habits
		targetAmount: integer('targetAmount'),
		// Unit for numeric habits
		unit: text('unit'),
		// Category for organizing habits
		categoryId: text('categoryId').references(() => category.id, { onDelete: 'set null' }),
		// Goal this habit contributes to
		goalId: text('goalId').references(() => goal.id, { onDelete: 'set null' }),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		userFrequencyIdx: index('habit_user_frequency_idx').on(table.userId, table.frequency)
	})
);

// Stats cache table for storing computed statistics server-side
export const statsCache = sqliteTable(
	'stats_cache',
	{
		id: text('id').primaryKey(), // Format: `${userId}-${scope}-${dateKey}`
		userId: text('userId')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		scope: text('scope').notNull(), // 'daily', 'weekly', 'monthly'
		dateKey: text('dateKey').notNull(), // YYYY-MM-DD for the period
		// Computed stats stored as JSON
		data: text('data').notNull(), // JSON string of ComputedStatistics
		computedAt: integer('computedAt', { mode: 'timestamp' }).notNull(),
		validUntil: integer('validUntil', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		userScopeIdx: index('stats_cache_user_scope_idx').on(table.userId, table.scope),
		validUntilIdx: index('stats_cache_valid_until_idx').on(table.validUntil)
	})
);

// Habit completions table for tracking when users complete habits
export const habitCompletion = sqliteTable(
	'habit_completion',
	{
		id: text('id').primaryKey(),
		habitId: text('habitId')
			.notNull()
			.references(() => habit.id, { onDelete: 'cascade' }),
		userId: text('userId')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		// When the habit was completed
		completedAt: integer('completedAt', { mode: 'timestamp' }).notNull(),
		// Measurement value for numeric habits (null for boolean habits)
		measurement: integer('measurement'),
		// Optional notes for this completion
		notes: text('notes'),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		// Index for querying all completions by user (without date filter)
		userIdx: index('habit_completion_user_idx').on(table.userId),
		// Index for querying completions by user and date range
		userDateIdx: index('habit_completion_user_date_idx').on(table.userId, table.completedAt),
		// Index for querying completions by habit and date
		habitDateIdx: index('habit_completion_habit_date_idx').on(table.habitId, table.completedAt),
		// Unique constraint for boolean habits (one completion per habit per day)
		// This will be enforced at the application layer for the date part
		uniqueHabitDate: unique('habit_completion_unique').on(table.habitId, table.completedAt)
	})
);
