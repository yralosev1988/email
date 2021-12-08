const { src, dest, task, watch, series, parallel } = require('gulp')
const del = require('del') // For Cleaning build/dist for fresh export
const options = require('./config') // paths and other options from config.js
const browserSync = require('browser-sync').create()

const plumber = require('gulp-plumber') // Log errors and prevent errors from breaking tasks
const sass = require('gulp-sass')(require('node-sass')) // For Compiling SASS files
const postcss = require('gulp-postcss') // For Compiling tailwind utilities with tailwind config
const concat = require('gulp-concat') // For Concatinating js,css files
const uglify = require('gulp-terser') // To Minify JS files
const htmlMinimizer = require('gulp-html-minimizer') // To clean up html during build process
const formatHtml = require('gulp-format-html') // To prettify html during build process
// const imagemin = require('gulp-imagemin') // To Optimize Images
const cleanCSS = require('gulp-clean-css') // To Minify CSS files
const purgecss = require('gulp-purgecss') // Remove Unused CSS from Styles
const tailwindcss = require('tailwindcss')
const inject = require('gulp-inject') // For injection js and css files into each html page
const fileinclude = require('gulp-file-include') // For html modularity and static assets paths correction during dev/build
const nunjucksRender = require('gulp-nunjucks-render') // For global html layouts and general templating
const urlPrefixer = require('gulp-html-static') // For prefixing urls for github.io documents to work

const logSymbols = require('log-symbols') // For Symbolic Console logs

//Load Previews on Browser on dev
function livePreview(done) {
  browserSync.init({
    server: {
      baseDir: options.paths.dev.base,
    },
    port: options.config.port || 5000,
  })
  done()
}

// Triggers Browser reload
function previewReload(done) {
  console.log('\n\t' + logSymbols.info, 'Reloading Browser Preview.\n')
  browserSync.reload()
  done()
}

function injectSources(payload = {}) {
  if (payload.sources === undefined || payload.basePath === undefined) return
  return inject(payload.sources, {
    relative: true,
    removeTags: payload.removeTags || false,
    transform: function (filepath, file, index, length, targetFile) {
      return inject.transform.call(
        inject.transform,
        filepath.split(`../.${payload.basePath}/`).join(''),
        file,
        index,
        length,
        targetFile
      )
    },
  })
}

//Development Tasks
function devHTML() {
  const sourcesToInject = src(
    [`${options.paths.dev.js}/**/*.js`, `${options.paths.dev.css}/**/*.css`],
    { read: false }
  )
  return src([`${options.paths.src.pages}/**/*.html`], { allowEmpty: true })
    .pipe(plumber())
    .pipe(
      nunjucksRender({
        path: ['src/templates'],
      })
    )
    .pipe(
      injectSources({
        sources: sourcesToInject,
        basePath: options.paths.dev.base,
      })
    )
    .pipe(
      fileinclude({
        prefix: '@@',
        basepath: options.paths.src.templates,
      })
    )
    .pipe(
      htmlMinimizer({
        collapseWhitespace: true,
        conservativeCollapse: true,
      })
    )
    .pipe(
      formatHtml({
        end_with_newline: true,
        preserve_newlines: false,
        wrap_line_length: 0,
      })
    )
    .pipe(dest(options.paths.dev.base))
}

function devStyles() {
  return src(`${options.paths.src.css}/main.scss`)
    .pipe(sass().on('error', sass.logError))
    .pipe(
      postcss([tailwindcss(options.config.tailwindjs), require('autoprefixer')])
    )
    .pipe(concat({ path: 'style.css' }))
    .pipe(dest(options.paths.dev.css))
}

function devScripts() {
  return src([`${options.paths.src.js}/**/*.js`])
    .pipe(concat({ path: 'scripts.js' }))
    .pipe(dest(options.paths.dev.js))
}


function watchFiles() {
  watch(
    [
      `${options.paths.src.pages}/**/*.html`,
      `${options.paths.src.templates}/**/*.html`,
      `${options.paths.src.templates}/**/*.njk`,
    ],
    series(devHTML, previewReload)
  )
  watch(
    [options.config.tailwindjs, `${options.paths.src.css}/**/*`],
    series(devStyles, previewReload)
  )
  watch(`${options.paths.src.js}/**/*.js`, series(devScripts, previewReload))
  console.log('\n\t' + logSymbols.info, 'Watching for Changes..\n')
}

function devClean() {
  console.log(
    '\n\t' + logSymbols.info,
    'Cleaning dist folder for fresh start.\n'
  )
  return del([options.paths.dev.base])
}

//Production Tasks (Optimized Build for Live/Production Sites)
function prodHTML(build) {
  return function callbackProdHTML() {
    const sourcesToInject = src(
      [
        `${options.paths[build].base}/**/*.js`,
        `${options.paths[build].base}/**/*.css`,
      ],
      { read: false }
    )
    return src([`${options.paths.src.pages}/**/*.html`], { allowEmpty: true })
      .pipe(
        nunjucksRender({
          path: ['src/templates'],
        })
      )
      .pipe(
        injectSources({
          sources: sourcesToInject,
          basePath: options.paths[build].base,
          removeTags: true,
        })
      )
      .pipe(
        fileinclude({ prefix: '@@', basepath: options.paths.src.templates })
      )
      .pipe(urlPrefixer({ '/': options.paths[build].urlPrefix }))
      .pipe(
        htmlMinimizer({
          collapseWhitespace: true,
          conservativeCollapse: true,
        })
      )
      .pipe(
        formatHtml({
          end_with_newline: true,
          preserve_newlines: false,
          wrap_line_length: 0,
        })
      )
      .pipe(dest(options.paths[build].base))
  }
}

function prodStyles(build) {
  return function callbackProdStyles() {
    return src(`${options.paths.src.css}/main.scss`)
      .pipe(sass().on('error', sass.logError))
      .pipe(
        postcss([
          tailwindcss(options.config.tailwindjs),
          require('autoprefixer'),
        ])
      )
      .pipe(concat({ path: 'style.css' }))
      .pipe(
        purgecss({
          ...require(options.config.tailwindjs).purge,
        })
      )
      .pipe(cleanCSS({ compatibility: 'ie8' }))
      .pipe(dest(options.paths[build].css))
  }
}

function prodScripts(build) {
  return function callbackProdScripts() {
    return src([`${options.paths.src.js}/**/*.js`])
      .pipe(concat({ path: 'scripts.js' }))
      .pipe(uglify())
      .pipe(dest(options.paths[build].js))
  }
}

function prodClean(build) {
  return function callbackProdClean() {
    console.log(
      '\n\t' + logSymbols.info,
      'Cleaning build folder for fresh start.\n'
    )
    return del([options.paths[build].base])
  }
}

function buildFinish(build) {
  return function callbackBuildFinish(done) {
    console.log(
      '\n\t' + logSymbols.info,
      `Production ${build} is complete. Files are located at ${options.paths[build].base}\n`
    )
    done()
  }
}

exports.default = series(
  devClean, // Clean Dist Folder
  parallel(devStyles, devScripts), //Run All tasks in parallel
  devHTML,
  livePreview, // Live Preview Build
  watchFiles // Watch for Live Changes
)

exports.build = series(
  prodClean('build'), // Clean Build Folder
  parallel(prodScripts('build'), prodStyles('build')), //Run All tasks in parallel
  prodHTML('build'),
  buildFinish('build')
)

exports.docs = series(
  prodClean('docs'), // Clean Build Folder
  parallel(prodScripts('docs'), prodStyles('docs')), //Run All tasks in parallel
  prodHTML('docs'),
  buildFinish('docs')
)
