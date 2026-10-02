import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from 'react';
import { Box, Group, Text, Popover, Checkbox, Button, Stack, ActionIcon } from '@mantine/core';
import { IconAdjustments } from '@tabler/icons-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CollectionTable, cellText } from './CollectionTable';
import { EntityRef } from './EntityRef';
import { CollectionListShell, DefListRow } from './CollectionListShell';
import { Table } from '@mantine/core';
import { formatVal } from './eventShared';
import { getClassnameIcon, getComponentIcon } from '../lib/icons';
import {
  findCatalogRow,
  findSlugCatalog,
  hasCatalogMode,
  hasGetMode,
  hasListMode,
  hasStreamMode,
  rowId,
  rpcGet,
  streamUsesSlugFilter,
  type CollectionRow,
} from '../lib/collectionWire';
import type { CollectionDescriptor, InspectorSelection } from '../types/protocol';
import { inspectableFromGetResult } from '../types/protocol';
import type { useConnection } from '../hooks/useConnection';

export interface CollectionPanelHandle {
  refresh: () => void;
  selectRow: (id: string | number) => void;
}

interface CollectionPanelProps {
  descriptor: CollectionDescriptor;
  conn: ReturnType<typeof useConnection>;
  refreshMs?: number;
  onSelect: (selection: InspectorSelection | null) => void;
  onNavigate: (collectionId: string, payload?: { selectRow?: string | number }) => void;
  entityLookup?: CollectionRow[];
}

function pickColumns(rows: CollectionRow[], idField: string): string[] {
  if (rows.length === 0) return [idField];
  const keys = Object.keys(rows[0]).filter((k) => k !== 'free');
  const ordered = [idField, ...keys.filter((k) => k !== idField)];
  return [...new Set(ordered)].slice(0, 6);
}

function formatCell(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'number' && !Number.isInteger(value)) return value.toFixed(2);
  return formatVal(value);
}

