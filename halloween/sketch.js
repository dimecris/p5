// sketch.js
// Demo con p5.js + MediaPipe FaceMesh:
// - Detecto la apertura de la boca con los puntos faciales (landmarks)
// - Genero partículas "Halloween" (chispas y brochazos) alrededor de la boca
// - Dibujo el vídeo de la cámara a pantalla completa sin deformarlo (modo cover)

// --- Configuración y estados globales ---
let video;
let canvasW = 1280; // Resolución objetivo que solicito a la cámara (ancho)
let canvasH = 720;  // Resolución objetivo que solicito a la cámara (alto)

let faceMesh;      // Instancia de MediaPipe FaceMesh
let landmarks = null; // Últimos puntos faciales detectados (si hay cara)

let loadingOverlay;       // Capa de carga que muestro/oculto
let isModelReady = false; // El modelo de FaceMesh está listo para usarse
let hasStarted = false;   // La experiencia ha comenzado (el usuario pulsó Start)

// Elementos de interfaz (DOM)
let startButton, sizeSlider, statusDiv;
// Umbral fijo para considerar la boca abierta (relación con distancia entre ojos)
const MOUTH_OPEN_THRESHOLD = 0.03;
let particleSize = 8; // Tamaño base de partículas (ajustable con slider)

let particles = [];     // Lista de partículas activas
let maxParticles = 800; // Límite máximo de partículas simultáneas

// Control de envío a FaceMesh (throttling)
let detectionInFlight = false;
let detectionLoopActive = false;
const DETECTION_INTERVAL_MS = 80; // ~12.5 fps de inferencia (para fallback)

// Canvas fuera de pantalla para desacoplar la lectura del vídeo del render
let offscreenCanvas = null;
let offscreenCtx = null;
let offscreenW = 0;
let offscreenH = 0;

// === Helpers de offscreen y utilidades ===
// Preparo el canvas offscreen con dimensiones adecuadas del vídeo (una sola vez)
function prepareOffscreen(v, label = '') {
  try {
    if (!offscreenCanvas || !offscreenCtx) {
      const vw = v.videoWidth || canvasW; // ancho real del vídeo
      const vh = v.videoHeight || canvasH; // alto real del vídeo
      const maxW = 1080; // límite ancho para procesamiento
      const scale = Math.min(1, maxW / vw); // escalo si es muy ancho
      const ow = Math.max(1, Math.round(vw * scale)); // ancho offscreen
      const oh = Math.max(1, Math.round(vh * scale));
      offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = ow;
      offscreenCanvas.height = oh;
      offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
      offscreenW = ow; offscreenH = oh;
      console.log(`[offscreen] prepared${label ? ' ' + label : ''}`, offscreenW, offscreenH);
    }
  } catch (e) { console.warn('[offscreen] init error', e); }
}

// Sonido con p5.sound
let spookySound = null;

// Paleta de colores precomputada para las partículas (la relleno en setup)
let PALETTE = null;

// Seguimiento de apertura de boca
let mouthOpen = false;
let mouthOpenStart = 0; // millis
let brushIntensity = 0; // Intensidad que crece con el tiempo que mantengo la boca abierta

