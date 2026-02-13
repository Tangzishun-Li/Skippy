const { ipcMain, Menu, app } = require('electron')

let suspensionMenu = null
let topFlag = true

function registerIpcHandlers(windowManager) {
  ipcMain.on('ballWindowMove', (event, data) => {
    windowManager.moveFloatingBall(data.x, data.y)
  })

  ipcMain.on('toggleMainWindow', () => {
    windowManager.toggleMainWindow()
  })

  ipcMain.on('updateBall', (event) => {
    const mockData = [5, 2]
    windowManager.sendToFloatingBall('update', mockData)
  })

  ipcMain.on('updateConfig', (event, data) => {
    windowManager.sendToFloatingBall('config', data)
  })

  ipcMain.on('openMenu', () => {
    if (!suspensionMenu) {
      suspensionMenu = Menu.buildFromTemplate([
        {
          label: '配置',
          click: () => {
          }
        },
        {
          label: '置顶/取消',
          click: () => {
            topFlag = !topFlag
            windowManager.setFloatingBallAlwaysOnTop(topFlag)
          }
        },
        {
          label: '开发者工具',
          click: () => {
            windowManager.openFloatingBallDevTools()
          }
        },
        {
          label: '重启',
          click: () => {
            app.quit()
            app.relaunch()
          }
        },
        {
          label: '退出',
          click: () => {
            app.isQuitting = true
            app.quit()
          }
        }
      ])
    }
    suspensionMenu.popup({})
  })

  ipcMain.on('showCalendar', () => {
    windowManager.showMainWindow()
  })

  ipcMain.on('showAddCourse', () => {
    windowManager.showMainWindow()
  })
}

function clearIpcHandlers() {
  const channels = [
    'ballWindowMove',
    'toggleMainWindow',
    'updateBall',
    'updateConfig',
    'openMenu',
    'showCalendar',
    'showAddCourse'
  ]
  
  channels.forEach(channel => {
    ipcMain.removeHandler(channel)
  })
  
  suspensionMenu = null
  topFlag = true
}

module.exports = {
  registerIpcHandlers,
  clearIpcHandlers
}
