// P5.js · Proyecto 2 · Ejercicio 3 (p5.js)


// -------------------------------------
// Kris Darias — Teclas::
// D → Erosión
// A → Posterización (nivel 4)
// R → Binarización (umbral 130)
// I → Negativo
// -------------------------------------

let imgOrig;
let img;
let escala; // Escala para que la imagen quepa en el canvas

function preload() {
  imgOrig = loadImage("img/Kris_Darias_Rodríguez_A_hyperrealistic_cinematic_shot_of_a_woman_with_short_hair_riding_28da27a6-9061-42a2-a751-7efa2bbb441e.jpg");
}
function setup() {
  createCanvas(windowWidth * 0.9, windowHeight * 0.85);
   // pixelDensity(1) para no escalar la densidad de píxeles a la densidad de píxeles del monitor 
  pixelDensity(1); 
  calcularEscala();
  img = imgOrig.get(); // Copia de la imagen original
  textFont('sans-serif');
  textSize(16);
}

function calcularEscala() { // Calcula la escala para que la imagen quepa en el canvas
  const escalaAncho = (width) / imgOrig.width; // Escala para ajustar al ancho
  const escalaAlto = (height) / imgOrig.height;  // Escala para ajustar al alto
  escala = min(escalaAncho, escalaAlto); // Elegimos la menor para que quepa en ambas dimensiones
}

function windowResized() {
  resizeCanvas(windowWidth * 0.9, windowHeight * 0.85);
  calcularEscala();
}

function draw() {
  background(240,0);

  // Dibuja la imagen escalada y centrada
  const newW = imgOrig.width * escala; // Nueva anchura
  const newH = imgOrig.height * escala; // Nueva altura
  image(img, (width - newW) / 2, (height - newH) / 2, newW, newH); // Dibuja la imagen centrada y escalada
  // image(img, 0, 0, width, height); 

  // Dibujar instrucciones sobre el canvas
  dibujarInstrucciones();
  
}

function keyPressed() {
  // Siempre partimos de la imagen original
  img = imgOrig.get();

  const letra = key.toLowerCase();

  if (letra === "d") {
    img.filter(ERODE); // Erosión
    // reduce las áreas claras, agranda las oscuras
    // útil para eliminar pequeños puntos blancos en imágenes binarias
    // aplica transformación espacial no lineal
  } 
  else if (letra === "a") {
    img.filter(POSTERIZE, 4); // Posterización con 4 niveles
    // limita los colores a 4 niveles por canal (rojo, verde, azul)
  } 
  else if (letra === "r") {
    img.filter(THRESHOLD, 130 / 255); // Binarización con umbral 130 (0-255 mapeado a 0-1)
  } 
  else if (letra === "i") {
    img.filter(INVERT); // Negativo
  } 
  else {
    // Cualquier otra tecla vuelve a la original
    img = imgOrig.get();
  }
}

function dibujarInstrucciones() {
  push();
  noStroke();
  const pad = 14;

  const textLines = [
    'Manual del programa',
    'D → Erosión de la imagen',
    'A → Posterización (nivel 4)',
    'R → Binarización (umbral 130)',
    `I → Negativo`,
    'Otra tecla → Imagen original',
  ];

  // Fondo semitransparente
  fill(255, 220);
  const boxW = 250, boxH = 130;
  rect(pad, boxH - pad, boxW, boxH, 10);

  // Texto
  fill(0);
  textSize(14);
  let y = boxH + pad * 0.7;
  for (let i = 0; i < textLines.length; i++) {
    text(textLines[i], pad * 2.5, y);
    y += 18;
  }

  pop();
}
