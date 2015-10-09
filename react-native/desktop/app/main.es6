var app = require('app')
var BrowserWindow = require('browser-window')

var mainWindow = null

app.on('window-all-closed', function () {
  app.quit()
})
//app.commandLine.appendSwitch('js-flags', '--harmony')

app.on('ready', function() {
  console.log('app ready')
  mainWindow = new BrowserWindow({width: 1200, height: 900})
  var filename = 'file://' + __dirname + '/../renderer/index.html'
  console.log(filename)
  mainWindow.loadUrl(filename)
  mainWindow.openDevTools()
  mainWindow.on('closed', function () {
    mainWindow = null
  })
})
