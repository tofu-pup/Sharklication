import manifest from "./data/asset-manifest.json";
import content from "./data/sharks.json";

export interface Photo {
  sharkId: string;
  scientificName: string;
  localPath: string;
  sourcePageUrl: string;
  originalFileUrl: string;
  creator: string;
  creditLine: string;
  licenseId: string;
  licenseUrl: string;
  rightsEvidence: string;
  accessedDate: string;
  modifications: string;
  identificationReference: string;
  verificationStatus: string;
  width: number;
  height: number;
  sha256: string;
}
export interface Shark {
  id: string;
  name: string;
  kind: "real" | "fantasy";
  scientificName?: string;
  color: string;
  accent?: string;
  symbol?: string;
  habitat: string;
  size: string;
  facts: string[];
  description: string[];
  references: string[];
  photo?: Photo;
}
export const CATALOG: Shark[] = content.map((entry) => {
  const kind = entry.kind;
  if (kind !== "real" && kind !== "fantasy") throw new Error(`Invalid catalog kind for ${entry.id}.`);
  return { ...entry, kind, photo: kind === "real" ? manifest.find((p) => p.sharkId === entry.id) : undefined };
});
export function rewardOrder(random: () => number): string[] {
  const starter = ["whale-shark", "epaulette-shark", "coral-comet"];
  const rest = CATALOG.map((s) => s.id).filter((id) => !starter.includes(id));
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [...starter, ...rest];
}
