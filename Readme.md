# Neoclide-client

**Neoclide-client** is a redesigned UI component of [neovim-component](https://github.com/rhysd/neovim-component).

Besides many bugs fixed, neoclide-client introduce uniformed data flow specified for neovim to make the UI easy to
reason about.

**Note** some features relies on [electron](https://github.com/electron/electron) to work.

## Install

[node.js](https://nodejs.org) is need, just run:

    npm run install

## Data flow

![Data-flow](https://cloud.githubusercontent.com/assets/251450/20463892/dfd18a46-af77-11e6-813a-8588b7d479bf.png)

## Usage

Include webcomponent, polymer and neovim-editor  to html page and `neovim-editor` tag.

``` html
<script src="../bower_components/webcomponentsjs/webcomponents-lite.min.js"></script>
<link rel="import" href="../bower_components/polymer/polymer.html" />
<link rel="import" href="../neovim-editor.html" />
<neovim-editor id="neovim" font="Source\ Code\ Pro" font-size="14">
</neovim-editor>
```

See detailed in `example/index.html`

You can run the example by using `node example/cli.js` after installation.

## Configuration

`neovim-editor` have some properties which allowed to specify how neovim-editor works before attched.

* `fontSize`: font size for rendering, default `14`
* `font`: font family for rendering, default `monospace`
* `lineHeight`: line height for rendering, default `1.3`
* `nvimCmd`: command start neovim default `nvim`
* `argv`: argument list add to nvimCmd, default `[]`
* `disableAltKey`: default `false`
* `disableMetaKey`: default `false`
* `cursorDrawDelay`: delay for redrawing cursor default `10`
* `windowTitle`: default `Neovim`
* `onProcessAttached`: optional callback function on editor attached
* `onQuit`: optional callback function on editor quit
* `onError`: optional callback function on editor error

## Editor events

Access `editor` instance by using `element.editor`, for example:

``` js
const el = document.getElementById('neovim-editor')
cosnt editor = el.editor
```

* `attached` fired on editor attached
* `detach` fired on editor detached
* `quit` fired on editor quit
* `error` fired on editor error with error instance
* `contextmenu` fired on contextmenu event of editor
* `bell` fired on editor bell
* `visual-bell` fired on editor visual-bell

* `change title` fired with new title
* `change icon` fired with new icon path
* `change attribute` fired on element attribute change with `name` and `type`
* `change scroll_region` fired with new `scroll_region`
* `change size` fired with new size of editor, which contains `lines` and `cols`
* `change cursor` fired with new cursor position
* `change bg_color` fired with new bg_color (rgba or rgb format)
* `change fg_color` fired with new fg_color (rgba or rgb format)
* `change font_attr` fired with new font attributes
* `change busy` fired with busy (true of false)
* `change focused` fired with focused (true of false)
* `change mode` fired with new mode (`command` or `insert`, need patch neovim to support `cmdline`)


## Editor API

### editor.getClient()

Get underlying [promised-neovim](https://github.com/rhysd/promised-neovim-client) client. 

### editor.focus()

Focus canvas element of editor

### editor.setArgv(argv: Array)

Pass new argument list to `neovim`, see `:h args_f`

### editor.state

Get a readonly state object of editor.

## editor.convertPositionToLocation(line, col)

Helper function covert cursor position to screen position.

## editor.convertLocationToPosition(x, y)

Helper function covert screen position to cursor position.

### editor.quit()

Quit editor

## LICENCE

Copyright 2016 chemzqm@gmail.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
