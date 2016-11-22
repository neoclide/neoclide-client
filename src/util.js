
export function defaultIM() {
  if (window.keyboardLayout && window.keyboardLayout !== 'com.apple.keylayout.US') {
    window.imselect.selectMethod()
    return true
  }
  return false
}

let cmdlineIM = null

export function saveCommandIm() {
  cmdlineIM = window.keyboardLayout
}

export function selectCommandIm() {
  if (cmdlineIM) window.imselect.selectMethod(cmdlineIM)
}
