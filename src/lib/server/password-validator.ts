/**
 * Password strength validation utilities
 */

export interface PasswordValidationResult {
	valid: boolean;
	errors: string[];
	strength: 'weak' | 'medium' | 'strong';
}

/**
 * Validate password strength
 *
 * Requirements:
 * - Minimum 8 characters (12+ recommended)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (optional)
 * - Not a common password
 */
export function validatePassword(password: string): PasswordValidationResult {
	const errors: string[] = [];

	// Check minimum length
	if (password.length < 8) {
		errors.push('Password must be at least 8 characters long');
	}

	// Check for uppercase letter
	if (!/[A-Z]/.test(password)) {
		errors.push('Password must contain at least one uppercase letter');
	}

	// Check for lowercase letter
	if (!/[a-z]/.test(password)) {
		errors.push('Password must contain at least one lowercase letter');
	}

	// Check for number
	if (!/[0-9]/.test(password)) {
		errors.push('Password must contain at least one number');
	}

	// Check for special character
	const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

	// Note: Breach checking now handled by HIBP plugin (800M+ passwords)

	// Calculate strength
	let strength: 'weak' | 'medium' | 'strong' = 'weak';
	if (errors.length === 0) {
		if (password.length >= 12 && hasSpecialChar) {
			strength = 'strong';
		} else if (password.length >= 10 || hasSpecialChar) {
			strength = 'medium';
		} else {
			strength = 'medium'; // Meets requirements but could be stronger
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		strength
	};
}

/**
 * Get password strength score (0-100)
 */
export function getPasswordStrength(password: string): number {
	let score = 0;

	// Length
	if (password.length >= 8) score += 20;
	if (password.length >= 12) score += 10;
	if (password.length >= 16) score += 10;

	// Character variety
	if (/[a-z]/.test(password)) score += 15;
	if (/[A-Z]/.test(password)) score += 15;
	if (/[0-9]/.test(password)) score += 15;
	if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

	// Penalize common patterns
	if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
	if (/^[0-9]+$/.test(password)) score -= 20; // Only numbers
	// Note: Common passwords now caught by HIBP plugin on server

	return Math.max(0, Math.min(100, score));
}
