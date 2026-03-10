const { BrowserWindow, app, ipcMain, screen } = require('electron')
const path = require('path')

const BASE_PATH = path.join(__dirname, '..')

let mainWindow = null
let floatingBallWindow = null
let isFloatExpanded = false

const MAIN_WINDOW_CONFIG = {
  width: 1200,
  height: 800,
  autoHideMenuBar: true
}

const FLOATING_BALL_CONFIG = {
  width: 60,
  height: 60,
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  resizable: false,
  skipTaskbar: true,
  hasShadow: false
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

  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  floatingBallWindow = new BrowserWindow({
    ...FLOATING_BALL_CONFIG,
    x: width - 80,
    y: 100,
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  floatingBallWindow.loadFile(path.join(BASE_PATH, '../floating/floating-ball.html'))

  floatingBallWindow.on('moved', () => {
    if (isFloatExpanded) return

    const bounds = floatingBallWindow.getBounds()
    const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y })
    const screenWidth = display.workAreaSize.width
    const screenX = display.bounds.x

    const snapMargin = 10
    const ballCenter = bounds.x + bounds.width / 2
    const isLeft = ballCenter < (screenX + screenWidth / 2)
    const targetX = isLeft ? screenX + snapMargin : screenX + screenWidth - bounds.width - snapMargin

    animateWindow(floatingBallWindow, targetX, bounds.y)
  })

  floatingBallWindow.on('closed', () => {
    floatingBallWindow = null
  })

  return floatingBallWindow
}

function animateWindow(win, targetX, targetY) {
  const startBounds = win.getBounds()
  const distanceX = targetX - startBounds.x

  if (Math.abs(distanceX) < 2) return

  const totalFrames = 15
  let currentFrame = 0

  const interval = setInterval(() => {
    currentFrame++
    const progress = currentFrame / totalFrames
    const easeOut = 1 - Math.pow(1 - progress, 3)
    const currentX = Math.round(startBounds.x + distanceX * easeOut)

    if (!win.isDestroyed()) {
      win.setBounds({
        x: currentX,
        y: targetY,
        width: startBounds.width,
        height: startBounds.height
      })
    }

    if (currentFrame >= totalFrames) {
      clearInterval(interval)
    }
  }, 16)
}

function registerWindowIpcHandlers(windowManager) {
  ipcMain.handle('resize-float-window', (event, expand) => {
    if (!floatingBallWindow) return

    isFloatExpanded = expand
    const bounds = floatingBallWindow.getBounds()
    const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y })
    const screenWidth = display.workAreaSize.width
    const screenX = display.bounds.x

    if (expand) {
      const newWidth = 280
      const newHeight = 350
      let newX = bounds.x

      if (bounds.x + newWidth > screenX + screenWidth) {
        newX = screenX + screenWidth - newWidth - 10
      }

      floatingBallWindow.setBounds({ x: newX, y: bounds.y, width: newWidth, height: newHeight })
    } else {
      const newWidth = 60
      const newHeight = 60
      floatingBallWindow.setBounds({ x: bounds.x, y: bounds.y, width: newWidth, height: newHeight })
      floatingBallWindow.emit('moved')
    }
  })
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
    floatingBallWindow.setBounds({ x, y, width: 60, height: 60 })
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
  registerWindowIpcHandlers,
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
