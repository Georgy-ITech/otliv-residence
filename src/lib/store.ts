import { useSyncExternalStore } from "react";

/*
  Избранное и сравнение — в localStorage этого браузера. Это удобство посетителя,
  а не данные: при закрытом хранилище всё работает до перезагрузки.
*/
type Key = "fav" | "cmp";
const KEY = (k: Key) => `otliv-residence:${k}`;
const MAX_CMP = 3;

const state: Record<Key, string[]> = { fav: read("fav"), cmp: read("cmp") };
const subs = new Set<() => void>();

function read(k: Key): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY(k)) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function write(k: Key, next: string[]) {
  state[k] = next;
  try {
    localStorage.setItem(KEY(k), JSON.stringify(next));
  } catch {
    // приватный режим — выбор живёт до перезагрузки
  }
  subs.forEach((f) => f());
}

export function toggle(k: Key, id: string) {
  const cur = state[k];
  if (cur.includes(id)) write(k, cur.filter((x) => x !== id));
  else write(k, k === "cmp" ? [...cur, id].slice(-MAX_CMP) : [...cur, id]);
}
export function clear(k: Key) {
  write(k, []);
}

export function useList(k: Key) {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => state[k],
  );
}
