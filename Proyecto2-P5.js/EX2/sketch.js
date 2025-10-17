// Proyecto 2 – Filtros con p5.js
// Autora: Kris Darias
// Apellido: DARIAS
// -------------------------------------
// Letras:
// D → Erosión
// A → Posterización (nivel 4)
// R → Binarización (umbral 130)
// I → Negativo
// -------------------------------------

let imgOriginal;
let img;
let escala; // Escala para que la imagen quepa en el canvas

function preload() {
  imgOriginal = loadImage("img/Kris_Darias_Rodríguez_A_hyperrealistic_cinematic_shot_of_a_woman_with_short_hair_riding_28da27a6-9061-42a2-a751-7efa2bbb441e.jpg");
}

function setup() {
  createCanvas(windowWidth * 0.9, windowHeight * 0.8);
  calcularEscala();
  img = imgOriginal.get();
  // es aconsejable incluir la función pixelDensity(), con valor 1, 
  // para no escalar la densidad de píxeles a la densidad de píxeles del monitor. 
  textFont('sans-serif');
  textSize(16);
}

function draw() {
  background(240);

  // Dibuja la imagen escalada y centrada
  const newW = imgOriginal.width * escala; // Nueva anchura
  const newH = imgOriginal.height * escala; // Nueva altura
  image(img, (width - newW) / 2, (height - newH) / 2, newW, newH); // Dibuja la imagen centrada y escalada
  // image(img, 0, 0, width, height); 

  // Dibujar instrucciones sobre el canvas
  dibujarInstrucciones();
  
}

function keyPressed() {
  // Siempre partimos de la imagen original
  img = imgOriginal.get();

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
    img = imgOriginal.get();
  }
}

function calcularEscala() { // Calcula la escala para que la imagen quepa en el canvas
  const escalaAncho = (width) / imgOriginal.width; // Escala para ajustar al ancho
  const escalaAlto = (height) / imgOriginal.height;  // Escala para ajustar al alto
  escala = min(escalaAncho, escalaAlto); // Elegimos la menor para que quepa en ambas dimensiones
}

function windowResized() {
  resizeCanvas(windowWidth * 0.9, windowHeight * 0.8);
  calcularEscala();
}

function dibujarInstrucciones() {
  // Fondo semitransparente para mejorar la lectura
  fill(255, 220);
  noStroke();
  rect(20, 20, 280, 200, 10);

  fill(0);
  textStyle(BOLD);
  text("Manual del programa:", 35, 45);
  textStyle(NORMAL);
  text("D → Erosión de la imagen", 35, 70);
  text("A → Posterización (nivel 4)", 35, 95);
  text("R → Binarización (umbral 130)", 35, 120);
  text("I → Negativo", 35, 145);
  textStyle(ITALIC);
  text("Otra tecla → Imagen original", 35, 170);
}
