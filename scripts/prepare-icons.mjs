import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const source = fileURLToPath(new URL("assets/app-icon-source.png", root));
const metadata = await sharp(source).metadata();
if (metadata.width !== metadata.height) throw new Error("The approved icon must be square; do not crop the owner's artwork.");

for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["icon-maskable.png", 512],
  ["apple-touch-icon-v2.png", 180],
  ["apple-touch-icon-ipad-167.png", 167],
  ["apple-touch-icon-ipad-152.png", 152],
]) {
  const bytes = await sharp(source)
    .resize(size, size)
    .flatten({ background: "#052d51" })
    .png({ compressionLevel: 9, palette: true, quality: 95, effort: 10 })
    .toBuffer();
  await writeFile(new URL(`public/${name}`, root), bytes);
  console.log(`${name}: ${size} x ${size}, ${(bytes.length / 1024).toFixed(1)} KiB`);
}
