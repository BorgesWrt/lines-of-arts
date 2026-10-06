import {defineConfig} from 'vite';

export default defineConfig({
  build:{rollupOptions:{output:{manualChunks(id){
    if(id.endsWith('/src/data/languages.json'))return 'translations';
  }}}}
});
