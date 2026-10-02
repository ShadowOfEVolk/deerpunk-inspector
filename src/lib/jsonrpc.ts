export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export type JsonRpcId = number | string;

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: JsonRpcId;
  method: string;
  params?: unknown;
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: JsonRpcId | null;
  result?: unknown;
  error?: JsonRpcError;
}

type NotificationHandler = (params: unknown) => void;

export class JsonRpcClient {
  private nextId = 1;
  private pending = new Map<JsonRpcId, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private handlers = new Map<string, Set<NotificationHandler>>();

  constructor(private send: (payload: string) => void) {}

  call(method: string, params?: unknown): Promise<unknown> {
    const id = this.nextId++;
    const req: JsonRpcRequest = { jsonrpc: '2.0', id, method, ...(params !== undefined ? { params } : {}) };
    this.send(JSON.stringify(req));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  notify(method: string, params?: unknown): void {
    const msg: JsonRpcNotification = { jsonrpc: '2.0', method, ...(params !== undefined ? { params } : {}) };
    this.send(JSON.stringify(msg));
  }

  on(method: string, handler: NotificationHandler): () => void {
    let set = this.handlers.get(method);
    if (!set) {
      set = new Set();
      this.handlers.set(method, set);
    }
    set.add(handler);
    return () => {
      set!.delete(handler);
    };
  }

  rejectAll(reason: string): void {
    for (const [, p] of this.pending) {
      p.reject(new Error(reason));
    }
    this.pending.clear();
  }

  handleMessage(raw: string): void {
    let msg: unknown;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (!msg || typeof msg !== 'object' || (msg as { jsonrpc?: string }).jsonrpc !== '2.0') {
      return;
    }

    const frame = msg as Record<string, unknown>;

    if (typeof frame.method === 'string' && !('id' in frame)) {
      const handlers = this.handlers.get(frame.method);
      if (handlers) {
        for (const h of handlers) {
          h(frame.params);
        }
      }
      return;
    }

    if (frame.id != null) {
      const pending = this.pending.get(frame.id as JsonRpcId);
      if (!pending) return;
      this.pending.delete(frame.id as JsonRpcId);
      if (frame.error && typeof frame.error === 'object') {
        const err = frame.error as JsonRpcError;
        pending.reject(new Error(`${err.code}: ${err.message}`));
      } else {
        pending.resolve(frame.result);
      }
    }
  }
}
