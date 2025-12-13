import { z } from 'zod';

export const emailSchema = z.string().email('Please enter a valid email address').toLowerCase();

export const usernameSchema = z
	.string()
	.min(3, 'Username must be at least 3 characters')
	.max(20, 'Username must be at most 20 characters')
	.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
	.toLowerCase();

export const validateEmailValue = (email: string): string | null => {
	try {
		emailSchema.parse(email);
		return null;
	} catch (err) {
		if (err instanceof z.ZodError) {
			return err.issues[0].message;
		}
		return 'Invalid email';
	}
};

export const validateUsernameValue = (username: string): string | null => {
	if (!username) return null;
	try {
		usernameSchema.parse(username);
		return null;
	} catch (err) {
		if (err instanceof z.ZodError) {
			return err.issues[0].message;
		}
		return 'Invalid username';
	}
};
