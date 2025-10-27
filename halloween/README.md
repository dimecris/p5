# HealthySmile — Cepillado digital (Halloween)

Proyecto p5.js + MediaPipe Face Mesh que detecta la apertura de la boca y activa efectos visuales con temática Halloween. Incluye configuración para ejecutarlo como app de escritorio con Electron.

Estructura
- index.html
- sketch.js
- style.css
- package.json
- main.js
- preload.js
- RESEARCH.md
- assets/
  - logo.png (pon aquí tu logotipo; si no existe se usa texto)
  - spooky.mp3 (sonido que acompaña al cepillado)

Requisitos
- Node.js 16+ y npm
- Conexión a Internet (carga de CDN para MediaPipe y p5)
- Permiso de cámara en tu navegador/entorno (Electron pedirá permiso en algunos SO)

Instalación y ejecución (desarrollo)
1. Clona / copia este proyecto en tu máquina.
2. Coloca tu logo en `assets/logo.png` y un audio en `assets/spooky.mp3` (opcional).
3. Instala dependencias (para ejecutar Electron localmente):
   npm install
4. Ejecuta en modo desarrollo (abre la app de Electron):
   npm run start

Ejecución en navegador (sin Electron)
- Abre `index.html` directamente con un servidor local (recomendado) o desde el IDE que uses.
- Ejemplo con http-server:
  npx http-server -c-1 .

Notas sobre empaquetado Electron
- Este repositorio incluye main.js con configuración para ventana en kiosk / fullscreen a 1080p.
- Para empaquetar (crear .exe/.dmg) usa herramientas como electron-builder o electron-packager (no incluido aquí).
- Si quieres depurar la ventana en Electron, descomenta en main.js la línea openDevTools que está comentada con una nota.

Qué hice y por qué
- Elegí MediaPipe Face Mesh por su rendimiento en navegador, precisión en landmarks y compatibilidad con la CDN (fácil integración).
- Implementé un umbral ajustable de apertura de boca y un contador de tiempo de apertura para modular la intensidad de partículas.
- Incluí una pantalla de carga mientras se inicializa MediaPipe para suavizar la experiencia de usuario.

Si quieres, puedo:
- Añadir un instalador con electron-builder.
- Integrar el modelo Face Landmarker de MediaPipe Tasks (más moderno) en vez de Face Mesh (requiere servir WASM/modelos).
- Añadir captura de datos/estadísticas (tiempo de cepillado, sesión por sesión).