import { integer, sqliteTable, text, index, unique } from 'drizzle-orm/sqlite-core';

// Better-auth user table with custom fields for D1
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
	image: text('image'),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
	// Custom fields for user preferences
	displayName: text('displayName'),
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

// Category table for organizing habits
export const category = sqliteTable('category', {
	id: text('id').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	color: text('color'),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull()
});

// Habit table for tracking user habits
export const habit = sqliteTable('habit', {
	id: text('id').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	notes: text('notes'),
	color: text('color'),
	// Frequency: 'daily', 'weekly', 'monthly', or custom interval
	frequency: text('frequency').notNull().default('daily'),
	// Measurement type: 'boolean' (single-step) or 'numeric' (progressive)
	measurement: text('measurement').notNull().default('boolean'),
	// Period for frequency - JSON array of selected days
	// Weekly: [0,2,4] for Sunday, Tuesday, Thursday (0=Sunday, 6=Saturday)
	// Monthly: [1,15,30] for 1st, 15th, and 30th of month
	period: text('period'),
	// Target amount for numeric habits (e.g., 5 for "5 cups of water")
	targetAmount: integer('targetAmount'),
	// Unit for numeric habits (e.g., "cups", "liters", "steps")
	unit: text('unit'),
	// Category for organizing habits
	categoryId: text('categoryId').references(() => category.id, { onDelete: 'set null' }),
	// Goal this habit contributes to (for future goal system)
	goalId: text('goalId'), // Will reference goal table when implemented
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

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
		// Measurement value for progressive habits (null for single-step habits)
		measurement: integer('measurement'),
		// Optional notes for this completion
		notes: text('notes'),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		// Index for querying completions by user and date range
		userDateIdx: index('habit_completion_user_date_idx').on(table.userId, table.completedAt),
		// Index for querying completions by habit and date
		habitDateIdx: index('habit_completion_habit_date_idx').on(table.habitId, table.completedAt),
		// Unique constraint for single-step habits (one completion per habit per day)
		// This will be enforced at the application layer for the date part
		uniqueHabitDate: unique('habit_completion_unique').on(table.habitId, table.completedAt)
	})
);
