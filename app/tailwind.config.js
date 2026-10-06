/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0c',
        foreground: '#ededed',
        card: '#121216',
        border: '#24242e',
        muted: '#8e8e9a',
        accent: '#e6a836',
        accentDark: '#b87f1c',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        hand: ['Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
}
