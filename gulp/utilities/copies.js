const {
  src,
  dest
} = require("gulp")
const {
  copyPaths
} = require("../config/copy")

/**
 * copy file fro path to another path 
 */

const copy = function (done) {
  if (copyPaths.length > 0) {
    copyPaths.forEach(path => {
      src(path.from)
        .pipe(dest(path.to))
    })
  }
  done()
}

exports.copy = copy