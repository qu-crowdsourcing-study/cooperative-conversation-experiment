import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resultsPlugin } from './server/resultsPlugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), resultsPlugin()],
})
