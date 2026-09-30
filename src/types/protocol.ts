export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface HelloMsg {
  type: 'hello';
  proto: number;
}

export interface ComponentSchemaMsg {
  type: 'components.schema';
  slug: string;
  schema: SchemaDef | null;
  icon?: string;
  icon_color?: string;
}

export type SchemaDef =
  | null
  | { kind: 'tag' }
  | {
      kind: 'struct';
      label: string;
      fields: FieldDef[];
    };

export interface FieldDef {
  name: string;
  type: 'bool' | 'number' | 'string' | 'vec3' | 'enum' | 'raw';
  label?: string;
  writable?: boolean;
  readonly?: boolean;
}

export interface EntitySummary {
  index: number;
  name: string;
  classname: string;
  netname: string;
  free: boolean;
  icon?: string;
  icon_color?: string;
}

export interface EntitiesListMsg {
  type: 'entities.list';
  time: number;
  count: number;
  entities: EntitySummary[];
}

export interface ComponentTag {
  slug: string;
  kind: 'tag';
}

export interface ComponentData {
  slug: string;
  data: Record<string, unknown>;
}

export type ComponentSnapshot = ComponentTag | ComponentData;

/** Anything inspectable in the right pane — scene edict, definition, etc. */
export interface InspectableContainer {
  id: string;
  title: string;
  subtitle?: string;
  components: ComponentSnapshot[];
}

export function inspectableFromEntityOne(msg: EntityOneMsg): InspectableContainer {
  return {
    id: String(msg.index),
    title: msg.name,
    subtitle: `#${msg.index}`,
    components: msg.components,
  };
}

export interface EntityOneMsg {
  type: 'entities.one';
  index: number;
  name: string;
  components: ComponentSnapshot[];
}

// Events
export interface EventFieldDef {
  name: string;
  type: string;
}

export interface EventsSchemaMsg {
  type: 'events.schema';
  slug: string;
  description?: string;
  codec?: string;
  schema?: {
    bincode?: string;
    layout?: {
      kind: string;
      fields?: EventFieldDef[];
    };
  };
}

export interface EntitySchemaMsg {
  type: 'entity.schema';
  id: string;
  icon?: string;
  icon_color?: string;
}

export interface EventsOneMsg {
  type: 'events.one';
  id: number;
  slug: string;
  time: number;
  target_edict: number | null;
  codec: string;
  payload: string;
}

export interface ErrorMsg {
  type: 'error';
  msg: string;
}

export interface OkMsg {
  type: 'ok';
}

export type ServerMsg =
  | HelloMsg
  | ComponentSchemaMsg
  | EntitySchemaMsg
  | EntitiesListMsg
  | EntityOneMsg
  | EventsSchemaMsg
  | EventsOneMsg
  | ErrorMsg
  | OkMsg;

export interface ConnectionParams {
  host: string;
  port: number;
}

export interface EventEntry {
  id: number;
  slug: string;
  time: number;
  targetEdict: number | null;
  codec: string;
  payload: string;
}
