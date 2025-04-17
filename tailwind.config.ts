import type { Config } from 'tailwindcss';
import type { ThemeConfig } from 'tailwindcss/types/config';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cyan': {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
      },
      typography: (theme: (path: string) => string) => ({
        DEFAULT: {
          css: {
            a: {
              color: theme('colors.cyan.400'),
              '&:hover': {
                color: theme('colors.cyan.300'),
              },
            },
            h1: {
              color: theme('colors.white'),
              marginTop: '2rem',
              marginBottom: '1rem',
            },
            h2: {
              color: theme('colors.cyan.400'),
              marginTop: '1.5rem',
              marginBottom: '0.75rem',
            },
            h3: {
              color: theme('colors.cyan.300'),
              marginTop: '1.5rem',
              marginBottom: '0.75rem',
            },
            blockquote: {
              borderLeftColor: theme('colors.cyan.800'),
              backgroundColor: theme('colors.gray.900'),
              color: theme('colors.gray.300'),
            },
            code: {
              color: theme('colors.cyan.400'),
              backgroundColor: theme('colors.gray.800'),
              padding: '0.25rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            hr: {
              borderColor: theme('colors.gray.700'),
            },
            ul: {
              li: {
                '&::marker': {
                  color: theme('colors.cyan.500'),
                },
              },
            },
          },
        },
        invert: {
          css: {
            color: theme('colors.gray.300'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;