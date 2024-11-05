/** @type {import('tailwindcss').Config} */
export default {
  content: ['./client/*.{html,js}'],
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
      }
    }
  },
}