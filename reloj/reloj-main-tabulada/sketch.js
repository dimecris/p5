// Reloj Gaza — boceto base (Kris)
// Mapping: izq=segundos, centro=minutos (líneas), dcha=horas (y sol)

// --------------------------
// --- variables globales ---
// --------------------------
let f; // fuente
const P = {
  bg: "#f7f7f7",
  grid: "#201e1eff",
  white: "#ffffff",
  black: "#111111",
  red: "#e4312b",
  green: "#149954",
  greenlight: "#7fe5b0ff",
  grey: "#b9b7b7"
};


// variables de layout (se calculan en computeLayout). 
let margin, 
    colLeftX, colRightX,   // columnas izq y dcha
    bloqueX1, bloqueX2,    // coordenada x inicial y final del bloque de líneas
    baseY,                 // base del bloque de líneas. Donde empieza la primera línea
    lineH;                 // distancia vertical entre cada línea

// configuración dibujo líneas
const SEGMENTS = 24;              // cuántos puntos definen cada línea. Más segmentos más ondulación
let lineOffsets = [];             // array que se llena en setup() con offsets fijos para cada línea

const HOURS_GROUND = 8;           // hora a la que "toca suelo" el sol

let manualHour = null;            // Hora editable por scroll. Si es null, usamos la hora del sistema (hour()).
let manualMinute = null;

// --------------------------
// --- helpers ---
// --------------------------

// Convertir horas a píxeles 
function hoursToPixels(h) {
  return (h / 24) * (lineH * 60); // convierte horas a px según tu escala actual
}

// --- helpers para el eje de horas (06 arriba → 05 abajo)
function hourToIndex(h) {
  // h = 0..23  → posición 0..23 donde 0 es 06, 23 es 05
  return (h - 6 + 24) % 24;
}

function labelFromIndex(i) {
  // i = 0..23  → 06..23,24,01..05 (sin 00: mostramos 24 en su lugar)
  const v = (6 + i) % 24;           // 0..23, donde 0 equivale a "24"
  return v === 0 ? "24" : nf(v, 2); // "24" en vez de "00"
}

// --------------------------
// --- Ciclo de vida ---
// --------------------------

