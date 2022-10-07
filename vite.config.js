import path from 'path'
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
      '@/': `${path.resolve(__dirname, 'src')}/`,
      // vue$: 'vue/dist/vue.esm-bundler.js'
    }
  },
  build: {
    minify: false,
    lib: {
      entry: './src/main.ts',
      name: 'index',
      fileName: (format) => `vite-clientlib.${format}.js`,
      // formats: ['iife'],
    },
    emptyOutDir: true,
    // outDir: `./dist`,

    // rollupOptions: {
    //   entry: { 'main': ['./src/main.js'] },
    //   formats: ['iife'],
    //   output: {
    //     filename: `[name].${format}.js`,
    //     assetFileNames: (assetInfo) => {
    //       if (assetInfo.name == 'style.css')
    //         return 'custom-name.css';
    //       return assetInfo.name;
    //     },
    //     globals: { vue: "Vue" }
    //   },
    //   external: [ "vue" ],
    // }
  }
})
