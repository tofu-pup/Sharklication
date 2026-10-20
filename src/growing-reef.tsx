import { ACTIVITY_INFO, seededRandom, shuffle, type ActivityId } from "./domain";
import { useState } from "react";

const REEF_SIZE = 12;
export function reefGrowth(solved: number) {
  return { reef: Math.max(1, Math.ceil(solved / REEF_SIZE)), friends: solved ? (solved - 1) % REEF_SIZE + 1 : 0 };
}

function Coral({ x, color }: { x: number; color: string }) {
  return <path className="reef-plant" d={`M${x} 153v-34m0 18q-15-1-15-18m15 8q12-1 12-18m-12 42q-22-3-22-15`}
    fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" />;
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
  return <g className="reef-swimmer"><g transform={`translate(${x} ${y})`}>
    <path d="M-12 3q-2-25 12-25T12 3Z" fill={color} />
    <path d="M-8 3q-5 7 0 14M0 3q-5 7 0 16M8 3q-5 7 0 14" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <g fill="#173d50"><circle cx="-4" cy="-5" r="1.5" /><circle cx="4" cy="-5" r="1.5" /></g>
  </g></g>;
}
function Turtle() {
  return <g className="reef-swimmer"><g transform="translate(171 96)">
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
  const [motionPaused, setMotionPaused] = useState(false);
  const { reef, friends } = reefGrowth(solved);
  const random = reefRandom(seed, activity, reef);
  const colors = shuffle(["#f49e79", "#edbc52", "#a68fd6", "#80cbd2", "#f28c87"], random);
  const background = shuffle(["#d6f1f0", "#ddebf6", "#dcefe6", "#e4e5f6"], random)[0];
  const mirror = random() > .5;
  const fish = (x: number, y: number, i: number) => <Fish x={x + random() * 8 - 4} y={y + random() * 8 - 4} color={colors[i % colors.length]} flip={random() > .5} pattern={Math.floor(random() * 3)} />;
  const discoveries = [
    <Coral x={43} color={colors[0]} />,
    fish(101, 75, 1),
    <path className="reef-plant" d="M250 153q-20-21-9-43 9 20 9 43m0 0q-1-35 16-45-2 25-16 45" fill="#58b58d" />,
    random() > .5 ? fish(223, 57, 2) : <Jellyfish x={223} y={57} color={colors[2]} />,
    <Coral x={285} color={colors[3]} />,
    random() > .5 ? <g fill="#edba50"><path d="m155 137 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" /><circle cx="153" cy="150" r="1" fill="#685234" /><circle cx="158" cy="150" r="1" fill="#685234" /></g> :
      <g transform="translate(155 151)" fill="#ed9d83"><path d="m-10 0-9-6m9 11-10 3m10-1-8 8m28-15 9-6m-9 11 10 3m-10-1 8 8" stroke="#ce7e68" strokeWidth="2" strokeLinecap="round" /><ellipse rx="12" ry="8" /><circle cx="-6" cy="-6" r="2" fill="#173d50" /><circle cx="6" cy="-6" r="2" fill="#173d50" /></g>,
    fish(63, 40, 4),
    fish(260, 90, 0),
    <Coral x={92} color={colors[2]} />,
    random() > .35 ? <g className="reef-swimmer"><g transform="translate(173 101)"><path d="M-46 0q26-29 65-12l17-13-2 20 2 20-17-10q-37 21-65-5" fill="#5ba6bc" /><path d="m-11-14 7-17 13 18m-22 21 11 12 7-13" fill="#4588a4" /><circle cx="-29" cy="-2" r="2" fill="#153d53" /><path d="M-35 5q7 5 13 0" fill="none" stroke="#153d53" strokeWidth="2" strokeLinecap="round" />{[-13, -2, 9].map((x) => <circle key={x} cx={x} cy="-4" r="2" fill="#d5eff0" />)}</g></g> : <Turtle />,
    fish(163, 37, 3),
    <g fill="#f4d580">{[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={203 + i * 6} cy={145 - Math.sin(i * Math.PI / 4) * 9} r="5" />)}</g>,
  ];
  const residents = shuffle(discoveries.map((art, id) => ({ art, id })), random);
  return <figure className={`growing-reef ${compact ? "compact" : ""}${motionPaused ? " reef-still" : ""}`} aria-label={`${ACTIVITY_INFO[activity].title}: ${solved} puzzles solved today. Reef ${reef}, ${friends} of 12 reef friends.`}>
    <svg viewBox="0 0 330 176" role="img" aria-label={`Illustrated growing reef with ${friends} fish, coral and other ocean friends`}>
      <rect width="330" height="176" rx="16" fill={background} />
      <path d="M0 0h70l90 155H85Zm112 0h30l90 155h-55Z" fill="white" opacity=".2" />
      <g fill="none" stroke="#87cbd3" strokeWidth="2" opacity=".6"><circle cx="29" cy="60" r="4" /><circle cx="303" cy="32" r="6" /><circle cx="295" cy="51" r="3" /></g>
      <path d="M0 151q80-18 164 0t166-1v26H0" fill="#ead8af" />
      <g aria-hidden="true" transform={mirror ? "translate(330 0) scale(-1 1)" : undefined}>{residents.slice(0, friends).map(({ art, id }, i) => <g className="reef-arrival" data-resident={id} key={`${seed}-${reef}-${id}`} style={{ "--reef-float": `${3 + i % 3}s`, "--reef-delay": `${-i * .7}s` } as React.CSSProperties}>{art}</g>)}</g>
      {!friends && <text x="165" y="92" textAnchor="middle" fill="#416b78" fontSize="13">Your next answer brings a new friend!</text>}
    </svg>
    <figcaption><strong>{solved} solved today</strong><span>Reef {reef} · {friends === 12 ? "All grown! Keep exploring." : `${friends} / 12 friends`}</span></figcaption>
    {friends > 0 && <button className="text-button reef-motion" type="button" aria-pressed={motionPaused} onClick={() => setMotionPaused(!motionPaused)}>{motionPaused ? "Resume reef motion" : "Pause reef motion"}</button>}
  </figure>;
}
