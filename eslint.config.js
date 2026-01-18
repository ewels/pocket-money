import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		},
		rules: {
			// Disable rules that don't work well with Svelte 5
			'svelte/no-navigation-without-resolve': 'off',
			'svelte/require-each-key': 'warn',
			// Allow unused vars starting with underscore (common in Svelte each loops)
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	},
	{
		files: ['**/*.ts'],
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	},
	{
		files: ['**/*.cjs', 'tailwind.config.js', 'postcss.config.js'],
		rules: {
			'@typescript-eslint/no-require-imports': 'off'
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'node_modules/', 'site/', '.wrangler/']
	}
);
