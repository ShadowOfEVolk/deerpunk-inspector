export type ConnectionState = 'disconnected' | 'connecting' | 'handshaking' | 'connected' | 'error';

export type CollectionMode = 'list' | 'get' | 'stream' | 'catalog';

export type CollectionGroup = 'runtime' | 'definitions';

export interface CollectionDescriptor {
  id: string;
  label: string;
  group: CollectionGroup;
  modes: CollectionMode[];
  idField: string;
  nestedIn?: string;
}

export interface InitializeParams {
  proto: number;
  client: string;
  clientVersion?: string;
}

export interface InitializeResult {
  proto: number;
  server: string;
  serverVersion?: string;
  collections: CollectionDescriptor[];
  capabilities?: Record<string, boolean>;
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

export interface ComponentTag {
  slug: string;
  kind: 'tag';
}

export interface ComponentData {
  slug: string;
  data: Record<string, unknown>;
}

export type ComponentSnapshot = ComponentTag | ComponentData;

export interface InspectableContainer {
  id: string;
  title: string;
  subtitle?: string;
  components: ComponentSnapshot[];
}

export function inspectableFromGetResult(result: Record<string, unknown>): InspectableContainer {
  const index = result.index;
  const name = typeof result.name === 'string' ? result.name : String(index ?? '?');
  const components = Array.isArray(result.components) ? (result.components as ComponentSnapshot[]) : [];
  return {
    id: String(index ?? name),
    title: name,
    subtitle: index != null ? `#${index}` : undefined,
    components,
  };
}

export interface ConnectionParams {
  host: string;
  port: number;
}

export interface InspectorSelection {
  collectionId: string;
  row: Record<string, unknown>;
  detail?: InspectableContainer | Record<string, unknown>;
}

export const RPC = {
  initialize: 'inspector.initialize',
  initialized: 'inspector.initialized',
} as const;
