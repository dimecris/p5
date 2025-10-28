// sketch.js
// Demo con p5.js + MediaPipe FaceMesh:
// - Detecta la apertura de la boca con los puntos faciales (landmarks)
// - Genera partículas "Halloween" (chispas y brochazos) alrededor de la boca
// - Dibuja el vídeo de la cámara a pantalla completa sin deformarlo (modo cover)

// --- Configuración y estados globales ---
let video;
let canvasW = 1280; // Resolución objetivo que solicitamos a la cámara (ancho)
let canvasH = 720;  // Resolución objetivo que solicitamos a la cámara (alto)

let faceMesh;      // Instancia de MediaPipe FaceMesh
let landmarks = null; // Últimos puntos faciales detectados (si hay cara)

let loadingOverlay;       // Capa de carga que mostramos/ocultamos
let isModelReady = false; // El modelo de FaceMesh está listo para usarse
let hasStarted = false;   // La experiencia ha comenzado (usuario pulsó Start)

// Elementos de interfaz (DOM)
let startButton, sizeSlider, statusDiv;
// Umbral fijo para considerar la boca abierta (relación con distancia entre ojos)
const MOUTH_OPEN_THRESHOLD = 0.03;
let particleSize = 8; // Tamaño base de partículas (ajustable con slider)

let particles = [];     // Lista de partículas activas
let maxParticles = 800; // Límite máximo de partículas simultáneas

// Cámara de MediaPipe (para poder iniciar/parar)
let mpCamera = null;

// Sonido y otros assets
let spookySound;

// Paleta de colores precomputada para las partículas (se rellena en setup)
let PALETTE = null;

// Seguimiento de apertura de boca
let mouthOpen = false;
let mouthOpenStart = 0; // millis
let brushIntensity = 0; // Intensidad que crece con el tiempo que mantienes la boca abierta

// Tipografías
let titleFont;  // Griffy (decorativa)
let rubikFont;  // Rubik (HUD)

// --- Particle class ---
// Clase simple de partícula para chispas/brochazos
class Particle {
  constructor(x, y, size, color, life, type = 'spark') {
    this.pos = createVector(x, y);                           // posición actual
    this.vel = p5.Vector.random2D().mult(random(0.3, 2.5));  // velocidad inicial
    if (type === 'brush') this.vel.mult(0.6);                // brochazo = movimiento más suave
    this.size = size * random(0.6, 1.4);                     // tamaño con ligera variación
    this.color = color;                                      // p5.Color ya calculado
    this.life = life;                                        // vida total en frames
    this.age = 0;                                            // edad en frames
    this.type = type;                                        // 'spark' o 'brush'
    this.angle = random(TWO_PI);                             // orientación inicial
    this.spin = random(-0.1, 0.1);                           // giro por frame
  }
  update() {
    this.pos.add(this.vel);                  // avanza
    if (this.type === 'spark') this.vel.y += 0.03; // gravedad ligera para chispas
    this.age++;                               // envejece
    this.angle += this.spin;                  // gira
  }
  draw() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    noStroke();
    
    if (this.type === 'spark') {
      // chispa circular con alpha que decae con la edad
      fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], map(this.age, 0, this.life, 255, 0));
      ellipse(0, 0, this.size);
    } else if (this.type === 'brush') {
      // brochazo rectangular con bordes redondeados
      fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], 180);
      rectMode(CENTER);
      rect(0, 0, this.size * 2.2, this.size * 0.7, 6);
    }
    pop();
  }
  isDead() {
    return this.age > this.life; // marcar para eliminarse
  }
}

// --- p5 preload ---
function preload() {
  // Cargamos el sonido si está presente en el DOM
  if (document.getElementById('spookySound')) {
    try {
      spookySound = loadSound('assets/music/halloween-bells-and-strings-loop_dm_124bpm_master-410508.mp3');
    } catch (e) {
      console.warn('No spooky sound loaded.');
      spookySound = null;
    }
  }
  
  // Cargar tipografías (con fallback silencioso)
  titleFont = loadFont('assets/typo/Griffy-Regular.ttf', () => {}, () => {});
}

