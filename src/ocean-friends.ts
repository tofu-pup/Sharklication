import { seededRandom, shuffle, type ActivityId } from "./domain";

export const BIOTOPES = {
  reef: { name: "Coral reef", description: "Warm shallows with corals, sponges and colourful swimmers.", water: "#ccefea", sand: "#efdab2",
    animals: ["fish", "giant-coral", "sponge", "lobster", "jellyfish", "ray", "octopus", "sea-star", "anemone", "reef-shark"] },
  feeding: { name: "Seagrass meadow", description: "Sunlit seagrass shallows with turtles, seahorses and sandy-bottom neighbours.", water: "#daefcd", sand: "#e4d5a0",
    animals: ["turtle", "seahorse", "crab", "fish", "ray", "jellyfish", "sponge", "octopus", "sea-star", "shrimp"] },
  dive: { name: "Kelp forest", description: "Cool coastal water with kelp, lobsters, jellies and rocky-bottom neighbours.", water: "#bcd9df", sand: "#a2b6ad",
    animals: ["lobster", "jellyfish", "octopus", "fish", "sea-star", "urchin", "sponge", "crab", "squid", "anemone"] },
} as const;

export type OceanAnimal = typeof BIOTOPES[ActivityId]["animals"][number];
export interface OceanFriend { kind: OceanAnimal; name: string; color: string; x: number; y: number }
export function reefRandom(seed: string, activity: ActivityId, index: number) {
  let hash = 2166136261;
  for (const char of `${seed}:${activity}:${index}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return seededRandom(hash);
}
const firstNames = ["Professor", "Wobbly", "Captain", "Bubbles", "Noodle", "Lady", "Sir", "Disco", "Pickle", "Giggles", "Squishy", "Doctor"];
const lastNames = ["Wiggleboots", "McBubbles", "Noodlepants", "Flufflebottom", "Snorkelton", "Fizzypop", "Wobblechin", "Jellybean", "Tippytoes", "Sprinkles", "Snoozlefin", "Puddlehop"];
export function oceanFriend(seed: string, activity: ActivityId, index: number): OceanFriend {
  const pool = BIOTOPES[activity].animals;
  const cycle = Math.floor(index / pool.length);
  const order = shuffle(pool, reefRandom(seed, activity, cycle));
  const random = reefRandom(seed, activity, index + 100_000);
  return {
    kind: order[index % pool.length],
    name: `${firstNames[Math.floor(random() * firstNames.length)]} ${lastNames[Math.floor(random() * lastNames.length)]}`,
    color: ["#ed9d83", "#edbc52", "#a68fd6", "#63afb9", "#8bb383", "#d989ae"][Math.floor(random() * 6)],
    x: 30 + index % 6 * 53 + random() * 6 - 3,
    y: 44 + Math.floor(index / 6) * 62 + random() * 6 - 3,
  };
}
export const animalLabel = (kind: OceanAnimal) => kind.replaceAll("-", " ");
