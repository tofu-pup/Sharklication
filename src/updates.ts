export const UPDATE_INTERVAL = 5 * 60 * 1000;

export function watchForControllerChange(container: EventTarget & { readonly controller: unknown }, onUpdate: () => void): () => void {
  let previous = container.controller;
  const changed = () => {
    const next = container.controller;
    if (previous && next && next !== previous) onUpdate();
    previous = next;
  };
  container.addEventListener("controllerchange", changed);
  return () => container.removeEventListener("controllerchange", changed);
}

// iOS suspends timers while backgrounded, so foreground/reconnect checks matter.
export function watchForUpdates(registration: Pick<ServiceWorkerRegistration, "update">, onError: (error: unknown) => void): () => void {
  let checking = false;
  const check = async () => {
    if (checking || !navigator.onLine || document.visibilityState === "hidden") return;
    checking = true;
    try { await registration.update(); }
    catch (error) { onError(error); }
    finally { checking = false; }
  };
  const foreground = () => { void check(); };
  window.addEventListener("online", foreground);
  window.addEventListener("pageshow", foreground);
  window.addEventListener("focus", foreground);
  document.addEventListener("visibilitychange", foreground);
  const interval = window.setInterval(foreground, UPDATE_INTERVAL);
  void check();
  return () => {
    clearInterval(interval);
    window.removeEventListener("online", foreground);
    window.removeEventListener("pageshow", foreground);
    window.removeEventListener("focus", foreground);
    document.removeEventListener("visibilitychange", foreground);
  };
}
export function canApplyUpdate(screen: string, saving: boolean, saveLoaded: boolean, error: string): boolean {
  return saveLoaded && !saving && !error && ["home", "collection", "credits", "celebrate"].includes(screen);
}
