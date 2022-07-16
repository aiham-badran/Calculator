const {
  src,
  dest
} = require("gulp")


const the_sass = require("gulp-sass")(require('sass')),
  sourcemaps = require("gulp-sourcemaps"),
  connect = require("gulp-connect"),
  postcss = require("gulp-postcss"),
  gulpIf = require("gulp-if"),
  autoprefixer = require("autoprefixer")

const {
  sassPaths
} = require("./config/paths").paths

const the_state = require("./config/state").projectState

const sass = function () {
  let is_dev = the_state()

  return src(sassPaths.src)
    .pipe(gulpIf(is_dev, sourcemaps.init()))
    .pipe(the_sass({
      outputStyle: is_dev ? 'expanded' : 'compressed'
    }).on('error', the_sass.logError))
    .pipe(gulpIf(is_dev, sourcemaps.write()))
    .pipe(postcss([autoprefixer()]))
    .pipe(dest(sassPaths.dist))
    .pipe(gulpIf(is_dev, connect.reload()))
}


module.exports.sass = sass