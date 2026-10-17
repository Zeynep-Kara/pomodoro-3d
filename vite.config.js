import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Site GitHub Pages'te alan adının kökünde değil, depo adının altında yayınlanıyor:
  // https://zeynep-kara.github.io/pomodoro-3d/
  // Vite JS/CSS dosyalarının adreslerini bu alt yola göre üretsin diye.
  base: '/pomodoro-3d/',
  plugins: [react()],
});
