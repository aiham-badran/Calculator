const {
  src,
  dest
} = require("gulp"), {
    dist,
    css,
  } = require("../config/paths").paths,
  uncss = require('gulp-uncss')

const del = require('del');


/**
 * search of unused classes in html files and deleted it 
 */
const cleanUnusedClasses = function () {
  return src(`${dist}/${css}/**/*.css`)
    .pipe(uncss({
      html: [`${dist}/**/*.html`]
    }))
    .pipe(dest(`${dist}/${css}`))
}


/**
 * clear dist file 
 */

const deleteFolder = async (path) => await del([path])


module.exports = {
  cleanUnusedClasses,
  deleteFolder
}