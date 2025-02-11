/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
  variants: {
    extend: {
      cursor: ['disabled'],
      pointerEvents: ['disabled'],
      backgroundColor: ['disabled']
    }
  },
  theme: {
    extend: {
      colors: {
        'main-dark': '#1f1c23',
        'main-light': '#ebf5f8',
        'primary-dark': '#1f383a',
        'primary-light': '#dcffeb'
      },
      keyframes: {
        fadeInUpwards: {
          '0%': { transform: 'translateX(-40px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 }
        },
        glow: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '800% 0' }
        },
        rotatingBorder: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.4)' },
          '100%': { transform: 'rotate(360deg) scale(1)' }
        }
      },
      animation: {
        fadeInUpwards: 'fadeInUpwards .5s ease-in-out forwards',
        glow: 'glow 10s linear infinite',
        'rotating-border': 'rotatingBorder 5s linear infinite'
      }
    }
  },
  plugins: []
}
