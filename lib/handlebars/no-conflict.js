module.exports = function noConflict(Handlebars) {
  /* istanbul ignore next */
  const root = typeof global !== 'undefined' ? global : window,
        $Handlebars = root.Handlebars
  /* istanbul ignore next */
  Handlebars.noConflict = function nc() {
    if (root.Handlebars === Handlebars) {
      root.Handlebars = $Handlebars
    }
    return Handlebars
  }
}
