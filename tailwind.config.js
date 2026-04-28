/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#050507',
          card: '#0e0e12',
          elevated: '#17171c',
          hover: '#1f1f26',
          border: 'rgba(255, 255, 255, 0.06)',
        },
        accent: {
          DEFAULT: '#34d399',
          muted: 'rgba(52, 211, 153, 0.12)',
          hover: '#2bc48c',
        },
        secondary: {
          DEFAULT: '#a78bfa',
          muted: 'rgba(167, 139, 250, 0.12)',
        },
        urgent: {
          high: '#fb7185',
          medium: '#fbbf24',
          low: '#34d399',
        },
        assigned: '#818cf8',
        resolved: '#52525b',
        text: {
          primary: '#fafafa',
          secondary: '#71717a',
          muted: '#3f3f46',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-urgent': 'pulseUrgent 2.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseUrgent: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(251, 113, 133, 0.35)' },
          '50%': { boxShadow: '0 0 0 12px rgba(251, 113, 133, 0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(52, 211, 153, 0.05)' },
          '100%': { boxShadow: '0 0 40px rgba(52, 211, 153, 0.1)' },
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
}
