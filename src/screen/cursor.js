import Emitter from 'emitter'
import log from '../log'
import CursorBlinkTimer from './timer'

function close(a, b) {
  return Math.abs(a - b) < 2
}

export default class NeovimCursor extends Emitter {
  constructor(el, screen_ctx, proxy) {
    super()
    this.proxy = proxy
    this.screen_ctx = screen_ctx
    this.delay_timer = null

    this.blink_timer = new CursorBlinkTimer(proxy.cursor_blink_interval)
    this.el = el
    Object.assign(el.style, {
      top: '0px',
      left: '0px',
      pointerEvents: 'none'
    })

    this.ctx = this.el.getContext('2d', {alpha: false})

    this.blink_timer.on('tick', (shown) => {
      if (shown) {
        this.redraw()
      } else {
        this.dismiss()
      }
    })

    // srote current input method
    this.ime = window.keyboardLayout && window.keyboardLayout != 'com.apple.keylayout.US'
    window.addEventListener('layoutChange', e => {
      this.ime = e.detail !== 'com.apple.keylayout.US'
      this.redraw()
    })

    this.updateSize()
    this.updateBgColors(proxy.bg_color)
    this.updateCursorBlinking()
  }

  borderColor(bg) {
    const ms = bg.match(/\((\d+),\s*(\d+),\s*(\d+)/)
    if (!ms) return '#ffffff'
    return `rgb(${255 - ms[1]}, ${255 - ms[2]}, ${255 - ms[3]})`
  }

  updateBgColors(bg) {
    const ms = bg.match(/\((\d+),\s*(\d+),\s*(\d+)/)
    if (ms) {
      this.bgColors = {r: ms[1], g: ms[2], b: ms[3]}
    } else {
      this.bgColors = {r: 0, g: 0, b: 0}
    }
  }
  shouldBlink() {
    const {focused, mode} = this.proxy
    return focused && mode != 'normal'
  }

  invertColor(image) {
    const d = image.data
    const {ime, bgColors} = this
    for (let i = 0; i < d.length; i+=4) {
      if (ime && close(d[i], bgColors.r)
          && close(d[i + 1], bgColors.g)
          && close(d[i + 2], bgColors.b)) {
        // yellow color
        d[i] = 255
        d[i + 1] = 193
        d[i + 2] = 7
      } else {
        d[i] = 255 - d[i]
        d[i+1] = 255 - d[i+1]
        d[i+2] = 255 - d[i+2]
      }
    }
    return image
  }

  updateSize() {
    const {font_width, font_height} = this.proxy.font_attr
    const r = window.devicePixelRatio || 1
    this.el.style.width = font_width + 'px'
    this.el.style.height = font_height + 'px'
    this.el.width = font_width * r
    this.el.height = font_height * r
    this.ctx.setTransform(r ,0 ,0 , r, 0, 0)
    this.redraw()
  }

  dismiss() {
    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
  }

  redraw() {
    const {cursor_draw_delay} = this.proxy
    if (cursor_draw_delay <= 0) {
      this.redrawImpl()
      return
    }
    if (this.delay_timer !== null) {
      clearTimeout(this.delay_timer)
    }
    this.delay_timer = setTimeout(this.redrawImpl.bind(this), cursor_draw_delay)
  }

  updateCursorPos() {
    const {line, col} = this.proxy.cursor
    const {font_width, font_height} = this.proxy.font_attr
    const x = col * font_width
    const y = line * font_height

    this.el.style.left = x + 'px'
    this.el.style.top = y + 'px'
    log.debug(`Cursor is moved to (${x}, ${y})`)
    this.redraw()
    this.blink_timer.reset()
  }

  redrawImpl() {
    this.delay_timer = null
    const r = window.devicePixelRatio || 1
    const {ctx} = this
    const {focused, mode, font_attr, cursor} = this.proxy
    const {font_width, font_height} = font_attr
    const x = cursor.col * font_attr.font_width
    const y = cursor.line * font_attr.font_height

    const color = this.borderColor(font_attr.bg)
    ctx.clearRect(0, 0, this.el.width, this.el.height)

    if (mode == 'replace') {
      const y = font_attr.font_height - window.devicePixelRatio
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(font_attr.font_width, y)
      ctx.stroke()
    } else if (mode == 'normal') {
      const captured = this.screen_ctx.getImageData(x*r, y*r, font_width*r, font_height*r)
      if (focused) {
        ctx.putImageData(this.invertColor(captured), 0, 0)
      } else {
        // show border if not focused on normal mode
        ctx.putImageData(captured, 0, 0)
        ctx.strokeStyle = color
        ctx.strokeRect(0, 0, font_attr.font_width - 2, font_attr.font_height)
      }
    } else if (mode == 'insert' || mode == 'cmdline') {
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, font_attr.font_height)
      ctx.stroke()
    }
  }

  updateCursorBlinking() {
    if (this.shouldBlink()) {
      this.blink_timer.start()
      this.redraw()
    } else {
      this.blink_timer.stop()
      this.redraw()
    }
  }
}
