import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { StatusBar } from './components/StatusBar';
import { DetailPane } from './components/DetailPane';
import { CollectionRail } from './components/CollectionRail';
import { CollectionPanel, type CollectionPanelHandle } from './components/CollectionPanel';
import { useConnection } from './hooks/useConnection';
import { groupCollections, hasListMode } from './lib/collectionWire';
import type { InspectorSelection } from './types/protocol';
import type { ConnectionParams } from './types/protocol';

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

  const collectionGroups = useMemo(() => groupCollections(conn.collections), [conn.collections]);
  const defaultCollection = conn.collections[0]?.id ?? '';

  const [activeCollectionId, setActiveCollectionId] = useState(defaultCollection);
  const [selection, setSelection] = useState<InspectorSelection | null>(null);
  const [streamSeenAt, setStreamSeenAt] = useState<Record<string, number>>({});
  const [refreshMs, setRefreshMs] = useState(1000);
  const panelRef = useRef<CollectionPanelHandle>(null);

  const activeDescriptor = useMemo(
    () => conn.collections.find((c) => c.id === activeCollectionId),
    [conn.collections, activeCollectionId],
  );

  const entityLookup = useMemo(() => {
    const entityCol = conn.collections.find((c) => c.modes.includes('list') && c.modes.includes('get'));
    return entityCol ? conn.listRows[entityCol.id] ?? [] : [];
  }, [conn.collections, conn.listRows]);

  useEffect(() => {
    if (conn.collections.length > 0 && !conn.collections.some((c) => c.id === activeCollectionId)) {
      setActiveCollectionId(conn.collections[0].id);
      setSelection(null);
    }
  }, [conn.collections, activeCollectionId]);

  const badges = useMemo(() => {
    const out: Record<string, number> = {};
    for (const col of conn.collections) {
      if (!col.modes.includes('stream')) continue;
      const count = conn.streamRows[col.id]?.length ?? 0;
      const seen = streamSeenAt[col.id] ?? 0;
      out[col.id] = activeCollectionId === col.id ? 0 : Math.max(0, count - seen);
    }
    return out;
  }, [conn.collections, conn.streamRows, streamSeenAt, activeCollectionId]);

  useEffect(() => {
    if (!activeDescriptor?.modes.includes('stream')) return;
    const count = conn.streamRows[activeDescriptor.id]?.length ?? 0;
    setStreamSeenAt((prev) => ({ ...prev, [activeDescriptor.id]: count }));
  }, [activeCollectionId, activeDescriptor, conn.streamRows]);

  const handleCollectionChange = useCallback((id: string) => {
    setActiveCollectionId(id);
    setSelection(null);
  }, []);

  const handleNavigate = useCallback((collectionId: string, payload?: { selectRow?: string | number }) => {
    setActiveCollectionId(collectionId);
    if (payload?.selectRow != null) {
      setSelection(null);
      setTimeout(() => panelRef.current?.selectRow(payload.selectRow!), 0);
    }
  }, []);

  const entityCollection = conn.collections.find((c) => c.modes.includes('get') && c.modes.includes('list'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1e1e1e' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <CollectionRail
          groups={collectionGroups}
          active={activeCollectionId}
          onChange={handleCollectionChange}
          badges={badges}
        />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Allotment defaultSizes={[62, 38]} separator>
            <Allotment.Pane minSize={280}>
              {activeDescriptor ? (
                <CollectionPanel
                  ref={panelRef}
                  descriptor={activeDescriptor}
                  conn={conn}
                  refreshMs={hasListMode(activeDescriptor) ? refreshMs : 0}
                  onSelect={setSelection}
                  onNavigate={handleNavigate}
                  entityLookup={entityLookup}
                />
              ) : null}
            </Allotment.Pane>
            <Allotment.Pane minSize={300}>
              <DetailPane
                selection={selection}
                conn={conn}
                entityLookup={entityLookup}
                onNavigateEntity={(index) => {
                  if (entityCollection) handleNavigate(entityCollection.id, { selectRow: index });
                }}
              />
            </Allotment.Pane>
          </Allotment>
        </div>
      </div>
      <StatusBar
        state={conn.state}
        host={params.host}
        port={params.port}
        onRefresh={() => panelRef.current?.refresh()}
        onReconnect={conn.reconnect}
        refreshMs={refreshMs}
        onRefreshChange={setRefreshMs}
        refreshOptions={REFRESH_OPTIONS}
      />
    </div>
  );
}
