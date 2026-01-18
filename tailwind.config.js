/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				child: {
					red: '#ef4444',
					orange: '#f97316',
					yellow: '#eab308',
					lime: '#84cc16',
					green: '#22c55e',
					teal: '#14b8a6',
					cyan: '#06b6d4',
					blue: '#3b82f6',
					indigo: '#6366f1',
					purple: '#a855f7',
					pink: '#ec4899',
					rose: '#f43f5e'
				}
			}
		}
	},
	plugins: [require('@tailwindcss/forms')],
	safelist: [
		{
			pattern: /bg-child-(red|orange|yellow|lime|green|teal|cyan|blue|indigo|purple|pink|rose)/
		},
		{
			pattern: /text-child-(red|orange|yellow|lime|green|teal|cyan|blue|indigo|purple|pink|rose)/
		},
		{
			pattern: /border-child-(red|orange|yellow|lime|green|teal|cyan|blue|indigo|purple|pink|rose)/
		},
		{
			pattern: /ring-child-(red|orange|yellow|lime|green|teal|cyan|blue|indigo|purple|pink|rose)/
		}
	]
};
