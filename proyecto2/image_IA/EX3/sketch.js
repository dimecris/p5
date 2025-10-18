/* 
Proyecto 2 · Ejercicio 3 — Transformaciones lineales (p5.js)
Autora: Kris Darias

Teclas:
K → Detección de contornos (filtro Sobel)
D → Realce de contornos (enfoque con kernel 3×3)
*/

// ---------------------------------------------
// VARIABLES GLOBALES
// ---------------------------------------------

let imgOriginal;         // Imagen original que se muestra al iniciar el programa
let imgContornos = null; // Imagen con el filtro Sobel aplicado (bordes en B/N)
let imgRealzado = null;  // Imagen con el filtro de realce (color más definido)
let escala;              // Factor de escala para que la imagen quepa en la pantalla
let modoActual = 'original'; // Guarda el modo actual: 'original', 'sobel' o 'sharpen'

// Códigos de las teclas que uso para detectar si están pulsadas
const TECLA_K = 75; // letra K → detectar contornos
const TECLA_D = 68; // letra D → realzar contornos


// ---------------------------------------------
// FUNCIÓN PRELOAD
// ---------------------------------------------

function preload() {
  // Cargo la imagen desde la carpeta del proyecto (asegurar que existe la ruta)
  imgOriginal = loadImage('img/seleccion_kd.jpg');
}


// ---------------------------------------------
// FUNCIÓN SETUP
// ---------------------------------------------

function setup() {
  // Creo el lienzo de dibujo ocupando el 90% del ancho y el 85% del alto de la ventana
  // pixelDensity(1) evita que la imagen se vea borrosa en pantallas Retina
  let c = createCanvas(windowWidth * 0.9, windowHeight * 0.85);
  pixelDensity(1);

  // Esta línea es para evitar un aviso de Chrome por el uso frecuente de getImageData()
  // (p5 usa esta función internamente cuando se leen píxeles del canvas)
  c.elt.getContext('2d', { willReadFrequently: true });

  calcularEscala(); // Calculo el factor de escala inicial
}


// ---------------------------------------------
// FUNCIÓN calcularEscALA
// ---------------------------------------------

function calcularEscala() {
  // Calculo la escala para que la imagen quepa entera dentro del canvas sin deformarse
  const escalaAncho = width / imgOriginal.width;
  const escalaAlto = height / imgOriginal.height;
  // Me quedo con el valor menor para asegurar que se ve completa
  escala = min(escalaAncho, escalaAlto);
}


// ---------------------------------------------
// FUNCIÓN DRAW
// ---------------------------------------------

function draw() {
  // Limpio el fondo del lienzo antes de dibujar la nueva imagen
  background(240, 0);

  // Calculo las medidas escaladas y centro la imagen en el lienzo
  const newW = imgOriginal.width * escala;
  const newH = imgOriginal.height * escala;
  const x = (width - newW) / 2;
  const y = (height - newH) / 2;

  // Dependiendo del modo activo, muestro una u otra imagen
  if (modoActual === 'sobel' && imgContornos) {
    // Si ya calculé la versión Sobel, la muestro en blanco y negro
    image(imgContornos, x, y, newW, newH);
  } else if (modoActual === 'sharpen' && imgRealzado) {
    // Si ya tengo la versión realzada, la muestro en color con más contraste
    image(imgRealzado, x, y, newW, newH);
  } else {
    // Si no hay tecla pulsada, muestro la imagen original
    image(imgOriginal, x, y, newW, newH);
  }

  // Dibujo las instrucciones en pantalla para recordar los controles
  dibujarInstrucciones(modoActual);
}


// ---------------------------------------------
// FUNCIÓN windowResized
// ---------------------------------------------

function windowResized() {
  // Si el usuario cambia el tamaño de la ventana, reajusto el canvas y la escala
  resizeCanvas(windowWidth * 0.9, windowHeight * 0.85);
  calcularEscala();
}


// ---------------------------------------------
// FUNCIÓN keyPressed
// ---------------------------------------------

function keyPressed() {
  // Detecto qué tecla se ha pulsado
  const letra = (key + '').toLowerCase();

  // Si pulso K, aplico Sobel; si pulso D, aplico realce
  if (letra === 'k') {
    calcularContornos();
    modoActual = 'sobel';
  } else if (letra === 'd') {
    aplicarRealce();
    modoActual = 'sharpen';
  }
}


// ---------------------------------------------
// FUNCIÓN keyReleased
// ---------------------------------------------

function keyReleased() {
  // Cuando dejo de presionar, vuelvo al modo original
  if (!keyIsDown(TECLA_K) && !keyIsDown(TECLA_D)) {
    modoActual = 'original';
  }
}


// ---------------------------------------------
// FUNCIÓN calcularContornos
// ---------------------------------------------

