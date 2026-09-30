import net from 'net';
import { WebSocketServer, WebSocket } from 'ws';

const PROXY_PORT = Number(process.env.PROXY_PORT) || 9001;

const wss = new WebSocketServer({ port: PROXY_PORT });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '/', `http://localhost`);
  const host = url.searchParams.get('host') || '127.0.0.1';
  const port = Number(url.searchParams.get('port')) || 9000;

  console.log(`[proxy] ws connected → tcp ${host}:${port}`);

  const tcp = net.createConnection({ host, port }, () => {
    console.log(`[proxy] tcp connected to ${host}:${port}`);
    ws.send(JSON.stringify({ type: 'proxy_status', status: 'connected' }));
  });

  tcp.setEncoding('utf-8');

  let buffer = '';

  tcp.on('data', (chunk) => {
    buffer += chunk;
    let nl: number;
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl + 1);
      buffer = buffer.slice(nl + 1);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(line.trimEnd());
      }
    }
  });

  tcp.on('error', (err) => {
    console.error('[proxy] tcp error:', err.message);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'proxy_status', status: 'error', msg: err.message }));
    }
  });

  tcp.on('close', () => {
    console.log('[proxy] tcp closed');
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'proxy_status', status: 'disconnected' }));
      ws.close();
    }
  });

  ws.on('message', (data) => {
    const msg = data.toString();
    if (tcp.writable) {
      tcp.write(msg + '\n');
    }
  });

  ws.on('close', () => {
    console.log('[proxy] ws closed, destroying tcp');
    tcp.destroy();
  });

  ws.on('error', () => {
    tcp.destroy();
  });
});

console.log(`[proxy] listening on ws://localhost:${PROXY_PORT}`);
