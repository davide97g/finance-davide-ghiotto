/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ['class'],
	content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
	theme: {
		extend: {
			colors: {
				background: '#eaefea',
				foreground: '#1a1a1a',
				expense: '#cf1322',
				earning: '#3f8600',
				border: '#e2e8f0',
				input: '#e2e8f0',
				ring: '#94a3b8',
				primary: {
					DEFAULT: '#1a1a1a',
					foreground: '#ffffff',
				},
				secondary: {
					DEFAULT: '#f1f5f9',
					foreground: '#1a1a1a',
				},
				destructive: {
					DEFAULT: '#cf1322',
					foreground: '#ffffff',
				},
				muted: {
					DEFAULT: '#f1f5f9',
					foreground: '#64748b',
				},
				accent: {
					DEFAULT: '#f1f5f9',
					foreground: '#1a1a1a',
				},
				popover: {
					DEFAULT: '#ffffff',
					foreground: '#1a1a1a',
				},
				card: {
					DEFAULT: '#ffffff',
					foreground: '#1a1a1a',
				},
			},
			borderRadius: {
				lg: '0.5rem',
				md: '0.375rem',
				sm: '0.25rem',
			},
			fontFamily: {
				sans: ['Montserrat', 'Inter', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
			},
		},
	},
	plugins: [],
};
