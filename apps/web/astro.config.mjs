import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",
  // Canonical site origin for SEO (canonical URLs, sitemap, RSS). Update to the production domain.
  site: "http://187.126.0.227",
  adapter: node({ mode: "standalone" }),
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // These packages ship raw `.svelte` source files and must be processed
      // by the Svelte plugin rather than externalized for the Node SSR loader.
      noExternal: ["@lucide/svelte", "bits-ui"],
    },
  },
});
