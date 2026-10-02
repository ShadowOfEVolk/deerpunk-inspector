function storageKey(collectionId: string): string {
  return `deerpunk-inspector:streamFilter:${collectionId}`;
}

export function loadStreamFilter(collectionId: string, knownKeys: string[]): Set<string> {
  if (knownKeys.length === 0) return new Set();

  try {
    const raw = localStorage.getItem(storageKey(collectionId));
    if (raw === null) return new Set();
    const saved = JSON.parse(raw) as unknown;
    if (!Array.isArray(saved)) return new Set();
    const enabled = new Set(saved.filter((s): s is string => typeof s === 'string'));
    return new Set(knownKeys.filter((key) => enabled.has(key)));
  } catch {
    return new Set();
  }
}

export function saveStreamFilter(collectionId: string, enabled: Set<string>) {
  localStorage.setItem(storageKey(collectionId), JSON.stringify([...enabled].sort()));
}
