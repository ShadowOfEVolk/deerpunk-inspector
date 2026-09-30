import { useState, useRef, useEffect } from 'react';
import { Box, Text, Group, Badge, ScrollArea, TextInput } from '@mantine/core';
import type { EventEntry, EntitySummary, EventsSchemaMsg, EventFieldDef } from '../types/protocol';
import { decodeBincode } from '../lib/bincode';
import { SLUG_COLORS, formatVal } from './eventShared';
import { EntityRef } from './EntityRef';

interface EventListProps {
  events: EventEntry[];
  entities: EntitySummary[];
  eventSchemas: Map<string, EventsSchemaMsg>;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onSelectEntity: (index: number) => void;
}

function DecodedInline({ payload, fields }: { payload: string; fields: EventFieldDef[] }) {
  const decoded = decodeBincode(payload, fields);
  if (!decoded) return <Text size="xs" style={{ color: '#374151', fontFamily: 'monospace', fontSize: 10 }}>…</Text>;

  const keys = Object.keys(decoded);
  return (
    <Group gap={4} wrap="nowrap">
      {keys.slice(0, 4).map((k) => (
        <Text key={k} size="xs" style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: 10 }}>
          <span style={{ color: '#4b5563' }}>{k}:</span>{' '}
          <span style={{ color: '#9ca3af' }}>{formatVal(decoded[k])}</span>
        </Text>
      ))}
      {keys.length > 4 && <Text size="xs" style={{ color: '#374151', fontSize: 10 }}>…</Text>}
    </Group>
  );
}

export function EventList({ events, entities, eventSchemas, selectedId, onSelect, onSelectEntity }: EventListProps) {
  const [filter, setFilter] = useState('');
  const viewportRef = useRef<HTMLDivElement>(null);
  const prevEventsLen = useRef(0);

  const filtered = events.filter(
    (e) => !filter || e.slug.includes(filter) || String(e.targetEdict).includes(filter),
  );

  useEffect(() => {
    if (events.length > prevEventsLen.current && viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
    prevEventsLen.current = events.length;
  }, [events.length]);

  return (
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#14161c' }}>
      <Box p="xs" style={{ background: '#1a1d23', borderBottom: '1px solid #2a2d35' }}>
        <Group justify="space-between" mb={4}>
          <Group gap="sm">
            <Text size="xs" fw={600} style={{ color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', fontSize: 10 }}>
              Events
            </Text>
            <Badge size="xs" color="neon" variant="light" tt="none" style={{ fontSize: 9 }}>
              {filtered.length}
            </Badge>
          </Group>
        </Group>
        <TextInput
          size="xs"
          variant="filled"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.currentTarget.value)}
        />
      </Box>

      <ScrollArea style={{ flex: 1 }} px="sm" viewportRef={viewportRef}>
        {filtered.map((ev) => {
          const slugStyle = SLUG_COLORS[ev.slug] || { bg: '#37415144', text: '#9ca3af', glow: 'none' };
          const isSelected = ev.id === selectedId;
          const fields = eventSchemas.get(ev.slug)?.schema?.layout?.fields;
          return (
            <Box
              key={ev.id}
              style={{
                cursor: 'pointer',
                borderRadius: 4,
                background: isSelected ? '#22d3ee11' : 'transparent',
                borderLeft: isSelected ? '2px solid #22d3ee' : '2px solid transparent',
              }}
              px={4}
              py={3}
              onClick={() => onSelect(ev.id === selectedId ? null : ev.id)}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = '#ffffff06';
                const t = e.currentTarget.querySelector('[data-time]');
                if (t) (t as HTMLElement).style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'transparent';
                const t = e.currentTarget.querySelector('[data-time]');
                if (t) (t as HTMLElement).style.opacity = '0';
              }}
            >
              <Group gap="xs" wrap="nowrap" justify="space-between">
                <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                  <Text size="xs" style={{ color: '#4b5563', fontFamily: 'monospace', width: 40, flexShrink: 0 }}>
                    #{ev.id}
                  </Text>
                  <Badge
                    size="xs"
                    variant="filled"
                    tt="none"
                    radius={3}
                    style={{
                      background: slugStyle.bg,
                      color: slugStyle.text,
                      boxShadow: `0 0 6px ${slugStyle.glow}`,
                      fontFamily: 'monospace',
                      fontSize: 10,
                      flexShrink: 0,
                    }}
                  >
                    {ev.slug}
                  </Badge>
                  {ev.targetEdict !== null && (
                    <EntityRef edict={ev.targetEdict} entities={entities} onSelect={onSelectEntity} />
                  )}
                  {fields && fields.length > 0 && ev.payload && (
                    <>
                      <Text size="xs" style={{ color: '#374151', flexShrink: 0 }}>·</Text>
                      <DecodedInline payload={ev.payload} fields={fields} />
                    </>
                  )}
                </Group>
                <Text
                  data-time
                  size="xs"
                  style={{ color: '#374151', fontFamily: 'monospace', fontSize: 10, opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}
                >
                  {ev.time.toFixed(2)}s
                </Text>
              </Group>
            </Box>
          );
        })}
        {filtered.length === 0 && (
          <Text size="xs" py="xs" style={{ color: '#374151' }}>No events</Text>
        )}
      </ScrollArea>
    </Box>
  );
}
