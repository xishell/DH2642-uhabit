# Habit API Documentation

This guide documents the Habit CRUD API endpoints for managing user habits.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Data Models](#data-models)
4. [Endpoints](#endpoints)
   - [List Habits](#list-habits)
   - [Create Habit](#create-habit)
   - [Get Habit](#get-habit)
   - [Update Habit](#update-habit)
   - [Delete Habit](#delete-habit)
5. [Error Handling](#error-handling)
6. [Examples](#examples)
7. [Testing](#testing)

## Overview

The Habit API provides endpoints for creating, reading, updating, and deleting user habits. All endpoints are scoped to the authenticated user and enforce user isolation.

**Base URL**: `/api/habits`

**Database**: Cloudflare D1 (SQLite)

**Validation**: Zod schemas

## Authentication

All endpoints require a valid Better Auth session cookie. Unauthenticated requests return `401 Unauthorized`.

- The API is only available in the Cloudflare runtime (`bun run dev:cf` or deployed); `bun dev` does not provide the DB/auth bindings.
- Auth is wired through the global `hooks.server.ts` using Better Auth’s `svelteKitHandler`, which populates `locals.user` and `locals.session`.
- API handlers assert `locals.user` and scope queries to that user.

## Data Models

### Habit

```typescript
{
	id: string; // UUID v4
	userId: string; // User ID (owner)
	title: string; // Habit name (1-255 characters)
	notes: string | null; // Optional description
	color: string | null; // Optional hex color code
	frequency: 'daily' | 'weekly' | 'monthly'; // How often
	measurement: 'boolean' | 'numeric'; // Tracking type
	period: number[] | null; // Selected days (weekly: [0-6], monthly: [1-31])
	targetAmount: number | null; // Target for numeric habits (e.g., 5 cups)
	unit: string | null; // Unit for numeric habits (e.g., "cups", "liters")
	categoryId: string | null; // Category ID for organization
	goalId: string | null; // Goal ID (future feature)
	createdAt: Date; // Creation timestamp
	updatedAt: Date; // Last update timestamp
}
```

### Field Descriptions

| Field          | Type   | Required | Description                                                                   |
| -------------- | ------ | -------- | ----------------------------------------------------------------------------- |
| `title`        | string | Yes      | The name of the habit (1-255 chars)                                           |
| `notes`        | string | No       | Additional notes or description                                               |
| `color`        | string | No       | Hex color code for UI display (e.g., `#4CAF50`)                               |
| `frequency`    | enum   | Yes      | `daily`, `weekly`, or `monthly`                                               |
| `measurement`  | enum   | Yes      | `boolean` (single-step) or `numeric` (progressive)                            |
| `period`       | array  | No       | Array of days - weekly: `[0,2,4]` (Sun,Tue,Thu), monthly: `[1,15]` (1st,15th) |
| `targetAmount` | number | No       | Target for numeric habits (e.g., `5` for 5 cups)                              |
| `unit`         | string | No       | Unit for numeric habits (e.g., `"cups"`, `"liters"`, `"steps"`)               |
| `categoryId`   | string | No       | Category ID for organizing habits                                             |
| `goalId`       | string | No       | Goal ID for linking habit to a goal (future feature)                          |

## Endpoints

### List Habits

Get all habits for the authenticated user.

**Endpoint**: `GET /api/habits`

**Authentication**: Required

**Response**: `200 OK`

```json
[
	{
		"id": "a9ed65a7-1def-4191-8718-2dd8e8acfaf3",
		"userId": "user-123",
		"title": "Morning Exercise",
		"notes": "30 minutes of cardio",
		"color": "#4CAF50",
		"frequency": "daily",
		"measurement": "boolean",
		"period": null,
		"targetAmount": null,
		"unit": null,
		"categoryId": null,
		"goalId": null,
		"createdAt": "2025-11-27T22:31:45.000Z",
		"updatedAt": "2025-11-27T22:31:45.000Z"
	}
]
```

**Example**:

```bash
curl http://localhost:8788/api/habits
```

---

### Create Habit

Create a new habit for the authenticated user.

**Endpoint**: `POST /api/habits`

**Authentication**: Required

**Request Body**:

```json
{
	"title": "Drink Water",
	"notes": "Stay hydrated throughout the day",
	"color": "#2196F3",
	"frequency": "daily",
	"measurement": "numeric",
	"targetAmount": 8,
	"unit": "cups",
	"categoryId": null,
	"goalId": null
}
```

**Validation Rules**:

- `title`: Required, 1-255 characters
- `notes`: Optional string
- `color`: Optional string
- `frequency`: Required, must be `daily`, `weekly`, or `monthly` (default: `daily`)
- `measurement`: Required, must be `boolean` or `numeric` (default: `boolean`)
- `period`: Optional array of days (weekly: `[0-6]`, monthly: `[1-31]`)
- `targetAmount` and `unit`: Required together when `measurement` is `numeric`
- `categoryId`: Optional string (must reference existing category)
- `goalId`: Optional string (for future goal feature)

**Response**: `201 Created`

```json
{
	"id": "a9ed65a7-1def-4191-8718-2dd8e8acfaf3",
	"userId": "user-123",
	"title": "Drink Water",
	"notes": "Stay hydrated throughout the day",
	"color": "#2196F3",
	"frequency": "daily",
	"measurement": "numeric",
	"period": null,
	"targetAmount": 8,
	"unit": "cups",
	"categoryId": null,
	"goalId": null,
	"createdAt": "2025-11-27T22:31:45.000Z",
	"updatedAt": "2025-11-27T22:31:45.000Z"
}
```

**Example** (Boolean habit):

```bash
curl -X POST http://localhost:8788/api/habits \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Morning Exercise",
    "notes": "30 minutes of cardio",
    "color": "#4CAF50",
    "frequency": "weekly",
    "measurement": "boolean",
    "period": [1,3,5]
  }'
```

**Example** (Numeric habit):

```bash
curl -X POST http://localhost:8788/api/habits \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Drink Water",
    "notes": "Stay hydrated",
    "color": "#2196F3",
    "frequency": "daily",
    "measurement": "numeric",
    "targetAmount": 8,
    "unit": "cups"
  }'
```

**TypeScript Example**:

```typescript
// src/routes/habits/+page.svelte
async function createHabit(data: CreateHabitInput) {
	const response = await fetch('/api/habits', {
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
```

---

### Get Habit

Get a single habit by ID. The habit must belong to the authenticated user.

**Endpoint**: `GET /api/habits/{id}`

**Authentication**: Required

**URL Parameters**:

- `id`: Habit UUID

**Response**: `200 OK`

```json
{
	"id": "a9ed65a7-1def-4191-8718-2dd8e8acfaf3",
	"userId": "user-123",
	"title": "Drink Water",
	"notes": "Stay hydrated throughout the day",
	"color": "#2196F3",
	"frequency": "daily",
	"measurement": "numeric",
	"period": null,
	"targetAmount": 8,
	"unit": "cups",
	"categoryId": null,
	"goalId": null,
	"createdAt": "2025-11-27T22:31:45.000Z",
	"updatedAt": "2025-11-27T22:31:45.000Z"
}
```

**Example**:

```bash
curl http://localhost:8788/api/habits/a9ed65a7-1def-4191-8718-2dd8e8acfaf3
```

---

### Update Habit

Update an existing habit. The habit must belong to the authenticated user.

**Endpoint**: `PATCH /api/habits/{id}`

**Authentication**: Required

**URL Parameters**:

- `id`: Habit UUID

**Request Body** (all fields optional):

```json
{
	"title": "Drink More Water",
	"notes": "Increased daily water intake",
	"targetAmount": 10,
	"unit": "cups"
}
```

**Validation Rules**:

- All fields are optional
- Only provided fields will be updated
- Same validation rules as create endpoint

**Response**: `200 OK`

```json
{
	"id": "a9ed65a7-1def-4191-8718-2dd8e8acfaf3",
	"userId": "user-123",
	"title": "Drink More Water",
	"notes": "Increased daily water intake",
	"color": "#2196F3",
	"frequency": "daily",
	"measurement": "numeric",
	"period": null,
	"targetAmount": 10,
	"unit": "cups",
	"categoryId": null,
	"goalId": null,
	"createdAt": "2025-11-27T22:31:45.000Z",
	"updatedAt": "2025-11-27T22:35:12.000Z"
}
```

**Example**:

```bash
curl -X PATCH http://localhost:8788/api/habits/a9ed65a7-1def-4191-8718-2dd8e8acfaf3 \
  -H "Content-Type: application/json" \
  -d '{"title": "Morning Workout", "notes": "Updated description"}'
```

**TypeScript Example**:

```typescript
async function updateHabit(id: string, updates: Partial<Habit>) {
	const response = await fetch(`/api/habits/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(updates)
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message);
	}

	return await response.json();
}
```

---

### Delete Habit

Delete a habit. The habit must belong to the authenticated user.

**Endpoint**: `DELETE /api/habits/{id}`

**Authentication**: Required

**URL Parameters**:

- `id`: Habit UUID

**Response**: `204 No Content`

(Empty response body)

**Example**:

```bash
curl -X DELETE http://localhost:8788/api/habits/a9ed65a7-1def-4191-8718-2dd8e8acfaf3
```

**TypeScript Example**:

```typescript
async function deleteHabit(id: string) {
	const response = await fetch(`/api/habits/${id}`, {
		method: 'DELETE'
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message);
	}

	// No response body for 204
}
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

| Code  | Meaning               | When                                          |
| ----- | --------------------- | --------------------------------------------- |
| `200` | OK                    | Successful GET/PATCH request                  |
| `201` | Created               | Successful POST request                       |
| `204` | No Content            | Successful DELETE request                     |
| `400` | Bad Request           | Invalid input/validation error                |
| `401` | Unauthorized          | Missing or invalid authentication             |
| `404` | Not Found             | Habit doesn't exist or doesn't belong to user |
| `500` | Internal Server Error | Database or server error                      |

### Common Errors

#### 400 Bad Request - Validation Error

```json
{
	"message": "Invalid input: Too small: expected string to have >=1 characters"
}
```

**Cause**: Empty or invalid field values

**Solution**: Check validation rules and ensure required fields are provided

#### 401 Unauthorized

```json
{
	"message": "Unauthorized"
}
```

**Cause**: User is not authenticated (when auth is enabled)

**Solution**: Sign in first via `/api/auth/sign-in`

#### 404 Not Found

```json
{
	"message": "Habit not found"
}
```

**Cause**: Habit ID doesn't exist or belongs to different user

**Solution**: Verify the habit ID and ensure it belongs to the authenticated user

#### 500 Internal Server Error

```json
{
	"message": "Failed to create habit: Database error details"
}
```

**Cause**: Database connection or query error

**Solution**: Check database configuration and logs

---

## Examples

### Complete CRUD Flow

```typescript
// Create a habit
const habit = await fetch('/api/habits', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		title: 'Read Daily',
		notes: '30 minutes',
		frequency: 'daily',
		measurement: 'boolean',
		color: '#FF5722'
	})
}).then((r) => r.json());

console.log('Created:', habit.id);

// Get all habits
const habits = await fetch('/api/habits').then((r) => r.json());
console.log('Total habits:', habits.length);

// Update the habit
const updated = await fetch(`/api/habits/${habit.id}`, {
	method: 'PATCH',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		notes: '45 minutes of reading'
	})
}).then((r) => r.json());

console.log('Updated notes:', updated.notes);

// Delete the habit
await fetch(`/api/habits/${habit.id}`, {
	method: 'DELETE'
});

console.log('Habit deleted');
```

---

## Implementation Details

### Database Schema

Located in `src/lib/server/db/schema.ts`:

```typescript
export const category = sqliteTable('category', {
	id: text('id').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	color: text('color'),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull()
});

export const habit = sqliteTable('habit', {
	id: text('id').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	notes: text('notes'),
	color: text('color'),
	frequency: text('frequency').notNull().default('daily'),
	measurement: text('measurement').notNull().default('boolean'),
	period: text('period'), // JSON array of selected days
	targetAmount: integer('targetAmount'),
	unit: text('unit'),
	categoryId: text('categoryId').references(() => category.id, { onDelete: 'set null' }),
	goalId: text('goalId'), // For future goal system
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});
```

### Validation Schemas

#### Create Habit Schema

```typescript
const createHabitSchema = z.object({
	title: z.string().min(1).max(255),
	notes: z.string().optional(),
	color: z.string().optional(),
	frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
	measurement: z.enum(['boolean', 'numeric']).default('boolean'),
	period: z.string().optional(), // JSON array string
	targetAmount: z.number().int().positive().optional(),
	unit: z.string().optional(),
	categoryId: z.string().uuid().optional(),
	goalId: z.string().uuid().optional()
});
```

#### Update Habit Schema

```typescript
const updateHabitSchema = z.object({
	title: z.string().min(1).max(255).optional(),
	notes: z.string().optional(),
	color: z.string().optional(),
	frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
	measurement: z.enum(['boolean', 'numeric']).optional(),
	period: z.string().optional(),
	targetAmount: z.number().int().positive().optional(),
	unit: z.string().optional(),
	categoryId: z.string().uuid().optional(),
	goalId: z.string().uuid().optional()
});
```

### D1 Compatibility Notes

- D1 does not support `.returning()` on insert/update queries
- Manual fetch is required after mutations
- Timestamps are stored as Unix timestamps (integers)
- Foreign key constraints are enforced

---

## Related Documentation

- [Completions API](./completions.md) - Habit completion endpoints
- [Authentication Guide](../authentication.md) - How to integrate Better Auth
- [Database Schema](../../src/lib/server/db/schema.ts) - Full schema definitions
- [Cloudflare D1](https://developers.cloudflare.com/d1/) - D1 documentation
