import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import remarkBreaks from "remark-breaks";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import type { PluggableList } from "unified";
import { defineConfig, loadEnv, type Plugin } from "vite";

import { fetchContributions } from "./src/lib/github/contributions";
import mdxShortcodes from "./src/lib/build/mdxShortcodes";
import { remarkLeadingImageBreak, remarkSourceSpacing } from "./src/lib/markdown/plugins";

// Dev-only mirror of the production Worker route, with a small per-day cache.
// The PAT stays server-side (never bundled into the client).
function githubHeatmapDev(token: string, login: string): Plugin {
  let cache: { date: string; body: string } | null = null;

  return {
    name: "github-heatmap-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith("/api/github-heatmap")) return next();
        try {
          const today = new Date().toISOString().slice(0, 10);
          if (!cache || cache.date !== today) {
            const data = await fetchContributions(login, token);
            cache = { date: today, body: JSON.stringify(data) };
          }
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(cache.body);
        } catch (error) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: String(error) }));
        }
      });
    },
  };
}

const remarkPlugins = [
  remarkFrontmatter,
  remarkMdxFrontmatter,
  remarkGfm,
  remarkBreaks,
  remarkLeadingImageBreak,
  remarkSourceSpacing,
] as unknown as PluggableList;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (
            id.includes("@mdx-js") ||
            id.includes("remark") ||
            id.includes("micromark") ||
            id.includes("unified")
          ) {
            return "markdown";
          }

          if (id.includes("react-router")) {
            return "router";
          }

          if (id.includes("react")) {
            return "react";
          }
        },
      },
    },
  },
  plugins: [
    githubHeatmapDev(env.PAT, env.GITHUB_LOGIN || "SirTenzin"),
    mdxShortcodes(),
    {
      enforce: "pre",
      ...mdx({
        providerImportSource: "@mdx-js/react",
        remarkPlugins,
      }),
    },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ],
  };
});