// --- p5 setup ---
function setup() {
  // Canvas a tamaño completo de ventana
  createCanvas(canvasW, canvasH);
  pixelDensity(1);
  
  // Referenciar elementos de UI que ya existen en el HTML
  startButton = select('#startButton');
  sizeSlider = select('#sizeSlider');
  statusDiv = select('#status');
  loadingOverlay = select('#loading');
  
  // createCapture devuelve un elemento <video> que alimentaremos a MediaPipe
  video = createCapture(VIDEO, function() {
    // ready
  });
  // Solicitamos 1280x720 ideal, pero la cámara puede devolver otro tamaño/aspecto
  video.size(canvasW, canvasH);
  video.elt.setAttribute('playsinline', 'true');
  video.hide(); // dibujamos nosotros el vídeo en el canvas

  // Configurar eventos de UI
  startButton.mousePressed(toggleExperience);
  sizeSlider.input(() => particleSize = Number(sizeSlider.value()));

  // HUD text settings once (avoid per-frame changes)
  // Usar Rubik cargada en preload, con fallback a sans-serif si no cargó
  if (rubikFont) {
    textFont(rubikFont);
  } else {
    textFont('sans-serif');
  }
  textSize(13);

  // Paleta de colores para partículas (calculada una vez)
  PALETTE = [
    color(255, 138, 0),   // orange
    color(180, 60, 255),  // purple
    color(255, 255, 255), // white foam
    color(60, 200, 100)   // mint-ish (toothpaste)
  ];

  // Initialize MediaPipe Face Mesh (but we only start camera after pressing start)
  initFaceMesh();
}

// Alterna entre iniciar y parar la experiencia
function toggleExperience() {
  if (hasStarted) {
    stopExperience();
  } else {
    startExperience();
  }
}

/* Calcular el rectángulo donde dibujar el vídeo sin deformarlo.
   Modo "cover": llena todo el canvas recortando si es necesario (sin barras negras).
   Devuelve { x, y, w, h } en coordenadas de canvas. */
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
    // Canvas más "ancho" que el vídeo: escalar por ancho, recortar vertical
    drawW = cw;
    drawH = cw / videoAspect;
    dx = 0;
    dy = (ch - drawH) / 2;
  } else {
    // Canvas más "alto" que el vídeo: escalar por alto, recortar horizontal
    drawH = ch;
    drawW = ch * videoAspect;
    dy = 0;
    dx = (cw - drawW) / 2;
  }
  return { x: dx, y: dy, w: drawW, h: drawH };
}

// Initialize MediaPipe Face Mesh
async function initFaceMesh() {
  // Cargado por CDN (script), expone FaceMesh en el ámbito global
  faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  faceMesh.onResults(onFaceResults);

  // El modelo se considera "listo" al terminar init; ocultamos el overlay al iniciar cámara
  isModelReady = true;
  statusDiv.html('Status: model ready — press Start Experience');
  // Mantenemos el overlay hasta que el usuario pulse Start (requisito de interacción)
}

// Start experience triggered by user
function startExperience() {
  if (!isModelReady) {
    statusDiv.html('Status: model not ready yet...');
    return;
  }
  if (hasStarted) return;
  hasStarted = true;
  loadingOverlay.style('display', 'flex');

  // Usamos Camera helper de MediaPipe para enviar frames del <video> a FaceMesh
  // La cámara se crea y arranca solo una vez; el botón solo habilita/deshabilita la detección
  if (!mpCamera) {
    mpCamera = new Camera(video.elt, {
      onFrame: async () => {
        if (hasStarted) {
          await faceMesh.send({ image: video.elt });
        }
      },
      width: canvasW,
      height: canvasH
    });
    mpCamera.start();
  }

  // Ocultamos el overlay tras un pequeño delay (primeros frames)
  setTimeout(() => {
    loadingOverlay.style('display', 'none');
    statusDiv.html('Status: running — open your mouth!');
  }, 1200);

  // Cambiar texto del botón a Parar
  if (startButton) startButton.html('Parar');
}

