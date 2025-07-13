/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                cb: {
                    bg: '#F6F8FA', // background
                    card: '#FFFFFF', // card background
                    border: '#E5EAF0', // soft border
                    primary: '#3B4B5A', // dark blue-gray
                    secondary: '#7A8CA3', // muted blue-gray
                    accent: '#7DE3F3', // teal accent
                    highlight: '#B6D0E2', // light blue highlight
                    chip: '#D1D8E0', // chip gray
                    fan: '#A3B8C9', // fan gray
                },
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
            },
            borderRadius: {
                xl: '1.25rem',
            },
            boxShadow: {
                cb: '0 4px 24px 0 rgba(60, 80, 120, 0.08)',
            },
        },
    },
    plugins: [],
}; 