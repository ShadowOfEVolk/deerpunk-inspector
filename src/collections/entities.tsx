import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { EntityList } from '../components/EntityList';
import type { EntitySummary } from '../types/protocol';
import { inspectableFromEntityOne } from '../types/protocol';
import type { CollectionPanelProps } from './types';

export interface EntitiesCollectionHandle {
  refresh: () => void;
  select: (index: number) => void;
}

interface EntitiesCollectionProps extends CollectionPanelProps {
  refreshMs: number;
}

export const EntitiesCollection = forwardRef<EntitiesCollectionHandle, EntitiesCollectionProps>(
  function EntitiesCollection({ conn, refreshMs, onSelect, onEntitySummaries }, ref) {
    const [entities, setEntities] = useState<EntitySummary[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const selectedIndexRef = useRef<number | null>(null);
    const refreshTimer = useRef<ReturnType<typeof setInterval>>();

    const fetchOne = useCallback((index: number) => {
      conn.send({ cmd: 'entities.get_one', index });
    }, [conn.send]);

    const refresh = useCallback(() => {
      conn.send({ cmd: 'entities.get_list' });
      if (selectedIndexRef.current !== null) fetchOne(selectedIndexRef.current);
    }, [conn.send, fetchOne]);

    const select = useCallback((index: number) => {
      selectedIndexRef.current = index;
      setSelectedIndex(index);
      onSelect(null);
      fetchOne(index);
    }, [fetchOne, onSelect]);

    useImperativeHandle(ref, () => ({ refresh, select }), [refresh, select]);

    useEffect(() => {
      if (!conn.lastMsg) return;
      const msg = conn.lastMsg;
      if (msg.type === 'entities.list') {
        setEntities(msg.entities);
        onEntitySummaries(msg.entities);
      } else if (msg.type === 'entities.one') {
        setSelectedIndex(msg.index);
        selectedIndexRef.current = msg.index;
        onSelect({ kind: 'inspectable', container: inspectableFromEntityOne(msg) });
      }
    }, [conn.lastMsg, onSelect, onEntitySummaries]);

    useEffect(() => {
      if (conn.state === 'connected') conn.send({ cmd: 'entities.get_list' });
    }, [conn.state, conn.send]);

    useEffect(() => {
      clearInterval(refreshTimer.current);
      if (refreshMs > 0) {
        refreshTimer.current = setInterval(refresh, refreshMs);
      }
      return () => clearInterval(refreshTimer.current);
    }, [refreshMs, refresh]);

    return (
      <EntityList
        entities={entities}
        entitySchemas={conn.entitySchemas}
        selected={selectedIndex}
        onSelect={select}
      />
    );
  },
);
