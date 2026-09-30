import { IconBox, IconBolt, IconPuzzle, IconCategory, IconBrackets } from '@tabler/icons-react';
import { eventsBadge } from './events';
import type { CollectionPlugin } from './types';

export const RUNTIME_COLLECTIONS: CollectionPlugin[] = [
  {
    id: 'entities',
    label: 'Entities',
    icon: <IconBox size={18} stroke={1.5} />,
    group: 'runtime',
  },
  {
    id: 'events',
    label: 'Events',
    icon: <IconBolt size={18} stroke={1.5} />,
    group: 'runtime',
    badge: ({ conn, active, seenAt }) => eventsBadge({ conn, active, seenAt }),
  },
];

export const DEFINITION_COLLECTIONS: CollectionPlugin[] = [
  {
    id: 'component-defs',
    label: 'Component Definitions',
    icon: <IconPuzzle size={18} stroke={1.5} />,
    group: 'definitions',
  },
  {
    id: 'entity-defs',
    label: 'Entity Definitions',
    icon: <IconCategory size={18} stroke={1.5} />,
    group: 'definitions',
  },
  {
    id: 'event-defs',
    label: 'Event Definitions',
    icon: <IconBrackets size={18} stroke={1.5} />,
    group: 'definitions',
  },
];

export const COLLECTIONS: CollectionPlugin[] = [...RUNTIME_COLLECTIONS, ...DEFINITION_COLLECTIONS];
