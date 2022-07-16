const projectState = () => process.env.STATE == "develop" ? true : false

module.exports = {
  projectState
}