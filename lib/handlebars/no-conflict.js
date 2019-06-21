/* global window */
module.exports = function noConflict(Handlebars) {
  /* istanbul ignore next */
  const root = typeof global !== 'undefined' ? global : window,
        $Handlebars = root.Handlebars
  /* istanbul ignore next */
  /* eslint-disable no-param-reassign */
  Handlebars.noConflict = function nc() {
    if (root.Handlebars === Handlebars) {
      root.Handlebars = $Handlebars
    }
    return Handlebars
  }
}
