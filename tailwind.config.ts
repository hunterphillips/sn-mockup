import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ServiceNow Horizon Design System Colors
        sn: {
          // Chrome/Brand (header)
          'chrome': {
            DEFAULT: '#293e40',
            light: '#3d5a5e',
            dark: '#1a2a2c',
          },
          // Primary (actions)
          'primary': {
            DEFAULT: '#1a73e8',
            hover: '#1557b0',
            light: '#e8f0fe',
          },
          // Neutral palette
          'neutral': {
            0: '#ffffff',
            1: '#f7f7f7',
            2: '#ebebeb',
            3: '#e1e1e1',
            4: '#cfcfcf',
            5: '#b8b8b8',
            6: '#8c8c8c',
            7: '#6b6b6b',
            8: '#3d3d3d',
            9: '#292929',
            10: '#000000',
          },
          // Semantic colors
          'critical': {
            DEFAULT: '#d32f2f',
            light: '#ffebee',
          },
          'warning': {
            DEFAULT: '#ed6c02',
            light: '#fff3e0',
          },
          'positive': {
            DEFAULT: '#2e7d32',
            light: '#e8f5e9',
          },
          'info': {
            DEFAULT: '#0288d1',
            light: '#e1f5fe',
          },
          // Interactive
          'link': {
            DEFAULT: '#1a73e8',
            hover: '#1557b0',
            visited: '#681da8',
          },
        },
      },
      fontFamily: {
        'header': ['Cabin', 'sans-serif'],
        'body': ['Lato', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['20px', { lineHeight: '28px' }],
        'xl': ['24px', { lineHeight: '32px' }],
        '2xl': ['32px', { lineHeight: '40px' }],
      },
      spacing: {
        // 8px grid system
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
      },
      boxShadow: {
        // ServiceNow elevation levels
        'sn-1': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sn-2': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'sn-3': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'sn-4': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'sn-5': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'sn': '4px',
        'sn-lg': '8px',
      },
    },
  },
  plugins: [],
}

export default config
