import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { haveIBeenPwned } from 'better-auth/plugins';
import { APIError } from 'better-auth/api';
import { Resend } from 'resend';
import { getDB } from './db';
import * as schema from './db/schema';
import { getVerificationEmailTemplate, getPasswordResetEmailTemplate } from './email-templates';

export function createAuth(
	db: D1Database,
	secret: string,
	url: string,
	devMode = false,
	resendApiKey?: string
) {
	// Detect if URL is a staging/preview environment (dev mode allowed)
	// Preview: preview-123.uhabit.pages.dev
	// Staging: staging.uhabit.pages.dev
	const isStagingOrPreview =
		/preview-\d+\..*\.pages\.dev/.test(url) || url.includes('staging.') || url.includes('preview.');

	// Detect if URL is production (custom domain or main pages.dev without staging/preview prefix)
	const isProductionUrl =
		(!url.includes('.pages.dev') && !url.includes('.workers.dev') && url.startsWith('https://')) ||
		(url.includes('.pages.dev') && !isStagingOrPreview);

	// Only allow dev mode for local development URLs or staging/preview
	const isLocalUrl = url.includes('localhost') || url.includes('127.0.0.1');
	const isDevEnvironment = isLocalUrl || isStagingOrPreview;

	// Safety check: Prevent dev mode from being enabled in production
	if (devMode && isProductionUrl && !isDevEnvironment) {
		console.error(
			'[AUTH] SECURITY WARNING: DEV_MODE=true detected with production URL. ' +
				'Ignoring DEV_MODE to prevent security misconfiguration. URL:',
			url
		);
		devMode = false;
	}

	const isDev = devMode || isDevEnvironment;

	if (isDev) {
		console.log('[AUTH] Running in DEVELOPMENT mode - relaxed security settings enabled');
	} else if (isProductionUrl) {
		console.log('[AUTH] Running in PRODUCTION mode with strict security settings');
	}

	return betterAuth({
		database: drizzleAdapter(getDB(db), {
			provider: 'sqlite',
			schema: {
				user: schema.user,
				session: schema.session,
				account: schema.account,
				verification: schema.verification
			}
		}),
		plugins: [
			// Check passwords against 800M+ breached passwords
			// Only enabled in production (dev mode allows weak passwords for testing)
			...(!isDev
				? [
						haveIBeenPwned({
							customPasswordCompromisedMessage:
								'This password has been exposed in a data breach. Please choose a different password.'
						})
					]
				: [])
		],
		emailAndPassword: {
			enabled: true,
			// Enable email verification only in production
			requireEmailVerification: !!resendApiKey && !isDev,

			// Password requirements (enforced by Better Auth)
			minPasswordLength: isDev ? 1 : 8,
			// Note: Additional password validation happens client-side
			// via PasswordStrengthIndicator component

			// Lower bcrypt cost for Cloudflare Workers (10ms CPU limit)
			// Default is 10, that exceeds Workers CPU limits
			password: {
				hash: async (password: string) => {
					const bcrypt = await import('bcryptjs');
					return bcrypt.hash(password, 6);
				},
				verify: async (data: { password: string; hash: string }) => {
					const bcrypt = await import('bcryptjs');
					return bcrypt.compare(data.password, data.hash);
				}
			},

			// Send verification and password reset emails
			...(resendApiKey && {
				sendVerificationEmail: async ({ user, url }: { user: any; url: string }) => {
					const resend = new Resend(resendApiKey);
					await resend.emails.send({
						from: 'UHabit <noreply@uhabit.xyz>',
						to: user.email,
						subject: 'Verify your email - UHabit',
						html: getVerificationEmailTemplate(url, user.name)
					});
				},
				sendResetPassword: async ({ user, url }: { user: any; url: string }) => {
					const resend = new Resend(resendApiKey);
					await resend.emails.send({
						from: 'UHabit <noreply@uhabit.xyz>',
						to: user.email,
						subject: 'Reset your password - UHabit',
						html: getPasswordResetEmailTemplate(url, user.name)
					});
				}
			})
		},
		session: {
			// Extended session in dev mode for convenience
			expiresIn: isDev ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7, // 30 days in dev, 7 days in prod
			updateAge: isDev ? 60 * 60 * 24 * 7 : 60 * 60 * 24, // 7 days in dev, 1 day in prod
			cookieCache: {
				enabled: true,
				maxAge: 60 * 5 // 5 minutes
			}
		},
		secret,
		baseURL: `${url}/api/auth`,
		// Custom user fields
		user: {
			additionalFields: {
				displayName: {
					type: 'string',
					required: false
				},
				theme: {
					type: 'string',
					required: false,
					defaultValue: 'system'
				},
				country: {
					type: 'string',
					required: false
				},
				preferences: {
					type: 'string',
					required: false
				}
			}
		},
		advanced: {
			// CSRF Protection is enabled by default in Better Auth
			// Cookie security settings
			useSecureCookies: url.startsWith('https://'),
			...(isDev && {
				crossSubDomainCookies: {
					enabled: false
				}
			})
		},
		databaseHooks: {
			user: {
				create: {
					before: async (user) => {
						// Validate and normalize email
						const email = user.email?.toLowerCase().trim() ?? '';

						// Email format validation
						const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
						if (!emailRegex.test(email)) {
							throw new APIError('BAD_REQUEST', {
								message: 'Please enter a valid email address'
							});
						}

						// Normalize the email (lowercase + trim whitespace)
						user.email = email;
					}
				}
			}
		}
	});
}

export type Auth = ReturnType<typeof createAuth>;
