import { useState, useMemo } from 'react';
import { Table } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CollectionListShell, DefListRow } from '../components/CollectionListShell';
import { getComponentIcon, getClassnameIcon } from '../lib/icons';
import type { CollectionPanelProps } from './types';
import type { SchemaDef } from '../types/protocol';

function schemaKind(schema: SchemaDef | undefined): string {
  if (!schema) return '?';
  if (schema === null || (typeof schema === 'object' && 'kind' in schema && schema.kind === 'tag')) return 'tag';
  if (typeof schema === 'object' && 'kind' in schema && schema.kind === 'struct') return 'struct';
  return '?';
}

export function ComponentDefsCollection({ conn, onSelect }: CollectionPanelProps) {
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const items = useMemo(() => {
    const q = filter.toLowerCase();
    return [...conn.schemas.entries()]
      .filter(([slug]) => !q || slug.toLowerCase().includes(q))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [conn.schemas, filter]);

  const pick = (slug: string) => {
    setSelected(slug);
    const schema = conn.schemas.get(slug) ?? null;
    const icon = conn.compIcons.get(slug);
    onSelect({ kind: 'component-def', slug, schema, icon });
  };

  return (
    <CollectionListShell
      title="Component Definitions"
      total={conn.schemas.size}
      filtered={items.length}
      filter={filter}
      onFilterChange={setFilter}
    >
      <Table horizontalSpacing="sm" verticalSpacing={0}>
        <Table.Tbody>
          {items.map(([slug, schema], i) => {
            const ci = conn.compIcons.get(slug);
            const iconEntry = getComponentIcon(slug, ci?.icon, ci?.icon_color);
            return (
              <DefListRow
                key={slug}
                id={slug}
                label={slug}
                badge={schemaKind(schema)}
                selected={selected === slug}
                onClick={() => pick(slug)}
                index={i}
                icon={iconEntry ? (
                  <FontAwesomeIcon icon={iconEntry.icon} style={{ color: iconEntry.color, fontSize: 11, width: 14 }} />
                ) : undefined}
              />
            );
          })}
        </Table.Tbody>
      </Table>
    </CollectionListShell>
  );
}

export function EntityDefsCollection({ conn, onSelect }: CollectionPanelProps) {
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const items = useMemo(() => {
    const q = filter.toLowerCase();
    return [...conn.entitySchemas.entries()]
      .filter(([id]) => !q || id.toLowerCase().includes(q))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [conn.entitySchemas, filter]);

  const pick = (id: string) => {
    setSelected(id);
    const schema = conn.entitySchemas.get(id)!;
    onSelect({ kind: 'entity-def', id, schema });
  };

  return (
    <CollectionListShell
      title="Entity Definitions"
      total={conn.entitySchemas.size}
      filtered={items.length}
      filter={filter}
      onFilterChange={setFilter}
    >
      <Table horizontalSpacing="sm" verticalSpacing={0}>
        <Table.Tbody>
          {items.map(([id, schema], i) => {
            const iconEntry = getClassnameIcon(id, schema.icon, schema.icon_color);
            return (
              <DefListRow
                key={id}
                id={id}
                label={id}
                selected={selected === id}
                onClick={() => pick(id)}
                index={i}
                icon={iconEntry ? (
                  <FontAwesomeIcon icon={iconEntry.icon} style={{ color: iconEntry.color, fontSize: 11, width: 14 }} />
                ) : undefined}
              />
            );
          })}
        </Table.Tbody>
      </Table>
    </CollectionListShell>
  );
}

export function EventDefsCollection({ conn, onSelect }: CollectionPanelProps) {
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const items = useMemo(() => {
    const q = filter.toLowerCase();
    return [...conn.eventSchemas.entries()]
      .filter(([slug, s]) => !q || slug.toLowerCase().includes(q) || (s.description?.toLowerCase().includes(q) ?? false))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [conn.eventSchemas, filter]);

  const pick = (slug: string) => {
    setSelected(slug);
    const schema = conn.eventSchemas.get(slug)!;
    onSelect({ kind: 'event-def', slug, schema });
  };

  return (
    <CollectionListShell
      title="Event Definitions"
      total={conn.eventSchemas.size}
      filtered={items.length}
      filter={filter}
      onFilterChange={setFilter}
    >
      <Table horizontalSpacing="sm" verticalSpacing={0}>
        <Table.Tbody>
          {items.map(([slug, schema], i) => (
            <DefListRow
              key={slug}
              id={slug}
              label={slug}
              sub={schema.description}
              badge={schema.schema?.layout?.kind}
              selected={selected === slug}
              onClick={() => pick(slug)}
              index={i}
            />
          ))}
        </Table.Tbody>
      </Table>
    </CollectionListShell>
  );
}
