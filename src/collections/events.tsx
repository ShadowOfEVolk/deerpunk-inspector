import { useState } from 'react';
import { EventList } from '../components/EventList';
import type { CollectionPanelProps } from './types';

export function EventsCollection({
  conn,
  entitySummaries,
  onSelect,
  onNavigate,
}: CollectionPanelProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (id: number | null) => {
    setSelectedId(id);
    if (id === null) {
      onSelect(null);
      return;
    }
    const event = conn.events.find((e) => e.id === id);
    if (event) onSelect({ kind: 'event', event });
  };

  return (
    <EventList
      events={conn.events}
      entities={entitySummaries}
      eventSchemas={conn.eventSchemas}
      selectedId={selectedId}
      onSelect={handleSelect}
      onSelectEntity={(index) => onNavigate('entities', { selectEntity: index })}
    />
  );
}

export function eventsBadge({
  conn,
  active,
  seenAt,
}: {
  conn: CollectionPanelProps['conn'];
  active: boolean;
  seenAt: number;
}): number {
  return active ? 0 : Math.max(0, conn.events.length - seenAt);
}
