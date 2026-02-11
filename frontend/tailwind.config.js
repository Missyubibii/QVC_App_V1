/** @type {import('tailwindcss').Config} */
module.exports = {
    // 🔥 QUAN TRỌNG: Phải trỏ đúng đường dẫn
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {},
    },
    plugins: [],
}
