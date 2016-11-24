var path = require('path')
var electron = require('electron')
var app = electron.app
var BrowserWindow = electron.BrowserWindow

var index_html = 'file://' + path.join(__dirname, 'index.html')

app.on('ready', function() {
    const root = path.join(__dirname, '../extension/redux/2.10.3.1_0')
    BrowserWindow.addDevToolsExtension(root)

    var win = new BrowserWindow({
        width: 800,
        height: 600,
        useContentSize: true,
        alwaysOnTop: false,
        title: "Neoclide",
        webPreferences: {
          webgl: true,
          experimentalCanvasFeatures: true,
          plugins: false
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
