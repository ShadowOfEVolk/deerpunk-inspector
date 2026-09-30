import { useState, useEffect, useRef, useCallback } from 'react';
import type { ConnectionState, ServerMsg, ConnectionParams, SchemaDef, EventEntry, EventsSchemaMsg, EntitySchemaMsg } from '../types/protocol';

export interface CompIcon {
  icon?: string;
  icon_color?: string;
}

const MAX_EVENTS = 2000;

export function useConnection(params: ConnectionParams) {
  const [state, setState] = useState<ConnectionState>('disconnected');
  const [lastMsg, setLastMsg] = useState<ServerMsg | null>(null);
  const [schemas, setSchemas] = useState<Map<string, SchemaDef>>(new Map());
  const [compIcons, setCompIcons] = useState<Map<string, CompIcon>>(new Map());
  const [eventSchemas, setEventSchemas] = useState<Map<string, EventsSchemaMsg>>(new Map());
  const [entitySchemas, setEntitySchemas] = useState<Map<string, EntitySchemaMsg>>(new Map());
  const [events, setEvents] = useState<EventEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const wantsReconnectRef = useRef(true);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const cleanup = useCallback(() => {
    clearTimeout(reconnectTimer.current);
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

  const connect = useCallback(() => {
    if (wsRef.current) return;
    wantsReconnectRef.current = true;

    const { host, port } = paramsRef.current;
    setState('connecting');
    setSchemas(new Map());
    setCompIcons(new Map());
    setEventSchemas(new Map());
    setEntitySchemas(new Map());
    setEvents([]);

    const ws = new WebSocket(`ws://${host}:${port}`);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try {
        const msg: ServerMsg = JSON.parse(ev.data);

        if (msg.type === 'hello') {
          setState('connected');
        } else if (msg.type === 'components.schema') {
          setSchemas((prev) => {
            const next = new Map(prev);
            next.set(msg.slug, msg.schema);
            return next;
          });
          if (msg.icon || msg.icon_color) {
            setCompIcons((prev) => {
              const next = new Map(prev);
              next.set(msg.slug, { icon: msg.icon, icon_color: msg.icon_color });
              return next;
            });
          }
        } else if (msg.type === 'entity.schema') {
          setEntitySchemas((prev) => {
            const next = new Map(prev);
            next.set(msg.id, msg);
            return next;
          });
        } else if (msg.type === 'events.schema') {
          setEventSchemas((prev) => {
            const next = new Map(prev);
            next.set(msg.slug, msg);
            return next;
          });
        } else if (msg.type === 'events.one') {
          const entry: EventEntry = {
            id: msg.id,
            slug: msg.slug,
            time: msg.time,
            targetEdict: msg.target_edict,
            codec: msg.codec,
            payload: msg.payload,
          };
          setEvents((prev) => {
            const next = [...prev, entry];
            return next.length > MAX_EVENTS ? next.slice(-MAX_EVENTS) : next;
          });
        }

        setLastMsg(msg);
      } catch {
        // non-json, ignore
      }
    };

    ws.onerror = () => {
      setState('error');
    };

    ws.onclose = () => {
      wsRef.current = null;
      setState('disconnected');
    };
  }, []);

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

  const send = useCallback((cmd: Record<string, unknown> | string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof cmd === 'string' ? cmd : JSON.stringify(cmd));
    }
  }, []);

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

  return { state, lastMsg, schemas, compIcons, entitySchemas, eventSchemas, events, send, connect, disconnect, reconnect };
}
