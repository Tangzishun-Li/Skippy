const { BrowserWindow, app } = require('electron')
const path = require('path')

const BASE_PATH = path.join(__dirname, '..')

let mainWindow = null
let floatingBallWindow = null

const MAIN_WINDOW_CONFIG = {
  width: 800,
  height: 600,
  autoHideMenuBar: true
}

const FLOATING_BALL_CONFIG = {
  width: 85,
  height: 50,
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  resizable: false,
  skipTaskbar: true
}

function getPreloadPath() {
  return path.join(BASE_PATH, 'preload.js')
}

function createMainWindow() {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
    return mainWindow
  }

  mainWindow = new BrowserWindow({
    ...MAIN_WINDOW_CONFIG,
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.loadFile(path.join(BASE_PATH, '../renderer/index.html'))
  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  return mainWindow
}

function createFloatingBallWindow() {
  if (floatingBallWindow) {
    floatingBallWindow.show()
    return floatingBallWindow
  }

  floatingBallWindow = new BrowserWindow({
    ...FLOATING_BALL_CONFIG,
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  floatingBallWindow.loadFile(path.join(BASE_PATH, '../floating/floating-ball.html'))

  const { screen } = require('electron')
  const { left, top } = {
    left: screen.getPrimaryDisplay().workAreaSize.width - 150,
    top: screen.getPrimaryDisplay().workAreaSize.height - 100
  }
  floatingBallWindow.setPosition(left, top)

  floatingBallWindow.on('closed', () => {
    floatingBallWindow = null
  })

  return floatingBallWindow
}

function getMainWindow() {
  return mainWindow
}

function getFloatingBallWindow() {
  return floatingBallWindow
}

function showMainWindow() {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
  }
}

function hideMainWindow() {
  if (mainWindow) {
    mainWindow.hide()
  }
}

function toggleMainWindow() {
  if (mainWindow) {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  }
}

function showFloatingBall() {
  if (floatingBallWindow) {
    floatingBallWindow.show()
  }
}

function hideFloatingBall() {
  if (floatingBallWindow) {
    floatingBallWindow.hide()
  }
}

function toggleFloatingBall() {
  if (floatingBallWindow) {
    if (floatingBallWindow.isVisible()) {
      floatingBallWindow.hide()
    } else {
      floatingBallWindow.show()
    }
  }
}

function setFloatingBallAlwaysOnTop(flag) {
  if (floatingBallWindow) {
    floatingBallWindow.setAlwaysOnTop(flag)
  }
}

function moveFloatingBall(x, y) {
  if (floatingBallWindow) {
    floatingBallWindow.setBounds({ x, y, width: 85, height: 50 })
  }
}

function openFloatingBallDevTools() {
  if (floatingBallWindow) {
    floatingBallWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

function sendToFloatingBall(channel, data) {
  if (floatingBallWindow) {
    floatingBallWindow.webContents.send(channel, data)
  }
}

function destroyAllWindows() {
  if (mainWindow) {
    mainWindow.destroy()
    mainWindow = null
  }
  if (floatingBallWindow) {
    floatingBallWindow.destroy()
    floatingBallWindow = null
  }
}

module.exports = {
  createMainWindow,
  createFloatingBallWindow,
  getMainWindow,
  getFloatingBallWindow,
  showMainWindow,
  hideMainWindow,
  toggleMainWindow,
  showFloatingBall,
  hideFloatingBall,
  toggleFloatingBall,
  setFloatingBallAlwaysOnTop,
  moveFloatingBall,
  openFloatingBallDevTools,
  sendToFloatingBall,
  destroyAllWindows
}
