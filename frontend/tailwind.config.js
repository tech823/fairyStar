/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['DM Sans', 'sans-serif'],
                heading: ['Outfit', 'sans-serif'],
            },
            colors: {
                // Brand Colors - NO PURPLE
                brand: {
                    orange: '#F3A15A',
                    'orange-light': '#F5B77A',
                    'orange-dark': '#E8935A',
                },
                // Neutral Slate Palette
                slate: {
                    900: '#2D3139',
                    800: '#333D47',
                    700: '#3D4852',
                    600: '#4A5568',
                    500: '#64748B',
                    400: '#94A3B8',
                    300: '#CBD5E1',
                    200: '#E2E8F0',
                    100: '#F1F5F9',
                },
                // Accent Colors (minimal use)
                teal: {
                    DEFAULT: '#14B8A6',
                    light: '#2DD4BF',
                    dark: '#0D9488',
                },
                gold: {
                    DEFAULT: '#D4A574',
                    light: '#E4C9A8',
                    dark: '#B8956A',
                },
                // Status Colors
                success: '#22C55E',
                warning: '#EAB308',
                error: '#EF4444',
                info: '#3B82F6',
                // Legacy mappings for compatibility
                navy: {
                    DEFAULT: '#333D47',
                    light: '#4A5568',
                    dark: '#2D3748',
                },
                orange: {
                    DEFAULT: '#F3A15A',
                    light: '#F5B77A',
                    dark: '#E8935A',
                },
                // Semantic colors
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                }
            },
            spacing: {
                '18': '4.5rem',
                '22': '5.5rem',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
                xl: '1rem',
                '2xl': '1.5rem',
            },
            backdropBlur: {
                xs: '2px',
            },
            boxShadow: {
                'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
                'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.2)',
                'glow': '0 0 30px rgba(243, 161, 90, 0.15)',
                'glow-strong': '0 0 40px rgba(243, 161, 90, 0.3)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
                'fade-in-up': {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                'slide-in-right': {
                    '0%': { opacity: '0', transform: 'translateX(30px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' }
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' }
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                    '50%': { transform: 'translateY(-20px) rotate(3deg)' }
                },
                'float-slow': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-12px)' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
                'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
                'shimmer': 'shimmer 2s infinite',
                'float': 'float 6s ease-in-out infinite',
                'float-slow': 'float-slow 8s ease-in-out infinite',
            },
            screens: {
                'xs': '375px',
                '3xl': '1920px',
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
