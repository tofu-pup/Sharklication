import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const headers = { "User-Agent": "Sharklication/0.1 (educational game; https://github.com/tofu-pup/Sharklication)" };
// These source pages were reviewed for exact species and allowed licenses.
// Review any replacement file before changing this allow-list.
const approved = [
  {
    sharkId: "whale-shark", scientificName: "Rhincodon typus",
    title: "File:Whale shark Georgia aquarium.jpg",
    creator: "Zac Wolf (original); Stefan (cropping); Togabi (color adjustment)",
    license: "CC BY-SA 2.5", reference: "whale-shark",
    identification: "Commons category Rhincodon typus in Georgia Aquarium; broad flat head and rows of pale spots agree with Florida Museum identification features.",
  },
  {
    sharkId: "epaulette-shark", scientificName: "Hemiscyllium ocellatum",
    title: "File:Epaulette shark Arizona.jpg", creator: "Coughdrop12",
    license: "CC BY-SA 4.0", reference: "epaulette-shark",
    identification: "File description explicitly identifies Hemiscyllium ocellatum; rounded paired fins and conspicuous dark shoulder spot agree with Florida Museum features.",
  },
  {
    sharkId: "blacktip-reef-shark", scientificName: "Carcharhinus melanopterus",
    title: "File:Blacktip reef shark (Carcharhinus melanopterus) Moorea.jpg",
    creator: "Charles J. Sharp, Sharp Photography (sharpphotography.co.uk)",
    license: "CC BY-SA 4.0", reference: "blacktip-reef-shark",
    identification: "Commons featured photograph explicitly identifies Carcharhinus melanopterus at Moorea; black-tipped fins agree with Florida Museum diagnostic features.",
  },
  {
    sharkId: "whitetip-reef-shark", scientificName: "Triaenodon obesus",
    title: "File:Tiburón de arrecife de punta blanca (Triaenodon obesus), Nosy Tanikely, Madagascar, 2025-09-19, DD 110.jpg",
    creator: "Diego Delso", license: "CC BY-SA 4.0", reference: "whitetip-reef-shark",
    identification: "Commons quality photograph explicitly identifies Triaenodon obesus; pale first dorsal tip, rounded snout and slender body agree with Florida Museum diagnostic features. The tail is outside this photograph.",
  },
  {
    sharkId: "bonnethead", scientificName: "Sphyrna tiburo",
    title: "File:Bonnethead shark.jpg",
    creator: "Valerie Everett", license: "CC BY-SA 2.0", reference: "bonnethead",
    identification: "Commons file and category identify Sphyrna tiburo at Indianapolis Zoo; smooth shovel-shaped head agrees with Florida Museum diagnostic features. Flickr license reviewed on Commons.",
  },
  {
    sharkId: "leopard-shark", scientificName: "Triakis semifasciata",
    title: "File:Leopard shark in kelp.jpg",
    creator: "Matthew Field (Mfield), www.photography.mattfield.com",
    license: "CC BY-SA 3.0", reference: "leopard-shark",
    identification: "Commons description explicitly identifies Triakis semifasciata at Birch Aquarium, not the zebra shark also called leopard shark. Dark saddle marks agree with Florida Museum diagnostic features.",
  },
];
async function request(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, { headers });
    if (response.ok) return response;
    if (![429, 503].includes(response.status) || attempt === 2) throw new Error(`${url}: HTTP ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 2000 * 2 ** attempt));
  }
}
await mkdir(new URL("public/sharks/", root), { recursive: true });
await mkdir(new URL("assets/evidence/", root), { recursive: true });
const manifest = [];
for (const asset of approved) {
  const params = new URLSearchParams({ action: "query", format: "json", prop: "imageinfo", iiprop: "url|extmetadata", titles: asset.title });
  const evidence = await (await request(`https://commons.wikimedia.org/w/api.php?${params}`)).json();
  const info = Object.values(evidence.query.pages)[0].imageinfo[0];
  const meta = info.extmetadata;
  if (meta.LicenseShortName.value !== asset.license) throw new Error(`License changed for ${asset.sharkId}: review before acquisition.`);
  const original = info.url.split("?")[0];
  const bytes = Buffer.from(await (await request(original)).arrayBuffer());
  const output = await sharp(bytes).rotate().resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const dimensions = await sharp(output).metadata();
  const localPath = `sharks/${asset.sharkId}.webp`;
  await writeFile(new URL(`public/${localPath}`, root), output);
  await writeFile(new URL(`assets/evidence/${asset.sharkId}.json`, root), JSON.stringify(evidence, null, 2) + "\n");
  manifest.push({
    sharkId: asset.sharkId, scientificName: asset.scientificName, localPath,
    sourcePageUrl: info.descriptionurl, originalFileUrl: original,
    creator: asset.creator, creditLine: `${asset.creator} / ${asset.license}`,
    licenseId: asset.license, licenseUrl: meta.LicenseUrl.value,
    rightsEvidence: `assets/evidence/${asset.sharkId}.json`,
    accessedDate: new Date().toISOString().slice(0, 10),
    modifications: "Resized to at most 1000 px wide and re-encoded as WebP; no new crop. This adaptation remains under the source CC BY-SA license.",
    identificationReference: `https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/${asset.reference}/`,
    identificationNotes: asset.identification,
    verificationStatus: "agent-reviewed",
    reviewScope: "Agent review of file-specific description, license metadata, and visual diagnostic features against Florida Museum. Not a human taxonomic certification.",
    width: dimensions.width, height: dimensions.height,
    sha256: createHash("sha256").update(output).digest("hex"),
  });
  console.log(`${asset.sharkId}: ${dimensions.width}x${dimensions.height}, ${output.length} bytes`);
  await new Promise((resolve) => setTimeout(resolve, 1200));
}
await writeFile(new URL("src/data/asset-manifest.json", root), JSON.stringify(manifest, null, 2) + "\n");
await import("./prepare-icons.mjs");
