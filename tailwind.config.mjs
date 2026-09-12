/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F4F7FA',
          100: '#E6EEF4',
          200: '#C9D8E6',
          300: '#A3BDD2',
          400: '#6E97B5',
          500: '#3E7399',
          600: '#2D5F8A',
          700: '#255070',
          800: '#2D5F8A',
          900: '#1A3A54',
          950: '#122838',
        },
        heal: {
          50: '#F0F5F8',
          100: '#DCE7EF',
          500: '#5A8AAD',
          600: '#2D5F8A',
          700: '#255070',
        },
        warm: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        danger: {
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        ink: {
          DEFAULT: '#2D3436',
          light: '#5C6365',
        },
        mist: {
          DEFAULT: '#B9B6AC',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F7F5F2',
        },
        night: {
          bg: '#2D3436',
          surface: '#3A4244',
          border: '#4A5254',
          text: '#F7F5F2',
          footer: '#242A2C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['2.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['1.75rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['1.25rem', { lineHeight: '1.5', fontWeight: '500' }],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '96px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
      },
      boxShadow: {
        'card-sm': '0 1px 2px rgba(45, 52, 54, 0.05)',
        'card-md': '0 4px 6px rgba(45, 52, 54, 0.07)',
        'card-lg': '0 10px 15px rgba(45, 52, 54, 0.1)',
        'card-xl': '0 20px 25px rgba(45, 52, 54, 0.15)',
      },
      maxWidth: {
        content: '1280px',
      },
    },
  },
  plugins: [],
}
