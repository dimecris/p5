// P5.js · Proyecto 2 · Ejercicio 3
// -------------------------------------
// Kris Darias — Teclas:
// D → Erosión
// A → Posterización (nivel 4)
// R → Binarización (umbral 130)
// I → Negativo
// -------------------------------------


// ---------------------------------------------
// VARIABLES GLOBALES
// ---------------------------------------------

let imgOrig; // Imagen original cargada
let img;     // Imagen sobre la que se aplican los filtros
let escala;  // Escala calculada para ajustar la imagen al canvas


// ---------------------------------------------
// FUNCIÓN PRELOAD
// ---------------------------------------------
function preload() {
  // Carga la imagen seleccionada previamente
  imgOrig = loadImage("img/seleccion_kd.jpg");
}


// ---------------------------------------------
// FUNCIÓN SETUP
// ---------------------------------------------

function setup() {
  // El canvas ocupa casi toda la ventana del navegador
  createCanvas(windowWidth * 0.9, windowHeight * 0.85);

  // Evita que la densidad de píxeles dependa del tipo de pantalla
  pixelDensity(1);

  // Calcula la escala inicial
  calcularEscala();

  // Se hace una copia de la imagen original
  img = imgOrig.get();

  // Configuración de tipografía para las instrucciones
  textFont('sans-serif');
  textSize(16);
}


// ---------------------------------------------
// FUNCIÓN calcularEscALA
// ---------------------------------------------

function calcularEscala() {
  // Calcula la proporción de escalado según ancho y alto del canvas
  const escalaAncho = width / imgOrig.width;
  const escalaAlto  = height / imgOrig.height;

  // Se elige la menor de las dos para que la imagen quepa completa
  escala = min(escalaAncho, escalaAlto);
}


// ---------------------------------------------
// FUNCIÓN WINDOW RESIZED
// ---------------------------------------------

function windowResized() {
  // Si cambia el tamaño de la ventana, se reajusta el canvas y la escala
  resizeCanvas(windowWidth * 0.9, windowHeight * 0.85);
  calcularEscala();
}


// ---------------------------------------------
// FUNCIÓN DRAW
// ---------------------------------------------

function draw() {
  background(240, 0);

  // Calcula el nuevo tamaño de la imagen respetando su proporción original
  const newW = imgOrig.width * escala;
  const newH = imgOrig.height * escala;

  // Dibuja la imagen centrada en el canvas
  image(img, (width - newW) / 2, (height - newH) / 2, newW, newH);

  // Muestra las instrucciones dentro del propio canvas
  dibujarInstrucciones();
}


// ---------------------------------------------
// FUNCIÓN KEY PRESSED
// ---------------------------------------------

function keyPressed() {
  // Siempre parte de la imagen original (no acumula filtros)
  img = imgOrig.get();

  const letra = key.toLowerCase();

  // Asignación de filtros según las letras del apellido
  if (letra === "d") {
    img.filter(ERODE);
    // Erosión: reduce zonas claras y expande las oscuras.
    // Suele usarse para eliminar pequeños puntos blancos o ruido.
  } 
  else if (letra === "a") {
    img.filter(POSTERIZE, 4);
    // Posterización: limita los niveles de color a 4 por canal.
    // Genera un efecto de ilustración o reducción cromática.
  } 
  else if (letra === "r") {
    img.filter(THRESHOLD, 130 / 255);
    // Binarización: convierte la imagen en blanco y negro.
    // Usa un umbral de 130 (normalizado entre 0 y 1).
  } 
  else if (letra === "i") {
    img.filter(INVERT);
    // Negativo: invierte los valores de color de cada píxel.
  } 
  else {
    // Cualquier otra tecla restaura la imagen original
    img = imgOrig.get();
  }
}


// ---------------------------------------------
// FUNCION DIBUJAR INSTURCCIONES
// ---------------------------------------------

function dibujarInstrucciones() {
  push();

  // Sin bordes y con fondo semitransparente para la caja de texto
  noStroke();
  fill(255, 220);

  const pad = 14;
  const boxW = 250;
  const boxH = 130;
  rect(pad, boxH - pad, boxW, boxH, 10);

  // Texto de ayuda
  fill(0);
  textSize(14);
  let y = boxH + pad * 0.7;

  const texto = [
    'Manual del programa',
    'D → Erosión de la imagen',
    'A → Posterización (nivel 4)',
    'R → Binarización (umbral 130)',
    'I → Negativo',
    'Otra tecla → Imagen original'
  ];

  for (let i = 0; i < texto.length; i++) {
    text(texto[i], pad * 2.5, y);
    y += 18;
  }

  pop();
}
