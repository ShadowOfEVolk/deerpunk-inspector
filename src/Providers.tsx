import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import { App } from './App';

const theme = createTheme({
  primaryColor: 'neon',
  primaryShade: 5,
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5C5F66',
      '#373A40',
      '#2C2E33',
      '#25262B',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
    neon: [
      '#e0fcff',
      '#bef8fd',
      '#87eaf2',
      '#54d1db',
      '#38bec9',
      '#2cb1bc',
      '#14919b',
      '#0f7c77',
      '#0a6c6c',
      '#044e54',
    ],
  },
  components: {
    Table: {
      styles: {
        th: { background: '#1a1d23', color: '#6b7280', fontWeight: 500, borderBottom: '1px solid #2a2d35' },
        td: { background: 'transparent', borderBottom: '1px solid #1f2229' },
        tr: { background: 'transparent' },
      },
    },
    TextInput: {
      styles: {
        input: {
          background: '#1a1d23',
          borderColor: '#2a2d35',
          color: '#e5e7eb',
          '&:focus-within': { borderColor: '#2cb1bc', boxShadow: '0 0 0 1px #2cb1bc33' },
        },
      },
    },
    NumberInput: {
      styles: {
        input: {
          background: '#1a1d23',
          borderColor: '#2a2d35',
          color: '#e5e7eb',
          '&:focus-within': { borderColor: '#2cb1bc', boxShadow: '0 0 0 1px #2cb1bc33' },
        },
      },
    },
    Select: {
      styles: {
        input: {
          background: '#1a1d23',
          borderColor: '#2a2d35',
          color: '#e5e7eb',
        },
      },
    },
    Badge: {
      styles: {
        root: { fontWeight: 500, letterSpacing: 0.3 },
      },
    },
    Button: {
      styles: {
        root: { letterSpacing: 0.3 },
      },
    },
  },
});

export function Providers() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <App />
    </MantineProvider>
  );
}
