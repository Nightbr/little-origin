/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // Brand-specific names for clarity
        'calm-ivory': '#F5F5F0',
        'sage-green': '#A8B8A0',
        'warm-clay': '#D88C74',
        charcoal: '#3D403D',
      },
      fontFamily: {
        sans: ['Lato', 'Inter', 'sans-serif'],
        heading: ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        nurture: '0 4px 20px -4px rgba(168, 184, 160, 0.2)',
        'nurture-lg': '0 10px 40px -6px rgba(168, 184, 160, 0.3)',
      },
    },
  },
  plugins: [],
};
