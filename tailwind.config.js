/** @type {import('tailwindcss').Config} */

// Tokens de movimento: um só vocabulário para todo o site (150-350 ms, easing suave).
const EASE_SOFT = 'cubic-bezier(.22,.61,.36,1)';
const EASE_SPRING = 'cubic-bezier(.34,1.32,.64,1)';

module.exports = {
  content: ['./src/**/*.{html,ts}'],
  // Hover só em dispositivos que têm hover (no celular não "gruda" após o toque).
  future: { hoverOnlyWhenSupported: true },
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
          300: '#7a7466', // borda de campo/controle: >= 3,9:1 sobre ink-800
        },
        // Dourado (destaque). DEFAULT sobre ink-900 = ~9:1.
        gold: {
          DEFAULT: '#d4af37',
          soft: '#c9a24b',
          light: '#e8cc74',
          dark: '#a8862a',
        },
        // Vermelho da logo (uso pontual: CTA principal e detalhes). Branco sobre DEFAULT = 5,9:1; sobre light = 5,1:1.
        brand: {
          DEFAULT: '#c8102e',
          dark: '#a30d25',
          light: '#d81b38',
        },
        // Off-white quente para texto. Sobre ink-800: DEFAULT 16:1, muted 10:1, dim 7,1:1.
        cream: {
          DEFAULT: '#f5efe3',
          muted: '#cbc2b0',
          dim: '#b0a895',
        },
        // Tons quentes dos placeholders de sabor (um por categoria).
        warm: {
          tradicional: '#3a2519',
          especial: '#38301a',
          doce: '#3b2029',
        },
        ok: '#7fc98f',
        danger: '#ff8a8a',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      // Escala mínima: até o menor texto (legendas) fica em 13px.
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.25rem' }],
      },
      boxShadow: {
        // Realce dourado suave (só em hover/seleção; nada de brilho permanente).
        glow: '0 0 0 1px rgba(212,175,55,.16), 0 10px 26px -18px rgba(212,175,55,.35)',
        lift: '0 12px 26px -16px rgba(0,0,0,.75)',
        card: 'none',
      },
      transitionDuration: {
        DEFAULT: '200ms',
        fast: '150ms',
        base: '220ms',
        slow: '350ms',
      },
      transitionTimingFunction: {
        DEFAULT: EASE_SOFT,
        soft: EASE_SOFT,
        spring: EASE_SPRING,
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // "Pulinho" do contador do carrinho.
        pop: {
          '0%': { transform: 'scale(.72)' },
          '55%': { transform: 'scale(1.16)' },
          '100%': { transform: 'scale(1)' },
        },
        // Vibração curta de erro (transform apenas).
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(2px)' },
        },
        'sheet-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'sheet-out': {
          '0%': { opacity: '1', transform: 'none' },
          '100%': { opacity: '0', transform: 'translateY(-8px)' },
        },
        'step-fwd': {
          '0%': { opacity: '0', transform: 'translateX(14px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'step-back': {
          '0%': { opacity: '0', transform: 'translateX(-14px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'soft-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(.985)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        // Número que muda (quantidade): sobe 4px e clareia.
        tick: {
          '0%': { opacity: '.2', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'check-in': {
          '0%': { opacity: '0', transform: 'scale(.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        rise: `rise 350ms ${EASE_SOFT} backwards`,
        'fade-in': `fade-in 220ms ${EASE_SOFT} backwards`,
        pop: `pop 300ms ${EASE_SPRING}`,
        shake: `shake 320ms ${EASE_SOFT}`,
        'sheet-in': `sheet-in 240ms ${EASE_SOFT} backwards`,
        'sheet-out': `sheet-out 180ms ${EASE_SOFT} forwards`,
        'soft-in': `soft-in 350ms ${EASE_SOFT} backwards`,
        tick: `tick 200ms ${EASE_SOFT}`,
        'check-in': `check-in 300ms ${EASE_SPRING} 100ms backwards`,
      },
    },
  },
  plugins: [],
};
