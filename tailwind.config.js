/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./static/default_template.html',
		'./src/lib/components/*.svelte',
		'./src/lib/components//modal/*.svelte',
		'./src/routes/**/*.{svelte,js,ts}',
		'./src/routes/*.{svelte,js,ts}',
	],
	theme: {
		extend: {}
	},
	plugins: [require('@tailwindcss/typography'), require('daisyui')],
	daisyui: {
		themes: ['light', 'night']
	}
};
