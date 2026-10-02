import type { CollectionDescriptor } from '../types/protocol';

export type CollectionRow = Record<string, unknown>;

export function rpcList(id: string): string {
  return `${id}.list`;
}

export function rpcGet(id: string): string {
  return `${id}.get`;
}

export function rpcSubscribe(id: string): string {
  return `${id}.subscribe`;
}

export function rpcNotify(id: string): string {
  return id === 'events' ? 'events.onEvent' : `${id}.onEntry`;
}

export function rpcCatalogUpdate(id: string): string {
  return `${id}.onUpdate`;
}

export function extractListRows(result: unknown): CollectionRow[] {
  if (!result || typeof result !== 'object') return [];
  for (const value of Object.values(result as Record<string, unknown>)) {
    if (Array.isArray(value)) return value as CollectionRow[];
  }
  return [];
}

export function rowId(row: CollectionRow, idField: string): string | number {
  const value = row[idField];
  if (typeof value === 'string' || typeof value === 'number') return value;
  return String(value ?? '');
}

export function groupCollections(collections: CollectionDescriptor[]) {
  return {
    runtime: collections.filter((c) => c.group === 'runtime'),
    definitions: collections.filter((c) => c.group === 'definitions'),
  };
}

export function findSlugCatalog(collections: CollectionDescriptor[]): CollectionDescriptor | undefined {
  return collections.find((c) => c.modes.includes('catalog') && c.idField === 'slug');
}

export function streamUsesSlugFilter(
  stream: CollectionDescriptor,
  slugCatalog: CollectionDescriptor | undefined,
): boolean {
  return Boolean(slugCatalog && stream.modes.includes('stream') && stream.idField === 'id');
}

export function hasListMode(descriptor: CollectionDescriptor): boolean {
  return descriptor.modes.includes('list');
}

export function hasGetMode(descriptor: CollectionDescriptor): boolean {
  return descriptor.modes.includes('get');
}

export function hasStreamMode(descriptor: CollectionDescriptor): boolean {
  return descriptor.modes.includes('stream');
}

export function hasCatalogMode(descriptor: CollectionDescriptor): boolean {
  return descriptor.modes.includes('catalog');
}

export function findCatalogRow(
  catalogRows: Record<string, CollectionRow[]>,
  collections: CollectionDescriptor[],
  key: string,
): CollectionRow | undefined {
  for (const col of collections) {
    if (!col.modes.includes('catalog')) continue;
    const match = (catalogRows[col.id] ?? []).find((r) => String(r[col.idField] ?? '') === key);
    if (match) return match;
  }
  return undefined;
}
