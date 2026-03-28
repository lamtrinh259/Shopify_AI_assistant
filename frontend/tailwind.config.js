/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#0D0D0D',
          1: '#161616',
          2: '#1F1F1F',
          3: '#2A2A2A',
        },
        border: {
          DEFAULT: '#1F1F1F',
          hover: '#2A2A2A',
          active: '#3A3A3A',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0A0',
          tertiary: '#606060',
        },
        accent: {
          DEFAULT: '#F0B90B',
          dim: 'rgba(240,185,11,0.12)',
          hover: 'rgba(240,185,11,0.18)',
        },
        status: {
          success: '#00E676',
          warning: '#FF9100',
          error: '#FF3D57',
          info: '#448AFF',
        },
        paint: {
          yellow: '#F0B90B',
          green: '#00E676',
          red: '#FF3D57',
          blue: '#448AFF',
          purple: '#B388FF',
          orange: '#FF9100',
        },
      },
      fontFamily: {
        headline: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['11px', { lineHeight: '16px' }],
        'sm': ['12px', { lineHeight: '16px' }],
        'base': ['13px', { lineHeight: '20px' }],
        'lg': ['14px', { lineHeight: '20px' }],
        'xl': ['16px', { lineHeight: '24px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        'hero': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
      borderRadius: {
        'card': '12px',
      },
      keyframes: {
        'pollock-fade': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pollock-fade': 'pollock-fade 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
