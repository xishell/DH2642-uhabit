import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		expect: { requireAssertions: true },
		environment: 'node',
		include: ['tests/**/*.{test,spec}.{js,ts}', 'src/**/*.{test,spec}.{js,ts}'],
		exclude: [
			'tests/**/*.svelte.{test,spec}.{js,ts}',
			'src/**/*.svelte.{test,spec}.{js,ts}',
			'tests/components/**/*' // Exclude component tests (Svelte 5 compatibility issues)
		],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'tests/', '**/*.config.{js,ts}', '**/*.d.ts', '.svelte-kit/']
		}
	}
});
