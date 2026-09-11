import "server-only";

/** Small LRU of decoded preview bytes so repeated plays don't hit Apple's CDN. */
const MAX = 40;
const cache = new Map<string, { bytes: ArrayBuffer; type: string }>();
const inflight = new Map<string, Promise<{ bytes: ArrayBuffer; type: string }>>();

export async function fetchPreview(url: string) {
  const hit = cache.get(url);
  if (hit) {
    cache.delete(url);
    cache.set(url, hit);
    return hit;
  }
  const running = inflight.get(url);
  if (running) return running;
  const task = (async () => {
    const res = await fetch(url, { cache: "no-store", headers: { "user-agent": "music-guessr/1.0" } });
    if (!res.ok) throw new Error(`No audio preview (${res.status})`);
    const bytes = await res.arrayBuffer();
    const type = res.headers.get("content-type") ?? "audio/mp4";
    cache.set(url, { bytes, type });
    if (cache.size > MAX) cache.delete(cache.keys().next().value!);
    return { bytes, type };
  })().finally(() => inflight.delete(url));
  inflight.set(url, task);
  return task;
}
