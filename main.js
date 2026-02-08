const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('path')

let mainWindow = null
let floatingBallWindow = null

function createMainWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // 直接加载本地index.html文件
  mainWindow.loadFile('index.html')
  mainWindow.webContents.openDevTools()

  // 当主窗口关闭时退出应用
  mainWindow.on('closed', () => {
    app.quit()
  })
}

function createFloatingBallWindow () {
  floatingBallWindow = new BrowserWindow({
    width: 85,
    height: 50,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // 加载悬浮球HTML文件
  floatingBallWindow.loadFile('floating-ball.html')

  // 设置初始位置
  const { screen } = require('electron');
  const { left, top } = { 
    left: screen.getPrimaryDisplay().workAreaSize.width - 150, 
    top: screen.getPrimaryDisplay().workAreaSize.height - 100 
  };
  floatingBallWindow.setPosition(left, top);

  // 禁止悬浮球窗口的关闭按钮关闭应用
  floatingBallWindow.on('closed', () => {
    floatingBallWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow()
  createFloatingBallWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
      createFloatingBallWindow()
    }
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// 实现窗口间通信
ipcMain.on('ballWindowMove', (event, data) => {
  if (floatingBallWindow) {
    floatingBallWindow.setBounds({ x: data.x, y: data.y, width: 85, height: 50 })
  }
})

ipcMain.on('toggleMainWindow', () => {
  if (mainWindow) {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  }
})

// 更新悬浮球数据
ipcMain.on('updateBall', (event) => {
  // 这里可以从数据库或其他地方获取数据
  // 暂时返回模拟数据
  const mockData = [5, 2]; // [total, completed]
  if (floatingBallWindow) {
    floatingBallWindow.webContents.send('update', mockData);
  }
});

// 更新配置
ipcMain.on('updateConfig', (event, data) => {
  if (floatingBallWindow) {
    floatingBallWindow.webContents.send('config', data);
  }
});

// 显示右键菜单
let suspensionMenu
let topFlag = true
ipcMain.on('openMenu', (event) => {
  if (!suspensionMenu) {
    suspensionMenu = Menu.buildFromTemplate([
      {
        label: '配置',
        click: () => {
          // 可以在这里添加配置窗口的打开逻辑
        }
      },
      {
        label: '置顶/取消',
        click: () => {
          topFlag = !topFlag
          if (floatingBallWindow) {
            floatingBallWindow.setAlwaysOnTop(topFlag)
          }
        }
      },
      {
        label: '开发者工具',
        click: () => {
          if (floatingBallWindow) {
            floatingBallWindow.webContents.openDevTools({ mode: 'detach' })
          }
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
          app.quit();
        }
      },
    ]);
  }
  suspensionMenu.popup({});
});

// 显示日历视图
ipcMain.on('showCalendar', () => {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
    // 可以在这里添加显示日历视图的逻辑
  }
});

// 显示添加课程视图
ipcMain.on('showAddCourse', () => {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
    // 可以在这里添加显示添加课程视图的逻辑
  }
});