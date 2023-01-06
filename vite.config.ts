import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		VitePWA({
			mode: 'production',
			base: '/',
			srcDir: 'src',
			filename: 'sw.ts',
			includeAssets: ['/favicon.png'],
			strategies: 'injectManifest',
			manifest: {
				name: 'Sooshi',
				short_name: 'sooshi',
				theme_color: '#61e7b4',
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
		}),
		Components({
			resolvers: [AntDesignVueResolver()],
		}),
	],
	build: {
		outDir: 'dist',
	},
});