function calcularContornos() {
  // Aplico el filtro Sobel solo una vez y lo guardo para no recalcularlo constantemente
  if (!imgContornos) imgContornos = detectarContornos(imgOriginal);
}


// ---------------------------------------------
// FUNCIÓN aplicarRealce
// ---------------------------------------------

function aplicarRealce() {
  // Aplico un filtro de realce (o enfoque) basado en una máscara 3x3
  // Este filtro resalta los bordes manteniendo el color original
  if (!imgRealzado) {
    const kernel = [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0]
    ];
    // Aplico la convolución con la matriz del kernel
    imgRealzado = convolucionMatriz(imgOriginal, kernel, 3, 1, 0);
  }
}


// ---------------------------------------------
// FUNCIÓN Convolución genérica 3×3 
// ---------------------------------------------

// Esta función aplica una máscara a cada píxel y genera una nueva imagen filtrada
function convolucionMatriz(srcImg, matrix, matrixSize = 3, divisor = 1, offset = 0) {
  const w = srcImg.width, h = srcImg.height;
  const out = createImage(w, h);
  srcImg.loadPixels(); // Accedo a los píxeles originales
  out.loadPixels();    // Preparo los píxeles de salida

  const clamp = v => constrain(v, 0, 255); // Evita valores fuera del rango RGB
  const half = Math.floor(matrixSize / 2);

  // Recorro todos los píxeles de la imagen
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;

      // Recorro los vecinos alrededor del píxel actual
      for (let j = 0; j < matrixSize; j++) {
        for (let i = 0; i < matrixSize; i++) {
          const k = matrix[j][i]; // Valor del kernel en esa posición
          const px = constrain(x + i - half, 0, w - 1);
          const py = constrain(y + j - half, 0, h - 1);
          const idx = 4 * (py * w + px);

          // Multiplico los valores RGB del píxel por el valor del kernel
          r += srcImg.pixels[idx] * k;
          g += srcImg.pixels[idx + 1] * k;
          b += srcImg.pixels[idx + 2] * k;
        }
      }

      // Escribo el resultado en la nueva imagen
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

// ---------------------------------------------
// FUNCIÓN detectarContornos
// ---------------------------------------------

// --- Detección de contornos con Sobel ---
function detectarContornos(srcImg) {
  const w = srcImg.width, h = srcImg.height;

  // Paso la imagen a escala de grises para simplificar los cálculos
  // (el color no importa para detectar los bordes)
  const gray = createImage(w, h);
  srcImg.loadPixels();
  gray.loadPixels();
  for (let i = 0; i < srcImg.pixels.length; i += 4) {
    const y = 0.2126 * srcImg.pixels[i] + 0.7152 * srcImg.pixels[i + 1] + 0.0722 * srcImg.pixels[i + 2];
    gray.pixels[i] = gray.pixels[i + 1] = gray.pixels[i + 2] = y;
    gray.pixels[i + 3] = 255;
  }
  gray.updatePixels();

  // Defino las dos máscaras de Sobel, una horizontal (Kx) y una vertical (Ky)
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

  // Aplico ambas convoluciones por separado
  const gx = convolucionMatriz(gray, Kx, 3);
  const gy = convolucionMatriz(gray, Ky, 3);

  // Combino los resultados (magnitud aproximada del gradiente)
  gx.loadPixels();
  gy.loadPixels();
  const out = createImage(w, h);
  out.loadPixels();

  for (let i = 0; i < gx.pixels.length; i += 4) {
    const ax = Math.abs(gx.pixels[i]); // gradiente horizontal
    const ay = Math.abs(gy.pixels[i]); // gradiente vertical
    const m = constrain(ax + ay, 0, 255); // suma de ambos → borde más intenso
    out.pixels[i] = out.pixels[i + 1] = out.pixels[i + 2] = m; // gris uniforme
    out.pixels[i + 3] = 255;
  }

  out.updatePixels();
  return out;
}


// ---------------------------------------------
// FUNCIÓN dibujarInstrucciones
// ---------------------------------------------


function dibujarInstrucciones(mode) {
  push();
  noStroke();
  const pad = 14;

  const textLines = [
    'Manual del programa',
    'K → Detectar contornos (Sobel)',
    'D → Realzar contornos (kernel 3×3)',
    'Suelta la tecla para volver al original.',
    `Vista actual: ${mode}`
  ];

  // Fondo semitransparente para mejorar la legibilidad del texto
  fill(0, 0, 0, 130);
  const boxW = 280, boxH = 110;
  rect(pad, height - boxH - pad, boxW, boxH, 10);

  // Texto blanco sobre el fondo oscuro
  fill(255);
  textSize(14);
  let y = height - boxH + pad * 0.7;
  for (let i = 0; i < textLines.length; i++) {
    text(textLines[i], pad * 2.5, y);
    y += 18;
  }

  pop();
}
