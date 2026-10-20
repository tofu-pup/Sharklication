function FeedingShark() {
  return <svg className="feeding-shark" viewBox="0 0 110 70" aria-hidden="true" focusable="false">
    <path d="M25 32 5 16l4 23-5 17 24-9" fill="#168ba3" stroke="#154b66" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="m47 24 9-20 17 23" fill="#17a6bc" stroke="#154b66" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M22 38C25 12 90 15 104 35c12 24-63 37-80 13Z" fill="#31bdd0" stroke="#154b66" strokeWidth="2.5" />
    <path d="M26 44c20 9 52 6 77-4-4 21-60 28-77 4Z" fill="#e3faf2" />
    <path d="m53 47-7 17 24-12" fill="#1ca6bd" stroke="#154b66" strokeWidth="2" strokeLinejoin="round" />
    <g fill="#d9f8d5"><ellipse cx="40" cy="29" rx="4" ry="2.5" /><ellipse cx="54" cy="25" rx="4" ry="2.5" /><ellipse cx="65" cy="31" rx="4" ry="2.5" /></g>
    <ellipse cx="85" cy="34" rx="7" ry="8" fill="white" /><circle cx="87" cy="35" r="4" fill="#153d56" /><circle cx="88" cy="33" r="1.5" fill="white" />
    <path d="M83 47q8 6 15-2" fill="none" stroke="#154b66" strokeWidth="2.5" strokeLinecap="round" />
    <path d="m69 38-1 6m5-7-1 6" stroke="#168ba3" strokeWidth="2" strokeLinecap="round" />
  </svg>;
}

function FeedingFish() {
  return <svg className="feeding-fish" viewBox="0 0 44 30" aria-hidden="true" focusable="false">
    <path d="m27 15 14-11v22Z" fill="#f6ad38" stroke="#8d591a" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M3 15C8 0 28 0 34 15 28 30 8 30 3 15Z" fill="#ffd469" stroke="#8d591a" strokeWidth="1.5" />
    <path d="m18 8 6-6 3 8m-9 13 6 6 3-8" fill="#efaa39" stroke="#8d591a" strokeWidth="1.2" strokeLinejoin="round" />
    <circle cx="11" cy="12" r="3" fill="white" /><circle cx="10" cy="12" r="1.6" fill="#163e50" />
    <path d="m18 11 5 4-5 4" fill="none" stroke="#c17d27" strokeWidth="1.5" strokeLinecap="round" />
  </svg>;
}

export function FeedingGroups({ sharks, fishEach, array }: { sharks: number; fishEach: number; array: boolean }) {
  return <div className={`feeding-groups ${array ? "as-array" : ""}`} role="img" tabIndex={array ? 0 : undefined} aria-label={`${sharks} cartoon sharks, each with ${fishEach} fish. ${array ? `${sharks} rows of ${fishEach} fish. Scroll sideways if needed to see the whole row.` : "One equal group for each shark."}`}>
    {Array.from({ length: sharks }, (_, row) => <div className="feeding-group" key={row} aria-hidden="true">
      <div className="feeding-recipient"><FeedingShark /><span>Shark {row + 1}</span></div>
      <div className="feeding-portion" style={array ? { gridTemplateColumns: `repeat(${fishEach}, minmax(0, 1fr))` } : undefined}>{Array.from({ length: fishEach }, (_, col) => <FeedingFish key={col} />)}</div>
    </div>)}
  </div>;
}
