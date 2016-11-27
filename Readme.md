# Neoclide-client

**Neoclide-client** is a redesigned UI component of [neovim-component](https://github.com/rhysd/neovim-component).

Besides many bugs fixed, neoclide-client introduce uniformed data flow specified for neovim to make the UI easy to
reason about.

**Note** some features relies on [electron](https://github.com/electron/electron) to work.

## Features

* Background transparent support
* Improved input method support (need to run electron-rebuild)
* More friendly cursor support, without antialiased issue
* Accessable editor state object
* Automatic resize handler, no screen blink

## Install

[node.js](https://nodejs.org) is need, just run:

    npm install neoclide-client

Some native modules is used, since it's build for electron, `electron-rebuild` need to be run after install or electron get upgraded.

## Data flow

![Data-flow](https://cloud.githubusercontent.com/assets/251450/20463892/dfd18a46-af77-11e6-813a-8588b7d479bf.png)

## Usage

Include webcomponent, polymer and neovim-editor to html page and `neovim-editor` tag.

``` html
<script src="../bower_components/webcomponentsjs/webcomponents-lite.min.js"></script>
<link rel="import" href="../bower_components/polymer/polymer.html" />
<link rel="import" href="../neovim-editor.html" />
<neovim-editor id="neovim" font="Source\ Code\ Pro" font-size="14">
</neovim-editor>
```

See detailed in `example/index.html`

You can run the example by using `node example/cli.js` after clone the repo and
electron-rebuild.

## Configuration

`neovim-editor` have some properties which allows specify how neovim-editor works before attched.

None of them are required.

* `font-size`: font size for rendering, default `14`
* `font`: font family for rendering, default `monospace`
* `line-height`: line height for rendering, default `1.3`
* `nvim-cmd`: command start neovim default `nvim`
* `argv`: argument list add to nvimCmd, default `[]`
* `disable-alt-key`: default `false`
* `disable-meta-key`: default `true`
* `cursor-draw-delay`: delay for redrawing cursor default `10`
* `window-title`: default `Neovim`
* `on-process-attached`: optional callback function on editor attached
* `on-quit`: optional callback function on editor quit
* `on-error`: optional callback function on editor error
* `cursor-fgcolor`: font color of cursor, default `#000000`
* `cursor-bgcolor`: background color of cursor, default `#ffffff`
* `popupmenu-external`: set to true to enable popupmenu-external (only exists on neovim 0.2.0)

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
* `change busy` fired with busy (true of false)
* `change focused` fired with focused (true of false)
* `change mode` fired with new mode (`command` or `insert`, need patch neovim to support `cmdline`)
* `menu_show` emitted on popupmenu is shown with info object, which contains:
  * `activeIndex` current active index, could be -1 when no active item
  * `cols` column number of start position on screen
  * `lines` line number of start position on screen
  * `items` contains complete items, each items contains `word`, `kind`, `info` and `menu` as string, see `:h complete-items`
* `menu_change` emitted with active index on complete change
* `menu_hide` emitted on complete menu hide



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
