import Emitter from 'emitter'

const MouseButtonKind = [ 'Left', 'Middle', 'Right' ]

export default class ScreenDrag extends Emitter {
  static buildInputOf(e, type, line, col) {
    let seq = '<'
    if (e.ctrlKey) {
      seq += 'C-'
    }
    if (e.altKey) {
      seq += 'A-'
    }
    if (e.shiftKey) {
      seq += 'S-'
    }
    seq += MouseButtonKind[e.button] + type + '>'
    seq += `<${col},${line}>`
    return seq
  }

  constructor(proxy) {
    super()
    this.proxy = proxy
  }

  start(ev, pos) {
    ev.preventDefault()
    let [line, col] = pos
    const input = ScreenDrag.buildInputOf(ev, 'Mouse', line, col)
    this.emit('input', input)
  }

  drag(ev, pos) {
    ev.preventDefault()
    const [line, col] = pos
    const input = ScreenDrag.buildInputOf(ev, 'Drag', line, col)
    this.emit('input', input)
  }

  end(ev, pos) {
    ev.preventDefault()
    let [line, col] = pos
    const input = ScreenDrag.buildInputOf(ev, 'Release', line, col)
    this.emit('input', input)
  }
}
