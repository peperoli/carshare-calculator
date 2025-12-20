import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}'],
  theme: {
    fontFamily: {
      sans: ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      mono: ['Roboto Mono', 'ui-monospace', 'monospace'],
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000000',
      white: '#FFFFFF',
      gray: {
        50: 'hsl(210, 20%, 98%)',
        100: 'hsl(210, 16%, 96%)',
        200: 'hsl(210, 12%, 92%)',
        300: 'hsl(210, 8%, 84%)',
        400: 'hsl(210, 6%, 72%)',
        500: 'hsl(210, 4%, 60%)',
        600: 'hsl(210, 3%, 48%)',
        700: 'hsl(210, 2%, 36%)',
        800: 'hsl(210, 1%, 24%)',
        900: 'hsl(210, 1%, 12%)',
      },
      orange: {
        600: '#CB810B',
      },
      teal: {
        700: '#178282',
      },
      red: {
        300: '#FCA5A5',
        700: '#B91C1C',
      },
      green: {
        300: '#86EFAC',
        700: '#166534',
      },
    },
    extend: {},
  },
  corePlugins: {
    container: false,
  },
  plugins: [],
} satisfies Config
