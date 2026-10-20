import { mkdir, readFile, writeFile } from "node:fs/promises";
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
  {
    sharkId: "great-white-shark", scientificName: "Carcharodon carcharias", reference: "white-shark",
    title: "File:Great white shark south africa.jpg", creator: "Hermanus Backpackers", license: "CC BY 2.0",
    identification: "File identifies Carcharodon carcharias off South Africa; conical snout, robust body and sharply contrasting pale underside match museum features.",
  },
  {
    sharkId: "tiger-shark", scientificName: "Galeocerdo cuvier", reference: "tiger-shark",
    title: "File:Tiger shark.jpg", creator: "Albert Kok", license: "CC BY-SA 3.0",
    identification: "File identifies a tiger shark in the Bahamas; broad blunt head, body bars and long upper tail match museum features.",
  },
  {
    sharkId: "bull-shark", scientificName: "Carcharhinus leucas", reference: "bull-shark",
    title: "File:Bullshark Beqa Fiji 2007.jpg", creator: "Terry Goss", license: "CC BY 2.5",
    identification: "File explicitly identifies an adult Carcharhinus leucas at Beqa, Fiji; stout body, blunt snout and broad triangular dorsal fin match museum features.",
  },
  {
    sharkId: "great-hammerhead", scientificName: "Sphyrna mokarran", reference: "great-hammerhead",
    title: "File:Great hammerhead georgia.jpg", creator: "Jake Mohan", license: "CC BY 2.0",
    identification: "File explicitly identifies Sphyrna mokarran at Georgia Aquarium; broad nearly straight head margin and tall curved dorsal fin agree with museum features.",
  },
  {
    sharkId: "scalloped-hammerhead", scientificName: "Sphyrna lewini", reference: "scalloped-hammerhead",
    title: "File:Scalloped hammerhead shark (Sphyrna lewini) Costa Rica (cropped).jpg", creator: "Kris-Mikael Krister", license: "CC BY 2.0",
    identification: "File identifies Sphyrna lewini off Costa Rica; indented curved head margin matches museum features. External appearance alone cannot exclude the closely related Carolina hammerhead; identification follows the file and locality.",
  },
  {
    sharkId: "smooth-hammerhead", scientificName: "Sphyrna zygaena", reference: "smooth-hammerhead",
    title: "File:Sphyrna zygaena, Aquarium de La Rochelle.jpg", creator: "Globetrotteur17... Ici, là-bas ou ailleurs...", license: "CC BY-SA 2.0",
    identification: "File identifies Sphyrna zygaena at La Rochelle Aquarium; smoothly arched head without a central notch agrees with museum features. Original photographic border/signature retained.",
  },
  {
    sharkId: "shortfin-mako", scientificName: "Isurus oxyrinchus", reference: "shortfin-mako",
    title: "File:Isurus oxyrinchus by mark conlin.jpg", creator: "Mark Conlin, SWFSC Large Pelagics Program", license: "Public domain",
    identification: "NOAA source explicitly identifies Isurus oxyrinchus; pointed snout, spindle-shaped body and short pectoral fins match museum features.",
  },
  {
    sharkId: "blue-shark", scientificName: "Prionace glauca", reference: "blue-shark",
    title: "File:Tiburón azul (Prionace glauca), canal Fayal-Pico, islas Azores, Portugal, 2020-07-27, DD 14.jpg", creator: "Diego Delso", license: "CC BY-SA 4.0",
    identification: "File explicitly identifies Prionace glauca in the Azores; long pointed snout, large eye and blue upper body agree with museum features. Photograph shows the head and front body, not the whole shark.",
  },
  {
    sharkId: "basking-shark", scientificName: "Cetorhinus maximus", reference: "basking-shark",
    title: "File:Cetorhinus maximus by greg skomal.JPG", creator: "Greg Skomal / NOAA Fisheries Service", license: "Public domain",
    identification: "NOAA source identifies Cetorhinus maximus; huge open filtering mouth and long gill slits agree with museum features.",
  },
  {
    sharkId: "sand-tiger-shark", scientificName: "Carcharias taurus", reference: "sand-tiger-shark",
    title: "File:Carcharias taurus.jpg", creator: "Richard Ling", license: "CC BY-SA 2.0",
    identification: "File explicitly identifies Carcharias taurus (grey nurse shark) at South West Rocks, Australia; pointed snout and projecting slender teeth agree with museum features.",
  },
  {
    sharkId: "nurse-shark", scientificName: "Ginglymostoma cirratum", reference: "nurse-shark",
    title: "File:Ginglymostoma cirratum utila.jpg", creator: "Ross Garner", license: "CC BY 2.0",
    identification: "File identifies Ginglymostoma cirratum at Utila, Honduras in its Atlantic range; broad flattened head, rounded fins and bottom-resting posture agree with museum features.",
  },
  {
    sharkId: "lemon-shark", scientificName: "Negaprion brevirostris", reference: "lemon-shark",
    title: "File:Wikilemon Nbrevirostris1 TerryGoss.jpg", creator: "Terry Goss", license: "CC BY-SA 3.0",
    identification: "File identifies Negaprion brevirostris at Tiger Beach, Bahamas; blunt snout, yellowish body and two similarly sized dorsal fins agree with museum features.",
  },
  {
    sharkId: "sandbar-shark", scientificName: "Carcharhinus plumbeus", reference: "sandbar-shark",
    title: "File:Carcharhinus plumbeus georgia.jpg", creator: "Brian Gratwicke", license: "CC BY 2.0",
    identification: "File identifies Carcharhinus plumbeus at Georgia Aquarium; conspicuously high first dorsal fin and deep body agree with museum features.",
  },
  {
    sharkId: "dusky-shark", scientificName: "Carcharhinus obscurus", reference: "dusky-shark",
    title: "File:Carcharhinus obscurus at Seaworld.jpg", creator: "Happy Little Nomad", license: "CC BY-SA 2.0",
    identification: "File explicitly identifies Carcharhinus obscurus at Sea World Australia; rounded snout and swept pectoral fins agree with museum features. Cobia and a second shark also appear; the large central shark is the subject.",
  },
  {
    sharkId: "grey-reef-shark", scientificName: "Carcharhinus amblyrhynchos", reference: "grey-reef-shark",
    title: "File:Carcharhinus amblyrhynchos papua new guinea.jpg", creator: "Richard Ling", license: "CC BY-SA 2.0",
    identification: "File identifies Carcharhinus amblyrhynchos off Papua New Guinea; grey reef-shark body and broad dark rear tail margin agree with museum features.",
  },
  {
    sharkId: "blacktip-shark", scientificName: "Carcharhinus limbatus", reference: "blacktip-shark",
    title: "File:Carcharhinus limbatus - Caraibische zwartpunthaai.jpg", creator: "Albert Kok", license: "Public domain",
    identification: "File explicitly identifies Carcharhinus limbatus at Walkers Cay, Bahamas; pointed snout and black fin markings agree with museum features. Not Carcharhinus melanopterus, the separate blacktip reef shark.",
  },
  {
    sharkId: "zebra-shark", scientificName: "Stegostoma tigrinum", reference: "zebra-shark",
    title: "File:Stegostoma fasciatum.JPG", creator: "Julien Bidet", license: "CC BY-SA 4.0",
    identification: "File identifies Stegostoma fasciatum, an older name for Stegostoma tigrinum, at Baa Atoll, Maldives; adult spots, body ridges and long tail match museum features. Not Triakis semifasciata.",
  },
  {
    sharkId: "tawny-nurse-shark", scientificName: "Nebrius ferrugineus", reference: "tawny-nurse-shark",
    title: "File:Nebrius ferrugineus.jpg", creator: "David Burdick", license: "Public domain",
    identification: "File identifies Nebrius ferrugineus off Palau; brown body, broad head and angular pectoral fin agree with museum features.",
  },
  {
    sharkId: "spotted-wobbegong", scientificName: "Orectolobus maculatus", reference: "spotted-wobbegong",
    title: "File:Orectolobus maculatus 2.jpg", creator: "K McLean", license: "CC BY-SA 2.0",
    identification: "File explicitly identifies Orectolobus maculatus; flattened body, pale-ringed markings and skin fringe around the head agree with museum features.",
  },
  {
    sharkId: "port-jackson-shark", scientificName: "Heterodontus portusjacksoni", reference: "port-jackson-shark",
    title: "File:Port Jackson Shark pictured at SEA LIFE Sydney Aquarium.png", creator: "Felix Frost-Savage", license: "CC BY-SA 4.0",
    identification: "File identifies a Port Jackson shark at SEA LIFE Sydney; blunt ridged head and dark harness-like bands agree with museum features.",
  },
];
async function request(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(45_000) });
    if (response.ok) return response;
    if (![429, 503].includes(response.status) || attempt === 2) throw new Error(`${url}: HTTP ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 2000 * 2 ** attempt));
  }
}
await mkdir(new URL("public/sharks/", root), { recursive: true });
await mkdir(new URL("assets/evidence/", root), { recursive: true });
const manifest = [];
const existing = JSON.parse(await readFile(new URL("src/data/asset-manifest.json", root), "utf8"));
const onlyMissing = process.argv.includes("--missing");
for (const asset of approved) {
  const previous = existing.find((entry) => entry.sharkId === asset.sharkId);
  if (onlyMissing && previous) { manifest.push(previous); continue; }
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
    licenseId: asset.license, licenseUrl: meta.LicenseUrl?.value ?? (asset.license === "Public domain" ? "https://commons.wikimedia.org/wiki/Commons:Public_domain" : undefined),
    rightsEvidence: `assets/evidence/${asset.sharkId}.json`,
    accessedDate: new Date().toISOString().slice(0, 10),
    modifications: `Resized to at most 1000 px wide and re-encoded as WebP; no new crop. ${asset.license === "Public domain" ? "Source photograph is public domain." : `Reuse remains subject to the source ${asset.license} license.`}`,
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
if (!onlyMissing) await import("./prepare-icons.mjs");
