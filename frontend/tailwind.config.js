/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172126',
        mist: '#eef5f3',
        teal: '#0f766e',
        coral: '#d66a5f',
        amber: '#d5943f',
      },
      boxShadow: {
        soft: '0 18px 60px rgba(23, 33, 38, 0.08)',
      },
    },
  },
  plugins: [],
};
