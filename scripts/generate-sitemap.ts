import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://fanrealms.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/marketplace", changefreq: "daily", priority: "0.9" },
  { path: "/jobs", changefreq: "daily", priority: "0.9" },
  { path: "/forum", changefreq: "daily", priority: "0.8" },
  { path: "/games", changefreq: "weekly", priority: "0.7" },
  { path: "/search", changefreq: "weekly", priority: "0.5" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/terms", changefreq: "monthly", priority: "0.4" },
  { path: "/help", changefreq: "monthly", priority: "0.4" },
  { path: "/cookie-policy", changefreq: "monthly", priority: "0.4" },
  { path: "/payments", changefreq: "monthly", priority: "0.4" },
  { path: "/security", changefreq: "monthly", priority: "0.4" },
  { path: "/community-guidelines", changefreq: "monthly", priority: "0.4" },
  { path: "/privacy-policy", changefreq: "monthly", priority: "0.4" },
  { path: "/creator-guidelines", changefreq: "monthly", priority: "0.4" },
];

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
