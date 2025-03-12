/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [ "./ext/*.js", "./ext/*.html" ],
    theme: {
      extend: {},
    },
    plugins: [ require('daisyui') ],
    daisyui: { themes: ["retro"] },
}