// === Ciclo de vida p5 (setup/draw) ===
async function setup() {
  // Canvas a tamaño completo de ventana
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  
  // Referenciar elementos de UI que ya existen en el HTML
  startButton = select('#startButton');
  sizeSlider = select('#sizeSlider');
  statusDiv = select('#status');
  loadingOverlay = select('#loading');
  
  // Cargar audio con p5.sound (async)
  try {
    spookySound = await loadSound('assets/music/halloween-bells-and-strings-loop_dm_124bpm_master-410508.mp3');
    spookySound.setLoop(true);
    console.log('[audio] loaded successfully');
  } catch (e) {
    console.warn('[audio] failed to load', e);
  }
  
  // createCapture devuelve un elemento <video> que alimentaré a MediaPipe
  // p5 v2: el segundo parámetro ya no es callback aquí; uso eventos del elemento video
  video = createCapture({ video: { facingMode: 'user', width: { ideal: canvasW }, height: { ideal: canvasH } }, audio: false });
  // Solicito 1280x720 ideal, pero la cámara puede devolver otro tamaño/aspecto
  video.size(canvasW, canvasH);
  
  // Configuración de reproducción del elemento <video>
  video.elt.setAttribute('playsinline', 'true');
  video.elt.setAttribute('autoplay', 'true');
  video.elt.muted = true; // Permite autoplay sin interacción
  // Eventos de diagnóstico
  if (video && video.elt) {
    video.elt.onloadedmetadata = () => {
      console.log('[camera] metadata loaded', video.elt.videoWidth, video.elt.videoHeight);
      prepareOffscreen(video.elt, 'on metadata');
      if (statusDiv) statusDiv.html('Estado: cámara preparada');
    };
    video.elt.onerror = (e) => {
      console.error('[camera] error', e);
      if (statusDiv) statusDiv.html('Estado: error de cámara - Revisa los permisos');
    };
  }
  
  video.hide(); // Escondo el video para no duplicarlo, ya que lo dibujo en el canvas

  // Configurar eventos de UI
  startButton.mousePressed(toggleExperience);
  sizeSlider.input(() => particleSize = Number(sizeSlider.value()));

  // Tipografía para el HUD: uso la fuente local cargada por CSS (@font-face)
  textFont('Rubik, sans-serif');
  textSize(13);

  // Paleta de colores para partículas (la calculo una vez)
  PALETTE = [
    color('#FF8A00'), // naranja
    color('#B43CFF'), // morado
    color('#FFFFFF'), // blanco espuma
    color('#3CC864')  // verde menta
  ];

  // Inicializo MediaPipe Face Mesh (pero solo inicio la cámara después de pulsar start)
  initFaceMesh();
}

/* Calculo el rectángulo donde dibujar el vídeo sin deformarlo.
   Modo "cover": lleno todo el canvas recortando si es necesario (sin barras negras).
   Devuelvo { x, y, w, h } en coordenadas de canvas. */
function computeVideoDrawRect() {
  const cw = width;
  const ch = height;
  // Tamaño real del vídeo (puede diferir del solicitado)
  const vw = video && video.elt && video.elt.videoWidth ? video.elt.videoWidth : canvasW;
  const vh = video && video.elt && video.elt.videoHeight ? video.elt.videoHeight : canvasH;
  const canvasAspect = cw / ch;
  const videoAspect = vw / vh;

  let drawW, drawH, dx, dy;
  if (canvasAspect > videoAspect) {
    // Canvas más "ancho" que el vídeo: escalo por ancho, recorto vertical
    drawW = cw;
    drawH = cw / videoAspect;
    dx = 0;
    dy = (ch - drawH) / 2;
  } else {
    // Canvas más "alto" que el vídeo: escalo por alto, recorto horizontal
    drawH = ch;
    drawW = ch * videoAspect;
    dy = 0;
    dx = (cw - drawW) / 2;
  }
  return { x: dx, y: dy, w: drawW, h: drawH };
}

// === MediaPipe Face Mesh ===
// Inicializo MediaPipe Face Mesh
async function initFaceMesh() {
  // Cargado por CDN (script), expone FaceMesh en el ámbito global
  faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  // Configuro opciones del modelo
  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  faceMesh.onResults(onFaceResults);

  // El modelo se considera "listo" al terminar init; oculto el overlay al iniciar cámara
  isModelReady = true;
  if (statusDiv) statusDiv.html('Estado: modelo listo — presiona Iniciar Experiencia');
  // Mantengo el overlay hasta que el usuario pulse Start (requisito de interacción)
}

// === Control de UI (botón iniciar/parar) ===
// Alterna entre iniciar y parar la experiencia
function toggleExperience() {
  if (hasStarted) {
    stopExperience();
  } else {
    startExperience();
  }
}

// Botón activado (trigger) por el usuario
function startExperience() {
  if (!isModelReady) {
    if (statusDiv) statusDiv.html('Estado: el modelo no está listo todavía...');
    return;
  }
  if (hasStarted) return;
  hasStarted = true;
  loadingOverlay.style('display', 'flex');

  // Me aseguro de que el <video> se reproduzca (por si el autoplay fue bloqueado)
  try { video.elt.play(); } catch (_) {}

  // Inicio el bucle de detección desacoplado del draw()
  if (!detectionLoopActive) startDetectionLoop();

  // Desbloqueo el audio con p5.sound en el primer gesto del usuario
  try {
    userStartAudio();
    console.log('[audio] user audio context started');
  } catch (e) {
    console.warn('[audio] unlock failed', e);
  }

  // Oculto el overlay tras un pequeño delay (primeros frames)
  setTimeout(() => {
    loadingOverlay.style('display', 'none');
    statusDiv.html('Estado: ejecutando — abre la boca');
  }, 1200);

  // Cambio el texto del botón a Parar
  if (startButton) startButton.html('Parar');
}

