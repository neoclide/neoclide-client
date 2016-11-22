import Emitter from 'emitter'

export default class CursorBlinkTimer extends Emitter {
  constructor(interval) {
    super()
    this.interval = interval
    this.token = null
    this.enabled = false
    this.shown = true
    this.callback = this._callback.bind(this)
  }

  start() {
    if (this.enabled) return
    this.shown = true
    this.token = window.setTimeout(this.callback, this.interval)
    this.enabled = true
  }

  stop() {
    if (!this.enabled) return
    if (this.token !== null) {
      window.clearTimeout(this.token)
      this.token = null
    }
    this.enabled = false
  }

  reset() {
    if (this.enabled) {
      this.stop()
      this.start()
    }
  }

 _callback() {
    this.shown = !this.shown
    this.emit('tick', this.shown)
    this.token = window.setTimeout(this.callback, this.interval)
  }
}

