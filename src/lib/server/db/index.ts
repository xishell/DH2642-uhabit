import { drizzle } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

// For D1, we'll create the db instance per request using the platform binding
export function getDB(d1: D1Database): DrizzleD1Database<typeof schema> {
	return drizzle(d1, { schema });
}
