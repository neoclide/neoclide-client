import Emitter from 'emitter'
// Note: Mouse has its origin at left-bottom
//
//   +y
//    |
//    |
//    |
//    |
//    |--------- +x

// Note:
// Vim handles scroll with 3 lines and 6 columns as one scroll
// :help <ScrollWheelUp>

export default class ScreenWheel extends Emitter {
  constructor(proxy) {
    super()
    this.proxy = proxy
    this.reset()
  }

  handleEvent(e) {
    if (!this.proxy.mouse_enabled) return
    if ((this.shift === undefined && this.ctrl === undefined) ||
      (this.shift !== e.shiftKey || this.ctrl !== e.ctrlKey)) {
        // Note:
        // Initialize at first or reset on modifier change
        this.reset(e.shiftKey, e.ctrlKey)
    }

    this.x += e.deltaX
    this.y += e.deltaY
    const {font_attr} = this.proxy
    const {font_width, font_height} = font_attr

    const scroll_x = Math.round(this.x / font_width / 6)
    const scroll_y = Math.round(this.y / font_height / 3)

    if (scroll_x === 0 && scroll_y === 0) {
      // Note: At least 3 lines or 6 columns are needed to scroll screen
      return ''
    }

    const col  = Math.floor(e.offsetX / font_width)
    const line = Math.floor(e.offsetY / font_height)

    const input = this.getInput(scroll_x, scroll_y, line, col)
    this.reset()
    this.emit('input', input)
  }

 reset(shift, ctrl) {
    this.x = 0
    this.y = 0
    this.shift = shift
    this.ctrl = ctrl
  }

  getInput(scroll_x, scroll_y, line, col) {
    const pos = `<${col},${line}>`
    let modifier = '<'
    if (this.ctrl) {
      modifier += 'C-'
    }
    if (this.shift) {
      modifier += 'S-'
    }

    let seq = ''

    const y_dir = scroll_y > 0 ? 'Down' : 'Up'
    for (let _ = 0; _ < Math.abs(scroll_y); ++_) {
      seq += `${modifier}ScrollWheel${y_dir}>${pos}`
    }

    const x_dir = scroll_x > 0 ? 'Left' : 'Right'
    for (let _ = 0; _ < Math.abs(scroll_x); ++_) {
      seq += `${modifier}ScrollWheel${x_dir}>${pos}`
    }

    return seq
  }
}
