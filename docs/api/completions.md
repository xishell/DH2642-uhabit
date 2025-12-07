# Habit Completion API Documentation

This guide documents the Habit Completion API endpoints for tracking and managing habit completions.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Data Models](#data-models)
4. [Endpoints](#endpoints)
   - [Complete Habit](#complete-habit)
   - [List Completions](#list-completions)
   - [Get Completion](#get-completion)
   - [Update Completion](#update-completion)
   - [Delete Completion](#delete-completion)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

## Overview

The Habit Completion API provides endpoints for marking habits as complete, viewing completion history, and managing individual completion records. All endpoints are scoped to the authenticated user and enforce user isolation.

**Base URL**: `/api/habits/{habitId}`

**Database**: Cloudflare D1 (SQLite)

**Validation**: Zod schemas

## Authentication

All endpoints require a valid session cookie. Unauthenticated requests will return `401 Unauthorized`.

Authentication is handled via Better Auth. Users must sign in via `/api/auth/sign-in` to obtain a session cookie before accessing these endpoints.

## Data Models

### Habit Completion

```typescript
{
	id: string; // UUID v4
	habitId: string; // Habit ID (foreign key)
	userId: string; // User ID (owner)
	completedAt: Date; // When the habit was completed
	measurement: number | null; // Value for numeric habits (null for boolean)
	notes: string | null; // Optional notes for this completion
	createdAt: Date; // Record creation timestamp
}
```

### Field Descriptions

| Field         | Type           | Required | Description                                           |
| ------------- | -------------- | -------- | ----------------------------------------------------- |
| `id`          | string         | Auto     | UUID v4, auto-generated                               |
| `habitId`     | string         | Auto     | Reference to the parent habit                         |
| `userId`      | string         | Auto     | Reference to the owning user                          |
| `completedAt` | Date           | Yes      | Date/time when the habit was completed                |
| `measurement` | number \| null | No       | Numeric value for progressive habits (e.g., 5 cups)   |
| `notes`       | string \| null | No       | Optional notes about this completion (max 1000 chars) |
| `createdAt`   | Date           | Auto     | When the record was created                           |

## Endpoints

### List All Completions

Get all completions for the authenticated user with optional date filtering. This is useful for fetching all completions for a specific day (e.g., for the overview page).

**Endpoint**: `GET /api/completions`

**Authentication**: Required

**Query Parameters**:

| Parameter | Type   | Required | Description                                              |
| --------- | ------ | -------- | -------------------------------------------------------- |
| `date`    | string | No       | Specific date filter (YYYY-MM-DD)                        |
| `from`    | string | No       | Start date filter (YYYY-MM-DD), ignored if `date` is set |
| `to`      | string | No       | End date filter (YYYY-MM-DD), ignored if `date` is set   |

**Response**: `200 OK`

```json
[
	{
		"id": "b8fc76b8-2def-5292-9829-3ee9f9bdgbg4",
		"habitId": "a9ed65a7-1def-4191-8718-2dd8e8acfaf3",
		"userId": "user-123",
		"completedAt": "2025-12-07T12:00:00.000Z",
		"measurement": 8,
		"notes": "Hit my water goal!",
		"createdAt": "2025-12-07T14:30:00.000Z"
	}
]
```

**Example** (Get today's completions):

```bash
curl "http://localhost:8788/api/completions?date=2025-12-07"
```

**Example** (Get completions for date range):

```bash
curl "http://localhost:8788/api/completions?from=2025-12-01&to=2025-12-07"
```

---

### Add Progress (Numeric Habits)

Add incremental progress to a numeric habit. This is the recommended way to track progressive habits like "Drink 8 cups of water" where users add progress throughout the day.

**Endpoint**: `POST /api/habits/{habitId}/progress`

**Authentication**: Required

**URL Parameters**:

- `habitId`: Habit UUID (must be a numeric habit)

**Request Body**:

```json
{
	"amount": 2,
	"notes": "After lunch"
}
```

**Request Body Fields**:

| Field    | Type   | Required | Description                          |
| -------- | ------ | -------- | ------------------------------------ |
| `amount` | number | Yes      | Amount to add (positive integer)     |
| `notes`  | string | No       | Optional notes (max 1000 characters) |

**Response**: `201 Created`

```json
{
	"completion": {
		"id": "b8fc76b8-2def-5292-9829-3ee9f9bdgbg4",
		"habitId": "a9ed65a7-1def-4191-8718-2dd8e8acfaf3",
		"userId": "user-123",
		"completedAt": "2025-12-07T14:30:00.000Z",
		"measurement": 2,
		"notes": "After lunch",
		"createdAt": "2025-12-07T14:30:00.000Z"
	},
	"todayTotal": 5,
	"target": 8,
	"isCompleted": false
}
```

**Example**:

```bash
curl -X POST http://localhost:8788/api/habits/a9ed65a7-1def-4191-8718-2dd8e8acfaf3/progress \
  -H "Content-Type: application/json" \
  -d '{"amount": 2, "notes": "After lunch"}'
```

**TypeScript Example**:

```typescript
async function addProgress(habitId: string, amount: number, notes?: string) {
	const response = await fetch(`/api/habits/${habitId}/progress`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ amount, notes })
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message);
	}

	const result = await response.json();
	// { completion, todayTotal, target, isCompleted }
	return result;
}

// Usage: User drinks 2 cups of water
const { todayTotal, target, isCompleted } = await addProgress('habit-123', 2);
console.log(`Progress: ${todayTotal}/${target} ${isCompleted ? '✓' : ''}`);
```

**Errors**:

- `400 Bad Request` - If habit is boolean (use `/complete` instead)
- `400 Bad Request` - If amount is not a positive integer
- `404 Not Found` - If habit doesn't exist or doesn't belong to user

---

### Complete Habit

Mark a habit as complete for today or a specific date.

**Endpoint**: `POST /api/habits/{habitId}/complete`

**Authentication**: Required

**URL Parameters**:

- `habitId`: Habit UUID

**Request Body**:

```json
{
	"date": "2025-12-07",
	"measurement": 5,
	"notes": "Drank 5 cups before noon"
}
```

**Request Body Fields**:

| Field         | Type   | Required    | Description                                             |
| ------------- | ------ | ----------- | ------------------------------------------------------- |
| `date`        | string | No          | Date in YYYY-MM-DD format (defaults to today)           |
| `measurement` | number | Conditional | Required for numeric habits, ignored for boolean habits |
| `notes`       | string | No          | Optional notes (max 1000 characters)                    |

**Validation Rules**:

- `date`: Must be in `YYYY-MM-DD` format if provided
- `measurement`: Required for numeric habits, must be a positive integer
- `notes`: Optional, max 1000 characters
- For boolean habits: Only one completion allowed per day (returns `409 Conflict` if duplicate)

**Response**: `201 Created`

```json
{
	"id": "b8fc76b8-2def-5292-9829-3ee9f9bdgbg4",
	"habitId": "a9ed65a7-1def-4191-8718-2dd8e8acfaf3",
	"userId": "test-user-123",
	"completedAt": "2025-12-07T12:00:00.000Z",
	"measurement": 5,
	"notes": "Drank 5 cups before noon",
	"createdAt": "2025-12-07T14:30:00.000Z"
}
```

**Example** (Boolean habit - complete today):

```bash
curl -X POST http://localhost:8788/api/habits/a9ed65a7-1def-4191-8718-2dd8e8acfaf3/complete \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Example** (Numeric habit - complete with measurement):

```bash
curl -X POST http://localhost:8788/api/habits/a9ed65a7-1def-4191-8718-2dd8e8acfaf3/complete \
  -H "Content-Type: application/json" \
  -d '{
    "measurement": 8,
    "notes": "Hit my water goal!"
  }'
```

**Example** (Complete for specific date):

```bash
curl -X POST http://localhost:8788/api/habits/a9ed65a7-1def-4191-8718-2dd8e8acfaf3/complete \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-06",
    "notes": "Forgot to log yesterday"
  }'
```

---

### List Completions

Get completion history for a habit with optional date range filtering.

**Endpoint**: `GET /api/habits/{habitId}/completions`

**Authentication**: Required

**URL Parameters**:

- `habitId`: Habit UUID

**Query Parameters**:

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `from`    | string | No       | Start date filter (YYYY-MM-DD) |
| `to`      | string | No       | End date filter (YYYY-MM-DD)   |

**Response**: `200 OK`

```json
[
	{
		"id": "b8fc76b8-2def-5292-9829-3ee9f9bdgbg4",
		"habitId": "a9ed65a7-1def-4191-8718-2dd8e8acfaf3",
		"userId": "test-user-123",
		"completedAt": "2025-12-07T12:00:00.000Z",
		"measurement": 8,
		"notes": "Hit my water goal!",
		"createdAt": "2025-12-07T14:30:00.000Z"
	},
	{
		"id": "c9gd87c9-3efg-6393-0930-4ff0g0cehch5",
		"habitId": "a9ed65a7-1def-4191-8718-2dd8e8acfaf3",
		"userId": "test-user-123",
		"completedAt": "2025-12-06T12:00:00.000Z",
		"measurement": 6,
		"notes": null,
		"createdAt": "2025-12-06T18:00:00.000Z"
	}
]
```

**Example** (All completions):

```bash
curl http://localhost:8788/api/habits/a9ed65a7-1def-4191-8718-2dd8e8acfaf3/completions
```

**Example** (Filter by date range):

```bash
curl "http://localhost:8788/api/habits/a9ed65a7-1def-4191-8718-2dd8e8acfaf3/completions?from=2025-12-01&to=2025-12-07"
```

**Example** (Filter from date only):

```bash
curl "http://localhost:8788/api/habits/a9ed65a7-1def-4191-8718-2dd8e8acfaf3/completions?from=2025-12-01"
```

---

### Get Completion

Get a single completion record by ID.

**Endpoint**: `GET /api/habits/{habitId}/completions/{completionId}`

**Authentication**: Required

**URL Parameters**:

- `habitId`: Habit UUID
- `completionId`: Completion UUID

**Response**: `200 OK`

```json
{
	"id": "b8fc76b8-2def-5292-9829-3ee9f9bdgbg4",
	"habitId": "a9ed65a7-1def-4191-8718-2dd8e8acfaf3",
	"userId": "test-user-123",
	"completedAt": "2025-12-07T12:00:00.000Z",
	"measurement": 8,
	"notes": "Hit my water goal!",
	"createdAt": "2025-12-07T14:30:00.000Z"
}
```

**Example**:

```bash
curl http://localhost:8788/api/habits/a9ed65a7-1def-4191-8718-2dd8e8acfaf3/completions/b8fc76b8-2def-5292-9829-3ee9f9bdgbg4
```

---

### Update Completion

Update an existing completion record (e.g., modify measurement value or notes).

**Endpoint**: `PATCH /api/habits/{habitId}/completions/{completionId}`

**Authentication**: Required

**URL Parameters**:

- `habitId`: Habit UUID
- `completionId`: Completion UUID

**Request Body** (all fields optional):

```json
{
	"measurement": 10,
	"notes": "Actually drank more than I thought"
}
```

**Request Body Fields**:

| Field         | Type   | Required | Description                         |
| ------------- | ------ | -------- | ----------------------------------- |
| `measurement` | number | No       | Updated measurement value           |
| `notes`       | string | No       | Updated notes (max 1000 characters) |

**Validation Rules**:

- At least one field must be provided
- `measurement`: Must be a positive integer if provided
- `notes`: Max 1000 characters if provided

**Response**: `200 OK`

```json
{
	"id": "b8fc76b8-2def-5292-9829-3ee9f9bdgbg4",
	"habitId": "a9ed65a7-1def-4191-8718-2dd8e8acfaf3",
	"userId": "test-user-123",
	"completedAt": "2025-12-07T12:00:00.000Z",
	"measurement": 10,
	"notes": "Actually drank more than I thought",
	"createdAt": "2025-12-07T14:30:00.000Z"
}
```

**Example**:

```bash
curl -X PATCH http://localhost:8788/api/habits/a9ed65a7-1def-4191-8718-2dd8e8acfaf3/completions/b8fc76b8-2def-5292-9829-3ee9f9bdgbg4 \
  -H "Content-Type: application/json" \
  -d '{"measurement": 10, "notes": "Actually drank more than I thought"}'
```

---

### Delete Completion

Delete a completion record.

**Endpoint**: `DELETE /api/habits/{habitId}/completions/{completionId}`

**Authentication**: Required

**URL Parameters**:

- `habitId`: Habit UUID
- `completionId`: Completion UUID

**Response**: `204 No Content`

(Empty response body)

**Example**:

```bash
curl -X DELETE http://localhost:8788/api/habits/a9ed65a7-1def-4191-8718-2dd8e8acfaf3/completions/b8fc76b8-2def-5292-9829-3ee9f9bdgbg4
```

---

## Error Handling

All endpoints follow consistent error response format:

### Error Response Format

```json
{
	"message": "Error description"
}
```

### HTTP Status Codes

| Code  | Meaning               | When                                               |
| ----- | --------------------- | -------------------------------------------------- |
| `200` | OK                    | Successful GET/PATCH request                       |
| `201` | Created               | Successful POST request (new completion)           |
| `204` | No Content            | Successful DELETE request                          |
| `400` | Bad Request           | Invalid input/validation error                     |
| `401` | Unauthorized          | Missing or invalid authentication                  |
| `404` | Not Found             | Habit or completion doesn't exist/belong to user   |
| `409` | Conflict              | Duplicate completion for same date (boolean habit) |
| `500` | Internal Server Error | Database or server error                           |

### Common Errors

#### 400 Bad Request - Invalid Date Format

```json
{
	"message": "Invalid \"from\" date format. Use YYYY-MM-DD"
}
```

**Cause**: Query parameter date is not in YYYY-MM-DD format

**Solution**: Use ISO date format (e.g., `2025-12-07`)

#### 400 Bad Request - Missing Measurement

```json
{
	"message": "Measurement value is required for numeric habits"
}
```

**Cause**: Completing a numeric habit without providing measurement value

**Solution**: Include `measurement` field in request body

#### 400 Bad Request - No Fields to Update

```json
{
	"message": "No fields to update"
}
```

**Cause**: PATCH request with empty body

**Solution**: Provide at least one field to update (`measurement` or `notes`)

#### 404 Not Found - Habit

```json
{
	"message": "Habit not found"
}
```

**Cause**: Habit ID doesn't exist or belongs to different user

**Solution**: Verify the habit ID and ensure it belongs to the authenticated user

#### 404 Not Found - Completion

```json
{
	"message": "Completion not found"
}
```

**Cause**: Completion ID doesn't exist or doesn't belong to the specified habit

**Solution**: Verify the completion ID and habit ID are correct

#### 409 Conflict - Duplicate Completion

```json
{
	"message": "Habit already completed for this date"
}
```

**Cause**: Attempting to complete a boolean habit twice on the same day

**Solution**: Use PATCH to update the existing completion, or DELETE it first

---

## Examples

### Complete TypeScript Integration

```typescript
// Types
interface HabitCompletion {
	id: string;
	habitId: string;
	userId: string;
	completedAt: Date;
	measurement: number | null;
	notes: string | null;
	createdAt: Date;
}

interface CompleteHabitInput {
	date?: string;
	measurement?: number;
	notes?: string;
}

interface UpdateCompletionInput {
	measurement?: number;
	notes?: string;
}

// Complete a habit
async function completeHabit(
	habitId: string,
	data: CompleteHabitInput = {}
): Promise<HabitCompletion> {
	const response = await fetch(`/api/habits/${habitId}/complete`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message);
	}

	return await response.json();
}

// Get completions with optional date filter
async function getCompletions(
	habitId: string,
	from?: string,
	to?: string
): Promise<HabitCompletion[]> {
	const params = new URLSearchParams();
	if (from) params.set('from', from);
	if (to) params.set('to', to);

	const url = `/api/habits/${habitId}/completions${params.toString() ? '?' + params : ''}`;
	const response = await fetch(url);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message);
	}

	return await response.json();
}

// Update a completion
async function updateCompletion(
	habitId: string,
	completionId: string,
	data: UpdateCompletionInput
): Promise<HabitCompletion> {
	const response = await fetch(`/api/habits/${habitId}/completions/${completionId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message);
	}

	return await response.json();
}

// Delete a completion
async function deleteCompletion(habitId: string, completionId: string): Promise<void> {
	const response = await fetch(`/api/habits/${habitId}/completions/${completionId}`, {
		method: 'DELETE'
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message);
	}
}
```

### Usage Example

```typescript
// Complete a boolean habit for today
const completion = await completeHabit('habit-123');
console.log('Completed:', completion.id);

// Complete a numeric habit with measurement
const waterCompletion = await completeHabit('water-habit-456', {
	measurement: 8,
	notes: 'Reached my goal!'
});

// Complete for a specific past date
const pastCompletion = await completeHabit('habit-123', {
	date: '2025-12-06',
	notes: 'Forgot to log yesterday'
});

// Get all completions for this week
const weekCompletions = await getCompletions('habit-123', '2025-12-01', '2025-12-07');
console.log(`Completed ${weekCompletions.length} times this week`);

// Update a completion
const updated = await updateCompletion('habit-123', 'completion-789', {
	notes: 'Updated notes'
});

// Delete a mistaken completion
await deleteCompletion('habit-123', 'completion-789');
```

---

## Implementation Details

### Database Schema

Located in `src/lib/server/db/schema.ts`:

```typescript
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
		completedAt: integer('completedAt', { mode: 'timestamp' }).notNull(),
		measurement: integer('measurement'),
		notes: text('notes'),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		userDateIdx: index('habit_completion_user_date_idx').on(table.userId, table.completedAt),
		habitDateIdx: index('habit_completion_habit_date_idx').on(table.habitId, table.completedAt),
		uniqueHabitDate: unique('habit_completion_unique').on(table.habitId, table.completedAt)
	})
);
```

### Validation Schemas

#### Complete Habit Schema

```typescript
const completeHabitSchema = z.object({
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
		.nullish(),
	measurement: z.number().int().positive().nullish(),
	notes: z.string().max(1000).nullish()
});
```

#### Update Completion Schema

```typescript
const updateCompletionSchema = z.object({
	measurement: z.number().int().positive().nullish(),
	notes: z.string().max(1000).nullish()
});
```

### Duplicate Prevention

For boolean (single-step) habits, duplicate completions on the same day are prevented at the application layer:

1. When completing a habit, the API checks for existing completions on the same day
2. Uses `startOfDay()` and `endOfDay()` utilities for date range comparison
3. Returns `409 Conflict` if a completion already exists

Numeric habits allow multiple completions per day (e.g., logging water intake throughout the day).

---

## Utility Functions

The following utility functions are available in `src/lib/utils/habit.ts` to help with habit filtering and status tracking:

### shouldShowHabitOnDate

Check if a habit should be shown on a specific date based on its frequency and period.

```typescript
import { shouldShowHabitOnDate } from '$lib/utils/habit';

// Daily habit - always shows
shouldShowHabitOnDate({ frequency: 'daily', period: null }, new Date()); // true

// Weekly habit on Mon/Wed/Fri (1, 3, 5)
const monday = new Date('2025-12-08'); // Monday
shouldShowHabitOnDate({ frequency: 'weekly', period: [1, 3, 5] }, monday); // true

// Monthly habit on 1st and 15th
const first = new Date('2025-12-01');
shouldShowHabitOnDate({ frequency: 'monthly', period: [1, 15] }, first); // true
```

### filterHabitsForDate

Filter an array of habits to only those that should be shown on a specific date.

```typescript
import { filterHabitsForDate } from '$lib/utils/habit';

const allHabits = await fetch('/api/habits').then((r) => r.json());
const todaysHabits = filterHabitsForDate(allHabits, new Date());
```

### getHabitsForDate

Get habits for a specific date with their completion status. This is the main function for building the overview page.

```typescript
import { getHabitsForDate } from '$lib/utils/habit';
import type { HabitWithStatus } from '$lib/types/habit';

const habits = await fetch('/api/habits').then((r) => r.json());
const completions = await fetch('/api/completions?date=2025-12-07').then((r) => r.json());

const habitsWithStatus: HabitWithStatus[] = getHabitsForDate(habits, completions);

// Returns:
// [
//   {
//     habit: { id: '...', title: 'Exercise', measurement: 'boolean', ... },
//     isCompleted: true,
//     completion: { id: '...', completedAt: '...', ... },
//     progress: 1,
//     target: null
//   },
//   {
//     habit: { id: '...', title: 'Drink Water', measurement: 'numeric', targetAmount: 8, ... },
//     isCompleted: false,
//     completion: null,
//     progress: 3,
//     target: 8
//   }
// ]
```

### getCompletionStats

Calculate completion statistics for a set of habits.

```typescript
import { getHabitsForDate, getCompletionStats } from '$lib/utils/habit';

const habitsWithStatus = getHabitsForDate(habits, completions);
const stats = getCompletionStats(habitsWithStatus);

// Returns: { completed: 3, total: 5, percentage: 60 }
```

### groupHabitsByStatus

Group habits by their completion status.

```typescript
import { getHabitsForDate, groupHabitsByStatus } from '$lib/utils/habit';

const habitsWithStatus = getHabitsForDate(habits, completions);
const { completed, pending } = groupHabitsByStatus(habitsWithStatus);

// completed: habits that are done for today
// pending: habits that still need to be completed
```

---

## Overview Page Example

Here's a complete example of how to load data for the overview page:

```typescript
// src/routes/overview/+page.ts
import type { PageLoad } from './$types';
import { formatDate } from '$lib/utils/date';

export const load: PageLoad = async ({ fetch }) => {
	const today = formatDate(new Date());

	// Fetch habits and today's completions in parallel
	const [habitsRes, completionsRes] = await Promise.all([
		fetch('/api/habits'),
		fetch(`/api/completions?date=${today}`)
	]);

	const habits = await habitsRes.json();
	const completions = await completionsRes.json();

	return { habits, completions };
};
```

```svelte
<!-- src/routes/overview/+page.svelte -->
<script lang="ts">
	import { getHabitsForDate, getCompletionStats, groupHabitsByStatus } from '$lib/utils/habit';

	export let data;

	$: habitsWithStatus = getHabitsForDate(data.habits, data.completions);
	$: stats = getCompletionStats(habitsWithStatus);
	$: grouped = groupHabitsByStatus(habitsWithStatus);
	$: completed = grouped.completed;
	$: pending = grouped.pending;
</script>

<h1>Today's Habits</h1>
<p>{stats.completed} of {stats.total} completed ({stats.percentage}%)</p>

<h2>Pending</h2>
{#each pending as { habit, progress, target }}
	<div>
		{habit.title}
		{#if habit.measurement === 'numeric'}
			({progress}/{target} {habit.unit})
		{/if}
	</div>
{/each}

<h2>Completed</h2>
{#each completed as { habit }}
	<div>{habit.title} ✓</div>
{/each}
```

---

## Related Documentation

- [Habits API](./habits.md) - Habit CRUD operations
- [Authentication Guide](../authentication.md) - How to integrate Better Auth
- [Database Schema](../../src/lib/server/db/schema.ts) - Full schema definitions
