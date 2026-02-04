const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  runZeno: (options) => ipcRenderer.invoke('run-zeno', options),
  stopZeno: () => ipcRenderer.invoke('stop-zeno'),
  onZenoOutput: (callback) => {
    ipcRenderer.on('zeno-output', (event, data) => callback(data));
  },
  removeZenoOutputListener: () => {
    ipcRenderer.removeAllListeners('zeno-output');
  },
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  openChatWindow: () => ipcRenderer.invoke('open-chat-window'),
  closeChatWindow: () => ipcRenderer.invoke('close-chat-window'),
  isChatWindowOpen: () => ipcRenderer.invoke('is-chat-window-open'),
  pushToGitHubPR: (options) => ipcRenderer.invoke('push-to-github-pr', options)
});
