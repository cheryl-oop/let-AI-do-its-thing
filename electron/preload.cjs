const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('tomodoro', {
  platform: process.platform,
  startActivity: () => ipcRenderer.send('activity:start'),
  stopActivity: () => ipcRenderer.send('activity:stop'),
  getLastActivity: () => ipcRenderer.invoke('activity:last'),
  getIdleSeconds: () => ipcRenderer.invoke('activity:idle'),
  setPinned: (pinned) => ipcRenderer.invoke('app:pin', pinned),
  onActivity: (callback) => {
    const handler = (_event, payload) => callback(payload)
    ipcRenderer.on('activity:update', handler)
    return () => ipcRenderer.removeListener('activity:update', handler)
  },
  onFocus: (callback) => {
    const handler = (_event, focused) => callback(Boolean(focused))
    ipcRenderer.on('app:focus', handler)
    return () => ipcRenderer.removeListener('app:focus', handler)
  },
})
