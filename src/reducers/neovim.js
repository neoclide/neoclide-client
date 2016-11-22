import * as T from '../constants/ActionTypes'

const initialState = {
  size: {
    lines: 0,
    cols: 0
  },
  font_attr: {
    fg: 'white',
    bg: 'rgba(0,0,0,0.8)',
    sp: null,
    bold: false,
    italic: false,
    underline: false,
    undercurl: false,
    font_width: 7,
    font_height: 14,
    font_size: 14,
    face: 'monospace'
	},
  cursor: {
    line: 0,
    col: 0
  },
  scroll_region: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  mode: 'normal',
  busy: false,
  mouse_enabled: true,
  title: '',
  icon_path: '',
  focused: true,
  searching: false,
  line_height: 1.2,
  alt_key_disabled: false,
  meta_key_disabled: true,
  cursor_draw_delay: 30,
  blink_cursor: true,
  cursor_blink_interval: 500,
  opacity: 0.8,
  bg_color: 'rgba(0,0,0, 0.8)',
  fg_color: 'rgb(255,255,255)',
  sp_color: 'rgb(255,255,255)'
}


export default function neovim(state = initialState, action) {
  switch (action.type) {
    case T.CHANGE_LINE_HEIGHT:
      if (action.line_height == state.line_height)  return state
      return {
        ...state,
        line_height: action.line_height
      }
    case T.CHANGE_TITLE:
      return {
        ...state,
        title: action.title
      }
    case T.CHANGE_FONT_SIZE: {
      const {font_size} = action
      const {font_attr} = state
      const obj = calculateDrawBlock(font_size,
          state.line_height,
          state.font_attr.face)
      return Object.assign({}, state, {
        font_attr: {
          ...font_attr,
          ...obj
        }
      })
    }
    case T.SET_FONT_ATTRS: {
      const obj = calculateDrawBlock(
        action.fontSize || state.font_attr.font_size,
        action.lineHeight || state.line_height,
        action.font || state.font_attr.face)
      return Object.assign({}, state, {
        line_height: action.lineHeight || state.line_height,
        font_attr: {
          ...state.font_attr,
          ...obj
        }
      })
    }
    case T.SET_INPUT_OPTIONS: {
      return {
        ...state,
        alt_key_disabled: action.disableAltKey,
        meta_key_disabled: action.disableMetaKey,
        cursor_draw_delay: action.cursorDrawDelay == null ? state.cursor_draw_delay : action.cursorDrawDelay,
        cursor_blink_interval: action.cursorBlinkInterval || state.cursor_blink_interval
      }
    }
    case T.CHANGE_SIZE: {
      const {width, height} = action
      const {font_height, font_width} = state.font_attr
      const {size} = state
      const lines = Math.floor(height/font_height)
      const cols = Math.floor(width/font_width)
      if (lines == size.lines && cols == size.cols) return state
      return {
        ...state,
        size: {
          lines,
          cols
        }
      }
    }
    case T.TOGGLE_SEARCH: {
      return {
        ...state,
        searching: action.searching
      }
    }
    case T.TOGGLE_FOCUS: {
      return {
        ...state,
        focused: action.focused
      }
    }
    case T.CURSOR_GOTO: {
      return {
        ...state,
        cursor: {
          line: action.line == null ? state.line : action.line,
          col: action.col == null ? state.col : action.col
        }
      }
    }
    case T.SET_HIGHLIGHTS: {
      const {bg_color, fg_color, sp_color, opacity} = state
      const hl = action.highlights
      const obj = {
        bold: hl.bold,
        italic: hl.italic,
        underline: hl.underline,
        undercurl: hl.undercurl,
        fg: hl.reverse ? colorString(hl.background, bg_color) : colorString(hl.foreground, fg_color),
        bg: hl.reverse ? colorString(hl.foreground, fg_color, opacity) : colorString(hl.background, bg_color, opacity),
        sp: colorString(hl.special, sp_color || fg_color)
      }
      return {
        ...state,
        font_attr: {
          ...state.font_attr,
          ...obj
        }
      }
    }
    case T.SET_SCROLL_REGION: {
      return {
        ...state,
        scroll_region: action.region
      }
    }
    case T.UPDATE_FG: {
      const {font_attr} = state
      const fg_color = colorString(action.color, font_attr.fg)
      return {
        ...state,
        fg_color
      }
    }
    case T.UPDATE_BG: {
      const {font_attr, opacity} = state
      const bg_color = action.color < 0 ? 'rgba(0,0,0,0.8)':
        colorString(action.color, font_attr.bg, opacity)
      return {
        ...state,
        bg_color
      }
    }
    case T.UPDATE_SP: {
      const sp_color = colorString(action.color, state.fg_color)
      return {
        ...state,
        sp_color
      }
    }
    case T.CHANGE_MODE: 
      return {
        ...state,
        mode: action.mode
      }
    case T.TOGGLE_BUSY:
      return {
        ...state,
        busy: action.busy
      }
    case T.TOGGLE_MOUSE:
      return {
        ...state,
        mouse_enabled: action.mouse
      }
    case T.CHANGE_ICON:
      return {
        ...state,
        icon_path: action.icon
      }
    default:
      return state
  }
}

export const KEYS = Object.keys(initialState)

function measureText(drawn_px, face) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = drawn_px + 'px ' + face
  return ctx.measureText('m').width
}

function calculateDrawBlock(font_size, line_height, font) {
  // Note1:
  // Line height of <canvas> is fixed to 1.2 (normal).
  // If the specified line height is not 1.2, we should calculate
  // the line height manually.
  //
  // Note2:
  // font_width is not passed to Math.ceil() because the line-height
  // of <canvas> is fixed to 1.2.  Math.ceil(font_width) makes region
  // wider but width of actual rendered text is not changed.  Then it
  // causes rendering issues.
  // On the other hand, line-height is managed by us completely.  So
  // we can use Math.ceil(font_height) at this point and it resolves
  // some rendering issues (see #12).
  
  const font_width = measureText(font_size, font)

  const font_height = Math.ceil(
    line_height === 1.2 ?
    font_width * 2 :
    font_size *line_height
  )
  return {font_width, font_height, font_size, face: font}
}

// Note: 0x001203 -> '#001203'
function colorString(new_color, fallback, opacity = 1) {
  if (typeof new_color !== 'number' || new_color < 0) {
    return fallback
  }

  var r = (new_color >> 16) & 255
  var g = (new_color >> 8) & 255
  var b = new_color & 255

  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}