// Paro la experiencia: detengo detección, audio y limpio estado visual
function stopExperience() {
  if (!hasStarted) return;
  hasStarted = false;

  // No detengo la cámara: solo deshabilito la detección y limpio estado
  detectionLoopActive = false;

  // Reseteo el estado de detección y partículas
  landmarks = null;
  mouthOpen = false;
  brushIntensity = 0;
  particles.length = 0;

  // Pauso el sonido si estuviera sonando
  try {
    if (spookySound && spookySound.isPlaying()) spookySound.pause();
  } catch (_) {}

  // Me aseguro de que el overlay esté oculto y actualizo el estado
  if (loadingOverlay) loadingOverlay.style('display', 'none');
  if (statusDiv) statusDiv.html('Estado: detenido');
  if (startButton) startButton.html('Comenzar');
}

// Callback MediaPipe results
function onFaceResults(results) {
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    landmarks = results.multiFaceLandmarks[0];
  } else {
    landmarks = null;
  }
}

// Bucle del draw()
function startDetectionLoop() {
  if (!faceMesh || !video || !video.elt) return;
  detectionLoopActive = true;
  const v = video.elt;
  if (typeof v.requestVideoFrameCallback === 'function') {
    const onFrame = async () => {
      if (!hasStarted || !detectionLoopActive) return;
      if (v.paused) { try { await v.play(); } catch (_) {} }
      if (!detectionInFlight) {
        detectionInFlight = true;
        try {
          prepareOffscreen(v, 'rVFC');
          offscreenCtx.drawImage(v, 0, 0, offscreenW, offscreenH);
          await faceMesh.send({ image: offscreenCanvas });
        } catch (e) { console.warn('[facemesh] send error', e); }
        finally { detectionInFlight = false; }
      }
      v.requestVideoFrameCallback(() => onFrame());
    };
    v.requestVideoFrameCallback(() => onFrame());
  } else {
    const intervalId = setInterval(async () => {
      if (!hasStarted || !detectionLoopActive) { clearInterval(intervalId); return; }
      if (!detectionInFlight) {
        detectionInFlight = true;
        try {
          if (v.paused) { try { await v.play(); } catch (_) {} }
          prepareOffscreen(v, 'fallback');
          offscreenCtx.drawImage(v, 0, 0, offscreenW, offscreenH);
          await faceMesh.send({ image: offscreenCanvas });
        } catch (e) { console.warn('[facemesh] send error', e); }
        finally { detectionInFlight = false; }
      }
    }, DETECTION_INTERVAL_MS);
  }
}

// === Geometría / Render helpers ===
// Convierto un landmark normalizado a posición en píxeles
function landmarkToXY(landmark, dest) {
  // Mapeo coordenadas normalizadas [0..1] del FaceMesh al rectángulo de vídeo en canvas
  return createVector(dest.x + landmark.x * dest.w, dest.y + landmark.y * dest.h); // x e y ya en píxeles.
}

function draw() {
  background(10);

  // Calculo el rectángulo de destino para no deformar el vídeo (cover)
  const dest = computeVideoDrawRect();

  // Dibujo el vídeo espejado (como un espejo) sin deformación
  renderVideoMirrored(dest);

  // La detección se ejecuta en requestVideoFrameCallback / setInterval, no aquí

  // Si hay landmarks, dibujo elementos y calculo apertura de boca
  if (landmarks) {
    const { up, down, leftEye, rightEye, center } = computeKeyPoints(landmarks, dest);
    const metrics = measureFace(up, down, leftEye, rightEye);
    handleMouthInteraction(metrics, center);
    drawMouthGuide(metrics, center);
    // Debug opcional de puntos: drawLandmarkDebug(up, down);
  }

  // Partículas y HUD
  updateAndDrawParticles();
  drawHUD();
}

