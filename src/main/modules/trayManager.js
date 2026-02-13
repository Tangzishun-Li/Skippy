const { Tray, Menu, nativeImage, nativeTheme, app } = require('electron')
const path = require('path')

const BASE_PATH = path.join(__dirname, '..')

let tray = null

function getIconPath() {
  return path.join(BASE_PATH, '../renderer/img/icon.png')
}

function createTrayIcon() {
  let trayIcon
  
  try {
    trayIcon = nativeImage.createFromPath(getIconPath())
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty()
    }
  } catch {
    trayIcon = nativeImage.createEmpty()
  }
  
  return trayIcon
}

function createTray(windowManager) {
  if (tray) {
    return tray
  }

  const trayIcon = createTrayIcon()
  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        windowManager.showMainWindow()
      }
    },
    {
      label: '隐藏主窗口',
      click: () => {
        windowManager.hideMainWindow()
      }
    },
    { type: 'separator' },
    {
      label: '显示/隐藏悬浮球',
      click: () => {
        windowManager.toggleFloatingBall()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('Skippy - 课程管理')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    windowManager.toggleMainWindow()
  })

  return tray
}

function getTray() {
  return tray
}

function destroyTray() {
  if (tray) {
    tray.destroy()
    tray = null
  }
}

function updateTooltip(text) {
  if (tray) {
    tray.setToolTip(text)
  }
}

module.exports = {
  createTray,
  getTray,
  destroyTray,
  updateTooltip
}
