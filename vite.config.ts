import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Static SPA build: outputs a classic `dist/` folder (index.html + assets)
// instead of the Nitro `.output` server bundle.
export default defineConfig({
  nitro: false, // disable Nitro / Cloudflare server output
  vite: {
    preview: { host: "127.0.0.1" }, // prerender preview server: force IPv4
  },
  tanstackStart: {
    spa: {
      enabled: true,
      prerender: {
        outputPath: "/index", // writes index.html instead of _shell.html
        crawlLinks: false,
      },
    },
  },
});
