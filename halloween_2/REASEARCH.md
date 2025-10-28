# Research: Librerías para detección de landmarks faciales (resumen)

He investigado varias librerías disponibles en 2024-2025 para detectar landmarks faciales y/o emociones. A continuación un resumen y una recomendación.

1) MediaPipe (Google)
- Face Mesh (https://www.npmjs.com/package/@mediapipe/face_mesh)
  - Pros: Muy eficiente, 468 landmarks, funciona en CPU en navegador, buena precisión y latencia baja.
  - Contras: API alta dependencia de la versión; si se quiere la nueva Face Landmarker (Tasks API) hace falta servir WASM/modelos locales o usar CDN Tasks (más configuración).
- Face Landmarker (Tasks API)
  - Pros: API centralizada para diferentes modelos de visión; potencial para detección de emociones en próximas versiones.
  - Contras: Integración algo más compleja (WASM y modelos), tamaño de descarga mayor.

2) ml5.js (envoltorio sobre modelos TF)
- ml5.faceMesh (basado en MediaPipe/TensorFlow)
  - Pros: API amigable para p5.js, buena documentación.
  - Contras: A veces versiones de ml5 y p5 deben escogerse con cuidado; rendimiento variable.

3) face-api.js (basado en TensorFlow.js)
- Permite detección de caras, 68 landmarks y reconocimiento facial.
  - Pros: Muy completo (age/gender/emotion/descriptor).
  - Contras: Pesado en navegador, latencia mayor que MediaPipe.

4) BlazeFace (TensorFlow.js)
- Rápido detector de caras (poco peso).
  - Pros: Rapidez, ideal para detección básica de caras.
  - Contras: No devuelve tantos landmarks como FaceMesh.

5) clmtrackr / tracking.js (antiguos)
- Pros: Ligero, fácil de integrar.
- Contras: Menor precisión, menos mantenimiento.

6) OpenCV.js
- Pros: Potente y flexible.
- Contras: Requiere entrenamiento y configuración; no tiene out-of-the-box 468 landmarks.

Decisión:
- He escogido MediaPipe Face Mesh por su rendimiento en navegador, precisión (468 landmarks) y facilidad para detectar la apertura de la boca sin necesidad de descargar grandes modelos WASM adicionales. Esto es adecuado para una experiencia fluida y para empaquetado en Electron en kiosko a 1080p.
- Alternativa para nota máxima: usar MediaPipe Face Landmarker (Tasks API) con modelos hospedados localmente (WASM/model packages). 

Referencias:
- MediaPipe Face Mesh docs
- ml5js faceMesh examples
- face-api.js repository
- TensorFlow.js models (BlazeFace)