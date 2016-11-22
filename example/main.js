var path = require('path')
var electron = require('electron')
var app = electron.app
var BrowserWindow = electron.BrowserWindow

var index_html = 'file://' + path.join(__dirname, 'index.html')

app.on('ready', function() {
    BrowserWindow.addDevToolsExtension('/Users/chemzqm/Library/Application Support/Google/Chrome/Default/Extensions/lmhkpmbekcpmknklioeibfkpmmfibljd/2.10.2_0')
    var win = new BrowserWindow({
        width: 800,
        height: 600,
        useContentSize: true,
        alwaysOnTop: false,
        title: "Neoclide",
        webPreferences: {
          webgl: true,
          experimentalCanvasFeatures: false,
          plugins: true
        },
        hasShadow: false,
        defaultEncoding: "utf8",
        transparent: true,
        frame: true
    })

    win.on('closed', function() {
        win = null
        app.quit()
    })

    win.loadURL(index_html)
    if (process.env['NODE_ENV'] !== 'production') {
        win.webContents.openDevTools({detach: true})
    }
})
