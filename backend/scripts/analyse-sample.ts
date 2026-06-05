import { readFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

const DEFAULT_URL = "http://localhost:8080/analyse";
const MEDIA_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

function usage(): never {
  console.error("Usage: npm run analyse-sample -- <image-path> [backend-url]");
  console.error("Example: npm run analyse-sample -- sample/roof.jpg");
  process.exit(1);
}

const imagePath = process.argv[2];
if (!imagePath) {
  usage();
}

const backendUrl = process.argv[3] ?? DEFAULT_URL;
const absolutePath = resolve(process.cwd(), imagePath);
const extension = extname(absolutePath).toLowerCase();
const mediaType = MEDIA_TYPES[extension];

if (!mediaType) {
  console.error(`Unsupported image type: ${extension || "(none)"}`);
  process.exit(1);
}

const base64 = readFileSync(absolutePath).toString("base64");
const image = `data:${mediaType};base64,${base64}`;

console.error(`Sending ${basename(absolutePath)} to ${backendUrl} ...`);

const response = await fetch(backendUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    image,
    context: {
      jobType: "solar_install",
      notes: "CLI sample request",
    },
  }),
});

const body = await response.json();

if (!response.ok) {
  console.error(`Request failed (${response.status})`);
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(body, null, 2));
