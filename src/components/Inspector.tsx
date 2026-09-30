import { Box, Text, Group, Badge, Stack, Collapse, ActionIcon } from '@mantine/core';
import { useState } from 'react';
import { IconChevronDown, IconChevronRight, IconTag, IconPackage } from '@tabler/icons-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { InspectableContainer, ComponentSnapshot, SchemaDef, ComponentTag } from '../types/protocol';
import type { CompIcon } from '../hooks/useConnection';
import { getComponentIcon } from '../lib/icons';
import { JsonView } from './JsonView';

const BG = '#090a0c';
const CARD_BG = '#111318';
const CARD_BORDER = '#1c1f27';
const CARD_HEADER = '#151820';
const ZEBRA = ['transparent', '#0d0f14'];
const ZEBRA_HOVER = '#161b24';

function zebraBg(index: number) {
  return ZEBRA[index % 2];
}

function zebraHoverHandlers(index: number) {
  const base = zebraBg(index);
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.background = ZEBRA_HOVER; },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.background = base; },
  };
}

function ZebraRow({ index, py = 4, children }: { index: number; py?: number; children: React.ReactNode }) {
  return (
    <Box
      px="sm"
      py={py}
      style={{ background: zebraBg(index), transition: 'background 0.12s' }}
      {...zebraHoverHandlers(index)}
    >
      {children}
    </Box>
  );
}

interface InspectorProps {
  container: InspectableContainer | null;
  schemas: Map<string, SchemaDef>;
  compIcons: Map<string, CompIcon>;
}

function isTag(comp: ComponentSnapshot): comp is ComponentTag {
  return 'kind' in comp;
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(3);
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    if (v.length === 3 && v.every((x) => typeof x === 'number')) {
      return `${v[0].toFixed(1)}  ${v[1].toFixed(1)}  ${v[2].toFixed(1)}`;
    }
    return JSON.stringify(v);
  }
  return JSON.stringify(v);
}

function Vec3Row({ label, value, index }: { label: string; value: [number, number, number]; index: number }) {
  return (
    <ZebraRow index={index}>
      <Text size="xs" truncate mb={3} style={{ color: '#6b7280' }}>{label}</Text>
      <Group gap={3} wrap="nowrap">
        <Box style={{ flex: 1, background: '#7f1d1d22', borderRadius: 4, padding: '2px 6px', border: '1px solid #7f1d1d33' }}>
          <Text size="xs" ff="monospace" ta="center" style={{ color: '#fca5a5' }}>{value[0].toFixed(1)}</Text>
        </Box>
        <Box style={{ flex: 1, background: '#14532d22', borderRadius: 4, padding: '2px 6px', border: '1px solid #14532d33' }}>
          <Text size="xs" ff="monospace" ta="center" style={{ color: '#86efac' }}>{value[1].toFixed(1)}</Text>
        </Box>
        <Box style={{ flex: 1, background: '#1e3a5f22', borderRadius: 4, padding: '2px 6px', border: '1px solid #1e3a5f33' }}>
          <Text size="xs" ff="monospace" ta="center" style={{ color: '#93c5fd' }}>{value[2].toFixed(1)}</Text>
        </Box>
      </Group>
    </ZebraRow>
  );
}

function FieldRow({ label, value, index }: { label: string; value: React.ReactNode; index: number }) {
  if (typeof value === 'object' && value !== null) {
    return (
      <ZebraRow index={index}>
        <Text size="xs" truncate mb={3} style={{ color: '#6b7280' }}>{label}</Text>
        <Box p={6} style={{ background: BG, borderRadius: 4, border: `1px solid ${CARD_BORDER}` }}>
          <JsonView data={value} compact />
        </Box>
      </ZebraRow>
    );
  }

  const base = zebraBg(index);
  return (
    <Group
      justify="space-between"
      wrap="nowrap"
      px="sm"
      py={3}
      gap="xs"
      style={{ background: base, transition: 'background 0.12s' }}
      {...zebraHoverHandlers(index)}
    >
      <Text size="xs" truncate style={{ color: '#6b7280', flex: 1 }}>{label}</Text>
      <Text size="xs" ff="monospace" style={{ color: '#d1d5db', textAlign: 'right' }}>{value}</Text>
    </Group>
  );
}

function RawDataSection({ data }: { data: Record<string, unknown> }) {
  const keys = Object.keys(data);
  if (keys.length === 0) return null;

  return (
    <Stack gap={0}>
      {keys.map((k, i) => {
        const v = data[k];
        if (Array.isArray(v) && v.length === 3 && v.every((x) => typeof x === 'number')) {
          return <Vec3Row key={k} label={k} value={v as [number, number, number]} index={i} />;
        }
        if (typeof v === 'object' && v !== null) {
          return (
            <ZebraRow key={k} index={i}>
              <Text size="xs" truncate mb={3} style={{ color: '#6b7280' }}>{k}</Text>
              <Box p={6} style={{ background: BG, borderRadius: 4, border: `1px solid ${CARD_BORDER}` }}>
                <JsonView data={v} compact />
              </Box>
            </ZebraRow>
          );
        }
        return <FieldRow key={k} label={k} value={renderValue(v)} index={i} />;
      })}
    </Stack>
  );
}

const CARD_COL_WIDTH = 260;

