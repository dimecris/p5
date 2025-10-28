const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // safe bindings can go here if needed
});