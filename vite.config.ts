import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			// The TypeGen DTOs live outside src/, so allow Vite to serve them in dev.
			allow: ['parleyts']
		}
	}
});
