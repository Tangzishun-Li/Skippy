const { ipcMain, Menu, app } = require('electron')
const database = require('./database')
const sync = require('./sync')
const notification = require('./notification')
const mailer = require('./mailer')

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

  // Database IPC handlers
  ipcMain.handle('db:getAllCourses', async () => {
    try {
      return database.getAllCourses()
    } catch (error) {
      console.error('[DB] Error getting courses:', error)
      return []
    }
  })

  ipcMain.handle('db:getCourseById', async (event, id) => {
    try {
      return database.getCourseById(id)
    } catch (error) {
      console.error('[DB] Error getting course:', error)
      return null
    }
  })

  ipcMain.handle('db:saveCourse', async (event, course) => {
    try {
      return database.saveCourse(course)
    } catch (error) {
      console.error('[DB] Error saving course:', error)
      return null
    }
  })

  ipcMain.handle('db:deleteCourse', async (event, id) => {
    try {
      database.deleteCourse(id)
      return true
    } catch (error) {
      console.error('[DB] Error deleting course:', error)
      return false
    }
  })

  ipcMain.handle('db:getLessonsByCourse', async (event, courseId) => {
    try {
      return database.getLessonsByCourse(courseId)
    } catch (error) {
      console.error('[DB] Error getting lessons:', error)
      return []
    }
  })

  ipcMain.handle('db:saveLesson', async (event, lesson) => {
    try {
      database.saveLesson(lesson)
      return true
    } catch (error) {
      console.error('[DB] Error saving lesson:', error)
      return false
    }
  })

  ipcMain.handle('db:getSetting', async (event, key) => {
    try {
      return database.getSetting(key)
    } catch (error) {
      console.error('[DB] Error getting setting:', error)
      return null
    }
  })

  ipcMain.handle('db:setSetting', async (event, key, value) => {
    try {
      database.setSetting(key, value)
      return true
    } catch (error) {
      console.error('[DB] Error setting:', error)
      return false
    }
  })

  ipcMain.handle('db:importData', async (event, courses) => {
    try {
      database.importData(courses)
      return true
    } catch (error) {
      console.error('[DB] Error importing data:', error)
      return false
    }
  })

  // Events IPC handlers
  ipcMain.handle('db:getEvents', async () => {
    try {
      return database.getAllEvents()
    } catch (error) {
      console.error('[DB] Error getting events:', error)
      return []
    }
  })

  ipcMain.handle('db:getEventById', async (event, id) => {
    try {
      return database.getEventById(id)
    } catch (error) {
      console.error('[DB] Error getting event:', error)
      return null
    }
  })

  ipcMain.handle('db:addEvent', async (event, eventData) => {
    try {
      return database.saveEvent(eventData)
    } catch (error) {
      console.error('[DB] Error adding event:', error)
      return null
    }
  })

  ipcMain.handle('db:updateEvent', async (event, eventData) => {
    try {
      return database.saveEvent(eventData)
    } catch (error) {
      console.error('[DB] Error updating event:', error)
      return null
    }
  })

  ipcMain.handle('db:deleteEvent', async (event, id) => {
    try {
      database.deleteEvent(id)
      return true
    } catch (error) {
      console.error('[DB] Error deleting event:', error)
      return false
    }
  })

  ipcMain.handle('db:getTodayEvents', async () => {
    try {
      return database.getTodayEvents()
    } catch (error) {
      console.error('[DB] Error getting today events:', error)
      return []
    }
  })

  // Sync IPC handlers
  ipcMain.handle('sync:getStatus', async () => {
    return sync.getStatus()
  })

  ipcMain.handle('sync:setup', async (event, url, key) => {
    return sync.initSupabase(url, key)
  })

  ipcMain.handle('sync:signIn', async (event, email, password) => {
    return await sync.signIn(email, password)
  })

  ipcMain.handle('sync:signUp', async (event, email, password) => {
    return await sync.signUp(email, password)
  })

  ipcMain.handle('sync:signInAnonymous', async () => {
    return await sync.signInAnonymous()
  })

  ipcMain.handle('sync:signOut', async () => {
    await sync.signOut()
    return true
  })

  ipcMain.handle('sync:upload', async (event, data) => {
    return await sync.uploadData(data)
  })

  ipcMain.handle('sync:download', async () => {
    return await sync.downloadData()
  })

  ipcMain.handle('sync:enable', async (event, enabled) => {
    sync.enableSync(enabled)
    const config = sync.loadConfig()
    config.enabled = enabled
    sync.saveConfig(config)
    return true
  })

  ipcMain.handle('sync:saveConfig', async (event, config) => {
    sync.saveConfig(config)
    return true
  })

  // Notification IPC handlers
  ipcMain.handle('notification:getSettings', async () => {
    return notification.getSettings()
  })

  ipcMain.handle('notification:updateSettings', async (event, settings) => {
    return notification.updateSettings(settings)
  })

  ipcMain.handle('notification:show', async (event, title, body) => {
    notification.showNotification(title, body)
    return true
  })

  ipcMain.handle('notification:getHistory', async () => {
    return notification.getHistory()
  })

  ipcMain.handle('notification:clearHistory', async () => {
    notification.clearHistory()
    return true
  })

  // Mailer IPC handlers
  ipcMain.handle('mailer:getSettings', async () => {
    const settings = mailer.getSettings()
    delete settings.pass
    return settings
  })

  ipcMain.handle('mailer:updateSettings', async (event, settings) => {
    return mailer.updateSettings(settings)
  })

  ipcMain.handle('mailer:testConnection', async () => {
    return await mailer.testConnection()
  })

  ipcMain.handle('mailer:sendTest', async (event, to) => {
    return await mailer.sendMail(to, 'Skippy 测试邮件', '<p>这是一封测试邮件。</p>', '这是一封测试邮件。')
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
    'showAddCourse',
    'db:getAllCourses',
    'db:getCourseById',
    'db:saveCourse',
    'db:deleteCourse',
    'db:getLessonsByCourse',
    'db:saveLesson',
    'db:getSetting',
    'db:setSetting',
    'db:importData',
    'sync:getStatus',
    'sync:setup',
    'sync:signIn',
    'sync:signUp',
    'sync:signInAnonymous',
    'sync:signOut',
    'sync:upload',
    'sync:download',
    'sync:enable',
    'sync:saveConfig',
    'notification:getSettings',
    'notification:updateSettings',
    'notification:show',
    'notification:getHistory',
    'notification:clearHistory',
    'mailer:getSettings',
    'mailer:updateSettings',
    'mailer:testConnection',
    'mailer:sendTest'
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
