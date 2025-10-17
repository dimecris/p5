/* P3.js · Proyecto 2 · Ejercicio 3 (p5.js)
   Kris Darias — Teclas:
   K → Detección de contornos (Sobel, lineal por convolución)
   D → Realce de contornos (kernel de enfoque 3×3, lineal por convolución)
*/

let imgOrig;          // imagen original
let imgSobel = null;  // versión con contornos (caché)
let imgSharpen = null;// versión realzada (caché)
const K_KEY = 75;     // 'K'
const D_KEY = 68;     // 'D'
let scaleFactor = 1;

function preload(){
  // ⚠️ Cambia esta ruta por tu imagen.
  imgOrig = loadImage('img/Kris_Darias_Rodríguez_A_hyperrealistic_cinematic_shot_of_a_woman_with_short_hair_riding_28da27a6-9061-42a2-a751-7efa2bbb441e.jpg');
}

function setup(){
  const c = createCanvas(imgOrig.width, imgOrig.height);
  c.parent('p5-container');
  noLoop(); // Redibujamos bajo demanda para ahorrar CPU
  drawFrame('original');
}
function createResponsiveCanvas() {
  // Queremos que la imagen quepa completamente en pantalla
  // dejando algo de margen (10% del ancho, 15% del alto)
  const maxW = windowWidth * 0.9;
  const maxH = windowHeight * 0.85;

  // Calculamos el factor de escala manteniendo proporción
  scaleFactor = Math.min(maxW / imgOrig.width, maxH / imgOrig.height);

  const newW = imgOrig.width * scaleFactor;
  const newH = imgOrig.height * scaleFactor;

  const c = createCanvas(newW, newH);
  c.parent('p5-container');
}

function windowResized() {
  // Cuando cambia el tamaño de la ventana, reajustamos el canvas
  resizeCanvas(0, 0);
  createResponsiveCanvas();
  drawFrame('original');
}
function drawFrame(mode) {
  clear();
  push();
  scale(scaleFactor);
  if (mode === 'sobel' && imgSobel) {
    image(imgSobel, 0, 0);
  } else if (mode === 'sharpen' && imgSharpen) {
    image(imgSharpen, 0, 0);
  } else {
    image(imgOrig, 0, 0);
  }
  pop();
  drawManualOverlay(mode);
}

function draw(){ /* sin uso: controlamos el repintado manualmente */ }

// Detecta qué tecla está pulsada y dibuja en consecuencia
function keyPressed(){
  // Redibuja según estado actual de la tecla
  if (keyIsDown(K_KEY)) {
    ensureSobel();
    drawFrame('sobel');
  } else if (keyIsDown(D_KEY)) {
    ensureSharpen();
    drawFrame('sharpen');
  }
}

function keyReleased(){
  // Al soltar cualquier tecla, volvemos al original
  if (!keyIsDown(K_KEY) && !keyIsDown(D_KEY)) {
    drawFrame('original');
  }
}

// También por si la tecla ya estaba pulsada al enfocar la ventana
function mouseMoved(){
  if (keyIsDown(K_KEY)) { ensureSobel(); drawFrame('sobel'); return; }
  if (keyIsDown(D_KEY)) { ensureSharpen(); drawFrame('sharpen'); return; }
}

// ----- Render según modo -----
function drawFrame(mode){
  clear();
  if (mode === 'sobel' && imgSobel) {
    image(imgSobel, 0, 0);
  } else if (mode === 'sharpen' && imgSharpen) {
    image(imgSharpen, 0, 0);
  } else {
    image(imgOrig, 0, 0);
  }
  drawManualOverlay(mode);
}

// Manual sobreimpreso
function drawManualOverlay(mode){
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
  // Caja semitransparente
  const boxW = 360, boxH = 120;
  fill(0, 0, 0, 130);
  rect(pad, height - boxH - pad, boxW, boxH, 10);
  // Texto
  fill(255);
  textSize(14);
  let y = height - boxH + pad*0.7;
  for (let i=0;i<textLines.length;i++){
    text(textLines[i], pad*1.5, y);
    y += 18;
  }
  pop();
}

