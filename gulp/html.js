const {
  src,
  dest
} = require("gulp")

const the_pug = require("gulp-pug"),
  connect = require("gulp-connect"),
  gulpIf = require("gulp-if")

const {
  pugPaths
} = require("./config/paths").paths

const the_state = require("./config/state").projectState


const pug = function () {

  let is_dev = the_state()

  return src([pugPaths.src.all, pugPaths.src.except])
    .pipe(the_pug({
      pretty: is_dev
    }))
    .pipe(dest(pugPaths.dist))
    .pipe(gulpIf(is_dev, connect.reload()))
}



exports.pug = pug