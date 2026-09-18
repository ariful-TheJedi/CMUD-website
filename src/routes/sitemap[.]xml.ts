import { createFileRoute } from "@tanstack/react-router";
import { listPublicCourses } from "@/lib/courses.functions";
import { courseCategories } from "@/data/courses";

const SITE_URL = "https://cmudusg.com";

const STATIC_PATHS = [
  "/",
  "/about",
  "/courses",
  "/faculty",
  "/education-aides",
  "/notices",
  "/gallery",
  "/contact",
  "/admission",
];

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;");
}

function urlEntry(path: string) {
  return `  <url><loc>${xmlEscape(SITE_URL + path)}</loc></url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const courses = await listPublicCourses();

        const urls = [
          ...STATIC_PATHS.map(urlEntry),
          ...courseCategories.map((c) => urlEntry(`/courses/category/${c.slug}`)),
          ...courses.map((c) => urlEntry(`/courses/${c.slug}`)),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;

        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
