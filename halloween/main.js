// main.js (Electron main process)
// Creates a fullscreen kiosk window optimized for 1080p

const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    kiosk: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const indexPath = `file://${path.join(__dirname, 'index.html')}`;
  mainWindow.loadURL(indexPath);

  // If you want to debug inside the packaged window, uncomment:
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});