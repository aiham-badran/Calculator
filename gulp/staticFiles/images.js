const {
  src,
  dest
} = require("gulp")

const compress_images = require("compress-images")

const {
  imagesPath
} = require("../config/paths").paths

let imagesSrc = `${imagesPath.src}/**/*.{jpg,JPG,jpeg,JPEG,png,svg,gif}`
let imagesDist = `${imagesPath.dist}/`

const images = function () {

  compress_images(imagesSrc, imagesDist, {
    compress_force: false,
    statistic: true,
    autoupdate: true
  }, false, {
    jpg: {
      engine: "mozjpeg",
      command: ["-quality", "60"]
    }
  }, {
    png: {
      engine: "pngquant",
      command: ["--quality=20-50", "-o"]
    }
  }, {
    svg: {
      engine: "svgo",
      command: "--multipass"
    }
  }, {
    gif: {
      engine: "gifsicle",
      command: ["--colors", "64", "--use-col=web"]
    }
  }, function (error, completed, statistic) {
    console.log("-------------");
    console.log(error);
    console.log(completed);
    console.log(statistic);
    console.log("-------------");
  })


}

exports.copy_images = images