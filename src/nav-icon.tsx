export function NavIcon({ kind }: { kind: "ocean" | "album" }) {
  return <svg className="nav-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
    {kind === "ocean" ? <>
      <circle cx="16" cy="16" r="14" fill="#cef0ed" />
      <path d="M3 21q4-5 8 0t8 0 10 0M4 26q4-4 8 0t8 0 8 0" stroke="#0c8290" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M12 18q1-9 8-12l-1 12" fill="#149db0" stroke="#16566b" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="7" cy="10" r="2" fill="white" /><circle cx="26" cy="13" r="1.5" fill="white" />
    </> : <>
      <rect x="5" y="4" width="23" height="25" rx="4" fill="#e8e1fa" stroke="#6d5b94" strokeWidth="1.8" />
      <path d="M10 5v23M3 10h5M3 16h5M3 22h5" stroke="#6d5b94" strokeWidth="2" strokeLinecap="round" />
      <path d="m14 16 3-4 7 3 2-3v8l-3-2-7 2Z" fill="#1c9cad" />
      <path d="m18 13 2-4 2 5" fill="#1c9cad" /><circle cx="16" cy="16" r="1" fill="white" />
    </>}
  </svg>;
}
