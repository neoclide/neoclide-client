import Emitter from 'emitter'
import * as util from '../util'
import CursorBlinkTimer from './timer'

export default class NeovimCursor extends Emitter {
  constructor(el, screen, proxy) {
    super()
    this.proxy = proxy
    this.screen = screen
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
    this.clear()
    this.redraw()
    this.blink_timer.reset()
  }

  redrawImpl() {
    this.delay_timer = null
    const {ctx} = this
    ctx.font = this.screen.ctx.font
    ctx.textBaseline = 'top'
    const {focused, mode, font_attr, cursor,
          cursor_fgcolor, cursor_bgcolor} = this.proxy
    const {font_height} = font_attr
    const {line, col} = cursor
    const color = util.imeRunning() ? 'rgb(255,193,7)' : cursor_bgcolor
    const ch = this.screen.lines.getCharAt(line, col)
    const width = ctx.measureText(ch || ' ').width

    this.clear()

    if (mode == 'replace') {
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(0, font_height)
      ctx.lineTo(width, font_height)
      ctx.stroke()
    } else if (mode == 'normal') {
      if (focused) {
        ctx.fillStyle = color
        ctx.fillRect(0, 0, width, font_height)
        ctx.fillStyle = cursor_fgcolor
        ctx.fillText(ch, 0, 0)
      } else {
        ctx.strokeStyle = color
        ctx.strokeRect(0, 0, width, font_attr.font_height)
      }
    } else if (mode == 'insert' || mode == 'cmdline') {
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, font_attr.font_height)
      ctx.stroke()
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
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
