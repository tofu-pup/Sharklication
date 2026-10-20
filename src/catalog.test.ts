import { expect, it } from "vitest";
import { CATALOG } from "./catalog";

it("provides substantial offline stories and properly separated real-species facts", () => {
  expect(CATALOG.filter((s) => s.kind === "real")).toHaveLength(26);
  expect(CATALOG.filter((s) => s.kind === "fantasy")).toHaveLength(12);
  for (const shark of CATALOG) {
    expect(shark.description.length).toBeGreaterThanOrEqual(2);
    expect(shark.description.every((p) => p.length >= 80)).toBe(true);
    if (shark.kind === "real") {
      expect(shark.facts.length).toBeGreaterThanOrEqual(15);
      expect(shark.references[0]).toMatch(/^https:\/\/www\.floridamuseum\.ufl\.edu\//);
      expect(shark.photo?.scientificName).toBe(shark.scientificName);
    } else {
      expect(shark.facts.length).toBeGreaterThanOrEqual(8);
      expect(shark.description.join(" ")).toMatch(/fantasy|imagina|make-believe/i);
      expect(shark.photo).toBeUndefined();
    }
    expect(new Set(shark.facts).size).toBe(shark.facts.length);
  }
});

it("adds twenty photographed species without replacing the original eighteen entries", () => {
  const additions = CATALOG.slice(18);
  expect(additions).toHaveLength(20);
  expect(new Set(CATALOG.map((shark) => shark.id)).size).toBe(38);
  expect(new Set(CATALOG.filter((shark) => shark.kind === "real").map((shark) => shark.scientificName)).size).toBe(26);
  expect(additions.map((shark) => shark.id)).toEqual([
    "great-white-shark", "tiger-shark", "bull-shark", "great-hammerhead", "scalloped-hammerhead",
    "smooth-hammerhead", "shortfin-mako", "blue-shark", "basking-shark", "sand-tiger-shark",
    "nurse-shark", "lemon-shark", "sandbar-shark", "dusky-shark", "grey-reef-shark",
    "blacktip-shark", "zebra-shark", "tawny-nurse-shark", "spotted-wobbegong", "port-jackson-shark",
  ]);
  for (const shark of additions) {
    expect(shark.kind).toBe("real");
    expect(shark.photo?.localPath).toBe(`sharks/${shark.id}.webp`);
    expect(shark.photo?.licenseId).toMatch(/^(CC BY(?:-SA)? (?:[234]\.0|2\.5)|Public domain)$/);
    expect(shark.photo?.verificationStatus).toBe("agent-reviewed");
  }
});
