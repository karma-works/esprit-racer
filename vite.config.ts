import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/esprit-racer/",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@engine": resolve(__dirname, "src/engine"),
      "@game": resolve(__dirname, "src/game"),
      "@ui": resolve(__dirname, "src/ui"),
      "@assets": resolve(__dirname, "src/assets"),
      "@audio": resolve(__dirname, "src/audio"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: "es2022",
    sourcemap: true,
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/main.ts",
        "src/engine/index.ts",
        "src/engine/types.ts",
        "src/engine/renderer/canvas.ts",
        "src/engine/renderer/sprite.ts",
        "src/assets/**/*.ts",
        "src/audio/**/*.ts",
        "src/game/**/*.ts",
        "src/ui/**/*.ts",
      ],
      thresholds: {
        lines: 75,
        functions: 85,
        branches: 60,
        statements: 75,
      },
    },
  },
});
