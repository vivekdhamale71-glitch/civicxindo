import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

const SSR = !!process.env.SSR_BUILD;

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  define: { __BUILD_DATE__: JSON.stringify(new Date().toISOString()) },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: {
    target: "es2020",
    cssCodeSplit: true,
  },
  plugins: [
    react(),
    VitePWA({
      disable: SSR,
      strategies: "injectManifest",
      srcDir: "src/pwa",
      filename: "sw.ts",
      registerType: "prompt",
      injectRegister: false,
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,woff2,svg,png,ico,json}"],
        // Heavy, rarely used code (PDF generation, charts) is cached on first use instead of at install.
        globIgnores: ["**/jspdf*.js", "**/html2canvas*.js", "**/index.es-*.js", "**/purify*.js", "**/OpenData-*.js"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      includeAssets: ["favicon.svg", "offline.html", "icons/*.png"],
      manifest: {
        id: "./",
        name: "civicXindo – National Welfare Schemes Portal",
        short_name: "civicXindo",
        description: "Discover welfare schemes, check eligibility, apply and track your applications. Demo prototype.",
        lang: "en-IN",
        start_url: "./?source=pwa",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#1B2A4A",
        background_color: "#FAF8F5",
        categories: ["government", "utilities"],
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          { name: "Check eligibility", short_name: "Eligibility", url: "eligibility?source=shortcut", icons: [{ src: "icons/icon-192.png", sizes: "192x192" }] },
          { name: "Track application", short_name: "Track", url: "track?source=shortcut", icons: [{ src: "icons/icon-192.png", sizes: "192x192" }] },
          { name: "My documents", short_name: "Documents", url: "wallet?source=shortcut", icons: [{ src: "icons/icon-192.png", sizes: "192x192" }] },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
