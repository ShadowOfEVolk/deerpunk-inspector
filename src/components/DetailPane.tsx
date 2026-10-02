import { Box, Text } from '@mantine/core';
import { CollectionDetail } from './CollectionDetail';
import type { InspectorSelection } from '../types/protocol';
import type { useConnection } from '../hooks/useConnection';
import type { CollectionRow } from '../lib/collectionWire';

interface DetailPaneProps {
  selection: InspectorSelection | null;
  conn: ReturnType<typeof useConnection>;
  entityLookup: CollectionRow[];
  onNavigateEntity: (index: number) => void;
}

export function DetailPane({ selection, conn, entityLookup, onNavigateEntity }: DetailPaneProps) {
  if (selection) {
    return (
      <CollectionDetail
        selection={selection}
        conn={conn}
        entityLookup={entityLookup}
        onNavigateEntity={onNavigateEntity}
      />
    );
  }

  return (
    <Box
      style={{
        height: '100%',
        background: '#090a0c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#374151', fontStyle: 'italic' }} size="sm">
        Select an item
      </Text>
    </Box>
  );
}
