const src = "./src",
  dist = "./dist",
  css = "/assets/css",
  storage = "./storage"

exports.paths = {
  src,
  dist,
  css,

  pugPaths: {
    src: {
      all: `${src}/pug/**/*.pug`,
      except: `!${src}/pug/**/_*.pug`
    },
    dist: `${dist}/`
  },
  sassPaths: {
    src: `${src}/sass/**/*.+(sass|scss)`,
    dist: `${dist}/${css}`
  },
  jsPaths: {
    src: `${src}/js/**/*.js`,
    dist: `${dist}/assets/js`
  },
  imagesPath: {
    src: `${storage}/images`,
    dist: `${dist}/assets/images`
  }
}