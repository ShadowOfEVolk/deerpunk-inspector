import { Group, Badge, Button, Text, Box, Select } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import type { ConnectionState } from '../types/protocol';

const STATUS_CONFIG: Record<ConnectionState, { color: string; label: string; glow: string }> = {
  connected: { color: 'green', label: 'ONLINE', glow: '0 0 8px #22c55e44' },
  connecting: { color: 'yellow', label: 'CONN', glow: '0 0 8px #eab30844' },
  disconnected: { color: 'gray', label: 'OFF', glow: 'none' },
  error: { color: 'red', label: 'ERR', glow: '0 0 8px #ef444444' },
};

interface RefreshOption {
  value: number;
  label: string;
}

interface StatusBarProps {
  state: ConnectionState;
  host: string;
  port: number;
  onRefresh: () => void;
  onReconnect: () => void;
  refreshMs: number;
  onRefreshChange: (ms: number) => void;
  refreshOptions: RefreshOption[];
}

export function StatusBar({
  state,
  host,
  port,
  onRefresh,
  onReconnect,
  refreshMs,
  onRefreshChange,
  refreshOptions,
}: StatusBarProps) {
  const s = STATUS_CONFIG[state];
  const canAct = state === 'connected';

  return (
    <Box
      px="sm"
      py={3}
      style={{
        flexShrink: 0,
        background: '#101113',
        borderTop: `1px solid ${state === 'connected' ? '#22c55e22' : state === 'error' ? '#ef444422' : '#2a2d35'}`,
      }}
    >
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Group gap="sm" wrap="nowrap">
          <Text fw={600} size="xs" style={{ color: '#9ca3af', letterSpacing: 0.5 }}>
            DEERPUNK
          </Text>
          <Badge
            size="xs"
            color={s.color}
            variant="filled"
            tt="uppercase"
            style={{ boxShadow: s.glow, letterSpacing: 0.5, fontSize: 8, height: 16 }}
          >
            {s.label}
          </Badge>
          <Text size="xs" style={{ color: '#4b5563', fontFamily: 'monospace', fontSize: 10 }}>
            {host}:{port}
          </Text>
        </Group>
        <Group gap={6} wrap="nowrap">
          <Select
            size="xs"
            value={String(refreshMs)}
            onChange={(v) => onRefreshChange(Number(v ?? 0))}
            data={refreshOptions.map((o) => ({ value: String(o.value), label: o.label }))}
            variant="filled"
            styles={{ input: { minHeight: 24, height: 24, fontSize: 11 } }}
            style={{ width: 72 }}
            allowDeselect={false}
            searchable={false}
          />
          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            px={6}
            onClick={onRefresh}
            disabled={!canAct}
          >
            <IconRefresh size={13} />
          </Button>
          {state === 'error' && (
            <Button size="compact-xs" variant="light" color="red" onClick={onReconnect}>
              Retry
            </Button>
          )}
        </Group>
      </Group>
    </Box>
  );
}
