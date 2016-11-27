// Note:
// Use renderer's node.js integration to avoid using ipc for large data transfer
const child_process = require('child_process')
import Emitter from 'emitter'
import {attach} from 'promised-neovim-client'
import log from './log'

export default class NeovimProcess extends Emitter {
  /**
   * Constructor
   *
   * @public
   * @param {String} command
   * @param {Array} argv
   */
  constructor(command, argv) {
    super()
    this.command = command
    this.argv = argv
    this.started = false
    this.argv.unshift('--embed')
    this._actions = []
  }

  attach(lines, columns, external_popup) {
    this.client = null

    this.neovim_process = child_process.spawn(
      this.command, this.argv,
      {stdio: ['pipe', 'pipe', process.stderr]})

    return new Promise((resolve, reject) => {
      this.neovim_process.on('error', err => {
        console.error(err.stack)
      })
      if (!this.neovim_process.pid) return reject(new Error('neovim process not started'))
      attach(this.neovim_process.stdin, this.neovim_process.stdout)
        .then(nvim => {
          this.client = nvim
          nvim.on('request', this.onRequested.bind(this))
          nvim.on('notification', this.onNotified.bind(this))
          nvim.on('disconnect', this.onDisconnected.bind(this))
          nvim.uiAttach(columns, lines, {
            rgb: true,
            popupmenu_external: external_popup
          }, true /*notify*/)
          log.info(`nvim attached: ${this.neovim_process.pid} ${lines}x${columns} ${JSON.stringify(this.argv)}`)
          this.started = true

          setImmediate(() => {
            this.client.command('silent doautocmd <nomodeline> GUIEnter')
          })
          resolve(nvim)
        }, reject)
    })
  }

  input(chars) {
    if (this.client) this.client.input(chars)
  }

  tryResize(cols, lines) {
    if (this.client) this.client.uiTryResize(cols, lines)
  }

  onRequested(method, args, response) {
    log.info('requested: ', method, args, response)
  }

  onNotified(method, args) {
    if (method === 'redraw') {
      this.redraw(args)
    } else {
      // User defined notifications are passed here.
      log.debug('Unknown method', method, args)
    }
  }

  onDisconnected() {
    log.info('disconnected: ' + this.neovim_process.pid)
    // TODO:
    // Uncomment below line to close window on quit.
    // I don't do yet for debug.
    //global.require('electron').remote.getCurrentWindow().close()
    this.started = false
  }

  finalize() {
    this.off()
    return this.client.uiDetach().then(() => {
      this.client.quit()
      this.started = false
    }, () => {})
  }

  redraw(events) {
    for (const e of events) {
      const name = e[0]
      const args = e[1]
      switch (name) {
        case 'put':
          e.shift()
          if (e.length !== 0) this.emit('put', e)
          break
        case 'cursor_goto':
          // line col
          this.emit('cursor_goto', args[0], args[1])
          break
        case 'highlight_set':
          e.shift()
          {
            const highlights = [].concat.apply([], e)
            highlights.unshift({})
            const merged_highlight = Object.assign.apply(Object, highlights)
            this.emit("highlight_set", merged_highlight)
          }
          break
        case 'clear':
          this.emit('clear')
          break
        case 'eol_clear':
          this.emit('eol_clear')
          break
        case 'scroll':
          this.emit('scroll', args[0])
          break
        case 'set_scroll_region':
          this.emit('set_scroll_region', {
            top: args[0],
            bottom: args[1],
            left: args[2],
            right: args[3]
          })
          break
        case 'resize':
          this.emit('resize', args[0], args[1])
          break
        case 'update_fg':
          this.emit('update_fg', args[0])
          break
        case 'update_bg':
          this.emit('update_bg', args[0])
          break
        case 'update_sp':
          this.emit('update_sp', args[0])
          break
        case 'mode_change':
          this.emit('mode_change', args[0])
          break
        case 'busy_start':
          this.emit('busy_start')
          break
        case 'busy_stop':
          this.emit('busy_stop')
          break
        case 'mouse_on':
          this.emit('mouse_on')
          break
        case 'mouse_off':
          this.emit('mouse_off')
          break
        case 'bell':
          this.emit('beel')
          break
        case 'visual_bell':
          this.emit('visual_bell')
          break
        case 'set_title':
          this.emit('set_title', args[0])
          break
        case 'set_icon':
          this.emit('set_icon', args[0])
          break
        case 'popupmenu_show': {
          this.emit('menu_show', {
            items: args[0].map(o => {
              return {
                word: o[0],
                kind: o[1],
                menu: o[2],
                info: o[3]
              }
            }),
            activeIndex: args[1],
            lines: args[2],
            cols: args[3]
          })
          break
        }
        case 'popupmenu_select':
          this.emit('menu_select', args[0])
          break
        case 'popupmenu_hide': 
          this.emit('menu_hide')
          break
        default:
          console.warn('Unhandled event: ' + name, args)
          break
      }
    }
  }
}
