/* 
Proyecto 2 · Ejercicio 3 — Transformaciones lineales (p5.js)
Autora: Kris Darias

Teclas:
K → Detección de contornos (filtro Sobel)
D → Realce de contornos (enfoque con kernel 3×3)
*/

let imgOriginal;         // imagen base
let imgContornos = null; // versión con contornos detectados
let imgRealzado = null;  // versión con contornos realzados
let escala;              // escala para que la imagen se ajuste al canvas
let modoActual = 'original'; // guarda el modo activo (original, sobel o sharpen)

// Códigos de teclas que uso (para las funciones keyIsDown)
const TECLA_K = 75; // letra K
const TECLA_D = 68; // letra D

function preload() {
  // Cargo la imagen desde la carpeta del proyecto
  imgOriginal = loadImage('img/Kris_Darias_Rodríguez_A_hyperrealistic_cinematic_shot_of_a_woman_with_short_hair_riding_28da27a6-9061-42a2-a751-7efa2bbb441e.jpg');
}

function setup() {
  // Creo el lienzo y ajusto la densidad de píxel para evitar escalados extraños
  let c = createCanvas(windowWidth * 0.9, windowHeight * 0.85);
  pixelDensity(1);

  // Parche para que Chrome no muestre la advertencia de getImageData
  c.elt.getContext('2d', { willReadFrequently: true });

  calcularEscala();
}

function calcularEscala() {
  // Calculo la escala para que la imagen quepa completa en pantalla
  const escalaAncho = width / imgOriginal.width;
  const escalaAlto = height / imgOriginal.height;
  escala = min(escalaAncho, escalaAlto);
}

function windowResized() {
  // Si cambia el tamaño de la ventana, reajusto el lienzo y la escala
  resizeCanvas(windowWidth * 0.9, windowHeight * 0.85);
  calcularEscala();
}

function draw() {
  // Limpio el fondo y preparo el área de dibujo
  background(240, 0);

  // Calculo las medidas escaladas y centro la imagen
  const newW = imgOriginal.width * escala;
  const newH = imgOriginal.height * escala;
  const x = (width - newW) / 2;
  const y = (height - newH) / 2;

  // Según el modo actual, muestro la imagen correspondiente
  if (modoActual === 'sobel' && imgContornos) {
    image(imgContornos, x, y, newW, newH);
  } else if (modoActual === 'sharpen' && imgRealzado) {
    image(imgRealzado, x, y, newW, newH);
  } else {
    image(imgOriginal, x, y, newW, newH);
  }

  // Dibujo el cuadro de instrucciones en pantalla
  dibujarInstrucciones(modoActual);
}

function keyPressed() {
  // Compruebo qué tecla se ha pulsado
  const letra = (key + '').toLowerCase();

  if (letra === 'k') {
    calcularContornos();
    modoActual = 'sobel';
  } else if (letra === 'd') {
    aplicarRealce();
    modoActual = 'sharpen';
  }
}

function keyReleased() {
  // Cuando no hay ninguna tecla activa, vuelvo al modo original
  if (!keyIsDown(TECLA_K) && !keyIsDown(TECLA_D)) {
    modoActual = 'original';
  }
}

function calcularContornos() {
  // Genero la versión con contornos solo una vez (la guardo en caché)
  if (!imgContornos) imgContornos = detectarContornos(imgOriginal);
}

function aplicarRealce() {
  // Aplico el filtro de enfoque (también guardado en caché)
  if (!imgRealzado) {
    const kernel = [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0]
    ];
    imgRealzado = convolucionMatriz(imgOriginal, kernel, 3, 1, 0);
  }
}

// --- Convolución genérica 3×3 ---
function convolucionMatriz(srcImg, matrix, matrixSize = 3, divisor = 1, offset = 0) {
  const w = srcImg.width, h = srcImg.height;
  const out = createImage(w, h);
  srcImg.loadPixels();
  out.loadPixels();

  const clamp = v => constrain(v, 0, 255);
  const half = Math.floor(matrixSize / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;

      // Recorro todos los píxeles vecinos según el tamaño del kernel
      for (let j = 0; j < matrixSize; j++) {
        for (let i = 0; i < matrixSize; i++) {
          const k = matrix[j][i];
          const px = constrain(x + i - half, 0, w - 1);
          const py = constrain(y + j - half, 0, h - 1);
          const idx = 4 * (py * w + px);

          r += srcImg.pixels[idx] * k;
          g += srcImg.pixels[idx + 1] * k;
          b += srcImg.pixels[idx + 2] * k;
        }
      }

      const outIdx = 4 * (y * w + x);
      out.pixels[outIdx] = clamp(r / divisor + offset);
      out.pixels[outIdx + 1] = clamp(g / divisor + offset);
      out.pixels[outIdx + 2] = clamp(b / divisor + offset);
      out.pixels[outIdx + 3] = 255;
    }
  }

  out.updatePixels();
  return out;
}

// --- Filtro Sobel para detectar contornos ---
function detectarContornos(srcImg) {
  const w = srcImg.width, h = srcImg.height;

  // Paso la imagen a escala de grises para simplificar el cálculo
  const gray = createImage(w, h);
  srcImg.loadPixels();
  gray.loadPixels();
  for (let i = 0; i < srcImg.pixels.length; i += 4) {
    const y = 0.2126 * srcImg.pixels[i] + 0.7152 * srcImg.pixels[i + 1] + 0.0722 * srcImg.pixels[i + 2];
    gray.pixels[i] = gray.pixels[i + 1] = gray.pixels[i + 2] = y;
    gray.pixels[i + 3] = 255;
  }
  gray.updatePixels();

  // Máscaras de Sobel (Gx y Gy)
  const Kx = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];
  const Ky = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  const gx = convolucionMatriz(gray, Kx, 3);
  const gy = convolucionMatriz(gray, Ky, 3);

  // Combino ambos gradientes para obtener la magnitud de los contornos
  gx.loadPixels();
  gy.loadPixels();
  const out = createImage(w, h);
  out.loadPixels();

  for (let i = 0; i < gx.pixels.length; i += 4) {
    const ax = Math.abs(gx.pixels[i]);
    const ay = Math.abs(gy.pixels[i]);
    const m = constrain(ax + ay, 0, 255);
    out.pixels[i] = out.pixels[i + 1] = out.pixels[i + 2] = m;
    out.pixels[i + 3] = 255;
  }

  out.updatePixels();
  return out;
}

// --- Cuadro con las instrucciones ---
function dibujarInstrucciones(mode) {
  push();
  noStroke();
  const pad = 14;

  const textLines = [
    'Manual del programa',
    'K → Detectar contornos (Sobel)',
    'D → Realzar contornos (kernel 3×3)',
    'Suelta la tecla para volver al original.',
    `Vista: ${mode}`
  ];

  // Fondo semitransparente
  fill(0, 0, 0, 130);
  const boxW = 280, boxH = 110;
  rect(pad, height - boxH - pad, boxW, boxH, 10);

  // Texto
  fill(255);
  textSize(14);
  let y = height - boxH + pad * 0.7;
  for (let i = 0; i < textLines.length; i++) {
    text(textLines[i], pad * 2.5, y);
    y += 18;
  }

  pop();
}
