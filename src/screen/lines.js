import Line from './line'

export default class lines {
  constructor(lines, cols) {
    this.resize(lines, cols)
  }
  resize(lines, cols) {
    this.lines = []
    for (var i = 0; i < lines; i++) {
      this.lines[i] = new Line(cols)
    }
  }
  clearAll() {
    this.lines.forEach(line => {
      line.clear()
    })
  }
  clearEol(line, col) {
    this.lines[line].clearEol(col)
  }
  putChars(line, col, chars) {
    this.lines[line].replace(col, chars)
  }
  scrollUp(lines_up, top, bottom, left, right) {
    //const range = this.lines.slice(top, bottom)
    for (let i = 0 ; i < lines_up ; i++) {
      let chars = (new Array(right - left + 1)).fill(' ')
      for (let j = bottom - i; j >= top ; j -= lines_up) {
        const line = this.lines[j]
        chars = line.replace(left, chars)
      }
    }
  }
  scrollDown(lines_down, top, bottom, left, right) {
    for (let i = 0 ; i <lines_down ; i ++) {
      let chars = (new Array(right - left + 1)).fill(' ')
      for (let j = top + i; j <= bottom; j += lines_down) {
        const line = this.lines[j]
        chars = line.replace(left, chars)
      }
    }
  }
  getCharAt(line, col) {
    const l = this.lines[line]
    if (!l) return ' '
    return l.chars[col] || ' '
  }
  print() {
    for (var i=0 ; i < this.lines.length;i++) {
      const line = this.lines[i]
      console.log(line.chars.join(''))
    }
  }
}
