import Emitter from 'emitter'
import ClientInput from './input'
import NeovimScreen from './screen/screen'
import NeovimCursor from './screen/cursor'
import store from './store'
import proxy from './proxy'
import * as A from './actions'
import Process from './process'
import * as util from './util'

export default class Neovim extends Emitter {
  constructor(
    root,
    command,
    argv,
    attrs
  ) {
    super()
    this.root = root
    // use state for readonly state
    Object.defineProperty(this, 'state', {
      get: function () {
        return Object.freeze(store.getState())
      }
    })
    store.dispatch(A.setFontAttrs({
      fontSize: attrs.fontSize,
      lineHeight: attrs.lineHeight,
      font: attrs.font
    }))
    store.dispatch(A.setInputOptions({
      alt_key_disabled: attrs.disableAltKey,
      meta_key_disabled: attrs.disableMetaKey,
      cursor_fgcolor: attrs.cursorFgcolor,
      cursor_bgcolor: attrs.cursorBgcolor,
      cursor_draw_delay: attrs.cursorDrawDelay,
      cursor_blink_interval: attrs.cursorBlinkInterval
    }))
    store.dispatch(A.changeTitle(attrs.windowTitle))
    store.dispatch(A.changeOpacity(attrs.opacity))

    this.cmdlineIM = null
    const input = this.clientInput = new ClientInput(root, proxy)
    // bind all input events
    input.on('contextmenu', ev => this.emit("contextmenu", ev))
    input.on('cursor', pos => {
      store.dispatch(A.moveCursor(pos.line, pos.col))
    })
    input.on('startSearch', () => {
      this.cmdlineIM = window.keyboardLayout
      store.dispatch(A.toggleSearch(true))
    })
    input.on('input', chars => {
      this.process.input(chars)
    })
    input.on('resize', (width, height) => {
      store.dispatch(A.changeSize(width, height))
      const {cols, lines} = proxy.size
      this.screen.lines.resize(lines, cols)
      this.process.tryResize(cols, lines)
      this.process.once('resize', () => {
        this.screen.resizeCanvas(width, height)
      })
    })
    input.on('focusChanged', focused => {
      if (focused && proxy.mode == 'normal') util.defaultIM()

      this.process.input(focused ? '<FocusGained>' : '<FocusLost>')
      store.dispatch(A.toggleFocus(focused))
    })
    this.process = new Process(command, argv)
  }
  bindProcess() {
    const p = this.process
    const screen = this.screen
    // bind state chagnes
    p.on('cursor_goto', (line, col) => {
      store.dispatch(A.moveCursor(line, col))
    })
    p.on('highlight_set', highlights => {
      store.dispatch(A.setHighlights(highlights))
    })
    p.on('set_scroll_region', region => {
      store.dispatch(A.setScrollRegion(region))
      this.emit('change scroll_region', region)
    })
    p.on('update_fg', color => {
      store.dispatch(A.updateFg(color))
    })
    p.on('update_bg', color => {
      store.dispatch(A.updateBg(color))
    })
    p.on('update_sp', color => {
      store.dispatch(A.updateSp(color))
    })
    p.on('mode_change', mode => {
      const {searching} = proxy
      const curMode = proxy.mode
      if (mode != 'cmdline' && searching) {
        util.saveCommandIm()
        store.dispatch(A.toggleSearch(false))
      }
      if (curMode != 'insert' && mode == 'normal') {
        // works with smartim
        util.defaultIM()
      }
      if (mode == 'cmdline' && searching) {
        util.selectCommandIm()
      }
      store.dispatch(A.changeMode(mode))
    })
    p.on('busy_start', () => {
      store.dispatch(A.toggleBusy(true))
    })
    p.on('busy_stop', () => {
      store.dispatch(A.toggleBusy(false))
    })
    p.on('mouse_on', () => {
      store.dispatch(A.toggleMouse(true))
    })
    p.on('mouse_off', () => {
      store.dispatch(A.toggleMouse(false))
    })
    // bind actions
    p.on('put', chars => {
      store.dispatch(A.put())
      screen.drawText(chars)
      const {cursor} = proxy
      const line = cursor.line
      const col = cursor.col + chars.length
      store.dispatch(A.moveCursor(line, col))
    })
    p.on('clear', () => {
      store.dispatch(A.clear())
      screen.clearAll()
      store.dispatch(A.moveCursor(0, 0))
    })
    p.on('eol_clear', () => {
      store.dispatch(A.eolClear())
      screen.clearEol()
    })
    p.on('scroll', cols_delta => {
      store.dispatch(A.scroll())
      screen.scroll(cols_delta)
    })
    p.on('resize', (cols, lines) => {
      // store cares resize from browser side
      const {size} = proxy
      if (size.cols !== cols || size.lines !== lines) {
        this.emit('change size', size)
      }
    })
    p.on('bell', () => {
      store.dispatch(A.bell())
      this.emit('bell')
    })
    p.on('visual_bell', () => {
      store.dispatch(A.visualBell())
      this.emit('visual-bell')
    })
    p.on('set_title', title => {
      store.dispatch(A.changeTitle(title))
      this.emit('change title', title)
    })
    p.on('set_icon', icon => {
      store.dispatch(A.changeIcon(icon))
      this.emit('change icon', icon)
    })
  }
  selectCommandIm() {
    if (this.cmdlineIM && window.imselect) {
      window.imselect.selectMethod(this.cmdlineIM)
    }
  }
  attachCanvas(canvas, width, height) {
    store.dispatch(A.changeSize(width, height))

    this.canvas = canvas
    this.screen = new NeovimScreen(canvas, proxy)
    this.screen.resizeCanvas(width, height)

    const cursorEl = this.root.querySelector('.neovim-cursor')
    this.cursor = new NeovimCursor(cursorEl, this.screen, proxy)

    this.bindProcess()

    const {lines, cols} = proxy.size

    this.process
      .attach(lines, cols)
      .then(() => {
        this.process.client.on('disconnect', () => {
          this.emit('quit')
        })
        this.emit('attached')
      }).catch(err => this.emit('error', err))
    this.watch()
  }

