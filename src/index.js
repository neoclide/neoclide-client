import Polymer from 'polymer'
import Neovim from './neovim'

Polymer({
  is: 'neovim-editor',

  properties: {
    fontSize: {
      type: Number,
      value: 14,
    },
    font: {
      type: String,
      value: 'monospace',
    },
    lineHeight: {
      type: Number,
      value: 1.3,
    },
    opacity: {
      type: Number,
      value: 1,
    },
    cursorFgcolor: {
      type: String
    },
    cursorBgcolor: {
      type: String
    },
    nvimCmd: {
      type: String,
      value: 'nvim',
    },
    argv: {
      type: Array,
      value: []
    },
    disableAltKey: {
      type: Boolean,
      value: false,
    },
    disableMetaKey: {
      type: Boolean,
      value: false,
    },
    cursorDrawDelay: {
      type: Number,
      value: 10,
    },
    windowTitle: {
      type: String,
      value: 'Neovim',
    },
    popupmenuExternal: {
      type: Boolean,
      value: false
    },
    editor: Object,
    onProcessAttached: Object,
    onQuit: Object,
    onError: Object
  },

  ready: function() {
    this.editor = new Neovim(
      this,
      this.nvimCmd,
      this.argv,
      {
        popupmenuExternal: this.popupmenuExternal,
        opacity: this.opacity,
        font: this.font,
        fontSize: this.fontSize,
        lineHeight: this.lineHeight,
        disableAltKey: this.disableAltKey,
        disableMetaKey: this.disableMetaKey,
        cursorDrawDelay: this.cursorDrawDelay,
        windowTitle: this.windowTitle,
        cursorFgcolor: this.cursorFgcolor,
        cursorBgcolor: this.cursorBgcolor
      }
    )

    if (this.onError) this.editor.on('error', this.onError)

    if (this.onQuit) this.editor.on('quit', this.onQuit)

    if (this.onProcessAttached) this.editor.on('attached', this.onProcessAttached)
  },

  attached: function() {
    const canvas = this.querySelector('.neovim-canvas')
    const rect = canvas.parentElement.getBoundingClientRect()
    this.editor.attachCanvas(canvas, rect.width, rect.height)
  },

  detached: function() {
    this.editor.emit('detach')
    if (this.editor.process.started) this.editor.quit()
  },

  attributeChanged: function(name, type) {
    this.editor.emit('change attribute', name, type)
  }
})