function preload() {
  f = loadFont("assets/Barlow/Barlow-Regular.ttf"); //fuente importada desde google fonts
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(f);
  textAlign(CENTER, CENTER);
  noStroke();
  computeLayout();

  // Precalcular offsets fijos por cada una de las 60 líneas (reproducible)
  // Usamos una semilla fija para que el dibujo sea siempre igual
  // Si se generara aleatoriamente cada vez, el dibujo cambia constantemente en cada frame y no se ve bien, vibraría.
  randomSeed(12345); // semilla fija para reproducibilidad
  lineOffsets = new Array(60); // array de 60 filas
  for (let i = 0; i < 60; i++) { 
    const row = new Float32Array(SEGMENTS + 1); // array de offsets para esta línea. Usamos Float32Array por eficiencia.
    for (let j = 0; j <= SEGMENTS; j++) { // SEGMENTS+1 puntos por línea
      row[j] = random(-1.6, 1.6); // offsets entre -1.6 y 1.6 px
    }
    lineOffsets[i] = row; // asignar la fila al array principal
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  computeLayout();
}


// --------------------------
// --- Interacción usuaria: Simulación hora ---
// --------------------------

function keyPressed() {
  // Atajos rápidos con flechas
  if (keyCode === UP_ARROW)   { manualHour   = ((manualHour ?? hour()) + 1) % 24; } // revisa que manualHour no sea null y le suma 1. Si es null usa la hora del sistema
  if (keyCode === DOWN_ARROW) { manualHour   = ((manualHour ?? hour()) - 1) % 24; }
  if (keyCode === RIGHT_ARROW){ manualMinute = ((manualMinute ?? minute()) + 1) % 60; }
  if (keyCode === LEFT_ARROW) { manualMinute = ((manualMinute ?? minute()) - 1) % 60; }

}

function doubleClicked() { // resetea a hora del sistema
  manualHour = null;
  manualMinute = null;
}

// --------------------------
// --- Layout ---
// --------------------------

function computeLayout() {
  margin = min(width, height) * 0.16; // toma como valor el lado menor, dependiendo de la orientación

  colLeftX  = margin * 1.5; // situamos columna de segundos en el lado izquierdo
  colRightX = width - margin * 1.5; // situamos columna de horas en el lado derecho

  bloqueX1 = margin * 2.2; // coordenada x inicial del bloque de minutos (líneas horizontales)
  bloqueX2 = width - margin * 2.2; // coordenada x final del bloque de minutos

  const bloqueH = height * 0.70;  // altura del bloque de minutos y segundos (se ocupan 3/4 partes de la altur de la pantalla)
  baseY = height * 0.85;       // base del bloque de minutos y segundos
  lineH = bloqueH / 60;           // 60 líneas máximas
}


// --------------------------
// --- Dibujo ---
// --------------------------

function draw() {
  background(P.bg);
  drawGrid(); // fondo de puntos

  const s = second();
  const sysH = hour();
  const sysM = minute();
  const h = manualHour ?? sysH; // si manualHour es null, usa sysH
  const m = manualMinute ?? sysM;


  drawSecondsColumn(s);
  drawFooterBase();       // franja verde inferior (suelo)
 
    
  drawHorasSun(h, s);
  drawMinutosLinea(m, s);
  drawHorasColumn(h);

  drawHeaderTime(h, m, bloqueX1, margin * 0.2);   // HH:MM arriba izq
  drawHeaderTitle('ANAGNÓRISIS','Reconocimiento de la identidad por otros', bloqueX2, margin * 0.2);
  drawElapsedSince('1917-11-02T05:30:00', '11 NOV 1917', bloqueX2,height - margin * 0.4); // Mostrar tiempo transcurrido desde 07/10/2023 (día, horas)
  drawSignature('CC BY-NC-SA 4.0 - Kris Darias', bloqueX1, height - margin * 0.4);        // autoría y título

}



// --------------------------
// --- Funciones dibujo ---
// --------------------------


function drawGrid() {
  stroke(P.grid);
  strokeWeight(1);
  const step = 18;
  for (let y = step/2; y < height; y += step) {    // filas
    for (let x = step/2; x < width; x += step) {  // columnas
      point(x, y);
    }
  }
  noStroke();
}

function drawSecondsColumn(segundoActual) {
  // Dibujar ticks (marcadores) para cada segundo y números cada 5 segundos
  textSize(12);
  strokeWeight(1);

  // Números cada 5 segundos (0,5,10,...,60)
  for (let i = 0; i <= 60; i += 5) {
    const y = map(i, 0, 60, baseY, baseY - lineH * 60) + lineH * 0.5;
    fill(i === segundoActual ? P.red : P.black);
    text(nf(i, 2), colLeftX + 10, y);
  }

  // marcador del segundo actual (punto rojo). Mapea 0..59 a la posición y correspondiente
  const yDot = map(segundoActual, 0, 59, baseY, baseY - lineH * 59); // map(valor, start1, stop1, start2, stop2)
  fill(P.red);
  circle(colLeftX, yDot, 6);
}

function drawMinutosLinea(minutoActual, segundoActual) {

  for (let i = 0; i < 60; i++) {
    const y = baseY - i * lineH;

    if (i < minutoActual) {
      // líneas completas ya acabadas
      stroke(P.black); 
      strokeWeight(3);
      drawHandLine(i, bloqueX1, y, bloqueX2, y, 1);
    } else if (i === minutoActual) {
      // línea del minuto actual: se va completando con los segundos
      const portion = constrain(segundoActual / 59, 0, 1); // 0..1
      stroke(P.red); 
      strokeWeight(2);
      drawHandLine(i, bloqueX1, y - 2, bloqueX2, portion);
    }
    // las futuras no se dibujan
  }
  noStroke();
}


// Dibuja una línea “a mano” (ondulada) entre dos puntos x1,y1 y x2,y2. 
// En vez de trazar una línea recta, crea una serie de vértices interpolados a lo largo del eje X y 
// aplica un desplazamiento vertical (offset) precomputado para cada punto, de modo que la línea parezca dibujada a mano. 
// El parámetro portion permite dibujar solo una fracción de la línea (para animar  trazado).

function drawHandLine(lineIndex, x1, y1, x2, portion) {
  const lastSeg = floor(SEGMENTS * portion); // cuántos segmentos dibujar (0..SEGMENTS)
  noFill();
  beginShape();
  for (let k = 0; k <= lastSeg; k++) {
    const t = k / SEGMENTS; // t va de 0 a 1. Indica la posición relativa en la línea (0=inicio, 1=final)
    const x = lerp(x1, x2, t); // Interpola la coordenada X entre x1 y x2. El metodo lerp(a,b,t) devuelve un valor entre a y b según t (0 ≤ t ≤ 1)
    const oy = lineOffsets[lineIndex][k]; // obtenemos el offset vertical precomputado en SETUP para este punto (para crear el efecto a mano)
    vertex(x, y1 + oy); // dibuja el vértice en la posición con offset
  }
  endShape();
}


function drawHorasColumn(horaActual) {
  textSize(16);
  for (let i = 0; i < 24; i++) {
    // i = 0..23 (06 arriba → 05 abajo)
    const y = map(i, 0, 23, baseY - lineH * 60, baseY);
    const label = labelFromIndex(i);
    const isCurrent = (i === hourToIndex(horaActual));
    fill(isCurrent ? P.red : P.black);
    text(label, colRightX, y);
  }
}


function drawHorasSun(horaActual) {
  // Calcular posición y tamaño del sol
  const idx = hourToIndex(horaActual);
  const y   = map(idx, 0, 23, baseY - lineH * 60, baseY);
  const x   = (bloqueX1 + bloqueX2) * 0.42;
  const d   = min(width, height) * 0.12;

  noStroke();
  fill(P.red);
  circle(x, y, d);

  // --- ahora detectar intersección con el rectángulo del suelo y pintar
  // la porción dentro del suelo en blanco usando clipping del canvas ---
  // reproducir exactamente la geometría de drawFooterBase()
  const topY = baseY + 2; // mismo offset usado en drawFooterBase
  const desiredH = hoursToPixels(HOURS_GROUND);
  const h = min(desiredH, height + topY);
  const stackW = bloqueX2 - bloqueX1;
  const w = stackW / 1.10; // 10% más ancho
  const cx = (bloqueX1 + bloqueX2) / 2; // centro x del bloque de líneas
  const rectX  = cx - w / 2;
  const rectTop = topY - h;    // y superior del rectángulo del suelo
  const rectH = h + 100;             // altura positiva (desde rectTop hacia abajo) + se añade 100 para cubrir el espacio extra del suelo

  const r = d / 2;
  // Comprobar si el círculo intersecta verticalmente el rectángulo del suelo
  if ((y + r) > rectTop && (y - r ) < topY) {
    const ctx = drawingContext; // 2D canvas context
    ctx.save();
    ctx.beginPath();
    // definir clip exactamente en el área del suelo
    ctx.rect(rectX, rectTop, w, rectH);
    ctx.clip();

    // Dibujar sólo la parte del sol dentro del clip en blanco
    noStroke();
    fill(P.white); // color del suelo
    circle(x, y, d);

    ctx.restore();
  }
}

function drawFooterBase() {
  // Top del suelo: justo debajo de la primera línea + 100
  const topY = baseY + 100;

  // Altura basada en horas
  const desiredH = hoursToPixels(HOURS_GROUND);
  const h = min(desiredH, height); // por si no cabe

  // Ancho: un poco menos que el bloque de líneas
  const stackW = bloqueX2 - bloqueX1;
  const w = stackW / 1.10; // 10% más ancho
  const cx = (bloqueX1 + bloqueX2) / 2;
  const x  = cx - w / 2;

  noStroke();
  fill(P.green);
  rect(x, topY, w, -h-100);
}

function drawHeaderTime(h, m, x, y) {
  fill(P.black);
  textAlign(LEFT, TOP);
  textSize(40);
  text(nf(h, 2) + ":" + nf(m, 2), x, y);
}

function drawHeaderTitle(h1,h2,x,y) {
  fill(P.black);
  textAlign(RIGHT, TOP);
  textSize(30);
  text(h1.toLocaleUpperCase(), x,y);
  textSize(14);
  text(h2.toLocaleUpperCase(), x,y*3);
}

function drawSignature(txt, x,y) {
  textAlign(LEFT, BOTTOM);
  fill(P.black);
  textSize(14);
  text(txt.toLocaleUpperCase(), x,y /0.95);
  const txt2 = 'Simulation: hora (RIGHT-LEFT)  minutos (UP-DOWN)\ndoble click = hora sistema';
  text(txt2.toLocaleUpperCase(), x,y);

}
// Dibuja en pantalla el tiempo transcurrido desde una fecha ISO (YYYY-MM-DDTHH:MM:SS)
function drawElapsedSince(isoDate, fechaInicio, x, y) {
  const since = new Date(isoDate);
  const now = new Date();
  let deltaMs = now - since; // milisegundos
  if (isNaN(deltaMs)) return; // fecha inválida

  const msPerHour = 1000 * 60 * 60;
  const msPerDay = msPerHour * 24;

  const days = Math.floor(deltaMs / msPerDay);
  deltaMs -= days * msPerDay;
  const hours = Math.floor(deltaMs / msPerHour);
  deltaMs -= hours * msPerHour;
  const minutes = Math.floor(deltaMs / (1000 * 60));

  const txt = `${days} días, ${hours} horas, ${minutes} minutos \n ${fechaInicio}`;

  push();
  textAlign(RIGHT, BOTTOM);
  textSize(14);
  fill(P.black);
  text(txt.toUpperCase(), x, y);
  pop();
}
