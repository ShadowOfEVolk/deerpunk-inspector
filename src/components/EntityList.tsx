import { useState, useMemo } from 'react';
import { TextInput, Table, Box, Text, ScrollArea, Group } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { EntitySummary, EntitySchemaMsg } from '../types/protocol';
import { getClassnameIcon } from '../lib/icons';

interface EntityListProps {
  entities: EntitySummary[];
  entitySchemas: Map<string, EntitySchemaMsg>;
  selected: number | null;
  onSelect: (index: number) => void;
}

export function EntityList({ entities, entitySchemas, selected, onSelect }: EntityListProps) {
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!filter) return entities;
    const q = filter.toLowerCase();
    return entities.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.classname.toLowerCase().includes(q) ||
        e.netname.toLowerCase().includes(q) ||
        String(e.index).includes(q),
    );
  }, [entities, filter]);

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#14161c' }}>
      <Box p="xs" style={{ background: '#1a1d23', borderBottom: '1px solid #2a2d35' }}>
        <Group justify="space-between" mb={4}>
          <Text size="xs" fw={600} style={{ color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', fontSize: 10 }}>
            Entities
          </Text>
          <Text size="xs" style={{ color: '#4b5563', fontFamily: 'monospace' }}>
            {filtered.length}<span style={{ color: '#374151' }}>/</span>{entities.length}
          </Text>
        </Group>
        <TextInput
          placeholder="Search..."
          size="xs"
          leftSection={<IconSearch size={14} style={{ color: '#6b7280' }} />}
          value={filter}
          onChange={(e) => setFilter(e.currentTarget.value)}
          variant="filled"
        />
      </Box>
      <ScrollArea style={{ flex: 1 }}>
        <Table horizontalSpacing="sm" verticalSpacing={0}>
          <Table.Tbody>
            {filtered.map((e, i) => {
              const isSelected = e.index === selected;
              const es = entitySchemas.get(e.classname);
              const iconEntry = getClassnameIcon(
                e.classname,
                e.icon || es?.icon,
                e.icon_color || es?.icon_color,
              );
              return (
                <Table.Tr
                  key={e.index}
                  style={{
                    cursor: e.free ? 'default' : 'pointer',
                    background: isSelected
                      ? '#2cb1bc18'
                      : i % 2 === 0
                        ? 'transparent'
                        : '#16181e',
                    borderLeft: isSelected ? '2px solid #2cb1bc' : '2px solid transparent',
                    opacity: e.free ? 0.25 : 1,
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onClick={() => !e.free && onSelect(e.index)}
                  onMouseEnter={(ev) => {
                    if (!isSelected && !e.free) ev.currentTarget.style.background = '#1a1d2388';
                  }}
                  onMouseLeave={(ev) => {
                    if (!isSelected) ev.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#16181e';
                  }}
                >
                  <Table.Td style={{ width: 45, borderBottom: 'none' }}>
                    <Text size="xs" style={{ color: '#4b5563', fontFamily: 'monospace' }}>
                      {e.index}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ borderBottom: 'none' }}>
                    <Group gap={6} wrap="nowrap">
                      {iconEntry && (
                        <FontAwesomeIcon
                          icon={iconEntry.icon}
                          style={{ color: iconEntry.color, fontSize: 11, width: 14, textAlign: 'center', opacity: e.free ? 0.3 : 1 }}
                        />
                      )}
                      <Text
                        size="xs"
                        style={{
                          fontFamily: 'monospace',
                          color: e.free ? '#374151' : isSelected ? '#5eead4' : '#d1d5db',
                        }}
                        truncate
                      >
                        {e.name}
                      </Text>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Box>
  );
}
