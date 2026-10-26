import { defineConfig } from 'vite';

// 相对路径：部署在 GitHub Pages 的 /my-home/ 子路径下也能正确加载资源
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 800 },
});
