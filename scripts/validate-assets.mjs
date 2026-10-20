import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("src/data/asset-manifest.json", root), "utf8"));
const content = JSON.parse(await readFile(new URL("src/data/sharks.json", root), "utf8"));
assert.equal(new Set(content.map((s) => s.id)).size, content.length, "Catalog IDs must be unique");
for (const shark of content) {
  assert.ok(["real", "fantasy"].includes(shark.kind));
  assert.ok(shark.name && shark.habitat && shark.size && shark.facts.length >= 2);
  if (shark.kind === "real") {
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
for (const name of ["icon-192.png", "icon-512.png", "icon-maskable.png", "sharklication-logo.png"]) await access(new URL(`dist/${name}`, root));
console.log(`Validated ${manifest.length} local real-species photos, provenance, checksums, and built assets.`);
