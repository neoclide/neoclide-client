import log from '../log'
import Lines from './lines'

export default class NeovimScreen {
  constructor(canvas, proxy) {
    // init
    this.canvas = canvas
    this.proxy = proxy
    this.ctx = this.canvas.getContext('2d', {alpha: true})
    const {size} = proxy
    this.lines = new Lines(size.lines, size.cols)
  }

  /**
   * scroll for Neovim RPC
   *
   * delta > 0 -> screen up
   * delta < 0 -> screen down @public
   * @param {} delta
   */
  scroll(delta) {
    if (delta > 0) {
      this.scrollUp(delta)
    } else if (delta < 0) {
      this.scrollDown(-delta)
    }
  }

  /**
   * clearAll for Neovim RPC
   *
   * @public
   */
  clearAll() {
    const {width, height} = this.canvas
    this.ctx.clearRect(0, 0, width, height)
    this.ctx.fillStyle = this.proxy.bg_color
    this.ctx.fillRect(0, 0, width, height)
    this.lines.clearAll()
  }

  /**
   * clearEol for Neovim RPC
   *
   * @public
   */
  clearEol() {
    const {cursor, bg_color, size, font_attr} = this.proxy
    const {line, col} = cursor
    const clear_length = (size.cols - col) * font_attr.font_width
    log.debug(`Clear until EOL: ${line}:${col} length=${clear_length}`)
    this.drawBlock(line, col, 1, clear_length, bg_color)
    this.lines.clearEol(line, col)
  }

  /**
   * checkShouldResize public API
   *
   * @public
   */
  checkShouldResize() {
    const p = this.canvas.parentElement
    const {width, height} = p.getBoundingClientRect()
    const w = this.canvas.width
    const h = this.canvas.height
    if (width * (window.devicePixelRatio || 1) !== w ||
      height * (window.devicePixelRatio || 1) !== h) {
        return true
    }
    return false
  }

  /* Note:
   * About 'chars' parameter includes characters to render as array of strings
   * which should be rendered at the each cursor position.
   * So we renders the strings with forwarding the start position incrementally.
   * When chars[idx][0] is empty string, it means that 'no character to render,
   * go ahead'.
   *
   * @private
   */

  drawChars(x, y, chars, width) {
    let includes_half_only = true
    for (const c of chars) {
      if (!c[0]) {
        includes_half_only = false
        break
      }
    }
    if (includes_half_only) {
      // Note:
      // If the text includes only half characters, we can render it at once.
      const text = chars.map(c => (c[0] || '')).join('')
      if (text.length == 1 && text.codePointAt(0) == 9888) {
        this.warningSign = true
      }
      this.ctx.fillText(text, x, y)
      return
    }

    for (const c of chars) {
      if (!c[0] || c[0] === ' ') {
        x += width
        continue
      }
      this.ctx.fillText(c.join(''), x, y)
      x += width
    }
  }

  /**
   * drawText for neovim put
   *
   * @public
   * @param {Array} chars
   */
  drawText(chars) {
    // Neovim doesn't recognize double width charactors except emoji
    const {cursor, font_attr, line_height} = this.proxy
    const {line, col} = cursor
    const {
      fg, bg, sp,
      font_width,
      font_height,
      font_family,
      font_size,
      bold,
      italic,
      underline,
      undercurl,
    } = font_attr

    // Draw background
    if (this.warningSign) {
      this.warningSign = false
    } else {
      this.drawBlock(line, col, 1, chars.length, bg)
    }

    let attrs = ''
    if (bold) {
      attrs += 'bold '
    }
    if (italic) {
      attrs += 'italic '
    }
    this.ctx.font = attrs + font_size + 'px ' + font_family

    this.ctx.textBaseline = 'top'
    this.ctx.fillStyle = fg
    // Note:
    // Line height of <canvas> is fixed to 1.2 (normal).
    // If the specified line height is not 1.2, we should calculate
    // the difference of margin-bottom of text.
    const margin = font_size * (line_height - 1.2) / 2
    const y = Math.floor(line * font_height + margin)
    const x = col * font_width
    this.drawChars(x, y, chars, font_width)
    this.lines.putChars(line, col, chars.map(a => a[0]))
    this.ctx.lineWidth = window.devicePixelRatio || 1
    if (undercurl) {
      this.ctx.strokeStyle = sp || this.proxy.sp_color || fg // Note: Fallback for Neovim 0.1.4 or earlier.
      this.ctx.setLineDash([font_width / 3, font_width / 3])
      this.ctx.beginPath()
      const curl_y = y + font_height - 3
      this.ctx.moveTo(x, curl_y)
      this.ctx.lineTo(x + font_width * chars.length, curl_y)
      this.ctx.stroke()
    } else if (underline) {
      this.ctx.strokeStyle = fg
      this.ctx.setLineDash([])
      this.ctx.beginPath()
      // Note:
      // 3 is set with considering the width of line.
      const underline_y = y + font_height - 3
      this.ctx.moveTo(x, underline_y)
      this.ctx.lineTo(x + font_width * chars.length, underline_y)
      this.ctx.stroke()
    }
    log.debug(`drawText(): (${x}, ${y})`, chars.length, cursor)
  }

  /**
   * drawBlock
   *
   * @private
   */
  drawBlock(line, col, height, width, color) {
    const {font_attr} = this.proxy
    const {font_width, font_height} = font_attr
    const x = Math.floor(col * font_width)
    const y = line * font_height
    const w = Math.ceil(width * font_width)
    const h = height * font_height
    this.ctx.clearRect(x, y, w, h)
    this.ctx.fillStyle = color
    // Note:
    // Height doesn't need to be truncated (floor, ceil) but width needs.
    // The reason is desribed in Note2 of changeFontSize().
    this.ctx.fillRect(x, y, w, h)
  }

  slideVertical(top, height, dst_top) {
    const r = window.devicePixelRatio || 1
    const {scroll_region, font_attr} = this.proxy
    const {left, right} = scroll_region
    const {font_width, font_height} = font_attr
    const captured = this.ctx.getImageData(
      left * font_width * r,
      top * font_height * r,
      (right - left + 1) * font_width * r,
      height * font_height * r
    )

    this.ctx.putImageData(
      captured,
      left * font_width * r,
      dst_top * font_height * r
    )
  }

  scrollUp(lines_up) {
    const {scroll_region, bg_color} = this.proxy
    const {top, bottom, left, right} = scroll_region
    this.lines.scrollUp(lines_up, top, bottom, left, right)
    this.slideVertical(
      top + lines_up,
      bottom - (top + lines_up) + 1,
      top
    )
    this.drawBlock(
      bottom - lines_up + 1,
      left,
      lines_up,
      right - left + 1,
      bg_color
    )
    log.debug('Scroll up: ' + lines_up, scroll_region)
  }

  scrollDown(lines_down) {
    const {scroll_region, bg_color} = this.proxy
    const {top, bottom, left, right} = scroll_region
    this.lines.scrollDown(lines_down, top, bottom, left, right)
    this.slideVertical(
      top,
      bottom - (top + lines_down) + 1,
      top + lines_down
    )
    this.drawBlock(
      top,
      left,
      lines_down,
      right - left + 1,
      bg_color
    )
    log.debug('Scroll down: ' + lines_down, scroll_region)
  }

  resizeCanvas(width, height) {
    const r = window.devicePixelRatio || 1
    this.canvas.width = width*r
    this.canvas.height = height*r
    this.canvas.style.width = width + 'px'
    this.canvas.style.height = height + 'px'
    if (r !== 1) {
      this.ctx.scale(r, r)
    }
  }
}
