import Emitter from 'emitter'
import {toOpacity} from '../util'

export default class NeovimCompose extends Emitter {
  constructor(el, proxy) {
    super()
    this.el = el
    this.proxy = proxy
    this.startLine = 0
    this.startColumn = 0
  }
  start() {
    const {cursor, font_attr, fg_color, bg_color} = this.proxy
    const col = this.startColumn = cursor.col
    const line = this.startLine = cursor.line

    const {
      font_width,
      font_height,
      font_size,
      font_family
    } = font_attr

    Object.assign(this.el.style, {
      color: toOpacity(fg_color),
      backgroundColor: toOpacity(bg_color),
      fontSize: font_size + 'px',
      fontFamily: font_family,
      lineHeight: font_height + 'px',
      top: Math.floor(line * font_height) + 'px',
      left: col*font_width + 'px',
    })
  }
  update(input) {
    this.el.textContent = input
    const col = this.startColumn + input.length
    this.emit('cursor', {line: this.startLine, col})
  }
  end() {
    this.el.textContent = ''
    this.emit('cursor', {line: this.startLine, col: this.startColumn})
  }
}