// Parar experiencia: detener detección, audio y limpiar estado visual
function stopExperience() {
  if (!hasStarted) return;
  hasStarted = false;

  // No detenemos la cámara: solo deshabilitamos la detección y limpiamos estado

  // Reset de estado de detección y partículas
  landmarks = null;
  mouthOpen = false;
  brushIntensity = 0;
  particles.length = 0;

  // Pausar sonido si estuviera sonando
  try {
    if (spookySound && spookySound.isPlaying()) spookySound.pause();
  } catch (_) {}

  // Asegurar overlay oculto y estado
  if (loadingOverlay) loadingOverlay.style('display', 'none');
  if (statusDiv) statusDiv.html('Status: stopped — press Start');
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

// Convert normalized landmark to pixel position
function landmarkToXY(landmark, dest) {
  // Mapea coordenadas normalizadas [0..1] del FaceMesh al rectángulo de vídeo en canvas
  return createVector(dest.x + landmark.x * dest.w, dest.y + landmark.y * dest.h);
}

function draw() {
  background(10);

  // Calcular rectángulo de destino para no deformar el vídeo (cover)
  const dest = computeVideoDrawRect();

  // Dibujar vídeo espejado (como un espejo) sin deformación
  push();
  translate(width, 0);
  scale(-1, 1);
  // Tras espejar, la x se invierte: dibujamos en width - (x + w)
  image(video, width - (dest.x + dest.w), dest.y, dest.w, dest.h);
  pop();

  // Si hay landmarks, dibujamos elementos y calculamos apertura de boca
  if (landmarks) {
    // Índices relevantes: 13 (labio superior interior), 14 (labio inferior interior)
    // Ojos: 33 (izquierdo) y 263 (derecho)
    let idxUpper = 13;
    let idxLower = 14;
    let idxLeftEye = 33;
    let idxRightEye = 263;

  let up = landmarkToXY(landmarks[idxUpper], dest);
  let down = landmarkToXY(landmarks[idxLower], dest);
  let leftEye = landmarkToXY(landmarks[idxLeftEye], dest);
  let rightEye = landmarkToXY(landmarks[idxRightEye], dest);

    // Invertimos X porque el vídeo se dibuja espejado
  up.x = width - up.x;
  down.x = width - down.x;
  leftEye.x = width - leftEye.x;
  rightEye.x = width - rightEye.x;

    // faceScale = distancia entre ojos (para normalizar tamaños)
    let faceScale = p5.Vector.dist(leftEye, rightEye);
    let mouthDist = p5.Vector.dist(up, down);
    let mouthRatio = mouthDist / max(faceScale, 1);

    // Boca abierta si supera el umbral configurado
  if (mouthRatio > MOUTH_OPEN_THRESHOLD) {
      if (!mouthOpen) {
        mouthOpen = true;
        mouthOpenStart = millis();
        // Reproducir/reanudar sonido al abrir la boca (si hay)
        if (spookySound && !spookySound.isPlaying()) {
          try { 
            spookySound.loop(); // Usar loop para que se repita continuamente
          } catch (e) {}
        }
      }
      // Calcular intensidad (crece con el tiempo, hasta un máximo)
      brushIntensity = constrain((millis() - mouthOpenStart) / 1200.0, 0, 1);
      // Generar partículas alrededor del centro de la boca
  const mcx = (up.x + down.x) * 0.5;
  const mcy = (up.y + down.y) * 0.5;
  spawnParticles(mcx, mcy, brushIntensity);
    } else {
      if (mouthOpen) {
        mouthOpen = false;
        brushIntensity = 0;
        // Pausar sonido al cerrar la boca (mantiene la posición)
        if (spookySound && spookySound.isPlaying()) {
          try { spookySound.pause(); } catch (e) {}
        }
      }
    }

    // Indicador sutil de la boca (forma elíptica tipo "brocha")
    strokeWeight(2);
    noFill();
    stroke(255, 180, 60, 160);
    ellipse((up.x + down.x) / 2, (up.y + down.y) / 2, faceScale * 0.34 + mouthDist * 0.6, faceScale * 0.18 + mouthDist * 0.4);

    // Dibujar puntos de landmarks (debug)
    // noStroke(); fill(0,255,0); ellipse(up.x, up.y, 6); ellipse(down.x, down.y, 6);
  }

  // Update and draw particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();
    if (p.isDead()) particles.splice(i, 1);
  }

  // Limitar número de partículas (barrera de seguridad)
  if (particles.length > maxParticles) {
    particles.splice(0, particles.length - maxParticles);
  }

  // HUD: pequeño texto de estado en el canvas
  noStroke();
  fill(255, 230);
  textAlign(RIGHT);
  text(`Particles: ${particles.length}`, width - 12, height - 12);
}

// Spawn particles at (x,y) according to intensity
function spawnParticles(x, y, intensity) {
  // intensity [0..1] controla número y tamaño de partículas
  let baseCount = lerp(2, 18, intensity);
  let extra = map(particleSize, 2, 20, 0, 6);
  let total = Math.round(baseCount + extra);

  // Limitar al hueco disponible para evitar exceso y recortes posteriores
  const freeSlots = Math.max(0, maxParticles - particles.length);
  if (freeSlots <= 0) return;
  total = Math.min(total, freeSlots);

  for (let i = 0; i < total; i++) {
    // Color aleatorio de la paleta Halloween
    let c = random(PALETTE);
    // Algunas partículas son brochazos (el resto chispas)
    let typ = random() < 0.28 + intensity * 0.6 ? 'brush' : 'spark';
    let life = random(40, 110) * (1 + intensity);
    let jitterX = random(-18, 18);
    let jitterY = random(-12, 12);
    let sz = particleSize * random(0.6, 1.6) * (1 + intensity * 0.6);
    particles.push(new Particle(x + jitterX, y + jitterY, sz, c, life, typ));
  }
}

/* Optional: when window resized, keep canvas scaled */
function windowResized() {
  // Redimensionar el canvas para ocupar toda la ventana
  resizeCanvas(windowWidth, windowHeight);
}