function ComponentCard({ children }: { children: React.ReactNode }) {
  return (
    <Box
      style={{
        width: '100%',
        display: 'inline-block',
        breakInside: 'avoid',
        marginBottom: 8,
        background: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {children}
    </Box>
  );
}

function ComponentHeader({
  title,
  open,
  onToggle,
  badge,
  iconEntry,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  badge?: string | null;
  iconEntry?: { icon: IconDefinition; color: string } | null;
}) {
  return (
    <Group
      px="sm"
      py={6}
      gap={6}
      wrap="nowrap"
      style={{
        background: CARD_HEADER,
        borderBottom: open ? `1px solid ${CARD_BORDER}` : 'none',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={onToggle}
    >
      {iconEntry ? (
        <FontAwesomeIcon icon={iconEntry.icon} style={{ color: iconEntry.color, fontSize: 12, width: 14, textAlign: 'center' }} />
      ) : (
        <IconPackage size={12} style={{ color: '#6b7280' }} />
      )}
      <ActionIcon size="xs" variant="subtle" color="gray" p={0} m={0}>
        {open
          ? <IconChevronDown size={12} style={{ color: '#6b7280' }} />
          : <IconChevronRight size={12} style={{ color: '#4b5563' }} />
        }
      </ActionIcon>
      <Text size="xs" fw={600} truncate style={{ color: '#e5e7eb', flex: 1, fontFamily: 'monospace', letterSpacing: 0.3 }}>
        {title}
      </Text>
      {badge && (
        <Badge size="xs" color="dark" variant="light" tt="none" style={{ color: '#6b7280' }}>
          {badge}
        </Badge>
      )}
    </Group>
  );
}

function ComponentBlock({ comp, schema, compIcons }: { comp: ComponentSnapshot; schema: SchemaDef; compIcons: Map<string, CompIcon> }) {
  const [open, setOpen] = useState(true);
  const ci = compIcons.get(comp.slug);
  const iconEntry = getComponentIcon(comp.slug, ci?.icon, ci?.icon_color);

  if (isTag(comp)) {
    return (
      <ComponentCard>
        <Group px="sm" py={8} gap={6} wrap="nowrap">
          {iconEntry ? (
            <FontAwesomeIcon icon={iconEntry.icon} style={{ color: iconEntry.color, fontSize: 12, width: 14, textAlign: 'center' }} />
          ) : (
            <IconTag size={12} style={{ color: '#22d3ee' }} />
          )}
          <Text size="xs" fw={600} truncate style={{ color: '#e5e7eb', fontFamily: 'monospace' }}>
            {comp.slug}
          </Text>
          <Badge size="xs" color="dark" variant="light" tt="none" style={{ color: '#6b7280' }}>
            tag
          </Badge>
        </Group>
      </ComponentCard>
    );
  }

  const data = comp.data;
  const hasData = Object.keys(data).length > 0;

  const structSchema =
    schema && typeof schema === 'object' && 'kind' in schema && schema.kind === 'struct'
      ? schema
      : null;

  const title = structSchema?.label || comp.slug;

  return (
    <ComponentCard>
      <ComponentHeader
        title={title}
        open={open}
        onToggle={() => setOpen(!open)}
        badge={!structSchema && !hasData ? 'empty' : null}
        iconEntry={iconEntry}
      />
      <Collapse in={open}>
        <Box py={2}>
          {structSchema?.fields ? (
            <Stack gap={0}>
              {structSchema.fields.map((f, i) => {
                const v = data[f.name];
                if (v === undefined) return null;
                if (f.type === 'vec3' && Array.isArray(v)) {
                  return <Vec3Row key={f.name} label={f.label || f.name} value={v as [number, number, number]} index={i} />;
                }
                return <FieldRow key={f.name} label={f.label || f.name} value={renderValue(v)} index={i} />;
              })}
            </Stack>
          ) : (
            <RawDataSection data={data} />
          )}
        </Box>
      </Collapse>
    </ComponentCard>
  );
}

export function Inspector({ container, schemas, compIcons }: InspectorProps) {
  if (!container) {
    return (
      <Box p="md" style={{ height: '100%', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#374151', fontStyle: 'italic' }} size="sm">
          Nothing to inspect
        </Text>
      </Box>
    );
  }

  return (
    <Box style={{ height: '100%', background: BG, display: 'flex', flexDirection: 'column' }}>
      <Box px="sm" py={8} style={{ background: CARD_HEADER, borderBottom: `1px solid ${CARD_BORDER}` }}>
        <Group gap="sm" wrap="nowrap">
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 8px #22c55e88',
            }}
          />
          <Text fw={700} size="sm" ff="monospace" style={{ color: '#5eead4', letterSpacing: 0.5 }}>
            {container.title}
          </Text>
          {container.subtitle && (
            <Text size="xs" style={{ color: '#4b5563', fontFamily: 'monospace' }}>
              {container.subtitle}
            </Text>
          )}
          <Text size="xs" style={{ color: '#374151', marginLeft: 'auto' }}>
            {container.components.length} components
          </Text>
        </Group>
      </Box>
      <Box style={{ flex: 1, overflow: 'auto', padding: 10 }}>
        {container.components.length === 0 ? (
          <Text size="xs" style={{ color: '#374151' }}>No components</Text>
        ) : (
          <Box style={{ columnWidth: CARD_COL_WIDTH, columnGap: 8 }}>
            {container.components.map((comp) => (
              <ComponentBlock
                key={comp.slug}
                comp={comp}
                schema={schemas.get(comp.slug) ?? null}
                compIcons={compIcons}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
