// main.js (Electron main process)
// Creates a fullscreen kiosk window optimized for 1080p

const { app, BrowserWindow } = require('electron')
const path = require('path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,  // Pantalla completa
    kiosk: true,       // Modo kiosko (bloquea salida)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  

  win.loadFile('index.html')
  
  // Descomentar para debug:
  win.webContents.openDevTools({ mode: 'detach' })
}

app.whenReady().then(() => {
  createWindow()
  
  // macOS: recrear ventana si se cierra
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})
