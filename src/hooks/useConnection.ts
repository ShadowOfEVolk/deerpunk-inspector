import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { JsonRpcClient } from '../lib/jsonrpc';
import {
  extractListRows,
  findSlugCatalog,
  hasCatalogMode,
  hasStreamMode,
  rpcCatalogUpdate,
  rpcList,
  rpcNotify,
  rpcSubscribe,
  streamUsesSlugFilter,
  type CollectionRow,
} from '../lib/collectionWire';
import { loadStreamFilter, saveStreamFilter } from '../lib/streamFilter';
import {
  RPC,
  type ConnectionState,
  type ConnectionParams,
  type SchemaDef,
  type InitializeResult,
  type CollectionDescriptor,
} from '../types/protocol';

export interface CompIcon {
  icon?: string;
  icon_color?: string;
}

const MAX_STREAM_ROWS = 2000;
const PROTO_VERSION = 1;

function appendStreamRow(prev: CollectionRow[], row: CollectionRow, idField: string): CollectionRow[] {
  const id = row[idField];
  if (id != null && prev.some((e) => e[idField] === id)) return prev;
  const next = [...prev, row];
  return next.length > MAX_STREAM_ROWS ? next.slice(-MAX_STREAM_ROWS) : next;
}

function rowsToCatalogMap(rows: CollectionRow[], idField: string): Map<string, CollectionRow> {
  const map = new Map<string, CollectionRow>();
  for (const row of rows) {
    map.set(String(row[idField] ?? ''), row);
  }
  return map;
}

function registerHandlers(rpc: JsonRpcClient, cols: CollectionDescriptor[], onStream: (id: string, row: CollectionRow) => void, onCatalog: (id: string, row: CollectionRow) => void) {
  for (const col of cols) {
    if (hasStreamMode(col)) {
      rpc.on(rpcNotify(col.id), (params) => onStream(col.id, params as CollectionRow));
    }
    if (hasCatalogMode(col)) {
      rpc.on(rpcCatalogUpdate(col.id), (params) => onCatalog(col.id, params as CollectionRow));
    }
  }
}

