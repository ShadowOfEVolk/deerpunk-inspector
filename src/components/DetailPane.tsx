import { Box, Text } from '@mantine/core';
import { Inspector } from './Inspector';
import { EventDetail } from './EventDetail';
import { DefinitionDetail } from './DefinitionDetail';
import type { InspectorSelection, InspectorConnection } from '../collections/types';
import type { EntitySummary } from '../types/protocol';

interface DetailPaneProps {
  selection: InspectorSelection;
  conn: InspectorConnection;
  entitySummaries: EntitySummary[];
  onSelectEntity: (index: number) => void;
}

function isDefinitionSelection(s: InspectorSelection): boolean {
  return s != null && (s.kind === 'component-def' || s.kind === 'entity-def' || s.kind === 'event-def');
}

export function DetailPane({ selection, conn, entitySummaries, onSelectEntity }: DetailPaneProps) {
  if (selection?.kind === 'event') {
    return (
      <EventDetail
        event={selection.event}
        entities={entitySummaries}
        eventSchemas={conn.eventSchemas}
        onSelectEntity={onSelectEntity}
      />
    );
  }

  if (selection?.kind === 'inspectable') {
    return (
      <Inspector
        container={selection.container}
        schemas={conn.schemas}
        compIcons={conn.compIcons}
      />
    );
  }

  if (isDefinitionSelection(selection)) {
    return <DefinitionDetail selection={selection} />;
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
