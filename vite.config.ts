import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		expect: { requireAssertions: true },
		environment: 'node',
		include: ['tests/**/*.{test,spec}.{js,ts}'],
		exclude: ['tests/**/*.svelte.{test,spec}.{js,ts}']
	}
});
