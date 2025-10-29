// main.js (Electron main process)
// Creates a fullscreen kiosk window optimized for 1080p

const { app, BrowserWindow, session } = require('electron')
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

  // Abrir DevTools solo si DEBUG=1
  if (process.env.DEBUG === '1') {
    win.webContents.openDevTools({ mode: 'detach' })
  }
}

app.whenReady().then(() => {
  // Conceder permisos de cámara (y audio si se pidiera) sin mostrar prompt en kiosk
  try {
    session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
      // Concedo cámara y micrófono sin prompt (kiosko)
      if (permission === 'media' || permission === 'camera' || permission === 'microphone') {
        return callback(true)
      }
      // Resto: permitir por defecto (ajusta si necesitas más control)
      callback(true)
    })
  } catch (_) {}

  createWindow()
  
  // macOS: recrear ventana si se cierra
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})
