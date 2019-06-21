/* eslint-disable no-multi-assign */
// Build out our basic SafeString type
function SafeString(string) {
  this.string = string
}

SafeString.prototype.toString = SafeString.prototype.toHTML = function h() {
  return `${this.string}`
}

module.exports = SafeString
