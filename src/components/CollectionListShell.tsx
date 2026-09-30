import { Box, Text, TextInput, ScrollArea, Group, Badge, Table } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

const SHELL_BG = '#14161c';
const HEADER_BG = '#1a1d23';
const BORDER = '#2a2d35';

interface CollectionListShellProps {
  title: string;
  total: number;
  filtered: number;
  filter: string;
  onFilterChange: (v: string) => void;
  placeholder?: string;
  children: React.ReactNode;
}

export function CollectionListShell({
  title,
  total,
  filtered,
  filter,
  onFilterChange,
  placeholder = 'Filter...',
  children,
}: CollectionListShellProps) {
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', background: SHELL_BG }}>
      <Box p="xs" style={{ background: HEADER_BG, borderBottom: `1px solid ${BORDER}` }}>
        <Group justify="space-between" mb={4}>
          <Text size="xs" fw={600} style={{ color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', fontSize: 10 }}>
            {title}
          </Text>
          <Text size="xs" style={{ color: '#4b5563', fontFamily: 'monospace' }}>
            {filtered}<span style={{ color: '#374151' }}>/</span>{total}
          </Text>
        </Group>
        <TextInput
          placeholder={placeholder}
          size="xs"
          leftSection={<IconSearch size={14} style={{ color: '#6b7280' }} />}
          value={filter}
          onChange={(e) => onFilterChange(e.currentTarget.value)}
          variant="filled"
        />
      </Box>
      <ScrollArea style={{ flex: 1 }}>{children}</ScrollArea>
    </Box>
  );
}

interface DefListRowProps {
  id: string;
  label: string;
  sub?: string;
  badge?: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  index: number;
}

export function DefListRow({ id, label, sub, badge, selected, onClick, icon, index }: DefListRowProps) {
  return (
    <Table.Tr
      style={{
        cursor: 'pointer',
        background: selected ? '#2cb1bc18' : index % 2 === 0 ? 'transparent' : '#16181e',
        borderLeft: selected ? '2px solid #2cb1bc' : '2px solid transparent',
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = '#1a1d2388';
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : '#16181e';
      }}
    >
      <Table.Td style={{ width: 28, borderBottom: 'none' }}>{icon}</Table.Td>
      <Table.Td style={{ borderBottom: 'none' }}>
        <Group gap={6} wrap="nowrap">
          <Text
            size="xs"
            truncate
            style={{ fontFamily: 'monospace', color: selected ? '#5eead4' : '#d1d5db' }}
          >
            {label}
          </Text>
          {badge && (
            <Badge size="xs" color="dark" variant="light" tt="none" style={{ color: '#6b7280', fontSize: 9 }}>
              {badge}
            </Badge>
          )}
        </Group>
        {sub && (
          <Text size="xs" truncate style={{ color: '#4b5563', fontFamily: 'monospace', fontSize: 10 }}>
            {sub}
          </Text>
        )}
      </Table.Td>
      <Table.Td style={{ width: 50, borderBottom: 'none' }}>
        <Text size="xs" style={{ color: '#374151', fontFamily: 'monospace', fontSize: 10 }} truncate>
          {id}
        </Text>
      </Table.Td>
    </Table.Tr>
  );
}
