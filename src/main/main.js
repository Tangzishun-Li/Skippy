const { app, BrowserWindow } = require('electron')

const windowManager = require('./modules/windowManager')
const trayManager = require('./modules/trayManager')
const ipcHandlers = require('./modules/ipcHandlers')
const database = require('./modules/database')
const sync = require('./modules/sync')
const notification = require('./modules/notification')
const mailer = require('./modules/mailer')

app.isQuitting = false

app.whenReady().then(async () => {
  console.log('[App] Starting Skippy...')
  
  await database.initDatabase()
  console.log('[App] Database initialized')
  
  sync.setupFromConfig()
  console.log('[App] Sync module initialized')
  
  notification.loadSettings()
  console.log('[App] Notification module initialized')
  
  mailer.loadSettings()
  console.log('[App] Mailer module initialized')
  
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
  database.closeDatabase()
})
