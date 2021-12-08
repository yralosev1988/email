module.exports = {
  purge: {
    content: [
      './src/templates/**/*.html',
      './src/pages/**/*.html',
      './src/assets/**/*.js',
    ],
    defaultExtractor: (content) => content.match(/[\w-/:.]+(?<!:)/g) || [],
  },
  darkMode: false, // 'media' or 'class' or false
  theme: {
    extend: {
    },
  },
  variants: {
  },
  plugins: [
  ],
}
