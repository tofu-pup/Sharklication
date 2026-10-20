import { animalLabel, type OceanFriend } from "./ocean-friends";

export function OceanAnimalArt({ friend }: { friend: OceanFriend }) {
  const { kind, color } = friend;
  const eyes = <g fill="#173d50"><circle cx="-5" cy="-3" r="2" /><circle cx="5" cy="-3" r="2" /><path d="M-4 4q4 4 8 0" fill="none" stroke="#173d50" strokeWidth="1.5" strokeLinecap="round" /></g>;
  let art: React.ReactNode;
  switch (kind) {
    case "giant-coral":
      art = <><path d="M0 25V-23m0 34q-18 0-18-19M0-4q17 0 17-18M0 21q-27-2-27-23M0 14q26-3 26-17" stroke={color} strokeWidth="8" fill="none" strokeLinecap="round" />{eyes}</>;
      break;
    case "sponge":
      art = <><path d="M-22 23v-27q8-11 16 0v27m1 0v-42q9-12 18 0v42m0 0v-28q8-10 16 0v28" stroke={color} strokeWidth="5" fill={color} /><g fill="#446d77" opacity=".6"><ellipse cx="4" cy="-19" rx="6" ry="3" /><ellipse cx="-14" cy="-3" rx="5" ry="2" /><ellipse cx="22" cy="-4" rx="5" ry="2" /></g>{eyes}</>;
      break;
    case "jellyfish":
      art = <><path d="M-20 3q0-40 20-40T20 3Z" transform="translate(0 12) scale(1 .65)" fill={color} /><path d="M-13 11q-9 9 0 17M0 11q-9 9 0 19M13 11q-9 9 0 17" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />{eyes}</>;
      break;
    case "lobster":
    case "shrimp":
      art = <><path d="M-8 0-24-12m32 12 16-12M-7 8-23 5m30 3 16-3M-7 14-23 18m30-4 16 4M-4-15-13-28m17 13 9-13" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" /><ellipse cy="3" rx="11" ry="20" fill={color} /><path d="m-9 19-6 9 15-4 15 4-6-9" fill={color} />{kind === "lobster" && <g fill={color}><path d="M-24-9q-15-2-8-19l5 9 7-9q7 18-4 19M24-9q15-2 8-19l-5 9-7-9q-7 18 4 19" /></g>}{eyes}</>;
      break;
    case "crab":
      art = <><path d="M-12 3-28-6m16 15-19 2m19 4-14 12m38-22 16-9M12 9l19 2m-19 4 14 12" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" /><ellipse cy="7" rx="20" ry="14" fill={color} /><path d="M-23-5q-12-2-7-14l5 7 6-7q5 12-4 14m46 0q12-2 7-14l-5 7-6-7q-5 12 4 14" fill={color} />{eyes}</>;
      break;
    case "octopus":
    case "squid":
      art = <><path d={kind === "squid" ? "M-16 6 0-30 16 6Z" : "M-19 7q-5-38 19-38T19 7Z"} fill={color} />{[-17, -10, -3, 4, 11, 18].map((x) => <path key={x} d={`M${x} 5q-10 22 2 20`} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />)}{eyes}</>;
      break;
    case "sea-star":
      art = <><path d="m0-27 9 18 21 3-15 14 4 21L0 18l-19 11 4-21-15-14 21-3Z" fill={color} />{eyes}</>;
      break;
    case "urchin":
      art = <>{Array.from({ length: 14 }, (_, i) => <path key={i} d="M0-12V-28" transform={`rotate(${i * 360 / 14})`} stroke={color} strokeWidth="3" strokeLinecap="round" />)}<circle r="18" fill={color} />{eyes}</>;
      break;
    case "anemone":
      art = <><ellipse cy="20" rx="19" ry="7" fill="#829e85" />{[-20, -10, 0, 10, 20].map((x) => <path key={x} d={`M0 19Q${x} 8 ${x} -18`} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />)}{eyes}</>;
      break;
    case "turtle":
      art = <><path d="m-15-6-15-18 25 12m17 0 19-10-10 23M-16 6l-14 17 24-9m18-2 18 11-10-20" fill="#5d9b7d" /><ellipse rx="23" ry="17" fill={color} /><path d="m-10-6 11-5 11 7-1 11-13 5-11-9Z" fill="none" stroke="#417861" strokeWidth="2" /><ellipse cx="30" rx="10" ry="8" fill="#85b89a" /><circle cx="34" cy="-3" r="2" fill="#173d50" /></>;
      break;
    case "seahorse":
      art = <><path d="M8-21q-20-9-20 6 0 9 11 13 15 15 3 25-15 6-10-5" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" /><path d="M8-22h15v6H6m-11 4-14 8 13 7" fill={color} /><circle cx="7" cy="-23" r="2" fill="#173d50" /></>;
      break;
    case "ray":
      art = <><path d="M-32 5q13-33 32-25 19-8 32 25L4 14Q0 25-4 14Z" fill={color} /><path d="M0 12q14 16 3 25" stroke={color} strokeWidth="3" fill="none" />{eyes}</>;
      break;
    case "reef-shark":
      art = <><path d="M-31 0q20-23 46-9l16-13-2 21 2 20-16-10Q-10 25-31 0" fill={color} /><path d="m-8-11 7-18 12 17M-7 12l8 12 7-13" fill={color} /><circle cx="-19" cy="-2" r="2" fill="#173d50" /></>;
      break;
    case "fish":
      art = <><path className="reef-tail" d="m-17 0-14-12v24Z" fill={color} /><ellipse rx="22" ry="14" fill={color} /><path d="M-6-11v22M3-12v24" stroke="#fff5df" strokeWidth="3" /><circle cx="14" cy="-3" r="2" fill="#173d50" /><path d="M10 5q4 3 8 0" stroke="#173d50" strokeWidth="1.5" fill="none" /></>;
  }
  const attached = ["giant-coral", "sponge", "anemone"].includes(kind);
  return <g className={attached ? "reef-plant" : "reef-swimmer"} data-animal={kind} role="img" aria-label={`${friend.name}, ${animalLabel(kind)}`}>
    <title>{friend.name}, {animalLabel(kind)}</title>{art}
  </g>;
}
