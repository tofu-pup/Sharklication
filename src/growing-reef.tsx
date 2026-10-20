import { ACTIVITY_INFO, seededRandom, shuffle, type ActivityId } from "./domain";

export const BIOTOPES = {
  reef: { name: "Coral reef", description: "Warm, shallow water with branching corals and colourful fish.", water: ["#ccefea", "#c9eef5"], sand: "#efdab2", colors: ["#f49e79", "#edbc52", "#a68fd6", "#80cbd2", "#f28c87"] },
  feeding: { name: "Seagrass meadow", description: "Sunlit sandy shallows with ribbons of seagrass and visiting turtles.", water: ["#daefcd", "#cde9da"], sand: "#e4d5a0", colors: ["#8dba75", "#ddb765", "#8bc9b0", "#dca97b", "#91b6a0"] },
  dive: { name: "Kelp forest", description: "Cool coastal water with tall seaweed, rocky shelter and curious swimmers.", water: ["#bcd9df", "#c3d4e7"], sand: "#a2b6ad", colors: ["#d9ab50", "#8cadb9", "#bb9d80", "#91b99e", "#a7a3c9"] },
} as const;

const REEF_SIZE = 12;
export function reefGrowth(solved: number) {
  return { reef: Math.max(1, Math.ceil(solved / REEF_SIZE)), friends: solved ? (solved - 1) % REEF_SIZE + 1 : 0 };
}

function Coral({ x, color }: { x: number; color: string }) {
  return <path className="reef-plant habitat-coral" d={`M${x} 153v-34m0 18q-15-1-15-18m15 8q12-1 12-18m-12 42q-22-3-22-15`}
    fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" />;
}
function HabitatPlant({ x, color, activity }: { x: number; color: string; activity: ActivityId }) {
  if (activity === "reef") return <Coral x={x} color={color} />;
  if (activity === "feeding") return <g className="reef-plant habitat-seagrass" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round">
    <path d={`M${x} 155q-24-29-18-54M${x} 155q-6-40 5-66M${x} 155q20-24 22-46M${x} 155q-10-27-7-43`} />
  </g>;
  return <g className="reef-plant habitat-kelp" fill={color} stroke={color} strokeWidth="3">
    <path d={`M${x} 157q-14-52 0-117`} fill="none" />
    {[58, 83, 108, 133].map((y, i) => <path key={y} d={i % 2 ? `M${x - 3} ${y}q-25-2-21-23 19 1 21 23` : `M${x} ${y}q24-3 23-23-22 1-23 23`} />)}
  </g>;
}
function Fish({ x, y, color, flip = false, pattern = 0 }: { x: number; y: number; color: string; flip?: boolean; pattern?: number }) {
  return <g className="reef-swimmer"><g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
    <path className="reef-tail" d="m-14 0-11-9v18Z" fill={color} />
    <ellipse rx="17" ry="10" fill={color} /><circle cx="9" cy="-2" r="2" fill="#173d50" />
    {pattern === 1 && <path d="M-7-7v14M0-8v16" stroke="#fff5df" strokeWidth="3" />}
    {pattern === 2 && <g fill="#fff5df"><circle cx="-8" cy="-3" r="2" /><circle cx="-2" cy="2" r="2" /><circle cx="-10" cy="4" r="1.5" /></g>}
    <path d="M-3-8 2-13 7-7" fill={color} /><path d="M6 4q4 3 7 0" fill="none" stroke="#173d50" strokeWidth="1.5" strokeLinecap="round" />
  </g></g>;
}
function Jellyfish({ x, y, color }: { x: number; y: number; color: string }) {
  return <g className="reef-swimmer habitat-jellyfish"><g transform={`translate(${x} ${y})`}>
    <path d="M-12 3q-2-25 12-25T12 3Z" fill={color} />
    <path d="M-8 3q-5 7 0 14M0 3q-5 7 0 16M8 3q-5 7 0 14" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <g fill="#173d50"><circle cx="-4" cy="-5" r="1.5" /><circle cx="4" cy="-5" r="1.5" /></g>
  </g></g>;
}
function Turtle() {
  return <g className="reef-swimmer habitat-turtle"><g transform="translate(171 96)">
    <path d="m-16-5-14-18 23 12m19 0 19-10L18 1M-16 6l-14 15L-6 14m17-1 18 9-11-18" fill="#5ea98c" />
    <ellipse rx="24" ry="16" fill="#71b798" /><path d="m-10-6 11-5 11 7-1 11-13 5-11-9Z" fill="none" stroke="#41896f" strokeWidth="2" />
    <ellipse cx="31" cy="-1" rx="11" ry="9" fill="#84c2a3" /><circle cx="36" cy="-4" r="2" fill="#173d50" />
  </g></g>;
}

