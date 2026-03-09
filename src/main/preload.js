const { contextBridge, ipcRenderer } = require('electron')

function setupPreloadBridge() {
  contextBridge.exposeInMainWorld('electronAPI', {
    ballWindowMove: (data) => {
      ipcRenderer.send('ballWindowMove', data)
    },
    openMenu: () => {
      ipcRenderer.send('openMenu')
    },
    toggleMainWindow: () => {
      ipcRenderer.send('toggleMainWindow')
    },
    showCalendar: () => {
      ipcRenderer.send('showCalendar')
    },
    showAddCourse: () => {
      ipcRenderer.send('showAddCourse')
    },
    updateBall: () => {
      ipcRenderer.send('updateBall')
    },
    onUpdate: (callback) => {
      ipcRenderer.on('update', (event, data) => callback(data))
    },
    onConfig: (callback) => {
      ipcRenderer.on('config', (event, data) => callback(data))
    },
    db: {
      getAllCourses: () => ipcRenderer.invoke('db:getAllCourses'),
      getCourseById: (id) => ipcRenderer.invoke('db:getCourseById', id),
      saveCourse: (course) => ipcRenderer.invoke('db:saveCourse', course),
      deleteCourse: (id) => ipcRenderer.invoke('db:deleteCourse', id),
      getLessonsByCourse: (courseId) => ipcRenderer.invoke('db:getLessonsByCourse', courseId),
      saveLesson: (lesson) => ipcRenderer.invoke('db:saveLesson', lesson),
      getSetting: (key) => ipcRenderer.invoke('db:getSetting', key),
      setSetting: (key, value) => ipcRenderer.invoke('db:setSetting', key, value),
      importData: (courses) => ipcRenderer.invoke('db:importData', courses)
    },
    sync: {
      getStatus: () => ipcRenderer.invoke('sync:getStatus'),
      setup: (url, key) => ipcRenderer.invoke('sync:setup', url, key),
      signIn: (email, password) => ipcRenderer.invoke('sync:signIn', email, password),
      signUp: (email, password) => ipcRenderer.invoke('sync:signUp', email, password),
      signInAnonymous: () => ipcRenderer.invoke('sync:signInAnonymous'),
      signOut: () => ipcRenderer.invoke('sync:signOut'),
      upload: (data) => ipcRenderer.invoke('sync:upload', data),
      download: () => ipcRenderer.invoke('sync:download'),
      enable: (enabled) => ipcRenderer.invoke('sync:enable', enabled),
      saveConfig: (config) => ipcRenderer.invoke('sync:saveConfig', config)
    },
    notification: {
      getSettings: () => ipcRenderer.invoke('notification:getSettings'),
      updateSettings: (settings) => ipcRenderer.invoke('notification:updateSettings', settings),
      show: (title, body) => ipcRenderer.invoke('notification:show', title, body),
      getHistory: () => ipcRenderer.invoke('notification:getHistory'),
      clearHistory: () => ipcRenderer.invoke('notification:clearHistory')
    },
    mailer: {
      getSettings: () => ipcRenderer.invoke('mailer:getSettings'),
      updateSettings: (settings) => ipcRenderer.invoke('mailer:updateSettings', settings),
      testConnection: () => ipcRenderer.invoke('mailer:testConnection'),
      sendTest: (to) => ipcRenderer.invoke('mailer:sendTest', to)
    }
  })
}

function setupDOMBridge() {
  window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
  })
}

setupPreloadBridge()
setupDOMBridge()