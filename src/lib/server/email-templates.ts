import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Load and populate an email template
 */
function loadTemplate(templateName: string, variables: Record<string, string>): string {
	const templatePath = join(process.cwd(), 'src/lib/server/email-templates', templateName);
	let html = readFileSync(templatePath, 'utf-8');

	// Replace all variables in the template
	for (const [key, value] of Object.entries(variables)) {
		html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
	}

	return html;
}

/**
 * Get verification email HTML
 */
export function getVerificationEmailTemplate(verifyUrl: string, userName?: string): string {
	return loadTemplate('verify-email.html', {
		VERIFY_URL: verifyUrl,
		USER_NAME: userName || 'there'
	});
}

/**
 * Get password reset email HTML
 */
export function getPasswordResetEmailTemplate(resetUrl: string, userName?: string): string {
	return loadTemplate('reset-password.html', {
		RESET_URL: resetUrl,
		USER_NAME: userName || 'there'
	});
}
