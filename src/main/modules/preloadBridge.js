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

module.exports = {
  setupPreloadBridge,
  setupDOMBridge
}
