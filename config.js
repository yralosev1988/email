module.exports = {
  config: {
    tailwindjs: './tailwind.config.js',
  },
  paths: {
    root: './',
    src: {
      base: './src',
      css: './src/assets/css',
      js: './src/assets/js',
      pages: './src/pages',
      templates: './src/templates',
    },
    dev: {
      base: './.dev',
      css: './.dev/assets/css',
      js: './.dev/assets/js',
      pages: './.dev/pages',
    },
    build: {
      base: './build',
      css: './build/assets/css',
      js: './build/assets/js',
      pages: './build/pages',
      urlPrefix: '/',
    },
    docs: {
			base: './docs',
      css: './docs/assets/css',
      js: './docs/assets/js',
      pages: './docs/pages',
			urlPrefix: '/',
    },
  },
}