// Genero partículas en (x,y) según la intensidad. 
function crearParticulas(x, y, intensity) {
  // intensity [0..1] controla número y tamaño de partículas
  let baseCount = lerp(2, 18, intensity);
  let extra = map(particleSize, 2, 20, 0, 6);
  let total = Math.round(baseCount + extra);

  // Limito al hueco disponible para evitar exceso y recortes posteriores
  const freeSlots = Math.max(0, maxParticles - particles.length);
  if (freeSlots <= 0) return;
  total = Math.min(total, freeSlots);

  for (let i = 0; i < total; i++) {
    // Color aleatorio de la paleta Halloween
    let c = random(PALETTE) || color(255, 200, 0);
    // Algunas partículas son brochazos (el resto chispas)
    let typ = random() < 0.28 + intensity * 0.6 ? 'brush' : 'spark';
    let life = random(40, 110) * (1 + intensity);
    let jitterX = random(-18, 18);
    let jitterY = random(-12, 12);
    let sz = particleSize * random(0.6, 1.6) * (1 + intensity * 0.6);
    particles.push(new Particle(x + jitterX, y + jitterY, sz, c, life, typ));
  }
}

// === Helpers extraídos del draw ===
function renderVideoMirrored(dest) {
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, width - (dest.x + dest.w), dest.y, dest.w, dest.h);
  pop();
}

function computeKeyPoints(landmarks, dest) {
  const idxUpper = 13;     // labio superior interior
  const idxLower = 14;     // labio inferior interior
  const idxLeftEye = 33;   // ojo izq
  const idxRightEye = 263; // ojo der

  let up = landmarkToXY(landmarks[idxUpper], dest);
  let down = landmarkToXY(landmarks[idxLower], dest);
  let leftEye = landmarkToXY(landmarks[idxLeftEye], dest);
  let rightEye = landmarkToXY(landmarks[idxRightEye], dest);

  // Invierto X porque el vídeo se dibuja espejado
  up.x = width - up.x;
  down.x = width - down.x;
  leftEye.x = width - leftEye.x;
  rightEye.x = width - rightEye.x;

  const center = createVector((up.x + down.x) * 0.5, (up.y + down.y) * 0.5);
  return { up, down, leftEye, rightEye, center };
}

function measureFace(up, down, leftEye, rightEye) {
  const faceScale = p5.Vector.dist(leftEye, rightEye);
  const mouthDist = p5.Vector.dist(up, down);
  const mouthRatio = mouthDist / max(faceScale, 1);
  return { faceScale, mouthDist, mouthRatio };
}

function handleMouthInteraction(metrics, center) {
  const { mouthRatio } = metrics;
  if (mouthRatio > MOUTH_OPEN_THRESHOLD) {
    if (!mouthOpen) {
      mouthOpen = true;
      mouthOpenStart = millis();
      if (spookySound && !spookySound.isPlaying()) {
        try { spookySound.play(); } catch (e) { console.warn('[audio] play error', e); }
      }
    }
    brushIntensity = constrain((millis() - mouthOpenStart) / 1200.0, 0, 1);
    crearParticulas(center.x, center.y, brushIntensity);
  } else {
    if (mouthOpen) {
      mouthOpen = false;
      brushIntensity = 0;
      if (spookySound && spookySound.isPlaying()) {
        try { spookySound.pause(); } catch (e) { console.warn('[audio] pause error', e); }
      }
    }
  }
}

function drawMouthGuide(metrics, center) {
  const { faceScale, mouthDist } = metrics;
  strokeWeight(2);
  noFill();
  stroke(255, 180, 60, 160);
  ellipse(center.x, center.y, faceScale * 0.34 + mouthDist * 0.6, faceScale * 0.18 + mouthDist * 0.4);
}

function updateAndDrawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();
    if (p.isDead()) particles.splice(i, 1);
  }
  if (particles.length > maxParticles) {
    particles.splice(0, particles.length - maxParticles);
  }
}

function drawHUD() {
  noStroke();
  fill(255, 230);
  textAlign(RIGHT);
  text(`Partículas: ${particles.length}`, width - 12, height - 12);
}

// La paleta ya se crea en setup()

// Opcional: cuando se redimensiona la ventana, mantengo el canvas escalado
function windowResized() {
  // Redimensiono el canvas para ocupar toda la ventana
  resizeCanvas(windowWidth, windowHeight);
}

