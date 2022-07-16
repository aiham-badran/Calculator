const connect = require("gulp-connect")

exports.server = function () {
  connect.server({
    root: "dist",
    livereload: true
  })
}