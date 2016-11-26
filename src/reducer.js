import * as T from './types'
import {toOpacity} from './util'

const initialState = {
  size: {
    lines: 0,
    cols: 0
  },
  font_attr: {
    fg: 'rgb(255,255,255)',
    bg: 'rgb(0,0,0)',
    sp: null,
    bold: false,
    italic: false,
    underline: false,
    undercurl: false,
    font_width: 7,
    font_height: 14,
    font_size: 14,
    font_family: 'monospace'
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
  focused: false,
  searching: false,
  line_height: 1.2,
  alt_key_disabled: false,
  meta_key_disabled: true,
  cursor_draw_delay: 30,
  blink_cursor: true,
  cursor_blink_interval: 500,
  cursor_fgcolor: '#000000',
  cursor_bgcolor: '#ffffff',
  opacity: 1,
  bg_color: 'rgb(0,0,0)',
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
          state.font_attr.font_family)
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
        action.font || state.font_attr.font_family)
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
        cursor_fgcolor: action.cursor_fgcolor || state.cursor_fgcolor,
        cursor_bgcolor: action.cursor_bgcolor || state.cursor_bgcolor,
        alt_key_disabled: action.alt_key_disabled,
        meta_key_disabled: action.meta_key_disabled,
        cursor_draw_delay: action.cursor_draw_delay == null ? state.cursor_draw_delay : action.cursor_draw_delay,
        cursor_blink_interval: action.cursor_blink_interval || state.cursor_blink_interval
      }
    }
    case T.CHANGE_SIZE: {
      const {width, height} = action
      const {font_height, font_width} = state.font_attr
      const {size} = state
      const lines = Math.floor(height/font_height)
      const cols = Math.floor(width/font_width)
      const scroll_region = {
        top: 0,
        left: 0,
        right: cols - 1,
        bottom: lines - 1
      }
      if (lines == size.lines && cols == size.cols) return state
      return {
        ...state,
        scroll_region,
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
      const fg_color = colorString(action.color, state.fg_color)
      return {
        ...state,
        fg_color
      }
    }
    case T.UPDATE_BG: {
      const {opacity} = state
      const bg_color = colorString(action.color, state.bg_color, opacity)
      return {
        ...state,
        bg_color
      }
    }
    case T.UPDATE_SP: {
      const {opacity} = state
      const sp_color = colorString(action.color, state.fg_color, opacity)
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
    case T.CHANGE_OPACITY:
      return {
        ...state,
        opacity: action.opacity
      }
    case T.BELL_ACTION:
    case T.VISUAL_BELL_ACTION:
    case T.SCROLL_ACTION:
    case T.EOL_CLEAR_ACTION:
    case T.CLEAR_ACTION:
    case T.PUT_ACTION:
      return state
    default:
      return state
  }
}

export const KEYS = Object.keys(initialState)

function measureText(drawn_px, font_family) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = drawn_px + 'px ' + font_family
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
  return {font_width, font_height, font_size, font_family: font}
}

// Note: 0x001203 -> '#001203'
function colorString(color, fallback, opacity = 1) {
  if (typeof color !== 'number' || color < 0) {
    return toOpacity(fallback, opacity)
  }
  return toOpacity(color, opacity)
}
