import { Box, Text } from '@mantine/core';
import { IconList, IconBook } from '@tabler/icons-react';
import type { CollectionDescriptor } from '../types/protocol';

interface CollectionRailProps {
  groups: { runtime: CollectionDescriptor[]; definitions: CollectionDescriptor[] };
  active: string;
  onChange: (id: string) => void;
  badges?: Record<string, number>;
}

function RailButton({
  descriptor,
  isActive,
  badge,
  onChange,
}: {
  descriptor: CollectionDescriptor;
  isActive: boolean;
  badge?: number;
  onChange: (id: string) => void;
}) {
  const icon = descriptor.group === 'definitions'
    ? <IconBook size={18} stroke={1.5} />
    : <IconList size={18} stroke={1.5} />;

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onChange(descriptor.id)}
      style={{
        position: 'relative',
        width: '100%',
        height: 34,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 10px',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        background: isActive ? '#2cb1bc18' : 'transparent',
        color: isActive ? '#5eead4' : '#9ca3af',
        borderLeft: isActive ? '2px solid #2cb1bc' : '2px solid transparent',
        transition: 'background 0.15s, color 0.15s',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = '#1a1d23';
          e.currentTarget.style.color = '#d1d5db';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#9ca3af';
        }
      }}
    >
      <Box style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</Box>
      <Text size="xs" truncate style={{ flex: 1, fontWeight: isActive ? 600 : 500, letterSpacing: 0.2 }}>
        {descriptor.label}
      </Text>
      {badge != null && badge > 0 && (
        <Box
          style={{
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            borderRadius: 8,
            background: '#2cb1bc',
            color: '#0f1115',
            fontSize: 9,
            fontWeight: 700,
            lineHeight: '16px',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          {badge > 99 ? '99+' : badge}
        </Box>
      )}
    </Box>
  );
}

export function CollectionRail({ groups, active, onChange, badges }: CollectionRailProps) {
  const renderGroup = (items: CollectionDescriptor[]) =>
    items.map((descriptor) => (
      <RailButton
        key={descriptor.id}
        descriptor={descriptor}
        isActive={descriptor.id === active}
        badge={badges?.[descriptor.id]}
        onChange={onChange}
      />
    ));

  return (
    <Box
      style={{
        width: 168,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '8px 6px',
        background: '#101113',
        borderRight: '1px solid #2a2d35',
      }}
    >
      {renderGroup(groups.runtime)}
      {groups.definitions.length > 0 && (
        <Box style={{ height: 1, margin: '6px 8px', background: '#2a2d35', flexShrink: 0 }} />
      )}
      {renderGroup(groups.definitions)}
    </Box>
  );
}
