import { Box, Text, Group, Badge } from '@mantine/core';
import type { EventEntry, EntitySummary, EventsSchemaMsg } from '../types/protocol';
import { decodeBincode } from '../lib/bincode';
import { JsonView } from './JsonView';
import { SLUG_COLORS } from './eventShared';
import { EntityRef } from './EntityRef';

interface EventDetailProps {
  event: EventEntry;
  entities: EntitySummary[];
  eventSchemas: Map<string, EventsSchemaMsg>;
  onSelectEntity: (index: number) => void;
}

function EventSchemaHint({ schema }: { schema: EventsSchemaMsg | undefined }) {
  if (!schema) return null;
  const fields = schema.schema?.layout?.fields;
  const kind = schema.schema?.layout?.kind;
  const desc = schema.description;

  return (
    <Group gap={6} wrap="wrap" px="sm" py={6}>
      {desc && (
        <Text size="xs" style={{ color: '#6b7280', fontStyle: 'italic', marginRight: 8 }}>{desc}</Text>
      )}
      {kind === 'unit' && (
        <Badge size="xs" color="dark" variant="light" tt="none" style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: 9 }}>
          unit (no payload)
        </Badge>
      )}
      {fields?.map((f) => (
        <Group key={f.name} gap={4} style={{ background: '#1a1d23', borderRadius: 4, padding: '2px 8px', border: '1px solid #2a2d35' }}>
          <Text size="xs" style={{ color: '#9ca3af', fontFamily: 'monospace' }}>{f.name}</Text>
          <Text size="xs" style={{ color: '#4b5563', fontFamily: 'monospace' }}>{f.type}</Text>
        </Group>
      ))}
    </Group>
  );
}

function DecodedPayload({ event, schema }: { event: EventEntry; schema: EventsSchemaMsg | undefined }) {
  const kind = schema?.schema?.layout?.kind;

  if (kind === 'unit') {
    return (
      <Text size="xs" style={{ color: '#4b5563', fontStyle: 'italic' }}>
        no payload
      </Text>
    );
  }

  const fields = schema?.schema?.layout?.fields;
  if (!fields) {
    return (
      <Box p="sm" style={{ background: '#0f1115', borderRadius: 6, border: '1px solid #252830' }}>
        <JsonView data={event.payload} />
      </Box>
    );
  }

  const decoded = decodeBincode(event.payload, fields);
  return (
    <Box p="sm" style={{ background: '#0f1115', borderRadius: 6, border: '1px solid #252830' }}>
      <JsonView data={decoded ?? event.payload} />
    </Box>
  );
}

export function EventDetail({ event, entities, eventSchemas, onSelectEntity }: EventDetailProps) {
  const slugStyle = SLUG_COLORS[event.slug] || { bg: '#37415144', text: '#9ca3af', glow: 'none' };
  const schema = eventSchemas.get(event.slug);

  return (
    <Box style={{ height: '100%', background: '#14161c', display: 'flex', flexDirection: 'column' }}>
      <Box px="sm" py={8} style={{ background: '#1a1d23', borderBottom: '1px solid #2a2d35' }}>
        <Group gap="sm" wrap="nowrap">
          <Badge
            size="sm"
            variant="filled"
            tt="none"
            radius={3}
            style={{
              background: slugStyle.bg,
              color: slugStyle.text,
              boxShadow: `0 0 8px ${slugStyle.glow}`,
              fontFamily: 'monospace',
            }}
          >
            {event.slug}
          </Badge>
          <Text size="xs" style={{ color: '#4b5563', fontFamily: 'monospace' }}>#{event.id}</Text>
        </Group>
      </Box>

      <Box style={{ flex: 1, overflow: 'auto' }}>
        <EventSchemaHint schema={schema} />

        <StackFields event={event} entities={entities} onSelectEntity={onSelectEntity} />

        <Box px="sm" py="sm">
          <Text size="xs" fw={600} mb={6} style={{ color: '#6b7280', letterSpacing: 1, textTransform: 'uppercase', fontSize: 10 }}>
            Payload
          </Text>
          <DecodedPayload event={event} schema={schema} />
        </Box>
      </Box>
    </Box>
  );
}

function StackFields({
  event,
  entities,
  onSelectEntity,
}: {
  event: EventEntry;
  entities: EntitySummary[];
  onSelectEntity: (index: number) => void;
}) {
  const rows = [
    { label: 'time', value: <Text size="xs" ff="monospace" style={{ color: '#d1d5db' }}>{event.time.toFixed(3)}s</Text> },
    { label: 'codec', value: <Text size="xs" ff="monospace" style={{ color: '#d1d5db' }}>{event.codec}</Text> },
  ];

  if (event.targetEdict !== null) {
    rows.push({
      label: 'target',
      value: <EntityRef edict={event.targetEdict} entities={entities} onSelect={onSelectEntity} />,
    });
  }

  return (
    <Box px="sm" py="xs">
      {rows.map((row, i) => (
        <Group
          key={row.label}
          justify="space-between"
          wrap="nowrap"
          px="sm"
          py={6}
          style={{ background: i % 2 === 0 ? '#14161c' : '#181b21', borderRadius: 4 }}
        >
          <Text size="xs" style={{ color: '#6b7280' }}>{row.label}</Text>
          {row.value}
        </Group>
      ))}
    </Box>
  );
}
