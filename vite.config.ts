import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/Sharklication/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      includeAssets: ["sharks/*", "icon-*.png", "apple-touch-icon*.png", "sharklication-logo.png", "sharklication-header.webp", "gobfrey-teacher.webp"],
      manifest: {
        name: "Sharklication",
        short_name: "Sharklication",
        description: "A little practice. A whole ocean of discovery.",
        start_url: "/Sharklication/",
        scope: "/Sharklication/",
        display: "standalone",
        background_color: "#f2fbfc",
        theme_color: "#063b51",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,webp,json,webmanifest}"],
        maximumFileSizeToCacheInBytes: 3_000_000,
        navigateFallback: "/Sharklication/index.html",
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: true,
      },
      devOptions: { enabled: false },
    }),
  ],
});
