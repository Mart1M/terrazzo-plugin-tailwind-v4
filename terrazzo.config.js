import { defineConfig } from "@terrazzo/cli";
import pluginTailwindV4 from "./plugin-tailwind-v4.mjs";

export default defineConfig({
  tokens: ["./test-tokens.json"],
  outDir: "./assets/css/",
  plugins: [
    pluginTailwindV4({
      fileName: "test.css",
    })
  ],
});
