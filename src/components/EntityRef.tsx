import { Text, Group } from '@mantine/core';

export interface EntityLookupRow {
  index: number;
  classname: string;
}

interface EntityRefProps {
  edict: number;
  entities: EntityLookupRow[];
  onSelect: (index: number) => void;
}

export function EntityRef({ edict, entities, onSelect }: EntityRefProps) {
  const e = entities.find((x) => x.index === edict);
  if (!e) {
    return <Text size="xs" ff="monospace" style={{ color: '#4b5563' }}>#{edict}</Text>;
  }
  return (
    <Group
      gap={4}
      wrap="nowrap"
      style={{
        cursor: 'pointer',
        borderRadius: 4,
        padding: '1px 6px',
        background: '#22d3ee11',
        border: '1px solid #22d3ee33',
      }}
      onClick={(ev) => { ev.stopPropagation(); onSelect(edict); }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#22d3ee22'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#22d3ee11'; }}
    >
      <Text size="xs" ff="monospace" style={{ color: '#22d3ee', fontSize: 10 }}>#{e.index}</Text>
      <Text size="xs" ff="monospace" style={{ color: '#d1d5db', fontSize: 10 }} truncate>{e.classname}</Text>
    </Group>
  );
}
