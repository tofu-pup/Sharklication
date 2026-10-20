import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import sharp from "sharp";
const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("src/data/asset-manifest.json", root), "utf8"));
const content = JSON.parse(await readFile(new URL("src/data/sharks.json", root), "utf8"));
assert.equal(new Set(content.map((s) => s.id)).size, content.length, "Catalog IDs must be unique");
for (const shark of content) {
  assert.ok(["real", "fantasy"].includes(shark.kind));
  assert.ok(shark.name && shark.habitat && shark.size && shark.facts.length >= 2);
  assert.ok(shark.description.length >= 2 && shark.description.every((p) => p.length >= 80), `${shark.id} needs a detailed, readable description`);
  if (shark.kind === "real") {
    assert.ok(shark.facts.length >= 5, `${shark.id} needs at least five sourced facts`);
    assert.ok(shark.scientificName && shark.references.length);
    assert.ok(manifest.some((p) => p.sharkId === shark.id && p.scientificName === shark.scientificName), `Unlockable ${shark.id} lacks a matching photo/provenance`);
  } else assert.ok(shark.symbol && shark.color && !shark.scientificName);
}
for (const asset of manifest) {
  for (const field of ["sharkId", "scientificName", "sourcePageUrl", "originalFileUrl", "creator", "creditLine", "licenseId", "licenseUrl", "rightsEvidence", "accessedDate", "modifications", "identificationReference", "sha256"]) assert.ok(asset[field], `${asset.sharkId} missing ${field}`);
  assert.equal(asset.verificationStatus, "agent-reviewed");
  assert.ok(content.some((s) => s.id === asset.sharkId && s.kind === "real"));
  assert.match(asset.licenseId, /^(CC BY(?:-SA)? [234]\.0|CC BY-SA 2\.5|CC0|Public domain)$/);
  assert.match(asset.localPath, /^sharks\/[a-z-]+\.webp$/);
  const bytes = await readFile(new URL(`public/${asset.localPath}`, root));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256);
  await access(new URL(asset.rightsEvidence, root));
  await access(new URL(`dist/${asset.localPath}`, root));
}
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["icon-maskable.png", 512], ["apple-touch-icon-v2.png", 180], ["apple-touch-icon-ipad-167.png", 167], ["apple-touch-icon-ipad-152.png", 152]]) {
  const bytes = await readFile(new URL(`dist/${name}`, root));
  const icon = await sharp(bytes).metadata();
  assert.equal(icon.width, size, `${name} width`);
  assert.equal(icon.height, size, `${name} height`);
  assert.equal(icon.hasAlpha, false, `${name} must be opaque; iOS supplies the rounded mask`);
  assert.ok(bytes.length < 180_000, `${name} should remain compact`);
}
await access(new URL("dist/sharklication-logo.png", root));
console.log(`Validated ${manifest.length} local real-species photos, provenance, checksums, and built assets.`);
