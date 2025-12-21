import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { sveltekitOG } from '@ethercorps/sveltekit-og/plugin';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), sveltekitOG()],
	test: {
		expect: { requireAssertions: true },
		environment: 'node',
		include: ['tests/**/*.{test,spec}.{js,ts}'],
		exclude: ['tests/**/*.svelte.{test,spec}.{js,ts}']
	}
});
