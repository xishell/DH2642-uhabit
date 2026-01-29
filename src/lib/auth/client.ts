import { createAuthClient } from 'better-auth/client';
import { usernameClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	baseURL: typeof window !== 'undefined' ? window.location.origin : '',
	plugins: [usernameClient()]
});

export interface SignUpData {
	email: string;
	password: string;
	username: string;
}

export async function signUp(data: SignUpData) {
	// Use username as the Better Auth 'name' field (display name)
	const result = await authClient.signUp.email(
		{
			email: data.email,
			password: data.password,
			name: data.username
		},
		{
			body: {
				username: data.username
			}
		}
	);

	if (result.error) {
		throw new Error(result.error.message || 'Sign up failed');
	}

	return result.data;
}

export async function signIn(emailOrUsername: string, password: string) {
	const isEmail = emailOrUsername.includes('@');

	const result = isEmail
		? await authClient.signIn.email({
				email: emailOrUsername,
				password
			})
		: await authClient.signIn.username({
				username: emailOrUsername,
				password
			});

	if (result.error) {
		throw new Error(result.error.message || 'Sign in failed');
	}

	return result.data;
}

export async function signOut() {
	const result = await authClient.signOut();

	if (result.error) {
		throw new Error(result.error.message || 'Sign out failed');
	}

	return result.data;
}

export async function getSession() {
	const result = await authClient.getSession();
	return result.data;
}
