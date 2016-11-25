
export default class Line {
  constructor(len) {
    const chars = this.chars = new Array(len)
    this.len = len
    chars.fill(' ')
  }
  clear() {
    this.chars.fill(' ')
  }
  clearEol(start) {
    const chars = this.chars
    for (var i = start; i < this.len; i++) {
      chars[i] = ' '
    }
  }
  replace(start, chars) {
    const l = chars.length
    const args = [start, l].concat(chars)
    return this.chars.splice.apply(this.chars, args)
  }
}
