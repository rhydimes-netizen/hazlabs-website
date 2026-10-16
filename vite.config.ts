import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base must match the repo name while the site is served from
// rhydimes-netizen.github.io/hazlabs-website/. Change to '/' for a custom domain.
export default defineConfig({ plugins: [react()], base: '/hazlabs-website/' });
