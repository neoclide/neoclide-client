import Emitter from 'emitter'
import * as util from '../util'
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
      display: 'none',
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

    this.updateSize()
    this.updateCursorBlinking()

    window.addEventListener('layoutChange', () => {
      this.redraw()
    })
  }

  shouldBlink() {
    const {focused, mode} = this.proxy
    return focused && mode != 'normal'
  }

  updateSize() {
    const {font_width, font_height} = this.proxy.font_attr
    const r = window.devicePixelRatio || 1
    this.el.style.width = font_width * 2 + 'px'
    this.el.style.height = font_height + 'px'
    this.el.width = font_width * 2 * r
    this.el.height = font_height * r
    this.ctx.scale(r,r)
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

    Object.assign(this.el.style, {
      left: x + 'px',
      top: y + 'px',
      display: 'block'
    })
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
    const color = util.imeRunning() ? 'rgb(255,193,7)' : '#ffffff'

    ctx.clearRect(0, 0, this.el.width, this.el.height)

    if (mode == 'replace') {
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(0, font_height)
      ctx.lineTo(font_attr.font_width, font_height)
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
  invertColor(image) {
    const d = image.data
    const ime = util.imeRunning()
    const {bg_color} = this.proxy
    const bg = rgbToColors(bg_color)
    for (let i = 0; i < d.length; i+=4) {
      if (ime && close(d[i], bg.r)
          && close(d[i + 1], bg.g)
          && close(d[i + 2], bg.b)) {
        // yellow color
        d[i] = 255
        d[i + 1] = 193
        d[i + 2] = 7
        d[i + 3] = 255
      } else {
        d[i] = 255 - d[i]
        d[i + 1] = 255 - d[i+1]
        d[i + 2] = 255 - d[i+2]
      }
    }
    return image
  }
}

function rgbToColors(color) {
  const ms = color.substring(color.indexOf('(') + 1, color.lastIndexOf(')')).split(/,\s*/)
  return {r: ms[0], g: ms[1], b: ms[2]}
}
