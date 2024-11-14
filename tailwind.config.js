/** @type {import('tailwindcss').Config} */
export default {
  content: ['./client/*.{html,js}'],
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
      'orange': '#ffa500',
      },
      spacing: {
        '8xl': '96rem',
        '9xl': '128rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      translate: {
        'full': '100vw',
      },
      width: {
        'min-menu': '3.4em',
        'mid-menu': '25%'
      },
      minWidth: {
        'webkit-fill-available': '-webkit-fill-available'
      }
    }
  },
}