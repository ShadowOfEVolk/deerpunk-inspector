import { Box, Text, Group, Badge, Stack } from '@mantine/core';
import type { InspectorSelection, InspectableContainer } from '../types/protocol';
import type { useConnection } from '../hooks/useConnection';
import { Inspector } from './Inspector';
import { JsonView } from './JsonView';
import { EntityRef } from './EntityRef';
import { decodeBincode } from '../lib/bincode';
import { formatVal } from './eventShared';
import type { CollectionRow } from '../lib/collectionWire';
import { findCatalogRow, hasGetMode } from '../lib/collectionWire';

function isInspectable(detail: InspectorSelection['detail']): detail is InspectableContainer {
  return Boolean(detail && typeof detail === 'object' && 'components' in detail);
}

function EventLikeDetail({
  row,
  conn,
  entityLookup,
  onNavigateEntity,
}: {
  row: CollectionRow;
  conn: ReturnType<typeof useConnection>;
  entityLookup: CollectionRow[];
  onNavigateEntity: (index: number) => void;
}) {
  const slug = typeof row.slug === 'string' ? row.slug : null;
  const schemaRow = slug ? findCatalogRow(conn.catalogRows, conn.collections, slug) : undefined;
  const fields = (schemaRow?.schema as { layout?: { fields?: { name: string; type: string }[] } })?.layout?.fields;
  const payload = typeof row.payload === 'string' ? row.payload : null;
  const decoded = payload && fields ? decodeBincode(payload, fields) : null;

  return (
    <Stack gap="sm">
      <Group gap="sm">
        {slug && <Badge size="sm">{slug}</Badge>}
        {typeof row.time === 'number' && (
          <Text size="xs" c="dimmed" ff="monospace">t={row.time.toFixed(2)}</Text>
        )}
      </Group>
      {typeof row.target_edict === 'number' && (
        <EntityRef
          edict={row.target_edict}
          entities={entityLookup.map((e) => ({
            index: Number(e.index),
            classname: String(e.classname ?? ''),
          }))}
          onSelect={onNavigateEntity}
        />
      )}
      {decoded ? (
        <Stack gap={4}>
          {Object.entries(decoded).map(([k, v]) => (
            <Text key={k} size="xs" ff="monospace">
              <Text span c="dimmed">{k}: </Text>
              {formatVal(v)}
            </Text>
          ))}
        </Stack>
      ) : payload ? (
        <JsonView data={payload} />
      ) : (
        <JsonView data={row} />
      )}
    </Stack>
  );
}

export function CollectionDetail({
  selection,
  conn,
  entityLookup,
  onNavigateEntity,
}: {
  selection: InspectorSelection;
  conn: ReturnType<typeof useConnection>;
  entityLookup: CollectionRow[];
  onNavigateEntity: (index: number) => void;
}) {
  const descriptor = conn.getDescriptor(selection.collectionId);
  const detail = selection.detail ?? selection.row;

  if (isInspectable(detail)) {
    return (
      <Inspector
        container={detail}
        schemas={conn.componentSchemas}
        compIcons={conn.compIcons}
      />
    );
  }

  const row = selection.row;
  const isEventLike = typeof row.slug === 'string' && (typeof row.payload === 'string' || row.codec != null);

  return (
    <Box p="md" style={{ height: '100%', background: '#090a0c', overflow: 'auto' }}>
      <Text size="xs" fw={600} mb="md" style={{ color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase' }}>
        {descriptor?.label ?? selection.collectionId}
      </Text>
      {isEventLike ? (
        <EventLikeDetail row={row} conn={conn} entityLookup={entityLookup} onNavigateEntity={onNavigateEntity} />
      ) : descriptor && hasGetMode(descriptor) && !selection.detail ? (
        <Text size="sm" c="dimmed">Loading…</Text>
      ) : (
        <JsonView data={detail as Record<string, unknown>} />
      )}
    </Box>
  );
}
