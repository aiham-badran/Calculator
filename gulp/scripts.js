const {
  src,
  dest
} = require("gulp")

const babel = require('gulp-babel')
const sourcemaps = require("gulp-sourcemaps")
const uglify = require('gulp-uglify')
const connect = require("gulp-connect")
const concat = require("gulp-concat")
const gulpIf = require("gulp-if")

const {
  jsPaths
} = require("./config/paths").paths

const the_state = require("./config/state").projectState

const js = function () {


  let is_dev = the_state()

  return src(jsPaths.src)
    .pipe(gulpIf(is_dev, sourcemaps.init()))
    .pipe(concat("main.js"))
    // .pipe(babel({
    //   presets: ['@babel/env']
    // }))
    .pipe(gulpIf(is_dev, sourcemaps.write()))
    .pipe(gulpIf(!is_dev, uglify()))
    // .pipe(uglify())
    .pipe(dest(jsPaths.dist))
    .pipe(gulpIf(is_dev, connect.reload()))
}


exports.js = js