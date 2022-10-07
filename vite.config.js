import path, { format } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env': {}
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@/': `${path.resolve(__dirname, 'src')}/`
    }
  },
  build: {
    // minify: false,
    lib: {
      entry: './src/main.js',
      name: 'index',
      fileName: () => `[name].${format}.js`,
      formats: ['iife'],
    },
    emptyOutDir: true,
    // outDir: ``,

    // rollupOptions: {
    //   entry: { 'main': ['./src/main.js'] },
    //   output: {
    //     filename: `[name].${format}.js`,
    //     assetFileNames: (assetInfo) => {
    //       if (assetInfo.name == 'style.css')
    //         return 'custom-name.css';
    //       return assetInfo.name;
    //     },
    //     globals: { '/etc/designs/icon.png': 'imagem' }
    //   },
    //   formats: ['iife'],
    //   external: [ /^\/etc\/designs/, '/etc/designs/icon.png' ],
    // }
  }
})