export function useConnection(params: ConnectionParams) {
  const [state, setState] = useState<ConnectionState>('disconnected');
  const [collections, setCollections] = useState<CollectionDescriptor[]>([]);
  const [serverName, setServerName] = useState<string | null>(null);
  const [catalogRows, setCatalogRows] = useState<Record<string, CollectionRow[]>>({});
  const [listRows, setListRows] = useState<Record<string, CollectionRow[]>>({});
  const [streamRows, setStreamRows] = useState<Record<string, CollectionRow[]>>({});
  const [streamFilters, setStreamFiltersState] = useState<Record<string, Set<string>>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const rpcRef = useRef<JsonRpcClient | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const wantsReconnectRef = useRef(true);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const cleanup = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    rpcRef.current?.rejectAll('disconnected');
    rpcRef.current = null;
    const ws = wsRef.current;
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
      wsRef.current = null;
    }
  }, []);

  const applyStreamFilter = useCallback(
    async (rpc: JsonRpcClient, cols: CollectionDescriptor[], stream: CollectionDescriptor, filter: Set<string>) => {
      const slugCatalog = findSlugCatalog(cols);
      if (streamUsesSlugFilter(stream, slugCatalog) && slugCatalog) {
        await rpc.call(rpcSubscribe(stream.id), { slugs: [...filter].sort() });
        return;
      }
      await rpc.call(rpcSubscribe(stream.id), {});
    },
    [],
  );

  const setStreamFilter = useCallback(
    (collectionId: string, next: Set<string>) => {
      saveStreamFilter(collectionId, next);
      setStreamFiltersState((prev) => ({ ...prev, [collectionId]: new Set(next) }));
      const rpc = rpcRef.current;
      const stream = collections.find((c) => c.id === collectionId);
      if (rpc && wsRef.current?.readyState === WebSocket.OPEN && stream) {
        void applyStreamFilter(rpc, collections, stream, next);
      }
    },
    [applyStreamFilter, collections],
  );

  const toggleStreamFilterKey = useCallback(
    (collectionId: string, key: string, enabled: boolean) => {
      setStreamFiltersState((prev) => {
        const current = new Set(prev[collectionId] ?? []);
        if (enabled) current.add(key);
        else current.delete(key);
        saveStreamFilter(collectionId, current);
        const rpc = rpcRef.current;
        const stream = collections.find((c) => c.id === collectionId);
        if (rpc && wsRef.current?.readyState === WebSocket.OPEN && stream) {
          void applyStreamFilter(rpc, collections, stream, current);
        }
        return { ...prev, [collectionId]: current };
      });
    },
    [applyStreamFilter, collections],
  );

  const bootstrapCollections = useCallback(
    async (rpc: JsonRpcClient, cols: CollectionDescriptor[], capabilities?: Record<string, boolean>) => {
      const catalogs: Record<string, CollectionRow[]> = {};
      for (const col of cols) {
        if (!hasCatalogMode(col)) continue;
        const result = await rpc.call(rpcList(col.id));
        catalogs[col.id] = extractListRows(result);
      }
      setCatalogRows(catalogs);

      const slugCatalog = findSlugCatalog(cols);
      const filters: Record<string, Set<string>> = {};
      for (const col of cols) {
        if (!hasStreamMode(col)) continue;
        if (streamUsesSlugFilter(col, slugCatalog) && slugCatalog) {
          const keys = catalogs[slugCatalog.id]?.map((r) => String(r[slugCatalog.idField] ?? '')) ?? [];
          filters[col.id] = loadStreamFilter(col.id, keys);
        }
      }
      setStreamFiltersState(filters);

      for (const col of cols) {
        if (!hasStreamMode(col)) continue;
        const capKey = `${col.id}Stream`;
        if (capabilities && capabilities[capKey] === false) continue;
        await applyStreamFilter(rpc, cols, col, filters[col.id] ?? new Set());
      }
    },
    [applyStreamFilter],
  );

  const connect = useCallback(() => {
    if (wsRef.current) return;
    wantsReconnectRef.current = true;

    const { host, port } = paramsRef.current;
    setState('connecting');
    setCollections([]);
    setServerName(null);
    setCatalogRows({});
    setListRows({});
    setStreamRows({});
    setStreamFiltersState({});

    const ws = new WebSocket(`ws://${host}:${port}`);
    wsRef.current = ws;

    const rpc = new JsonRpcClient((payload) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    });
    rpcRef.current = rpc;

    ws.onmessage = (ev) => {
      rpc.handleMessage(String(ev.data));
    };

    ws.onopen = () => {
      void (async () => {
        try {
          setState('handshaking');
          const result = (await rpc.call(RPC.initialize, {
            proto: PROTO_VERSION,
            client: 'deerpunk-inspector',
            clientVersion: '0.1.0',
          })) as InitializeResult;

          setCollections(result.collections);
          setServerName(result.server);
          rpc.notify(RPC.initialized);

          registerHandlers(
            rpc,
            result.collections,
            (id, row) => {
              const desc = result.collections.find((c) => c.id === id);
              const idField = desc?.idField ?? 'id';
              setStreamRows((prev) => ({
                ...prev,
                [id]: appendStreamRow(prev[id] ?? [], row, idField),
              }));
            },
            (id, row) => {
              const desc = result.collections.find((c) => c.id === id);
              const idField = desc?.idField ?? 'id';
              const key = String(row[idField] ?? '');
              setCatalogRows((prev) => {
                const rows = [...(prev[id] ?? [])];
                const idx = rows.findIndex((r) => String(r[idField] ?? '') === key);
                if (idx >= 0) rows[idx] = { ...rows[idx], ...row };
                else rows.push(row);
                return { ...prev, [id]: rows };
              });
            },
          );

          await bootstrapCollections(rpc, result.collections, result.capabilities);
          setState('connected');
        } catch {
          setState('error');
        }
      })();
    };

    ws.onerror = () => setState('error');

    ws.onclose = () => {
      rpc.rejectAll('disconnected');
      rpcRef.current = null;
      wsRef.current = null;
      setState('disconnected');
    };
  }, [bootstrapCollections]);

  const disconnect = useCallback(() => {
    wantsReconnectRef.current = false;
    cleanup();
    setState('disconnected');
  }, [cleanup]);

  const reconnect = useCallback(() => {
    wantsReconnectRef.current = true;
    cleanup();
    setTimeout(connect, 100);
  }, [cleanup, connect]);

  const call = useCallback(async <T = unknown>(method: string, params?: unknown): Promise<T> => {
    const rpc = rpcRef.current;
    if (!rpc) throw new Error('not connected');
    return (await rpc.call(method, params)) as T;
  }, []);

  const refreshList = useCallback(
    async (collectionId: string) => {
      const result = await call(rpcList(collectionId));
      const rows = extractListRows(result);
      setListRows((prev) => ({ ...prev, [collectionId]: rows }));
      return rows;
    },
    [call],
  );

  const getDescriptor = useCallback(
    (id: string) => collections.find((c) => c.id === id),
    [collections],
  );

  const getCatalogMap = useCallback(
    (collectionId: string) => {
      const desc = getDescriptor(collectionId);
      if (!desc) return new Map<string, CollectionRow>();
      return rowsToCatalogMap(catalogRows[collectionId] ?? [], desc.idField);
    },
    [catalogRows, getDescriptor],
  );

  const componentSchemas = useMemo(() => {
    const map = new Map<string, SchemaDef>();
    for (const col of collections) {
      if (!hasCatalogMode(col)) continue;
      for (const row of catalogRows[col.id] ?? []) {
        const key = String(row[col.idField] ?? '');
        if (key && row.schema != null) map.set(key, row.schema as SchemaDef);
      }
    }
    return map;
  }, [catalogRows, collections]);

  const compIcons = useMemo(() => {
    const map = new Map<string, CompIcon>();
    for (const col of collections) {
      if (!hasCatalogMode(col)) continue;
      for (const row of catalogRows[col.id] ?? []) {
        const key = String(row[col.idField] ?? '');
        if (!key || (!row.icon && !row.icon_color)) continue;
        map.set(key, { icon: row.icon as string, icon_color: row.icon_color as string });
      }
    }
    return map;
  }, [catalogRows, collections]);

  useEffect(() => {
    connect();
    return () => {
      wantsReconnectRef.current = false;
      cleanup();
    };
  }, [connect, cleanup]);

  useEffect(() => {
    if (state === 'disconnected' && wantsReconnectRef.current) {
      reconnectTimer.current = setTimeout(connect, 1000);
      return () => clearTimeout(reconnectTimer.current);
    }
  }, [state, connect]);

  return useMemo(
    () => ({
      state,
      serverName,
      collections,
      catalogRows,
      listRows,
      streamRows,
      streamFilters,
      componentSchemas,
      compIcons,
      setStreamFilter,
      toggleStreamFilterKey,
      call,
      refreshList,
      getDescriptor,
      getCatalogMap,
      connect,
      disconnect,
      reconnect,
    }),
    [
      state,
      serverName,
      collections,
      catalogRows,
      listRows,
      streamRows,
      streamFilters,
      componentSchemas,
      compIcons,
      setStreamFilter,
      toggleStreamFilterKey,
      call,
      refreshList,
      getDescriptor,
      getCatalogMap,
      connect,
      disconnect,
      reconnect,
    ],
  );
}
