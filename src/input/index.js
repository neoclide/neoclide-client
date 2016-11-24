import Emitter from 'emitter'
import raf from 'raf'
import NeovimInput from './input'
import ScreenDrag from './screen-drag'
import ScreenWheel from './screen-wheel'
import Compose from './compose'
import throttle from 'throttleit'
import debounce from 'debounce'

function checkResize(el, fn) {
  let w
  let h
  let func = debounce(fn, 200)
  function check() {
    let {width, height} = el.getBoundingClientRect()
    if (w && h && (w !== width || h !== height)) {
      func(width, height)
    }
    w = width
    h = height
    setTimeout(() => {
      raf(check)
    }, 100)
  }
  raf(check)
}

export default class ClientInput extends Emitter {
  constructor(root, proxy) {
    super()
    this.proxy = proxy

    const composEl = root.querySelector('#neovim-composing')
    const compose = this.compose = new Compose(composEl, proxy)
    compose.on('cursor', pos => { this.emit('cursor', pos) })

    const canvas = this.canvas = root.querySelector('.neovim-canvas')
    const inputEl = root.querySelector('.neovim-input')
    // bind input
    const input = this.input = new NeovimInput(inputEl, proxy)
    input.on('startComposing', () => { compose.start() })
    input.on('updateComposing', input => { compose.update(input) })
    input.on('endComposing', () => { compose.end() })

    input.on('startSearch', () => { this.emit('startSearch') })
    input.on('focusChanged', res => { this.emit('focusChanged', res) })
    input.on('input', input => { this.emit('input', input) })

    canvas.addEventListener('contextmenu', e => {
      e.position = this.getPos(e)
      this.emit('contextmenu', e)
    })
    canvas.addEventListener('wheel', throttle(e => {
      this.wheel(e)
    }, 20))
    canvas.addEventListener('click', () => { this.input.focus() })

    canvas.addEventListener('mousedown', this.mousedown.bind(this))
    canvas.addEventListener('mouseup', this.mouseup.bind(this))
    canvas.addEventListener('mousemove', this.mousemove.bind(this))

    const drag = this.screenDrag = new ScreenDrag(proxy)
    drag.on('input', input => { this.emit('input', input) })

    const wheel = this.screenWheel = new ScreenWheel(proxy)
    wheel.on('input', input => { this.emit('input', input) })

    checkResize(canvas.parentNode, this.onResize.bind(this))
  }
  focus() {
    this.input.focus()
  }
  mousedown(e) {
    if (!this.proxy.mouse_enabled) return
    if (e.button == 0) {
      this.screenDrag.start(e, this.getPos(e))
    }
  }
  mousemove(e) {
    if (!this.proxy.mouse_enabled) return
    if (e.buttons === 1) {
      this.screenDrag.drag(e, this.getPos(e))
    }
  }
  mouseup(e) {
    if (!this.proxy.mouse_enabled) return
    if (e.button == 0) {
      this.screenDrag.end(e, this.getPos(e))
    }
  }
  wheel(e) {
    if (!this.proxy.mouse_enabled) return
    this.screenWheel.handleEvent(e)
    this.emit('wheel', e)
  }
  getPos(e) {
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - window.pageXOffset - rect.left
    const y = e.clientY - window.pageYOffset - rect.top
    const {font_attr} = this.proxy
    return [
      Math.floor(y / font_attr.font_height),
      Math.floor(x / font_attr.font_width),
    ]
  }
  onResize(width, height) {
    this.emit('resize', width, height)
  }
}