function StreamFilterPopover({
  conn,
  descriptor,
  slugCatalog,
}: {
  conn: CollectionPanelProps['conn'];
  descriptor: CollectionDescriptor;
  slugCatalog: CollectionDescriptor;
}) {
  const [open, setOpen] = useState(false);
  const rows = conn.catalogRows[slugCatalog.id] ?? [];
  const filter = conn.streamFilters[descriptor.id] ?? new Set<string>();

  return (
    <Popover opened={open} onChange={setOpen} position="bottom-end" width={280}>
      <Popover.Target>
        <ActionIcon variant="subtle" size="sm" onClick={() => setOpen((v) => !v)}>
          <IconAdjustments size={14} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="xs" fw={600}>filter</Text>
            <Group gap={4}>
              <Button size="compact-xs" variant="subtle" onClick={() => conn.setStreamFilter(descriptor.id, new Set(rows.map((r) => String(r[slugCatalog.idField] ?? ''))))}>All</Button>
              <Button size="compact-xs" variant="subtle" onClick={() => conn.setStreamFilter(descriptor.id, new Set())}>None</Button>
            </Group>
          </Group>
          {rows.map((row) => {
            const key = String(row[slugCatalog.idField] ?? '');
            return (
              <Checkbox
                key={key}
                size="xs"
                label={key}
                checked={filter.has(key)}
                onChange={(e) => conn.toggleStreamFilterKey(descriptor.id, key, e.currentTarget.checked)}
              />
            );
          })}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

export const CollectionPanel = forwardRef<CollectionPanelHandle, CollectionPanelProps>(
  function CollectionPanel({ descriptor, conn, refreshMs = 0, onSelect, onNavigate, entityLookup = [] }, ref) {
    const [filter, setFilter] = useState('');
    const [selectedKey, setSelectedKey] = useState<string | number | null>(null);
    const selectedKeyRef = useRef<string | number | null>(null);
    const refreshTimer = useRef<ReturnType<typeof setInterval>>();

    const slugCatalog = useMemo(() => findSlugCatalog(conn.collections), [conn.collections]);
    const showStreamFilter = streamUsesSlugFilter(descriptor, slugCatalog) && slugCatalog;

    const rows = useMemo(() => {
      if (hasStreamMode(descriptor)) return conn.streamRows[descriptor.id] ?? [];
      if (hasListMode(descriptor)) return conn.listRows[descriptor.id] ?? [];
      if (hasCatalogMode(descriptor)) return conn.catalogRows[descriptor.id] ?? [];
      return [];
    }, [conn.streamRows, conn.listRows, conn.catalogRows, descriptor]);

    const entityCollection = useMemo(
      () => conn.collections.find((c) => hasGetMode(c) && c.modes.includes('list')),
      [conn.collections],
    );

    const fetchDetail = useCallback(
      async (row: CollectionRow) => {
        if (!hasGetMode(descriptor)) {
          onSelect({ collectionId: descriptor.id, row });
          return;
        }
        try {
          const result = (await conn.call(rpcGet(descriptor.id), {
            [descriptor.idField]: row[descriptor.idField],
          })) as Record<string, unknown>;
          onSelect({
            collectionId: descriptor.id,
            row,
            detail: inspectableFromGetResult(result),
          });
        } catch {
          onSelect({ collectionId: descriptor.id, row });
        }
      },
      [conn, descriptor, onSelect],
    );

    const refresh = useCallback(() => {
      if (!hasListMode(descriptor)) return;
      void conn.refreshList(descriptor.id).then((list) => {
        if (selectedKeyRef.current != null) {
          const row = list.find((r) => rowId(r, descriptor.idField) === selectedKeyRef.current);
          if (row) void fetchDetail(row);
        }
      });
    }, [conn, descriptor, fetchDetail]);

    const selectRow = useCallback(
      (id: string | number) => {
        selectedKeyRef.current = id;
        setSelectedKey(id);
        const row = rows.find((r) => rowId(r, descriptor.idField) === id);
        if (row) void fetchDetail(row);
        else onSelect(null);
      },
      [rows, descriptor.idField, fetchDetail, onSelect],
    );

    useImperativeHandle(ref, () => ({ refresh, selectRow }), [refresh, selectRow]);

    useEffect(() => {
      if (conn.state !== 'connected' || !hasListMode(descriptor)) return;
      void conn.refreshList(descriptor.id);
    }, [conn.state, conn.refreshList, descriptor]);

    useEffect(() => {
      clearInterval(refreshTimer.current);
      if (refreshMs > 0 && conn.state === 'connected' && hasListMode(descriptor)) {
        refreshTimer.current = setInterval(refresh, refreshMs);
      }
      return () => clearInterval(refreshTimer.current);
    }, [refreshMs, refresh, conn.state, descriptor]);

    const columns = useMemo(() => {
      const keys = pickColumns(rows, descriptor.idField);
      return keys.map((key) => ({
        key,
        header: key,
        width: key === descriptor.idField ? 52 : undefined,
        render: (row: CollectionRow) => {
          const id = rowId(row, descriptor.idField);
          const selected = id === selectedKey;
          const value = row[key];

          if (key === 'target_edict' && typeof value === 'number') {
            return (
              <EntityRef
                edict={value}
                entities={entityLookup.map((e) => ({
                  index: Number(e.index),
                  classname: String(e.classname ?? ''),
                }))}
                onSelect={(index) => {
                  if (entityCollection) onNavigate(entityCollection.id, { selectRow: index });
                }}
              />
            );
          }

          if (key === 'classname') {
            const def = findCatalogRow(conn.catalogRows, conn.collections, String(value ?? ''));
            const iconEntry = getClassnameIcon(
              String(value ?? ''),
              row.icon as string | undefined,
              (def?.icon as string | undefined) ?? (row.icon_color as string | undefined),
            );
            return (
              <Group gap={6} wrap="nowrap">
                {iconEntry && <FontAwesomeIcon icon={iconEntry.icon} style={{ color: iconEntry.color, fontSize: 11, width: 14 }} />}
                {cellText(String(value ?? ''), selected, Boolean(row.free))}
              </Group>
            );
          }

          return cellText(formatCell(value), selected, Boolean(row.free));
        },
      }));
    }, [rows, descriptor.idField, selectedKey, entityLookup, entityCollection, onNavigate, conn.catalogRows]);

    if (hasCatalogMode(descriptor) && !hasListMode(descriptor) && !hasStreamMode(descriptor)) {
      const items = rows.filter((row) => {
        const label = String(row[descriptor.idField] ?? '');
        return !filter || label.toLowerCase().includes(filter.toLowerCase());
      });

      return (
        <CollectionListShell
          title={descriptor.label}
          total={rows.length}
          filtered={items.length}
          filter={filter}
          onFilterChange={setFilter}
        >
          <Table horizontalSpacing="sm" verticalSpacing={0}>
            <Table.Tbody>
              {items.map((row, i) => {
                const id = String(row[descriptor.idField] ?? '');
                const ci = conn.compIcons.get(id);
                const iconEntry = getComponentIcon(id, ci?.icon, ci?.icon_color);
                return (
                  <DefListRow
                    key={id}
                    id={id}
                    label={id}
                    sub={typeof row.description === 'string' ? row.description : undefined}
                    badge={typeof row.schema === 'object' && row.schema && 'kind' in (row.schema as object) ? String((row.schema as { kind?: string }).kind) : undefined}
                    selected={selectedKey === id}
                    onClick={() => {
                      setSelectedKey(id);
                      onSelect({ collectionId: descriptor.id, row });
                    }}
                    index={i}
                    icon={iconEntry ? <FontAwesomeIcon icon={iconEntry.icon} style={{ color: iconEntry.color, fontSize: 11, width: 14 }} /> : undefined}
                  />
                );
              })}
            </Table.Tbody>
          </Table>
        </CollectionListShell>
      );
    }

    return (
      <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {showStreamFilter && slugCatalog && (
          <Box px="xs" py={4} style={{ background: '#1a1d23', borderBottom: '1px solid #2a2d35' }}>
            <Group justify="flex-end">
              <StreamFilterPopover conn={conn} descriptor={descriptor} slugCatalog={slugCatalog} />
            </Group>
          </Box>
        )}
        <Box style={{ flex: 1, minHeight: 0 }}>
          <CollectionTable
            title={descriptor.label}
            rows={rows}
            columns={columns}
            filter={filter}
            onFilterChange={setFilter}
            placeholder="Filter..."
            getRowKey={(row) => rowId(row, descriptor.idField)}
            selectedKey={selectedKey}
            onSelect={(row) => {
              const id = rowId(row, descriptor.idField);
              setSelectedKey(id);
              selectedKeyRef.current = id;
              void fetchDetail(row);
            }}
            filterRow={(row, q) =>
              Object.values(row).some((v) => v != null && String(v).toLowerCase().includes(q))
            }
            emptyMessage="Пусто"
          />
        </Box>
      </Box>
    );
  },
);