  watch() {
    let state = proxy.state
    let {
      cursor,
      bg_color,
      fg_color,
      busy,
      focused,
      mode
      } = state

    const input = this.root.querySelector('.neovim-input')
    store.subscribe(() => {
      // cursor position change
      if (proxy.cursor !== cursor) {
        cursor = proxy.cursor
        const {font_width, font_height} = proxy.font_attr
        const x = cursor.col * font_width
        const y = cursor.line * font_height
        input.style.left = x + 'px'
        input.style.top = y + 'px'
        this.cursor.updateCursorPos()
        this.emit('change cursor', cursor)
      }
      // background color change
      if (proxy.bg_color !== bg_color) {
        bg_color = proxy.bg_color
        this.cursor.redraw()
        this.emit('change bg_color', bg_color)
      }
      // foreground color change
      if (proxy.fg_color !== fg_color) {
        fg_color = proxy.fg_color
        this.cursor.redraw()
        this.emit('change fg_color', fg_color)
      }
      // busy change
      if (proxy.busy !== busy) {
        busy = proxy.busy
        this.cursor.updateCursorBlinking()
        this.emit('change busy', busy)
      }
      // focused change
      if (proxy.focused !== focused) {
        focused = proxy.focused
        this.cursor.updateCursorBlinking()
        this.emit('change focused', focused)
      }
      // mode change
      if (proxy.mode !== mode) {
        mode = proxy.mode
        this.cursor.updateCursorBlinking()
        this.emit('change mode')
      }
    })
  }

  quit() {
    this.process.finalize()
    this.clientInput.off()
    this.off()
  }

  getClient() {
    return this.process.client
  }

  focus() {
    this.clientInput.focus()
  }

  // Note:
  // It is better to use 'argv' property of <neovim-client> for apps using Polymer.
  setArgv(argv) {
    if (!this.process.started) {
      throw new Error("Process is not attached yet.  Use 'process-attached' event to ensure to specify arguments.")
    }
    return this.process.client.command('args ' + argv.join(' '))
  }

  /**
   * convertPositionToLocation public API
   *
   * @public
   * @param {number} line
   * @param {number} col
   * @returns {object}
   */
  convertPositionToLocation(line, col) {
    const {left, top} = this.canvas.getBoundingClientRect()
    const {font_width, font_height} = proxy.font_attr
    return {
      x: col * font_width + left,
      y: line * font_height + top,
    }
  }

  /**
   * convertLocationToPosition public API
   *
   * @public
   * @param {number} x pageX
   * @param {number} y pageY
   * @returns {undefined}
   */
  convertLocationToPosition(x, y) {
    const {left, top} = this.canvas.getBoundingClientRect()
    const {font_width, font_height} = proxy.font_attr
    return {
      line: Math.floor((y - top) * font_height),
      col: Math.floor((x - left) * font_width),
    }
  }
}

