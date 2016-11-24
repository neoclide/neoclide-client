import * as T from './types'

export const changeTitle = title => ({ type: T.CHANGE_TITLE, title })

export const changeFontSize = (font_size) => {
  return {type: T.CHANGE_FONT_SIZE, font_size}
}

export const changeLineHeight = (line_height) => {
  return {type: T.CHANGE_LINE_HEIGHT, line_height}
}

export const setFontAttrs = (attrs) => {
  return {type: T.SET_FONT_ATTRS, ...attrs}
}

export const setInputOptions = (attrs) => {
  return {type: T.SET_INPUT_OPTIONS, ...attrs}
}

export const changeSize = (width, height) => {
  return {type: T.CHANGE_SIZE, width, height}
}

export const toggleSearch = searching => {
  return {type: T.TOGGLE_SEARCH, searching}
}

export const toggleFocus = (focused) => {
  return {type: T.TOGGLE_FOCUS, focused}
}

export const moveCursor = (line, col) => {
  return {type: T.CURSOR_GOTO, line, col}
}

export const setHighlights = highlights => {
  return {type: T.SET_HIGHLIGHTS, highlights}
}

export const setScrollRegion = region => {
  return {type: T.SET_SCROLL_REGION, region}
}

export const updateFg = color => {
  return {type: T.UPDATE_FG, color}
}

export const updateBg = color => {
  return {type: T.UPDATE_BG, color}
}

export const updateSp = color => {
  return {type: T.UPDATE_SP, color}
}

export const changeMode = mode => {
  return {type: T.CHANGE_MODE, mode}
}

export const toggleBusy = busy => {
  return {type: T.TOGGLE_BUSY, busy}
}

export const toggleMouse = mouse => {
  return {type: T.TOGGLE_MOUSE, mouse}
}

export const changeIcon = icon => {
  return {type: T.CHANGE_ICON, icon}
}

export const changeOpacity = opacity => {
  return {type: T.CHANGE_OPACITY, opacity}
}

export const bell = () => {
  return {type: T.BELL_ACTION}
}

export const visualBell = () => {
  return {type: T.VISUAL_BELL_ACTION}
}

export const scroll = () => {
  return {type: T.SCROLL_ACTION}
}

export const eolClear = () => {
  return {type: T.EOL_CLEAR_ACTION}
}

export const clear = () => {
  return {type: T.CLEAR_ACTION}
}

export const put = () => {
  return {type: T.PUT_ACTION}
}
