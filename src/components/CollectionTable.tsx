import { useMemo } from 'react';
import { Table, Text } from '@mantine/core';
import { CollectionListShell } from './CollectionListShell';

export interface CollectionColumn<T> {
  key: string;
  header: string;
  width?: number | string;
  align?: 'left' | 'right';
  render: (row: T, index: number) => React.ReactNode;
}

interface CollectionTableProps<T> {
  title: string;
  rows: T[];
  columns: CollectionColumn<T>[];
  filter: string;
  onFilterChange: (v: string) => void;
  getRowKey: (row: T) => string | number;
  selectedKey?: string | number | null;
  onSelect?: (row: T) => void;
  isRowDisabled?: (row: T) => boolean;
  filterRow?: (row: T, query: string) => boolean;
  placeholder?: string;
  emptyMessage?: string;
}

const ROW_ZEBRA = ['transparent', '#16181e'];

export function CollectionTable<T>({
  title,
  rows,
  columns,
  filter,
  onFilterChange,
  getRowKey,
  selectedKey = null,
  onSelect,
  isRowDisabled,
  filterRow,
  placeholder,
  emptyMessage,
}: CollectionTableProps<T>) {
  const filtered = useMemo(() => {
    if (!filter || !filterRow) return rows;
    const q = filter.toLowerCase();
    return rows.filter((row) => filterRow(row, q));
  }, [rows, filter, filterRow]);

  return (
    <CollectionListShell
      title={title}
      total={rows.length}
      filtered={filtered.length}
      filter={filter}
      onFilterChange={onFilterChange}
      placeholder={placeholder}
    >
      <Table horizontalSpacing="sm" verticalSpacing={0} stickyHeader>
        <Table.Thead>
          <Table.Tr style={{ background: '#1a1d23' }}>
            {columns.map((col) => (
              <Table.Th
                key={col.key}
                style={{
                  width: col.width,
                  borderBottom: '1px solid #2a2d35',
                  color: '#6b7280',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  textAlign: col.align ?? 'left',
                }}
              >
                {col.header}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtered.map((row, i) => {
            const key = getRowKey(row);
            const disabled = isRowDisabled?.(row) ?? false;
            const selected = key === selectedKey;
            const bg = selected ? '#2cb1bc18' : ROW_ZEBRA[i % 2];

            return (
              <Table.Tr
                key={key}
                style={{
                  cursor: disabled || !onSelect ? 'default' : 'pointer',
                  background: bg,
                  borderLeft: selected ? '2px solid #2cb1bc' : '2px solid transparent',
                  opacity: disabled ? 0.25 : 1,
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onClick={() => {
                  if (!disabled && onSelect) onSelect(row);
                }}
                onMouseEnter={(ev) => {
                  if (!selected && !disabled && onSelect) {
                    ev.currentTarget.style.background = '#1a1d2388';
                  }
                }}
                onMouseLeave={(ev) => {
                  if (!selected) ev.currentTarget.style.background = bg;
                }}
              >
                {columns.map((col) => (
                  <Table.Td
                    key={col.key}
                    style={{
                      borderBottom: 'none',
                      textAlign: col.align ?? 'left',
                      fontFamily: 'monospace',
                      fontSize: 11,
                    }}
                  >
                    {col.render(row, i)}
                  </Table.Td>
                ))}
              </Table.Tr>
            );
          })}
        {filtered.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={columns.length} style={{ borderBottom: 'none' }}>
                <Text size="xs" ta="center" py="md" style={{ color: '#374151', fontStyle: 'italic' }}>
                  {rows.length === 0 ? emptyMessage ?? 'No items' : 'No matches'}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </CollectionListShell>
  );
}

export function cellText(value: string, selected: boolean, muted = false) {
  return (
    <Text
      size="xs"
      truncate
      style={{
        fontFamily: 'monospace',
        color: muted ? '#374151' : selected ? '#5eead4' : '#d1d5db',
      }}
    >
      {value || '—'}
    </Text>
  );
}
