    // preload.js: keep minimal. Expose nothing for security.
// If later you want to expose APIs to renderer, do it here with contextBridge.

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // safe bindings can go here if needed
});