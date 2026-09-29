/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // Carvão profundo (base)
        ink: {
          950: '#0a0a0a',
          900: '#0f0f0f',
          800: '#151515',
          700: '#1a1a1a',
          600: '#242424',
          500: '#33312d',
          400: '#4a4740',
          300: '#7a7466',
        },
        // Dourado (destaque). DEFAULT sobre ink-900 = ~9:1.
        gold: {
          DEFAULT: '#d4af37',
          soft: '#c9a24b',
          light: '#e8cc74',
          dark: '#a8862a',
        },
        // Vermelho da logo (uso pontual: CTA principal e detalhes)
        brand: {
          DEFAULT: '#c8102e',
          dark: '#a30d25',
          light: '#e0243f',
        },
        // Off-white quente para texto
        cream: {
          DEFAULT: '#f5efe3',
          muted: '#bdb4a3',
          dim: '#9c9484',
        },
        ok: '#7fc98f',
        danger: '#ff8a8a',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(212,175,55,.25), 0 12px 40px -12px rgba(212,175,55,.25)',
        card: '0 10px 30px -14px rgba(0,0,0,.8)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(.6)' },
          '60%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        rise: 'rise .45s ease-out both',
        pop: 'pop .3s ease-out',
      },
    },
  },
  plugins: [],
};
