import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { StatusBar } from './components/StatusBar';
import { DetailPane } from './components/DetailPane';
import { CollectionRail, type CollectionId } from './components/CollectionRail';
import { useConnection } from './hooks/useConnection';
import { COLLECTIONS } from './collections/registry';
import { EntitiesCollection, type EntitiesCollectionHandle } from './collections/entities';
import { EventsCollection } from './collections/events';
import { ComponentDefsCollection, EntityDefsCollection, EventDefsCollection } from './collections/definitions';
import type { InspectorSelection } from './collections/types';
import type { ConnectionParams, EntitySummary } from './types/protocol';

const REFRESH_OPTIONS = [
  { value: 0, label: '—' },
  { value: 500, label: '½s' },
  { value: 250, label: '¼s' },
  { value: 200, label: '⅕s' },
  { value: 1000, label: '1s' },
];

function getParams(): ConnectionParams {
  const p = new URLSearchParams(window.location.search);
  return {
    host: p.get('host') || '127.0.0.1',
    port: Number(p.get('port')) || 9000,
  };
}

export function App() {
  const params = useMemo(() => getParams(), []);
  const conn = useConnection(params);

  const [collection, setCollection] = useState<CollectionId>('entities');
  const [selection, setSelection] = useState<InspectorSelection>(null);
  const [entitySummaries, setEntitySummaries] = useState<EntitySummary[]>([]);
  const [eventsSeenAt, setEventsSeenAt] = useState(0);
  const [refreshMs, setRefreshMs] = useState(1000);
  const entitiesRef = useRef<EntitiesCollectionHandle>(null);

  const badges = useMemo(() => {
    const out: Partial<Record<CollectionId, number>> = {};
    for (const plugin of COLLECTIONS) {
      if (plugin.badge) {
        out[plugin.id] = plugin.badge({
          conn,
          active: collection === plugin.id,
          seenAt: eventsSeenAt,
        });
      }
    }
    return out;
  }, [conn, collection, eventsSeenAt, conn.events.length]);

  useEffect(() => {
    if (collection === 'events') setEventsSeenAt(conn.events.length);
  }, [collection, conn.events.length]);

  const handleCollectionChange = useCallback((id: CollectionId) => {
    setCollection(id);
    setSelection(null);
  }, []);

  const handleNavigate = useCallback((id: CollectionId, payload?: { selectEntity?: number }) => {
    setCollection(id);
    if (payload?.selectEntity != null) {
      setSelection(null);
      setTimeout(() => entitiesRef.current?.select(payload.selectEntity!), 0);
    }
  }, []);

  const panelProps = {
    conn,
    active: true,
    onSelect: setSelection,
    onNavigate: handleNavigate,
    entitySummaries,
    onEntitySummaries: setEntitySummaries,
  };

  const renderCollection = () => {
    switch (collection) {
      case 'entities':
        return <EntitiesCollection ref={entitiesRef} {...panelProps} refreshMs={refreshMs} />;
      case 'events':
        return <EventsCollection {...panelProps} />;
      case 'component-defs':
        return <ComponentDefsCollection {...panelProps} />;
      case 'entity-defs':
        return <EntityDefsCollection {...panelProps} />;
      case 'event-defs':
        return <EventDefsCollection {...panelProps} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1e1e1e' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <CollectionRail active={collection} onChange={handleCollectionChange} badges={badges} />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Allotment defaultSizes={[42, 58]} separator>
            <Allotment.Pane minSize={240}>{renderCollection()}</Allotment.Pane>
            <Allotment.Pane minSize={360}>
              <DetailPane
                selection={selection}
                conn={conn}
                entitySummaries={entitySummaries}
                onSelectEntity={(index) => handleNavigate('entities', { selectEntity: index })}
              />
            </Allotment.Pane>
          </Allotment>
        </div>
      </div>
      <StatusBar
        state={conn.state}
        host={params.host}
        port={params.port}
        onRefresh={() => entitiesRef.current?.refresh()}
        onReconnect={conn.reconnect}
        refreshMs={refreshMs}
        onRefreshChange={setRefreshMs}
        refreshOptions={REFRESH_OPTIONS}
      />
    </div>
  );
}