export function reefRandom(seed: string, activity: ActivityId, reef: number) {
  let hash = 2166136261;
  for (const char of `${seed}:${activity}:${reef}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return seededRandom(hash);
}

export function GrowingReef({ solved, activity, seed, compact = false }: { solved: number; activity: ActivityId; seed: string; compact?: boolean }) {
  const { reef, friends } = reefGrowth(solved);
  const biotope = BIOTOPES[activity];
  const random = reefRandom(seed, activity, reef);
  const colors = shuffle(biotope.colors, random);
  const background = shuffle(biotope.water, random)[0];
  const mirror = random() > .5;
  const fish = (x: number, y: number, i: number) => <Fish x={x + random() * 8 - 4} y={y + random() * 8 - 4} color={colors[i % colors.length]} flip={random() > .5} pattern={Math.floor(random() * 3)} />;
  const discoveries = [
    <HabitatPlant x={43} color={activity === "reef" ? colors[0] : "#669965"} activity={activity} />,
    fish(101, 75, 1),
    <HabitatPlant x={250} color="#58a58d" activity={activity} />,
    activity === "dive" ? <Jellyfish x={223} y={57} color={colors[2]} /> : fish(223, 57, 2),
    <HabitatPlant x={285} color={activity === "reef" ? colors[3] : "#668c54"} activity={activity} />,
    random() > .5 ? <g fill="#edba50"><path d="m155 137 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" /><circle cx="153" cy="150" r="1" fill="#685234" /><circle cx="158" cy="150" r="1" fill="#685234" /></g> :
      <g transform="translate(155 151)" fill="#ed9d83"><path d="m-10 0-9-6m9 11-10 3m10-1-8 8m28-15 9-6m-9 11 10 3m-10-1 8 8" stroke="#ce7e68" strokeWidth="2" strokeLinecap="round" /><ellipse rx="12" ry="8" /><circle cx="-6" cy="-6" r="2" fill="#173d50" /><circle cx="6" cy="-6" r="2" fill="#173d50" /></g>,
    fish(63, 40, 4),
    fish(260, 90, 0),
    <HabitatPlant x={92} color={activity === "reef" ? colors[2] : "#7ba36a"} activity={activity} />,
    activity !== "feeding" ? <g className="reef-swimmer"><g transform="translate(173 101)"><path d="M-46 0q26-29 65-12l17-13-2 20 2 20-17-10q-37 21-65-5" fill="#5ba6bc" /><path d="m-11-14 7-17 13 18m-22 21 11 12 7-13" fill="#4588a4" /><circle cx="-29" cy="-2" r="2" fill="#153d53" /><path d="M-35 5q7 5 13 0" fill="none" stroke="#153d53" strokeWidth="2" strokeLinecap="round" />{[-13, -2, 9].map((x) => <circle key={x} cx={x} cy="-4" r="2" fill="#d5eff0" />)}</g></g> : <Turtle />,
    fish(163, 37, 3),
    <g fill="#f4d580">{[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={203 + i * 6} cy={145 - Math.sin(i * Math.PI / 4) * 9} r="5" />)}</g>,
  ];
  const residents = shuffle(discoveries.map((art, id) => ({ art, id })), random);
  return <figure className={`growing-reef biotope-${activity} ${compact ? "compact" : ""}`} aria-label={`${ACTIVITY_INFO[activity].title}: ${solved} puzzles solved today. ${biotope.name} ${reef}, ${friends} of 12 habitat friends.`}>
    <svg viewBox="0 0 330 176" role="img" aria-label={`Illustrated ${biotope.name.toLowerCase()} with ${friends} growing ocean friends. ${biotope.description}`}>
      <rect width="330" height="176" rx="16" fill={background} />
      <path d="M0 0h70l90 155H85Zm112 0h30l90 155h-55Z" fill="white" opacity=".2" />
      <g fill="none" stroke="#87cbd3" strokeWidth="2" opacity=".6"><circle cx="29" cy="60" r="4" /><circle cx="303" cy="32" r="6" /><circle cx="295" cy="51" r="3" /></g>
      <path d="M0 151q80-18 164 0t166-1v26H0" fill={biotope.sand} />
      <g opacity=".4" aria-hidden="true">
        {activity === "dive" ? <><path d="M0 176v-28l25-12 32 18 22 22m184 0 18-26 31-9 18 12v23" fill="#5e7d83" /><HabitatPlant x={16} color="#577855" activity="dive" /></> :
          activity === "feeding" ? <>{[13, 24, 303, 316].map((x) => <HabitatPlant key={x} x={x} color="#92b177" activity="feeding" />)}</> :
            <><Coral x={12} color="#dbb0a3" /><Coral x={317} color="#c7a2c4" /></>}
      </g>
      <g aria-hidden="true" transform={mirror ? "translate(330 0) scale(-1 1)" : undefined}>{residents.slice(0, friends).map(({ art, id }, i) => <g className="reef-arrival" data-resident={id} key={`${seed}-${reef}-${id}`} style={{ "--reef-float": `${3 + i % 3}s`, "--reef-delay": `${-i * .7}s` } as React.CSSProperties}>{art}</g>)}</g>
      {!friends && <text x="165" y="92" textAnchor="middle" fill="#416b78" fontSize="13">Your next answer brings a new friend!</text>}
    </svg>
    <figcaption><strong>{biotope.name}</strong><span>{solved} solved today · Habitat {reef} · {friends} / 12 friends</span></figcaption>
  </figure>;
}
