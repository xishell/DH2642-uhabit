import tailwindcss from '@tailwindcss/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for Svelte component tests
 * Use this config when running component tests: vitest --config vitest.config.svelte.ts
 */
export default defineConfig({
	plugins: [tailwindcss(), svelte({ hot: !process.env.VITEST })],
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['tests/components/**/*.{test,spec}.{js,ts}'],
		setupFiles: ['./tests/setup.ts']
	},
	resolve: {
		alias: {
			$lib: '/src/lib'
		}
	}
});
