import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#dc2626',
          dark: '#b91c1c',
          light: '#ef4444',
          subtle: 'rgba(220, 38, 38, 0.08)',
        },
        kashmir: {
          DEFAULT: '#059669',
          dark: '#047857',
          light: '#10b981',
          subtle: 'rgba(5, 150, 105, 0.08)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Lora', 'Georgia', 'serif'],
        accent: ['var(--font-accent)', 'Bodoni Moda', 'Didot', 'serif'],
      },
      borderRadius: {
        'control': '10px',
        'card': '16px',
        'panel': '24px',
      },
    },
  },
  plugins: [
    typography,
  ],
};
