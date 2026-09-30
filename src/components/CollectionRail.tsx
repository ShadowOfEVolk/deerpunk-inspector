import { Box, Tooltip } from '@mantine/core';
import type { CollectionId } from '../collections/types';
import { RUNTIME_COLLECTIONS, DEFINITION_COLLECTIONS } from '../collections/registry';
import type { CollectionPlugin } from '../collections/types';

interface CollectionRailProps {
  active: CollectionId;
  onChange: (id: CollectionId) => void;
  badges?: Partial<Record<CollectionId, number>>;
}

function RailButton({
  c,
  isActive,
  badge,
  onChange,
}: {
  c: CollectionPlugin;
  isActive: boolean;
  badge?: number;
  onChange: (id: CollectionId) => void;
}) {
  return (
    <Tooltip label={c.label} position="right" withArrow>
      <Box
        component="button"
        type="button"
        onClick={() => onChange(c.id)}
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          background: isActive ? '#2cb1bc22' : 'transparent',
          color: isActive ? '#5eead4' : '#6b7280',
          borderLeft: isActive ? '2px solid #2cb1bc' : '2px solid transparent',
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = '#1a1d23';
            e.currentTarget.style.color = '#9ca3af';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }
        }}
      >
        {c.icon}
        {badge != null && badge > 0 && (
          <Box
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              minWidth: 14,
              height: 14,
              padding: '0 3px',
              borderRadius: 7,
              background: '#2cb1bc',
              color: '#0f1115',
              fontSize: 9,
              fontWeight: 700,
              lineHeight: '14px',
              textAlign: 'center',
            }}
          >
            {badge > 99 ? '99+' : badge}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}

export function CollectionRail({ active, onChange, badges }: CollectionRailProps) {
  const renderGroup = (items: CollectionPlugin[]) =>
    items.map((c) => (
      <RailButton
        key={c.id}
        c={c}
        isActive={c.id === active}
        badge={badges?.[c.id]}
        onChange={onChange}
      />
    ));

  return (
    <Box
      style={{
        width: 44,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '8px 0',
        background: '#101113',
        borderRight: '1px solid #2a2d35',
      }}
    >
      {renderGroup(RUNTIME_COLLECTIONS)}
      <Box
        style={{
          width: 28,
          height: 1,
          margin: '4px 0',
          background: '#2a2d35',
          flexShrink: 0,
        }}
      />
      {renderGroup(DEFINITION_COLLECTIONS)}
    </Box>
  );
}

export type { CollectionId };
