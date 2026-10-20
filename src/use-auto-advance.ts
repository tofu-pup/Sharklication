import { useEffect, useRef } from "react";

export const SUCCESS_DELAY = 1800;
export const SUPPORTED_SUCCESS_DELAY = 3600;

export function useAutoAdvance(questionId: string | undefined, enabled: boolean, delay: number, advance: (id: string) => void) {
  const callback = useRef(advance);
  callback.current = advance;
  const attempted = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!questionId || !enabled || attempted.current === questionId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clear = () => { clearTimeout(timer); };
    const schedule = () => {
      clear();
      if (document.visibilityState === "hidden" || attempted.current === questionId) return;
      timer = setTimeout(() => {
        if (document.visibilityState === "hidden") return;
        // A failed save must wait for an explicit retry, not loop in the background.
        attempted.current = questionId;
        callback.current(questionId);
      }, delay);
    };
    document.addEventListener("visibilitychange", schedule);
    window.addEventListener("pagehide", clear);
    window.addEventListener("pageshow", schedule);
    schedule();
    return () => {
      clear();
      document.removeEventListener("visibilitychange", schedule);
      window.removeEventListener("pagehide", clear);
      window.removeEventListener("pageshow", schedule);
    };
  }, [questionId, enabled, delay]);
  return questionId !== undefined && attempted.current === questionId;
}
