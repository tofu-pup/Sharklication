import { fileURLToPath } from "node:url";
import sharp from "sharp";

const source = fileURLToPath(new URL("../assets/gobfrey-teacher-source.png", import.meta.url));
const target = fileURLToPath(new URL("../public/gobfrey-teacher.webp", import.meta.url));
const output = await sharp(source).trim().resize({ width: 640, withoutEnlargement: true })
  .webp({ quality: 88, effort: 6 }).toFile(target);
console.log(`Teacher Gobfrey: ${output.width} x ${output.height}, ${(output.size / 1024).toFixed(1)} KiB; transparent margins trimmed, artwork unchanged.`);
