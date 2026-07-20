/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Verde nobre — cor da marca (base / acento principal)
        primary: {
          50: '#ecf7f0',
          100: '#d0ecda',
          200: '#a4d9bc',
          300: '#6ebf95',
          400: '#43a173',
          500: '#237a50',
          600: '#1b6241',
          700: '#164e35',
          800: '#133e2b',
          900: '#0f2f22',
        },
        // Ouro — acento (bate com a logo)
        gold: {
          50: '#faf5e6',
          100: '#f3e7c2',
          200: '#e9d296',
          300: '#dcb85f',
          400: '#cfa23a',
          500: '#b98a2c',
          600: '#9c7025',
          700: '#7d5820',
          800: '#66481f',
          900: '#553c1d',
        },
      },
      backgroundImage: {
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(150,55%,45%,0.22) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(43,65%,55%,0.16) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(150,45%,40%,0.14) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(43,60%,50%,0.14) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(150,50%,35%,0.16) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(43,55%,45%,0.12) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(150,50%,40%,0.16) 0px, transparent 50%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 15s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(10, 25, 18, 0.25)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      backdropBlur: {
        'glass': '16px',
      },
    },
  },
  plugins: [],
}
