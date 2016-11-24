const KeyboardLayout = require('keyboard-layout')

let keyboardLayout = ''

KeyboardLayout.observeCurrentKeyboardLayout(layout => {
  keyboardLayout = layout
  const ev = new CustomEvent('layoutChange', {
    detail: layout
  })
  window.dispatchEvent(ev)
})

export const imselect = require('imselect')

export function layout() {
  return keyboardLayout
}

export function imeRunning() {
  return keyboardLayout && keyboardLayout !== 'com.apple.keylayout.US'
}

export function defaultIM() {
  if (keyboardLayout && keyboardLayout !== 'com.apple.keylayout.US') {
    imselect.selectMethod()
    return true
  }
  return false
}

let cmdlineIM = null

export function saveCommandIm() {
  cmdlineIM = keyboardLayout
}

export function selectCommandIm() {
  if (cmdlineIM) imselect.selectMethod(cmdlineIM)
}

export function toOpacity(color, opacity = 1) {
  let r, g, b
  if (typeof color == 'number') {
    r = (color >> 16) & 255
    g = (color >> 8) & 255
    b = color & 255
  } else if (/^#/.test(color)) {
    let ms = color.match(/(\w{2})(\w{2})(\w{2})/)
    r = parseInt(ms[1], 16)
    g = parseInt(ms[2], 16)
    b = parseInt(ms[3], 16)
  } else if (/^rgb/.test(color)) {
    const ms = color.substring(color.indexOf('(') + 1, color.lastIndexOf(')')).split(/,\s*/)
    r = ms[0]
    g = ms[1]
    b = ms[2]
  } else {
    throw new Error(`Unknown color ${color}`)
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
