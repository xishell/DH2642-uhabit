import tsParser from '@typescript-eslint/parser';
import eslintPluginTs from '@typescript-eslint/eslint-plugin';
import eslintPluginSvelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import sonarjs from 'eslint-plugin-sonarjs';

const tsconfig = './tsconfig.json';
const root = process.cwd();

export default [
	{
		ignores: ['.svelte-kit/**/*', 'build/**/*', 'node_modules/**/*', 'dist/**/*', 'coverage/**/*']
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser,
				extraFileExtensions: ['.svelte'],
				project: tsconfig,
				tsconfigRootDir: root
			}
		},
		plugins: {
			svelte: eslintPluginSvelte,
			sonarjs
		},
		rules: {
			complexity: ['warn', 15],
			'max-lines': ['warn', 300],
			'max-depth': ['warn', 4],
			'sonarjs/cognitive-complexity': ['warn', 15],
			'sonarjs/no-duplicate-string': 'warn',
			'svelte/valid-compile': 'error',
			'svelte/no-dupe-else-if-blocks': 'error',
			'svelte/no-dupe-style-properties': 'error',
			'svelte/no-unused-svelte-ignore': 'warn'
		}
	},
	{
		files: ['**/*.ts', '**/*.js'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: tsconfig,
				tsconfigRootDir: root
			}
		},
		plugins: {
			'@typescript-eslint': eslintPluginTs,
			sonarjs
		},
		rules: {
			complexity: ['warn', 15],
			'max-lines': ['warn', 350],
			'max-depth': ['warn', 4],
			'sonarjs/cognitive-complexity': ['warn', 15],
			'sonarjs/no-duplicate-string': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	}
];
