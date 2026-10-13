import { createFileRoute } from "@tanstack/react-router";
import { listPublicCourses } from "@/lib/courses.functions";
import { courseCategories } from "@/data/courses";

const SITE_URL = "https://www.cmudusg.com";

const STATIC_PATHS = [
  "/",
  "/about",
  "/courses",
  "/faculty",
  "/courses/diploma-in-medical-ultrasound",
  "/gallery",
  "/contact",
  "/admission",
  "/education-aides",
];

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(path: string) {
  return `  <url><loc>${xmlEscape(SITE_URL + path)}</loc></url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const courses = await listPublicCourses();

        const paths = [
          ...STATIC_PATHS,
          ...courseCategories.map((c) => `/courses/category/${c.slug}`),
          ...courses
            .filter(
              (c) =>
                c.slug !== "dmu" &&
                c.slug !== "diploma-in-medical-ultrasound",
            )
            .map((c) => `/courses/${c.slug}`),
        ];
        const urls = [...new Set(paths)].map(urlEntry);

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;

        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
