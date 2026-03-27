import { defineConfig } from "vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync } from "fs";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        devtools: resolve(__dirname, "src/devtools.ts"),
        "panel/panel": resolve(__dirname, "src/panel/panel.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
        // Chrome extensions need flat output, no code splitting
        manualChunks: undefined,
      },
    },
    // No minification for easier debugging during development
    minify: false,
    // Chrome extensions use plain JS, not modules
    target: "es2022",
  },
  plugins: [
    {
      name: "copy-static-files",
      closeBundle() {
        // Copy HTML and CSS files + manifest to dist
        const dist = resolve(__dirname, "dist");
        mkdirSync(resolve(dist, "panel"), { recursive: true });

        copyFileSync(
          resolve(__dirname, "src/manifest.json"),
          resolve(dist, "manifest.json"),
        );
        copyFileSync(
          resolve(__dirname, "src/devtools.html"),
          resolve(dist, "devtools.html"),
        );
        copyFileSync(
          resolve(__dirname, "src/panel/panel.html"),
          resolve(dist, "panel/panel.html"),
        );
        copyFileSync(
          resolve(__dirname, "src/panel/panel.css"),
          resolve(dist, "panel/panel.css"),
        );
      },
    },
  ],
});
