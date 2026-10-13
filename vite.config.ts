import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],base:process.env.LOCAL_PREVIEW==='1'?'/':'/SoftwareEngineering_CBT/',build:{rollupOptions:{output:{manualChunks(id){if(id.includes('course.json'))return 'course';if(id.includes('node_modules'))return 'vendor';}}}}});
