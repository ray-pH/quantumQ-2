import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defaultClientConditions, defineConfig } from "vite";

const mobileHost = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [svelte()],
  resolve: { conditions: ["quantumq-source", ...defaultClientConditions] },
  base: "./",
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: mobileHost || false,
    hmr: mobileHost
      ? { host: mobileHost, port: 1421, protocol: "ws" }
      : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
});
