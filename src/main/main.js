const { app, BrowserWindow } = require('electron')

const windowManager = require('./modules/windowManager')
const trayManager = require('./modules/trayManager')
const ipcHandlers = require('./modules/ipcHandlers')

app.isQuitting = false

app.whenReady().then(() => {
  windowManager.createMainWindow()
  windowManager.createFloatingBallWindow()
  
  trayManager.createTray(windowManager)
  
  ipcHandlers.registerIpcHandlers(windowManager)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createMainWindow()
      windowManager.createFloatingBallWindow()
    }
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', function () {
  app.isQuitting = true
})
