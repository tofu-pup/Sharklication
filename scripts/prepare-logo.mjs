import { fileURLToPath } from "node:url";
import sharp from "sharp";

const source = fileURLToPath(new URL("../assets/header-logo-source.png", import.meta.url));
const target = fileURLToPath(new URL("../public/sharklication-header.webp", import.meta.url));
const output = await sharp(source)
  .trim()
  .resize({ width: 1200, withoutEnlargement: true })
  .webp({ quality: 90, effort: 6 })
  .toFile(target);
console.log(`Header logo: ${output.width} x ${output.height}, ${(output.size / 1024).toFixed(1)} KiB; transparent margins trimmed, artwork unchanged.`);
