const {
  watch
} = require("gulp")

const {
  server
} = require("./hotServer")
const {
  paths
} = require("../config/paths")

const {
  pug
} = require("../html")
const {
  sass
} = require("../styles")
const {
  js
} = require("../scripts")

const env = require('gulp-env');


exports.watch = function () {
  env.set({
    STATE: "develop" // production 
  })
  server()
  watch(paths.pugPaths.src.all, pug);
  watch(paths.sassPaths.src, sass);
  watch(paths.jsPaths.src, js);
}