// ----- Preparadores (con caché) -----
function ensureSobel(){
  if (!imgSobel) imgSobel = sobelEdges(imgOrig);
}
function ensureSharpen(){
  if (!imgSharpen) {
    // Kernel de enfoque clásico:
    //  [ 0, -1,  0,
    //   -1,  5, -1,
    //    0, -1,  0 ]
    const kernel = [0,-1,0,-1,5,-1,0,-1,0];
    imgSharpen = convolve3x3(imgOrig, kernel, 1, 0);
  }
}

// ----- Convolución 3×3 genérica (lineal) -----
function convolve3x3(srcImg, kernel, divisor=1, offset=0){
  const w = srcImg.width, h = srcImg.height;
  const out = createImage(w, h);
  srcImg.loadPixels();
  out.loadPixels();

  const k = kernel;
  const clamp = v => v < 0 ? 0 : (v > 255 ? 255 : v);

  // Recorremos evitando bordes (modo 'extensión' simple replicando bordes)
  for (let y = 0; y < h; y++){
    for (let x = 0; x < w; x++){
      let r=0,g=0,b=0;
      for (let ky = -1; ky <= 1; ky++){
        for (let kx = -1; kx <= 1; kx++){
          const px = constrain(x + kx, 0, w-1);
          const py = constrain(y + ky, 0, h-1);
          const idx = 4*(py*w + px);
          const kval = k[(ky+1)*3 + (kx+1)];
          r += srcImg.pixels[idx  ] * kval;
          g += srcImg.pixels[idx+1] * kval;
          b += srcImg.pixels[idx+2] * kval;
        }
      }
      r = clamp(r/divisor + offset);
      g = clamp(g/divisor + offset);
      b = clamp(b/divisor + offset);
      const outIdx = 4*(y*w + x);
      out.pixels[outIdx  ] = r;
      out.pixels[outIdx+1] = g;
      out.pixels[outIdx+2] = b;
      out.pixels[outIdx+3] = 255;
    }
  }
  out.updatePixels();
  return out;
}

// ----- Detección de contornos (Sobel, lineal por convoluciones separadas) -----
function sobelEdges(srcImg){
  const w = srcImg.width, h = srcImg.height;

  // 1) Pasar a luminancia (Y) para operar en 1 canal (lineal)
  const gray = createImage(w, h);
  srcImg.loadPixels(); gray.loadPixels();
  for (let i=0; i < srcImg.pixels.length; i+=4){
    // luminancia perceptual
    const y = 0.2126*srcImg.pixels[i] + 0.7152*srcImg.pixels[i+1] + 0.0722*srcImg.pixels[i+2];
    gray.pixels[i] = gray.pixels[i+1] = gray.pixels[i+2] = y;
    gray.pixels[i+3] = 255;
  }
  gray.updatePixels();

  // Kernels Sobel Gx, Gy (lineales)
  const Kx = [-1,0,1,-2,0,2,-1,0,1];
  const Ky = [-1,-2,-1,0,0,0,1,2,1];

  const gx = convolve3x3(gray, Kx);
  const gy = convolve3x3(gray, Ky);

  // Magnitud aproximada (|gx| + |gy|), linealmente combinada y acotada
  gx.loadPixels(); gy.loadPixels();
  const out = createImage(w, h);
  out.loadPixels();
  for (let i=0;i<gx.pixels.length;i+=4){
    const ax = Math.abs(gx.pixels[i]);   // mismo en R,G,B
    const ay = Math.abs(gy.pixels[i]);
    let m = ax + ay; // aproximación rápida de magnitud
    if (m > 255) m = 255;
    out.pixels[i] = out.pixels[i+1] = out.pixels[i+2] = m;
    out.pixels[i+3] = 255;
  }
  out.updatePixels();
  return out;
}
