import { ACTIVITY_INFO, RULES, type ActivityId } from "./domain";
import { BIOTOPES, animalLabel, oceanFriend } from "./ocean-friends";
import { OceanAnimalArt } from "./ocean-animal";

export function GrowingReef({ friends, activity, seed, compact = false }: { friends: number; activity: ActivityId; seed: string; compact?: boolean }) {
  const biotope = BIOTOPES[activity];
  const height = Math.max(176, Math.ceil(friends / 6) * 62 + 38);
  return <figure className={`growing-reef biotope-${activity} ${compact ? "compact" : ""}`} aria-label={`${ACTIVITY_INFO[activity].title}: ${friends} bonus friends today in your ${biotope.name.toLowerCase()}.`}>
    <div className="aquarium-window" role="region" aria-label={`${biotope.name} aquarium; scroll to see all friends`} tabIndex={0}>
      <svg viewBox={`0 0 330 ${height}`} role="group" aria-label={`Illustrated ${biotope.name.toLowerCase()} with ${friends} earned ocean friends. ${biotope.description}`}>
        <rect width="330" height={height} rx="16" fill={biotope.water} />
        <path d={`M0 0h70l90 ${height}H85Zm112 0h30l90 ${height}h-55Z`} fill="white" opacity=".2" />
        <g fill="none" stroke="#87cbd3" strokeWidth="2" opacity=".6"><circle cx="29" cy="60" r="4" /><circle cx="303" cy="32" r="6" /><circle cx="295" cy="51" r="3" /></g>
        <path d={`M0 ${height - 25}q80-18 164 0t166-1v26H0`} fill={biotope.sand} />
        {activity === "dive" && <path d={`M0 ${height}v-28l25-12 32 18 22 22m184 0 18-26 31-9 18 12v23`} fill="#809da1" opacity=".5" />}
        {activity === "feeding" && [10, 42, 95, 230, 285, 315].map((x) => <g key={x} transform={`translate(${x} ${height - 15})`}><path className="reef-plant" d="M0 0q-12-27-7-45M0 0q15-24 12-40M0 0q-1-23 5-52" fill="none" stroke="#7da167" strokeWidth="3" /></g>)}
        {activity === "dive" && [12, 43, 290, 320].map((x) => <g key={x} transform={`translate(${x} ${height - 15})`}><g className="reef-plant" fill="#5e9479" stroke="#4d836a" strokeWidth="2">
          <path d="M0 0q-12-60 0-120" fill="none" />
          {[-20, -45, -70, -95].map((y, i) => <path key={y} d={`M-4 ${y}q${i % 2 ? 29 : -29}-23 ${i % 2 ? 21 : -21}-37Q-6 ${y - 18}-4 ${y}`} />)}
        </g></g>)}
        {Array.from({ length: friends }, (_, index) => {
          const friend = oceanFriend(seed, activity, index);
          return <g className="reef-arrival" data-resident={index} key={`${seed}-${activity}-${index}`}
            transform={`translate(${friend.x} ${friend.y}) scale(${friend.kind === "giant-coral" ? ".8" : ".65"})`}
            style={{ "--reef-float": `${3 + index % 3}s`, "--reef-delay": `${-index * .7}s` } as React.CSSProperties}>
            <OceanAnimalArt friend={friend} />
          </g>;
        })}
        {!friends && <g fill="#416b78" textAnchor="middle"><text x="165" y="75" fontSize="16">It's quiet in here...</text><text x="165" y="101" fontSize="12">Finish a bonus set to invite a friend!</text></g>}
      </svg>
    </div>
    <figcaption><strong>{biotope.name}</strong><span>{friends} bonus {friends === 1 ? "friend" : "friends"} today</span>
      {!friends && <span>Can you find us a neighbour? Solve a full set of {RULES[activity]} bonus puzzles!</span>}
    </figcaption>
  </figure>;
}

export function NewFriend({ activity, seed, index }: { activity: ActivityId; seed: string; index: number }) {
  const friend = oceanFriend(seed, activity, index);
  return <section className="new-friend" aria-labelledby="new-friend-name">
    <span className="eyebrow">A NEW NEIGHBOUR HAS ARRIVED!</span>
    <svg viewBox="0 0 180 150" role="img" aria-label={`Illustration of ${friend.name}, a ${animalLabel(friend.kind)}`}>
      <circle cx="90" cy="75" r="65" fill={BIOTOPES[activity].water} />
      <g transform="translate(90 75) scale(1.8)" aria-hidden="true"><OceanAnimalArt friend={friend} /></g>
    </svg>
    <h2 id="new-friend-name">Meet {friend.name}!</h2>
    <p>A playful illustrated {animalLabel(friend.kind)}, now at home in your {BIOTOPES[activity].name.toLowerCase()}.</p>
    <p>Gobfrey says: “A whole set solved, a whole new friend!” Your new neighbour is saved.</p>
  </section>;
}
