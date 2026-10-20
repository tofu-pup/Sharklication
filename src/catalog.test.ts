import { expect, it } from "vitest";
import { CATALOG } from "./catalog";

it("provides substantial offline stories and properly separated real-species facts", () => {
  expect(CATALOG.filter((s) => s.kind === "real")).toHaveLength(6);
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
