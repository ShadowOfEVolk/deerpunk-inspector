import type { ReactNode } from 'react';
import type {
  InspectableContainer,
  EventEntry,
  EntitySummary,
  SchemaDef,
  EntitySchemaMsg,
  EventsSchemaMsg,
} from '../types/protocol';
import type { useConnection } from '../hooks/useConnection';
import type { CompIcon } from '../hooks/useConnection';

export type CollectionId =
  | 'entities'
  | 'events'
  | 'component-defs'
  | 'entity-defs'
  | 'event-defs';

export type CollectionGroup = 'runtime' | 'definitions';

export type InspectorConnection = ReturnType<typeof useConnection>;

export type InspectorSelection =
  | { kind: 'inspectable'; container: InspectableContainer }
  | { kind: 'event'; event: EventEntry }
  | { kind: 'component-def'; slug: string; schema: SchemaDef | null; icon?: CompIcon }
  | { kind: 'entity-def'; id: string; schema: EntitySchemaMsg }
  | { kind: 'event-def'; slug: string; schema: EventsSchemaMsg }
  | null;

export interface CollectionPanelProps {
  conn: InspectorConnection;
  active: boolean;
  onSelect: (selection: InspectorSelection) => void;
  onNavigate: (id: CollectionId, payload?: { selectEntity?: number }) => void;
  /** summaries for cross-links (entity refs in events) */
  entitySummaries: EntitySummary[];
  onEntitySummaries: (entities: EntitySummary[]) => void;
}

export interface CollectionPlugin {
  id: CollectionId;
  label: string;
  icon: ReactNode;
  group: CollectionGroup;
  badge?: (props: { conn: InspectorConnection; active: boolean; seenAt: number }) => number;
}
