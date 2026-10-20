import { CATALOG } from "./catalog";

export async function checkOfflineReady(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("caches" in window) || !import.meta.env.PROD) return false;
  const registration = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL);
  if (!registration?.active) return false;
  const base = new URL(import.meta.env.BASE_URL, location.origin);
  const urls = [
    base.href,
    new URL("index.html", base).href,
    new URL("sharklication-logo.png", base).href,
    new URL("sharklication-header.webp", base).href,
    ...CATALOG.flatMap((s) => s.photo ? [new URL(s.photo.localPath, base).href] : []),
    ...Array.from(document.querySelectorAll<HTMLScriptElement>("script[src]")).map((s) => s.src),
    ...Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map((s) => s.href),
  ];
  // Workbox precaches the document as index.html, not the directory alias.
  const required = urls.filter((url) => url !== base.href);
  const matches = await Promise.all(required.map((url) => caches.match(url, { ignoreSearch: true })));
  return matches.every(Boolean);
}
