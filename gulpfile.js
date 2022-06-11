const {
  src,
  dest,
  watch
} = require("gulp"),
  pug = require("gulp-pug"),
  sass = require("gulp-sass")(require('sass')),
  sourcemaps = require("gulp-sourcemaps"),
  babel = require("gulp-babel"),
  connect = require("gulp-connect")

const server = function () {
  connect.server({
    root: "dist",
    livereload: true
  })
}


const html = function () {

  return src("./src/pug/*.pug")
    .pipe(pug({
      pretty: true
    }))
    .pipe(dest("./dist"))
    .pipe(connect.reload())

}

const css = function () {
  return src("./src/sass/**/*.sass")
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(dest("./dist/css"))
    .pipe(connect.reload())

}

const js = function () {
  return src("./src/js/**/*.js")
    // .pipe(babel({
    //   presets: ['@babel/env']
    // }))
    .pipe(sourcemaps.write())
    .pipe(dest('./dist/js'))
    .pipe(connect.reload())

}


exports.default = function () {
  server()
  watch('./src/pug/**/*.pug', html);
  watch(['./src/sass/**/*.sass', './src/sass/**/*.scss'], css);
  watch('./src/js/**/*.js', js);

}