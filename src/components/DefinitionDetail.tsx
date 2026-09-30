import { Box, Text, Group, Badge, Stack } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconTag, IconPackage } from '@tabler/icons-react';
import type { InspectorSelection } from '../collections/types';
import { getComponentIcon, getClassnameIcon } from '../lib/icons';
import { JsonView } from './JsonView';
import type { FieldDef } from '../types/protocol';

const BG = '#090a0c';
const HEADER = '#151820';
const BORDER = '#1c1f27';

function DefHeader({ title, sub, icon }: { title: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <Box px="sm" py={8} style={{ background: HEADER, borderBottom: `1px solid ${BORDER}` }}>
      <Group gap="sm" wrap="nowrap">
        {icon}
        <Box style={{ minWidth: 0 }}>
          <Text fw={700} size="sm" ff="monospace" truncate style={{ color: '#5eead4' }}>{title}</Text>
          {sub && <Text size="xs" style={{ color: '#4b5563', fontFamily: 'monospace' }}>{sub}</Text>}
        </Box>
      </Group>
    </Box>
  );
}

function FieldTable({ fields }: { fields: FieldDef[] }) {
  return (
    <Stack gap={0}>
      {fields.map((f, i) => (
        <Group
          key={f.name}
          justify="space-between"
          wrap="nowrap"
          px="sm"
          py={6}
          style={{ background: i % 2 === 0 ? 'transparent' : '#0d0f14' }}
        >
          <Text size="xs" style={{ color: '#9ca3af', fontFamily: 'monospace' }}>{f.label || f.name}</Text>
          <Group gap={6}>
            <Badge size="xs" variant="light" color="dark" tt="none" style={{ fontFamily: 'monospace', fontSize: 9 }}>
              {f.type}
            </Badge>
            {f.writable && <Text size="xs" style={{ color: '#22c55e', fontSize: 9 }}>w</Text>}
            {f.readonly && <Text size="xs" style={{ color: '#6b7280', fontSize: 9 }}>r</Text>}
          </Group>
        </Group>
      ))}
    </Stack>
  );
}

export function DefinitionDetail({ selection }: { selection: InspectorSelection }) {
  if (!selection || selection.kind === 'inspectable' || selection.kind === 'event') return null;

  if (selection.kind === 'component-def') {
    const { slug, schema, icon } = selection;
    const iconEntry = getComponentIcon(slug, icon?.icon, icon?.icon_color);
    const isTag = !schema || (typeof schema === 'object' && 'kind' in schema && schema.kind === 'tag');
    const struct = schema && typeof schema === 'object' && 'kind' in schema && schema.kind === 'struct' ? schema : null;

    return (
      <Box style={{ height: '100%', background: BG, display: 'flex', flexDirection: 'column' }}>
        <DefHeader
          title={struct?.label || slug}
          sub={slug}
          icon={iconEntry ? (
            <FontAwesomeIcon icon={iconEntry.icon} style={{ color: iconEntry.color, fontSize: 14 }} />
          ) : (
            <IconPackage size={14} style={{ color: '#6b7280' }} />
          )}
        />
        <Box style={{ flex: 1, overflow: 'auto', padding: 10 }}>
          {isTag ? (
            <Group gap={6} px="sm">
              <IconTag size={12} style={{ color: '#22d3ee' }} />
              <Badge size="sm" variant="light" color="dark">tag</Badge>
            </Group>
          ) : struct ? (
            <FieldTable fields={struct.fields} />
          ) : (
            <Text size="xs" px="sm" style={{ color: '#6b7280' }}>No schema</Text>
          )}
        </Box>
      </Box>
    );
  }

  if (selection.kind === 'entity-def') {
    const { id, schema } = selection;
    const iconEntry = getClassnameIcon(id, schema.icon, schema.icon_color);

    return (
      <Box style={{ height: '100%', background: BG, display: 'flex', flexDirection: 'column' }}>
        <DefHeader
          title={id}
          sub="entity classname"
          icon={iconEntry ? (
            <FontAwesomeIcon icon={iconEntry.icon} style={{ color: iconEntry.color, fontSize: 14 }} />
          ) : undefined}
        />
        <Box p="sm">
          <Box p="sm" style={{ background: '#111318', borderRadius: 6, border: `1px solid ${BORDER}` }}>
            <JsonView data={schema} />
          </Box>
        </Box>
      </Box>
    );
  }

  if (selection.kind === 'event-def') {
    const { slug, schema } = selection;
    const fields = schema.schema?.layout?.fields;
    const kind = schema.schema?.layout?.kind;

    return (
      <Box style={{ height: '100%', background: BG, display: 'flex', flexDirection: 'column' }}>
        <DefHeader title={slug} sub={schema.description || schema.codec} />
        <Box style={{ flex: 1, overflow: 'auto', padding: 10 }}>
          {kind && (
            <Badge size="xs" mb="sm" variant="light" color="dark" tt="none" style={{ fontFamily: 'monospace' }}>
              layout: {kind}
            </Badge>
          )}
          {fields && fields.length > 0 && (
            <Box mb="sm">
              <Text size="xs" mb={4} style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: 10 }}>Fields</Text>
              <Stack gap={4}>
                {fields.map((f) => (
                  <Group key={f.name} gap={6} px="sm" py={4} style={{ background: '#111318', borderRadius: 4, border: `1px solid ${BORDER}` }}>
                    <Text size="xs" ff="monospace" style={{ color: '#9ca3af' }}>{f.name}</Text>
                    <Text size="xs" ff="monospace" style={{ color: '#4b5563' }}>{f.type}</Text>
                  </Group>
                ))}
              </Stack>
            </Box>
          )}
          <Text size="xs" mb={4} style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: 10 }}>Schema</Text>
          <Box p="sm" style={{ background: '#111318', borderRadius: 6, border: `1px solid ${BORDER}` }}>
            <JsonView data={schema} />
          </Box>
        </Box>
      </Box>
    );
  }

  return null;
}
