import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';

export default defineConfig({
	plugins: [
		vue(),
		VitePWA({
			registerType: 'autoUpdate',
			mode: 'production',
			base: '/',
			srcDir: 'src',
			filename: 'sw.ts',
			includeAssets: ['/favicon.png'],
			strategies: 'injectManifest',
			manifest: {
				name: 'Personal Finance',
				short_name: 'Personal Finance',
				theme_color: '#eaefea',
				start_url: '/',
				display: 'standalone',
				background_color: '#eaefea',
				icons: [
					{
						src: '/img/icons/android-chrome-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: '/img/icons/android-chrome-512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
					{
						src: '/img/icons/android-chrome-maskable-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable',
					},
					{
						src: '/img/icons/android-chrome-maskable-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable',
					},
					{
						src: '/img/icons/apple-touch-icon-60x60.png',
						sizes: '60x60',
						type: 'image/png',
					},
					{
						src: '/img/icons/apple-touch-icon-76x76.png',
						sizes: '76x76',
						type: 'image/png',
					},
					{
						src: '/img/icons/apple-touch-icon-120x120.png',
						sizes: '120x120',
						type: 'image/png',
					},
					{
						src: '/img/icons/apple-touch-icon-152x152.png',
						sizes: '152x152',
						type: 'image/png',
					},
					{
						src: '/img/icons/apple-touch-icon.png',
						sizes: '180x180',
						type: 'image/png',
					},
				],
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,ttf}'],
			},
		}),
		Components({
			resolvers: [AntDesignVueResolver()],
		}),
	],
	build: {
		outDir: 'dist',
	},
});
