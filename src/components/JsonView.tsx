import { Box, Text, Group } from '@mantine/core';
import { useState } from 'react';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

const COLORS = {
  string: '#86efac',
  number: '#fdba74',
  boolean: '#c4b5fd',
  null: '#6b7280',
  key: '#93c5fd',
  bracket: '#6b7280',
  colon: '#4b5563',
  comma: '#4b5563',
};

function JsonValue({ value, depth, compact }: { value: unknown; depth: number; compact?: boolean }) {
  if (value === null || value === undefined) {
    return <Text component="span" size="xs" ff="monospace" style={{ color: COLORS.null }}>null</Text>;
  }

  if (typeof value === 'boolean') {
    return <Text component="span" size="xs" ff="monospace" style={{ color: COLORS.boolean }}>{String(value)}</Text>;
  }

  if (typeof value === 'number') {
    const s = Number.isInteger(value) ? String(value) : value.toFixed(3);
    return <Text component="span" size="xs" ff="monospace" style={{ color: COLORS.number }}>{s}</Text>;
  }

  if (typeof value === 'string') {
    return <Text component="span" size="xs" ff="monospace" style={{ color: COLORS.string, wordBreak: 'break-all' }}>"{value}"</Text>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <Text component="span" size="xs" ff="monospace" style={{ color: COLORS.bracket }}>[]</Text>;
    }

    // Compact vec3 display
    if (!compact && value.length === 3 && value.every((x) => typeof x === 'number')) {
      return (
        <Text component="span" size="xs" ff="monospace">
          <Text component="span" style={{ color: COLORS.bracket }}>[</Text>
          <Text component="span" style={{ color: COLORS.number }}>{value[0]}</Text>
          <Text component="span" style={{ color: COLORS.comma }}>, </Text>
          <Text component="span" style={{ color: COLORS.number }}>{value[1]}</Text>
          <Text component="span" style={{ color: COLORS.comma }}>, </Text>
          <Text component="span" style={{ color: COLORS.number }}>{value[2]}</Text>
          <Text component="span" style={{ color: COLORS.bracket }}>]</Text>
        </Text>
      );
    }

    return <JsonArray value={value} depth={depth} />;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length === 0) {
      return <Text component="span" size="xs" ff="monospace" style={{ color: COLORS.bracket }}>{'{ }'}</Text>;
    }
    return <JsonObject value={value as Record<string, unknown>} depth={depth} />;
  }

  return <Text component="span" size="xs" ff="monospace" style={{ color: COLORS.null }}>—</Text>;
}

function JsonArray({ value, depth }: { value: unknown[]; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const indent = '  '.repeat(depth + 1);
  const closingIndent = '  '.repeat(depth);

  if (!open) {
    return (
      <Text
        component="span"
        size="xs"
        ff="monospace"
        style={{ cursor: 'pointer' }}
        onClick={() => setOpen(true)}
      >
        <Text component="span" style={{ color: COLORS.bracket }}>{'['}</Text>
        <Text component="span" style={{ color: '#4b5563', fontSize: 10 }}> …{value.length} </Text>
        <Text component="span" style={{ color: COLORS.bracket }}>{']'}</Text>
      </Text>
    );
  }

  return (
    <Box>
      <Text
        component="span"
        size="xs"
        ff="monospace"
        style={{ cursor: 'pointer' }}
        onClick={() => setOpen(false)}
      >
        <Text component="span" style={{ color: COLORS.bracket }}>{'['}</Text>
      </Text>
      <Box pl={12}>
        {value.map((item, i) => (
          <Group key={i} gap={4} wrap="nowrap" style={{ minHeight: 18 }}>
            <Text size="xs" ff="monospace" style={{ color: COLORS.comma }}>{indent}</Text>
            <JsonValue value={item} depth={depth + 1} compact />
            {i < value.length - 1 && <Text component="span" size="xs" ff="monospace" style={{ color: COLORS.comma }}>,</Text>}
          </Group>
        ))}
      </Box>
      <Text size="xs" ff="monospace" style={{ color: COLORS.comma }}>{closingIndent}</Text>
      <Text component="span" size="xs" ff="monospace" style={{ color: COLORS.bracket }}>{']'}</Text>
    </Box>
  );
}

function JsonObject({ value, depth }: { value: Record<string, unknown>; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const indent = '  '.repeat(depth + 1);
  const closingIndent = '  '.repeat(depth);
  const keys = Object.keys(value);

  if (!open) {
    return (
      <Text
        component="span"
        size="xs"
        ff="monospace"
        style={{ cursor: 'pointer' }}
        onClick={() => setOpen(true)}
      >
        <Text component="span" style={{ color: COLORS.bracket }}>{'{'}</Text>
        <Text component="span" style={{ color: '#4b5563', fontSize: 10 }}> …{keys.length} </Text>
        <Text component="span" style={{ color: COLORS.bracket }}>{'}'}</Text>
      </Text>
    );
  }

  return (
    <Box>
      <Text
        component="span"
        size="xs"
        ff="monospace"
        style={{ cursor: 'pointer' }}
        onClick={() => setOpen(false)}
      >
        <Text component="span" style={{ color: COLORS.bracket }}>{'{'}</Text>
      </Text>
      <Box pl={12}>
        {keys.map((k, i) => (
          <Group key={k} gap={4} wrap="nowrap" style={{ minHeight: 18 }}>
            <Text size="xs" ff="monospace" style={{ color: COLORS.comma }}>{indent}</Text>
            <Text size="xs" ff="monospace" style={{ color: COLORS.key }}>"{k}"</Text>
            <Text size="xs" ff="monospace" style={{ color: COLORS.colon }}>: </Text>
            <JsonValue value={value[k]} depth={depth + 1} />
            {i < keys.length - 1 && <Text component="span" size="xs" ff="monospace" style={{ color: COLORS.comma }}>,</Text>}
          </Group>
        ))}
      </Box>
      <Text size="xs" ff="monospace" style={{ color: COLORS.comma }}>{closingIndent}</Text>
      <Text component="span" size="xs" ff="monospace" style={{ color: COLORS.bracket }}>{'}'}</Text>
    </Box>
  );
}

export function JsonView({ data, compact }: { data: unknown; compact?: boolean }) {
  if (data === null || data === undefined) {
    return <Text size="xs" ff="monospace" style={{ color: COLORS.null }}>null</Text>;
  }

  if (typeof data === 'object' && !Array.isArray(data)) {
    return <JsonObject value={data as Record<string, unknown>} depth={0} />;
  }

  if (Array.isArray(data)) {
    return <JsonArray value={data} depth={0} />;
  }

  return <JsonValue value={data} depth={0} compact={compact} />;
}
