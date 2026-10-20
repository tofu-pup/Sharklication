import { useId } from "react";
import type { Shark } from "./catalog";

export function SharkArt({ shark, className = "" }: { shark?: Shark; className?: string }) {
  const id = useId().replaceAll(":", "");
  const color = shark?.color ?? "#40b9ce";
  const accent = shark?.accent ?? "#b4f4ea";
  return <svg viewBox="0 0 320 210" role="img" aria-label={shark ? `Original fantasy illustration of ${shark.name}` : "Friendly cartoon shark guide"} className={className}>
    <defs><linearGradient id={id} x2=".2" y2="1"><stop stopColor={accent} /><stop offset="1" stopColor={color} /></linearGradient></defs>
    <ellipse cx="164" cy="187" rx="103" ry="9" fill="#073d51" opacity=".08" />
    <circle cx="276" cy="38" r="8" fill="none" stroke={color} opacity=".3" strokeWidth="3" />
    <circle cx="288" cy="15" r="4" fill="none" stroke={color} opacity=".3" strokeWidth="2" />
    <path d="M75 103Q33 57 28 58L40 109L22 158Q45 154 78 127Z" fill={color} stroke="#16465e" strokeWidth="4" strokeLinejoin="round" />
    <path d="M132 72Q133 28 158 25L180 76" fill={color} stroke="#16465e" strokeWidth="4" strokeLinejoin="round" />
    <path d="M74 94C116 55 222 52 270 88Q302 110 272 139C223 178 115 166 72 128Z" fill={`url(#${id})`} stroke="#16465e" strokeWidth="4" />
    <path d="M88 128Q165 111 278 119Q258 166 172 162Q115 159 88 128Z" fill="#fff9e9" />
    <path d="M152 136Q131 161 163 180Q185 177 197 147" fill={color} stroke="#16465e" strokeWidth="4" strokeLinejoin="round" />
    <circle cx="235" cy="99" r="16" fill="white" stroke="#16465e" strokeWidth="3" />
    <circle cx="239" cy="100" r="9" fill="#143a54" /><circle cx="241" cy="96" r="3" fill="white" />
    <path d="M240 129Q255 140 268 126" fill="none" stroke="#16465e" strokeWidth="4" strokeLinecap="round" />
    {[105, 117, 129].map((x) => <path key={x} d={`M${x} 101q-5 9 0 18`} stroke="#16465e" strokeWidth="2" fill="none" opacity=".5" />)}
    {[95, 127, 164, 193, 211].map((x, i) => <ellipse key={x} cx={x} cy={83 + (i % 2) * 12} rx="5" ry="3" fill={accent} />)}
    <text x="168" y="108" fill="#fff9e9" fontSize="24" fontFamily="sans-serif" textAnchor="middle">{shark?.symbol ?? "✦"}</text>
  </svg>;
}
