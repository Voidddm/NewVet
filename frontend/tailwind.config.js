/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#2f2935',
        mist: '#fff4f5',
        teal: '#9a91ac',
        coral: '#ffb9c4',
        amber: '#caa7bd',
        blush: '#ffd3d4',
        mauve: '#caa7bd',
        lavender: '#9a91ac',
      },
      boxShadow: {
        soft: '0 18px 60px rgba(154, 145, 172, 0.18)',
      },
    },
  },
  plugins: [],
};
