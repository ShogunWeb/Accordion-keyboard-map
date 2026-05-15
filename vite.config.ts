import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const buildVersion = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.AKM_BUILD_VERSION ?? "dev";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __AKM_BUILD_VERSION__: JSON.stringify(buildVersion)
  },
  base: "/Accordion-keyboard-map/", // important for GitHub Pages
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    globals: true
  }
});
