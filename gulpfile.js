const {
  watch
} = require("./gulp/utilities/watch")

const {
  build
} = require("./gulp/utilities/build")

const {
  cleanUnusedClasses
} = require("./gulp/utilities/clean")

const {
  copy
} = require("./gulp/utilities/copies")


const {
  copy_images
} = require("./gulp/staticFiles/images")

module.exports = {
  // during developing the project
  dev: watch,
  default: watch,

  // when need to build project 
  build,

  // for remove all class unused in css
  cssCleaner: cleanUnusedClasses,

  // for copy file form path to another
  copy,

  // copy image to dist file with Minify images seamlessly
  images: copy_images
}